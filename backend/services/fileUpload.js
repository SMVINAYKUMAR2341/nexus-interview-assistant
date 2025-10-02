const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');

class FileUploadService {
  constructor() {
    this.gridFSBucket = null;
    this.allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/rtf',
      'application/rtf'
    ];
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
  }

  initialize(db) {
    this.gridFSBucket = new GridFSBucket(db, {
      bucketName: process.env.GRIDFS_BUCKET_NAME || 'uploads'
    });
  }

  getGridFSBucket() {
    if (!this.gridFSBucket) {
      throw new Error('GridFS bucket not initialized');
    }
    return this.gridFSBucket;
  }

  // Configure multer with memory storage (simpler, more reliable)
  getMulterConfig() {
    const storage = multer.memoryStorage();

    return multer({
      storage: storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 5 // Maximum 5 files per request
      },
      fileFilter: (req, file, cb) => {
        // Check file type
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
          const error = new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and RTF files are allowed.');
          error.code = 'INVALID_FILE_TYPE';
          return cb(error, false);
        }

        // Check file extension
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
          const error = new Error('Invalid file extension.');
          error.code = 'INVALID_FILE_EXTENSION';
          return cb(error, false);
        }

        cb(null, true);
      }
    });
  }

  // Upload file buffer to GridFS manually
  async uploadToGridFS(fileBuffer, originalName, mimetype, userId, category = 'resume') {
    return new Promise((resolve, reject) => {
      try {
        const bucket = this.getGridFSBucket();
        
        // Generate unique filename
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const filename = `${Date.now()}-${uniqueSuffix}${path.extname(originalName)}`;
        
        const uploadStream = bucket.openUploadStream(filename, {
          metadata: {
            originalName: originalName,
            uploadedBy: userId,
            uploadDate: new Date(),
            mimetype: mimetype,
            category: category
          }
        });

        uploadStream.on('finish', (file) => {
          resolve({
            id: uploadStream.id,
            filename: filename,
            originalname: originalName,
            mimetype: mimetype,
            size: fileBuffer.length
          });
        });

        uploadStream.on('error', (error) => {
          console.error('GridFS upload error:', error);
          reject(error);
        });

        uploadStream.end(fileBuffer);
      } catch (error) {
        console.error('Error starting GridFS upload:', error);
        reject(error);
      }
    });
  }

  // Get file stream for download
  async getFileStream(fileId) {
    try {
      const bucket = this.getGridFSBucket();
      const objectId = new mongoose.Types.ObjectId(fileId);
      
      // Check if file exists
      const files = await bucket.find({ _id: objectId }).toArray();
      if (files.length === 0) {
        throw new Error('File not found');
      }

      const file = files[0];
      const downloadStream = bucket.openDownloadStream(objectId);
      
      return {
        stream: downloadStream,
        file: file
      };
    } catch (error) {
      throw new Error(`Error retrieving file: ${error.message}`);
    }
  }

  // Delete file from GridFS
  async deleteFile(fileId) {
    try {
      const bucket = this.getGridFSBucket();
      const objectId = new mongoose.Types.ObjectId(fileId);
      
      // Check if file exists
      const files = await bucket.find({ _id: objectId }).toArray();
      if (files.length === 0) {
        throw new Error('File not found');
      }

      await bucket.delete(objectId);
      return true;
    } catch (error) {
      throw new Error(`Error deleting file: ${error.message}`);
    }
  }

  // Get file information
  async getFileInfo(fileId) {
    try {
      const bucket = this.getGridFSBucket();
      const objectId = new mongoose.Types.ObjectId(fileId);
      
      const files = await bucket.find({ _id: objectId }).toArray();
      if (files.length === 0) {
        throw new Error('File not found');
      }

      return files[0];
    } catch (error) {
      throw new Error(`Error retrieving file info: ${error.message}`);
    }
  }

  // List files for a user
  async listUserFiles(userId, options = {}) {
    try {
      const bucket = this.getGridFSBucket();
      const query = { 'metadata.uploadedBy': userId.toString() };
      
      if (options.category) {
        query['metadata.category'] = options.category;
      }

      const files = await bucket.find(query)
        .sort({ uploadDate: -1 })
        .limit(options.limit || 50)
        .toArray();

      return files;
    } catch (error) {
      throw new Error(`Error listing files: ${error.message}`);
    }
  }

  // Get file statistics
  async getFileStats(userId = null) {
    try {
      const bucket = this.getGridFSBucket();
      let query = {};
      
      if (userId) {
        query['metadata.uploadedBy'] = userId.toString();
      }

      const files = await bucket.find(query).toArray();
      
      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.length, 0),
        byCategory: {},
        byMimeType: {}
      };

      files.forEach(file => {
        const category = file.metadata?.category || 'other';
        const mimeType = file.metadata?.mimetype || 'unknown';

        if (!stats.byCategory[category]) {
          stats.byCategory[category] = { count: 0, size: 0 };
        }
        stats.byCategory[category].count++;
        stats.byCategory[category].size += file.length;

        if (!stats.byMimeType[mimeType]) {
          stats.byMimeType[mimeType] = { count: 0, size: 0 };
        }
        stats.byMimeType[mimeType].count++;
        stats.byMimeType[mimeType].size += file.length;
      });

      return stats;
    } catch (error) {
      throw new Error(`Error retrieving file statistics: ${error.message}`);
    }
  }

  // Validate file before upload
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push('Invalid file type. Only PDF, DOC, DOCX, TXT, and RTF files are allowed.');
    }

    // Check file extension
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push('Invalid file extension.');
    }

    return errors;
  }

  // Clean up old files (utility function)
  async cleanupOldFiles(daysOld = 30) {
    try {
      const bucket = this.getGridFSBucket();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldFiles = await bucket.find({
        uploadDate: { $lt: cutoffDate }
      }).toArray();

      let deletedCount = 0;
      for (const file of oldFiles) {
        try {
          await bucket.delete(file._id);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting file ${file._id}:`, error);
        }
      }

      return {
        totalFound: oldFiles.length,
        deleted: deletedCount
      };
    } catch (error) {
      throw new Error(`Error cleaning up old files: ${error.message}`);
    }
  }
}

// Export singleton instance
const fileUploadService = new FileUploadService();
module.exports = fileUploadService;