const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const participantSchema = new mongoose.Schema({
  // Personal Information
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
    minlength: 6
  },
  phoneNumber: {
    type: String,
    required: true
  },
  
  // School Information
  schoolName: {
    type: String,
    required: true,
    trim: true
  },
  schoolAddress: {
    type: String,
    required: true
  },
  schoolCity: {
    type: String,
    required: true
  },
  schoolState: {
    type: String,
    required: true
  },
  schoolPincode: {
    type: String,
    required: true
  },
  principalName: {
    type: String,
    required: true
  },
  principalEmail: {
    type: String,
    required: true
  },
  facultyRepresentative: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    subject: String
  },
  
  // Programme Details
  isClimateChampion: {
    type: Boolean,
    default: true
  },
  partnerParticipant: {
    name: String,
    email: String
  },
  
  // Submissions and Progress
  submissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }],
  quarterlyReports: [{
    quarter: {
      type: String,
      enum: ['Q1', 'Q2', 'Q3', 'Final']
    },
    submissionDate: Date,
    fileUrl: String,
    status: {
      type: String,
      enum: ['submitted', 'reviewed', 'approved', 'needs_revision'],
      default: 'submitted'
    },
    score: Number,
    feedback: String
  }],
  
  // Events and Activities
  eventsOrganized: [{
    eventName: String,
    eventDate: Date,
    eventType: {
      type: String,
      enum: ['Mission LiFE', 'Climate Change', 'Other']
    },
    description: String,
    participantCount: Number,
    evidenceUrl: String
  }],
  
  // Workshops Attended
  workshopsAttended: [{
    workshopName: String,
    attendanceDate: Date,
    certificateUrl: String
  }],
  
  // Awards and Recognition
  totalScore: {
    type: Number,
    default: 0
  },
  rank: Number,
  badges: [{
    name: String,
    earnedDate: Date,
    description: String
  }],
  
  // Programme Status
  registrationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: String,
  
  // Timestamps
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
participantSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
participantSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate total score from quarterly reports
participantSchema.methods.calculateTotalScore = function() {
  this.totalScore = this.quarterlyReports.reduce((total, report) => {
    return total + (report.score || 0);
  }, 0);
  return this.totalScore;
};

// Get participant's progress summary
participantSchema.methods.getProgressSummary = function() {
  return {
    quarterlyReportsSubmitted: this.quarterlyReports.length,
    eventsOrganized: this.eventsOrganized.length,
    workshopsAttended: this.workshopsAttended.length,
    totalScore: this.totalScore,
    badges: this.badges.length
  };
};

module.exports = mongoose.model('Participant', participantSchema);