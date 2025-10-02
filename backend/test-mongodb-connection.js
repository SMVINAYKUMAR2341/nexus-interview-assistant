const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = 'mongodb+srv://vinaykumarsm2341_db_user:UXONgKjzVZvSiBP6@ai-interview.ftp1gtm.mongodb.net/crisp-interview-db?retryWrites=true&w=majority&appName=AI-interview';

async function testConnection() {
  console.log('🔄 Testing MongoDB Atlas connection...\n');
  
  try {
    console.log('📡 Connecting to MongoDB Atlas...');
    console.log('🔗 Connection String: mongodb+srv://vinaykumarsm2341_db_user:****@ai-interview.ftp1gtm.mongodb.net/\n');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!\n');
    
    // Get database info
    const db = mongoose.connection.db;
    const admin = db.admin();
    const info = await admin.serverStatus();
    
    console.log('📊 Database Information:');
    console.log('   ├─ Database Name:', mongoose.connection.name);
    console.log('   ├─ Host:', mongoose.connection.host);
    console.log('   ├─ MongoDB Version:', info.version);
    console.log('   ├─ Connection State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');
    console.log('   └─ Database Size:', db.stats ? 'Available' : 'Checking...\n');

    // Test collections
    console.log('📚 Available Collections:');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('   └─ No collections yet (will be created on first use)\n');
    } else {
      collections.forEach((col, index) => {
        const isLast = index === collections.length - 1;
        console.log(`   ${isLast ? '└─' : '├─'} ${col.name}`);
      });
      console.log('');
    }

    // Test User model
    console.log('🧪 Testing User Model...');
    const User = require('./models/User');
    
    // Check if test user exists
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    if (testUser) {
      console.log('   ├─ Found existing test user');
      console.log('   ├─ Username:', testUser.username);
      console.log('   ├─ Email:', testUser.email);
      console.log('   └─ Role:', testUser.role, '\n');
    } else {
      console.log('   └─ No test users found (ready for registration)\n');
    }

    // Get user count
    const userCount = await User.countDocuments();
    console.log('👥 Total Users in Database:', userCount, '\n');

    console.log('✅ All tests passed! MongoDB is ready for authentication.\n');
    console.log('🚀 Next Steps:');
    console.log('   1. Start the backend server: cd backend && npm run dev');
    console.log('   2. Start the frontend: npm run dev');
    console.log('   3. Register a new user to test email authentication\n');

    await mongoose.connection.close();
    console.log('🔒 Connection closed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB Connection Failed!\n');
    console.error('Error Details:');
    console.error('   ├─ Type:', error.name);
    console.error('   ├─ Message:', error.message);
    console.error('   └─ Code:', error.code || 'N/A', '\n');

    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Troubleshooting Tips:');
      console.error('   1. Check if your IP address is whitelisted in MongoDB Atlas');
      console.error('   2. Verify the username and password are correct');
      console.error('   3. Ensure your internet connection is stable');
      console.error('   4. Check if MongoDB Atlas cluster is running\n');
    } else if (error.name === 'MongoParseError') {
      console.error('💡 Troubleshooting Tips:');
      console.error('   1. Check the connection string format');
      console.error('   2. Ensure special characters in password are URL encoded');
      console.error('   3. Verify the cluster name is correct\n');
    }

    process.exit(1);
  }
}

// Run the test
testConnection();
