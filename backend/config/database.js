const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.gridFSBucket = null;
  }

  async connect() {
    try {
      // Connect to MongoDB with more lenient timeout settings
      this.connection = await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10, // Maximum number of connections in the connection pool
        serverSelectionTimeoutMS: 30000, // Increased timeout - wait 30 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        connectTimeoutMS: 30000, // Increased connection timeout
      });

      console.log('✅ Connected to MongoDB successfully');

      // Initialize GridFS bucket for file uploads
      const db = mongoose.connection.db;
      this.gridFSBucket = new GridFSBucket(db, {
        bucketName: process.env.GRIDFS_BUCKET_NAME || 'uploads'
      });

      console.log('✅ GridFS bucket initialized successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', this.gracefulShutdown.bind(this));
      process.on('SIGTERM', this.gracefulShutdown.bind(this));

      return this.connection;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown() {
    try {
      console.log('🔄 Closing MongoDB connection...');
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  getGridFSBucket() {
    if (!this.gridFSBucket) {
      throw new Error('GridFS bucket not initialized. Make sure to call connect() first.');
    }
    return this.gridFSBucket;
  }

  getConnection() {
    if (!this.connection) {
      throw new Error('Database not connected. Make sure to call connect() first.');
    }
    return this.connection;
  }

  // Health check method
  async healthCheck() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      return {
        status: states[state] || 'unknown',
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

// Export singleton instance
const dbConnection = new DatabaseConnection();
module.exports = dbConnection;