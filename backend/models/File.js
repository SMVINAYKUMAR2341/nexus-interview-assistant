const mongoose = require('mongoose');

// Schema for file metadata (complements GridFS)
const fileSchema = new mongoose.Schema({
  // GridFS file reference
  gridfsId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'fs.files'
  },

  // User who uploaded the file
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },

  // File metadata
  originalName: {
    type: String,
    required: true
  },

  filename: {
    type: String,
    required: true
  },

  mimetype: {
    type: String,
    required: true
  },

  size: {
    type: Number,
    required: true
  },

  // File categorization
  category: {
    type: String,
    enum: ['resume', 'cover_letter', 'portfolio', 'certificate', 'other'],
    default: 'resume'
  },

  // File description
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },

  // File processing status
  processedStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },

  // Extracted text content (for searchability)
  extractedText: {
    type: String,
    select: false // Don't include by default due to size
  },

  // File analysis results
  analysis: {
    skills: [{
      name: String,
      confidence: Number
    }],
    experience: {
      years: Number,
      positions: [{
        title: String,
        company: String,
        duration: String
      }]
    },
    education: [{
      degree: String,
      institution: String,
      year: Number
    }],
    languages: [String],
    certifications: [String]
  },

  // Access control
  isPublic: {
    type: Boolean,
    default: false
  },

  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'download'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },

  lastDownloaded: {
    type: Date,
    default: null
  },

  // File tags
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // AI Analysis metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Timestamps
  uploadedAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
fileSchema.index({ uploadedBy: 1, uploadedAt: -1 });
fileSchema.index({ gridfsId: 1 });
fileSchema.index({ category: 1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ 'analysis.skills.name': 1 });

// Virtual for file URL
fileSchema.virtual('downloadUrl').get(function() {
  return `/api/files/download/${this._id}`;
});

// Virtual for file preview URL
fileSchema.virtual('previewUrl').get(function() {
  return `/api/files/preview/${this._id}`;
});

// Pre-save middleware
fileSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Instance method to increment download count
fileSchema.methods.incrementDownloadCount = function() {
  return this.updateOne({
    $inc: { downloadCount: 1 },
    $set: { lastDownloaded: Date.now() }
  });
};

// Instance method to share file with user
fileSchema.methods.shareWith = function(userId, permission = 'view') {
  // Check if already shared
  const existingShare = this.sharedWith.find(
    share => share.userId.toString() === userId.toString()
  );

  if (existingShare) {
    existingShare.permission = permission;
    existingShare.sharedAt = Date.now();
  } else {
    this.sharedWith.push({
      userId,
      permission,
      sharedAt: Date.now()
    });
  }

  return this.save();
};

// Instance method to unshare file
fileSchema.methods.unshareWith = function(userId) {
  this.sharedWith = this.sharedWith.filter(
    share => share.userId.toString() !== userId.toString()
  );
  return this.save();
};

// Static method to find files by user
fileSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ uploadedBy: userId });
  
  if (options.category) {
    query.where('category').equals(options.category);
  }
  
  if (options.tags && options.tags.length > 0) {
    query.where('tags').in(options.tags);
  }
  
  return query.sort({ uploadedAt: -1 });
};

// Static method to find shared files
fileSchema.statics.findSharedWith = function(userId) {
  return this.find({
    'sharedWith.userId': userId
  }).populate('uploadedBy', 'username email profile.firstName profile.lastName');
};

// Static method to get file statistics
fileSchema.statics.getFileStats = async function(userId = null) {
  const matchStage = userId ? { uploadedBy: new mongoose.Types.ObjectId(userId) } : {};
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' },
        avgSize: { $avg: '$size' }
      }
    }
  ]);

  const totalStats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        totalDownloads: { $sum: '$downloadCount' }
      }
    }
  ]);

  return {
    byCategory: stats,
    total: totalStats[0] || { totalFiles: 0, totalSize: 0, totalDownloads: 0 }
  };
};

const File = mongoose.model('File', fileSchema);

module.exports = File;