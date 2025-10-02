// Backend server with MongoDB GridFS and AI analysis
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport');

// Import database connection
const dbConnection = require('./config/database');

// Import services
const fileUploadService = require('./services/fileUpload');

// Import routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Session middleware for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'crisp-interview-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await dbConnection.healthCheck();
    
    res.json({
      success: true,
      message: 'Server is healthy',
      data: {
        server: {
          status: 'online',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV
        },
        database: dbHealth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Crisp Interview Assistant API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      files: '/api/files',
      health: '/health'
    }
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Crisp Interview Assistant API v1.0.0',
    documentation: {
      swagger: '/api/docs',
      postman: 'https://documenter.getpostman.com/view/crisp-interview'
    },
    endpoints: {
      authentication: {
        register: {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register new user',
          auth: false,
          body: {
            name: 'string',
            email: 'string',
            password: 'string',
            role: 'Interviewee | Interviewer'
          }
        },
        login: {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login user',
          auth: false,
          body: {
            email: 'string',
            password: 'string'
          }
        },
        googleAuth: {
          method: 'GET',
          path: '/api/auth/google',
          description: 'Authenticate with Google OAuth',
          auth: false
        }
      },
      files: {
        upload: {
          method: 'POST',
          path: '/api/files/upload',
          description: 'Upload files to MongoDB GridFS',
          auth: true,
          role: 'Interviewee',
          body: 'multipart/form-data with files[], category, description, tags'
        },
        list: {
          method: 'GET',
          path: '/api/files',
          description: 'List user uploaded files',
          auth: true,
          query: {
            category: 'optional',
            page: 'optional (default: 1)',
            limit: 'optional (default: 50)'
          }
        },
        download: {
          method: 'GET',
          path: '/api/files/:id/download',
          description: 'Download file from GridFS',
          auth: true
        },
        analyze: {
          method: 'POST',
          path: '/api/files/:id/analyze',
          description: 'Analyze file with Google Gemini AI',
          auth: true,
          role: 'Interviewee (own files) | Interviewer (any files)',
          response: {
            summary: 'string',
            skills: 'object',
            experience: 'object',
            education: 'object',
            strengths: 'array',
            areasForImprovement: 'array',
            recommendedRoles: 'array',
            interviewFocus: 'array',
            overallScore: 'string (1-10)',
            scoreReasoning: 'string'
          }
        },
        delete: {
          method: 'DELETE',
          path: '/api/files/:id',
          description: 'Delete file from GridFS',
          auth: true
        },
        update: {
          method: 'PUT',
          path: '/api/files/:id',
          description: 'Update file metadata',
          auth: true,
          body: {
            description: 'optional string',
            tags: 'optional array',
            category: 'optional string'
          }
        }
      },
      health: {
        check: {
          method: 'GET',
          path: '/health',
          description: 'Server and database health check',
          auth: false,
          response: {
            server: 'object',
            database: 'object'
          }
        }
      }
    },
    features: {
      fileStorage: 'MongoDB GridFS',
      aiAnalysis: 'Google Gemini 1.5 Flash',
      authentication: 'JWT + Google OAuth',
      fileTypes: ['PDF', 'DOC', 'DOCX', 'TXT', 'RTF'],
      maxFileSize: '10MB',
      maxFilesPerUpload: 5
    },
    status: {
      server: 'online',
      database: 'connected',
      gridfs: 'initialized',
      aiService: 'active'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    requestedUrl: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Handle validation errors
  if (error.name === 'ValidationError') {
    const validationErrors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  // Handle duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    
    return res.status(400).json({
      success: false,
      message: `${field} '${value}' already exists`,
      field: field
    });
  }

  // Handle cast errors (invalid ObjectId, etc.)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      field: error.path
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Handle multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large'
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files'
    });
  }

  // Default error
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack 
    })
  });
});

// Start server function
async function startServer() {
  try {
    // Connect to database
    await dbConnection.connect();
    
    // Initialize file upload service
    const db = require('mongoose').connection.db;
    fileUploadService.initialize(db);
    
    // Start server
    const PORT = process.env.PORT || 5000;
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API docs: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          await dbConnection.gracefulShutdown();
          console.log('✅ Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;