const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createDefaultAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/climate-champion', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@climatechampion.com' 
    });

    if (existingAdmin) {
      console.log('Default admin already exists');
      process.exit(0);
    }

    // Create default admin
    const defaultAdmin = new Admin({
      fullName: 'System Administrator',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@climatechampion.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!',
      role: 'super_admin',
      department: 'ASCA',
      phoneNumber: '+91-9876543210',
    });

    await defaultAdmin.save();

    console.log('✅ Default admin created successfully!');
    console.log('📧 Email:', defaultAdmin.email);
    console.log('🔑 Password:', process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!');
    console.log('⚠️  Please change the default password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
    process.exit(1);
  }
};

// Run the script
createDefaultAdmin();