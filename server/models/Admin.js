const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'evaluator'],
    default: 'admin'
  },
  department: {
    type: String,
    enum: ['ASCA', 'AARAMBH', 'Academic', 'Technical'],
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'view_participants',
      'manage_participants', 
      'review_submissions',
      'manage_leaderboard',
      'generate_reports',
      'manage_admins',
      'system_settings'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  profilePicture: String,
  phoneNumber: String
}, {
  timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if admin has specific permission
adminSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.role === 'super_admin';
};

// Set default permissions based on role
adminSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    switch (this.role) {
      case 'super_admin':
        this.permissions = [
          'view_participants',
          'manage_participants', 
          'review_submissions',
          'manage_leaderboard',
          'generate_reports',
          'manage_admins',
          'system_settings'
        ];
        break;
      case 'admin':
        this.permissions = [
          'view_participants',
          'manage_participants', 
          'review_submissions',
          'manage_leaderboard',
          'generate_reports'
        ];
        break;
      case 'evaluator':
        this.permissions = [
          'view_participants',
          'review_submissions'
        ];
        break;
    }
  }
  next();
});

module.exports = mongoose.model('Admin', adminSchema);