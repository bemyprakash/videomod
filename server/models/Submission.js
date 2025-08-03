const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  submissionType: {
    type: String,
    enum: [
      'quarterly_report',
      'event_documentation',
      'idea_contest_entry',
      'workshop_certificate',
      'final_report',
      'other'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  quarter: {
    type: String,
    enum: ['Q1', 'Q2', 'Q3', 'Final'],
    required: function() {
      return this.submissionType === 'quarterly_report';
    }
  },
  
  // File Information
  fileName: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  
  // Additional Documents
  supportingDocuments: [{
    fileName: String,
    filePath: String,
    fileUrl: String,
    description: String
  }],
  
  // Submission Status and Evaluation
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'rejected', 'needs_revision'],
    default: 'submitted'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  evaluatedAt: Date,
  
  // Submission Details
  submissionDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  isLateSubmission: {
    type: Boolean,
    default: false
  },
  
  // Event-specific fields (for event documentation)
  eventDetails: {
    eventName: String,
    eventDate: Date,
    eventType: {
      type: String,
      enum: ['Mission LiFE', 'Climate Change', 'Workshop', 'Other']
    },
    participantCount: Number,
    location: String,
    impact: String
  },
  
  // Idea Contest specific fields
  ideaContestEntry: {
    problemStatement: String,
    proposedSolution: String,
    innovationAspect: String,
    implementation: String,
    expectedImpact: String,
    teamMembers: [String]
  },
  
  // Version control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    filePath: String,
    submissionDate: Date,
    reason: String
  }],
  
  // Tags and Categories
  tags: [String],
  category: String,
  
  // Visibility and Sharing
  isPublic: {
    type: Boolean,
    default: false
  },
  allowDownload: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Check if submission is late
submissionSchema.pre('save', function(next) {
  if (this.dueDate && this.submissionDate > this.dueDate) {
    this.isLateSubmission = true;
  }
  next();
});

// Calculate days until due date
submissionSchema.methods.getDaysUntilDue = function() {
  if (!this.dueDate) return null;
  
  const now = new Date();
  const diffTime = this.dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get file extension
submissionSchema.methods.getFileExtension = function() {
  return this.originalFileName.split('.').pop().toLowerCase();
};

// Check if file is an image
submissionSchema.methods.isImage = function() {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  return imageTypes.includes(this.getFileExtension());
};

// Check if file is a document
submissionSchema.methods.isDocument = function() {
  const docTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  return docTypes.includes(this.getFileExtension());
};

// Generate submission summary
submissionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    type: this.submissionType,
    status: this.status,
    score: this.score,
    submissionDate: this.submissionDate,
    isLate: this.isLateSubmission,
    fileType: this.getFileExtension()
  };
};

module.exports = mongoose.model('Submission', submissionSchema);