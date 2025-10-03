const express = require('express');
const mongoose = require('mongoose');
const File = require('../models/File');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { validateFileUpload, handleValidationErrors } = require('../middleware/validation');
const fileUploadService = require('../services/fileUpload');

const router = express.Router();

// Initialize file upload service
const db = mongoose.connection.db;
if (db) {
  fileUploadService.initialize(db);
}

// Handle multer errors
const handleMulterError = (error, req, res, next) => {
  if (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size exceeds maximum limit of ${process.env.MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed per request.'
      });
    }
    
    if (error.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'File upload error'
    });
  }
  next();
};

/**
 * @route   POST /api/files/upload
 * @desc    Upload files (resumes, documents)
 * @access  Private (Interviewees only)
 */
router.post('/upload',
  authenticate,
  authorize('Interviewee'),
  (req, res, next) => {
    // Debug: Check if user is set
    if (!req.user || !req.user._id) {
      console.error('❌ Upload Error: req.user not set after authentication');
      return res.status(401).json({
        success: false,
        message: 'User authentication failed'
      });
    }
    
    console.log('✅ User authenticated for upload:', req.user.email, 'ID:', req.user._id);
    
    const upload = fileUploadService.getMulterConfig().array('files', 5);
    upload(req, res, (error) => {
      handleMulterError(error, req, res, next);
    });
  },
  validateFileUpload,
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const { category = 'resume', description = '', tags = [] } = req.body;
      const uploadedFiles = [];

      // Upload each file to GridFS manually
      for (const file of req.files) {
        try {
          console.log(`📤 Uploading file: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`);
          
          // Upload buffer to GridFS
          const gridfsFile = await fileUploadService.uploadToGridFS(
            file.buffer,
            file.originalname,
            file.mimetype,
            req.user._id.toString(),
            category
          );

          console.log(`✅ File uploaded to GridFS with ID: ${gridfsFile.id}`);

          // Create file metadata record in database
          const fileRecord = new File({
            gridfsId: gridfsFile.id,
            uploadedBy: req.user._id,
            originalName: gridfsFile.originalname,
            filename: gridfsFile.filename,
            mimetype: gridfsFile.mimetype,
            size: gridfsFile.size,
            category,
            description,
            tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : [])
          });

          await fileRecord.save();
          console.log(`✅ File record saved in database with ID: ${fileRecord._id}`);

          // Add file to user's documents
          if (category === 'resume') {
            await User.findByIdAndUpdate(req.user._id, {
              $push: {
                'intervieweeInfo.documents': {
                  name: gridfsFile.originalname,
                  fileId: gridfsFile.id,
                  uploadDate: new Date(),
                  fileType: gridfsFile.mimetype,
                  fileSize: gridfsFile.size
                }
              }
            });
          }

          uploadedFiles.push({
            id: fileRecord._id,
            gridfsId: gridfsFile.id,
            originalName: gridfsFile.originalname,
            filename: gridfsFile.filename,
            size: gridfsFile.size,
            category,
            downloadUrl: `/api/files/download/${fileRecord._id}`,
            previewUrl: `/api/files/preview/${fileRecord._id}`
          });

        } catch (error) {
          console.error(`❌ Error uploading file ${file.originalname}:`, error);
          // Continue with other files even if one fails
        }
      }

      res.status(201).json({
        success: true,
        message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
        data: {
          files: uploadedFiles
        }
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during file upload'
      });
    }
  }
);

/**
 * @route   POST /api/files/:id/analyze
 * @desc    Analyze uploaded file with AI
 * @access  Private
 */
router.post('/:id/analyze', authenticate, async (req, res) => {
  try {
    const fileRecord = await File.findById(req.params.id);
    
    if (!fileRecord) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user owns the file or is an interviewer
    if (fileRecord.uploadedBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'Interviewer') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to analyze this file'
      });
    }

    // Get file stream from GridFS
    const { stream: fileStream, file: gridfsFile } = await fileUploadService.getFileStream(fileRecord.gridfsId);
    
    // Collect file content
    const chunks = [];
    fileStream.on('data', chunk => chunks.push(chunk));
    
    await new Promise((resolve, reject) => {
      fileStream.on('end', resolve);
      fileStream.on('error', reject);
    });

    const fileBuffer = Buffer.concat(chunks);
    
    // Import AI analyzer service
    const aiAnalyzer = require('../services/aiAnalyzer');
    
    // Extract text content
    const textContent = await aiAnalyzer.extractTextFromFile(fileBuffer, fileRecord.mimetype);
    
    // Analyze with AI
    const analysisResult = await aiAnalyzer.analyzeResume(textContent, {
      fileName: fileRecord.originalName,
      fileType: fileRecord.mimetype,
      fileSize: fileRecord.size
    });

    if (analysisResult.success) {
      // Store analysis results in file record
      fileRecord.metadata = {
        ...fileRecord.metadata,
        aiAnalysis: analysisResult.data
      };
      await fileRecord.save();

      res.json({
        success: true,
        message: 'File analyzed successfully',
        data: analysisResult.data
      });
    } else {
      res.json({
        success: false,
        message: 'AI analysis failed',
        error: analysisResult.error,
        data: analysisResult.fallback
      });
    }

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during AI analysis',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/files
 * @desc    Get user's uploaded files
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = { uploadedBy: req.user._id };
    if (category) {
      query.category = category;
    }

    const files = await File.find(query)
      .sort({ uploadedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-extractedText'); // Exclude large text content

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      data: {
        files: files.map(file => ({
          ...file.toJSON(),
          downloadUrl: `/api/files/download/${file._id}`,
          previewUrl: `/api/files/preview/${file._id}`
        })),
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: files.length,
          totalFiles: total
        }
      }
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching files'
    });
  }
});

/**
 * @route   GET /api/files/:id
 * @desc    Get file details
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      $or: [
        { uploadedBy: req.user._id },
        { 'sharedWith.userId': req.user._id },
        { isPublic: true }
      ]
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or access denied'
      });
    }

    res.json({
      success: true,
      data: {
        file: {
          ...file.toJSON(),
          downloadUrl: `/api/files/download/${file._id}`,
          previewUrl: `/api/files/preview/${file._id}`
        }
      }
    });

  } catch (error) {
    console.error('Get file details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching file details'
    });
  }
});

/**
 * @route   GET /api/files/download/:id
 * @desc    Download file
 * @access  Private
 */
router.get('/download/:id', authenticate, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      $or: [
        { uploadedBy: req.user._id },
        { 'sharedWith.userId': req.user._id },
        { isPublic: true }
      ]
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or access denied'
      });
    }

    // Get file stream from GridFS
    const { stream, file: gridfsFile } = await fileUploadService.getFileStream(file.gridfsId);

    // Set headers for download
    res.set({
      'Content-Type': gridfsFile.metadata?.mimetype || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
      'Content-Length': gridfsFile.length
    });

    // Increment download count
    await file.incrementDownloadCount();

    // Pipe the file stream to response
    stream.pipe(res);

  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file download'
    });
  }
});

/**
 * @route   GET /api/files/preview/:id
 * @desc    Preview file (for supported formats)
 * @access  Private
 */
router.get('/preview/:id', authenticate, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      $or: [
        { uploadedBy: req.user._id },
        { 'sharedWith.userId': req.user._id },
        { isPublic: true }
      ]
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or access denied'
      });
    }

    // Check if file type supports preview
    const previewableMimeTypes = [
      'application/pdf',
      'text/plain',
      'text/rtf'
    ];

    if (!previewableMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'File type does not support preview'
      });
    }

    // Get file stream from GridFS
    const { stream, file: gridfsFile } = await fileUploadService.getFileStream(file.gridfsId);

    // Set headers for preview
    res.set({
      'Content-Type': gridfsFile.metadata?.mimetype || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${file.originalName}"`,
      'Content-Length': gridfsFile.length
    });

    // Pipe the file stream to response
    stream.pipe(res);

  } catch (error) {
    console.error('File preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file preview'
    });
  }
});

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete file
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or access denied'
      });
    }

    // Delete from GridFS
    await fileUploadService.deleteFile(file.gridfsId);

    // Remove from user's documents if it's a resume
    if (file.category === 'resume') {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: {
          'intervieweeInfo.documents': { fileId: file.gridfsId }
        }
      });
    }

    // Delete file record
    await File.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file deletion'
    });
  }
});

/**
 * @route   PUT /api/files/:id
 * @desc    Update file metadata
 * @access  Private
 */
router.put('/:id',
  authenticate,
  validateFileUpload,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { category, description, tags } = req.body;

      const file = await File.findOne({
        _id: req.params.id,
        uploadedBy: req.user._id
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found or access denied'
        });
      }

      // Update file metadata
      const updates = {};
      if (category) updates.category = category;
      if (description !== undefined) updates.description = description;
      if (tags) updates.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());

      const updatedFile = await File.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'File updated successfully',
        data: {
          file: {
            ...updatedFile.toJSON(),
            downloadUrl: `/api/files/download/${updatedFile._id}`,
            previewUrl: `/api/files/preview/${updatedFile._id}`
          }
        }
      });

    } catch (error) {
      console.error('File update error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during file update'
      });
    }
  }
);

/**
 * @route   GET /api/files/stats
 * @desc    Get file statistics
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await File.getFileStats(req.user._id);

    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    console.error('File stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching file statistics'
    });
  }
});

module.exports = router;