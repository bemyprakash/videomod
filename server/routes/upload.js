const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Submission = require('../models/Submission');
const Participant = require('../models/Participant');
const { authenticateParticipant } = require('../middleware/auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const participantId = req.participant._id;
    const uploadPath = path.join(uploadsDir, participantId.toString());
    
    // Create participant-specific directory
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1000);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    
    const fileName = `${timestamp}_${randomNum}_${sanitizedBaseName}${extension}`;
    cb(null, fileName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, PPT, PPTX, XLS, XLSX'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  }
});

// Submit document
router.post('/submit', authenticateParticipant, upload.single('document'), [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('submissionType').isIn([
    'quarterly_report',
    'event_documentation',
    'idea_contest_entry',
    'workshop_certificate',
    'final_report',
    'other'
  ]).withMessage('Invalid submission type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const {
      title,
      description,
      submissionType,
      quarter,
      eventDetails,
      ideaContestEntry,
      tags
    } = req.body;

    // Validate quarter for quarterly reports
    if (submissionType === 'quarterly_report' && !quarter) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Quarter is required for quarterly reports' });
    }

    // Check for duplicate quarterly report
    if (submissionType === 'quarterly_report') {
      const existingReport = await Submission.findOne({
        participant: req.participant._id,
        submissionType: 'quarterly_report',
        quarter: quarter
      });

      if (existingReport) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          message: `You have already submitted a ${quarter} quarterly report` 
        });
      }
    }

    // Create file URL
    const fileUrl = `/uploads/${req.participant._id}/${req.file.filename}`;

    // Parse event details if provided
    let parsedEventDetails = null;
    if (eventDetails && typeof eventDetails === 'string') {
      try {
        parsedEventDetails = JSON.parse(eventDetails);
      } catch (e) {
        // If parsing fails, ignore event details
      }
    } else if (eventDetails && typeof eventDetails === 'object') {
      parsedEventDetails = eventDetails;
    }

    // Parse idea contest entry if provided
    let parsedIdeaContestEntry = null;
    if (ideaContestEntry && typeof ideaContestEntry === 'string') {
      try {
        parsedIdeaContestEntry = JSON.parse(ideaContestEntry);
      } catch (e) {
        // If parsing fails, ignore idea contest entry
      }
    } else if (ideaContestEntry && typeof ideaContestEntry === 'object') {
      parsedIdeaContestEntry = ideaContestEntry;
    }

    // Create submission
    const submission = new Submission({
      participant: req.participant._id,
      submissionType,
      title,
      description,
      quarter: quarter || undefined,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileUrl,
      eventDetails: parsedEventDetails,
      ideaContestEntry: parsedIdeaContestEntry,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : []
    });

    await submission.save();

    // Add submission to participant's submissions array
    await Participant.findByIdAndUpdate(
      req.participant._id,
      { $push: { submissions: submission._id } }
    );

    // If it's a quarterly report, also add to quarterlyReports array
    if (submissionType === 'quarterly_report') {
      await Participant.findByIdAndUpdate(
        req.participant._id,
        {
          $push: {
            quarterlyReports: {
              quarter: quarter,
              submissionDate: submission.submissionDate,
              fileUrl: fileUrl,
              status: 'submitted'
            }
          }
        }
      );
    }

    res.status(201).json({
      message: 'Document submitted successfully',
      submission: {
        id: submission._id,
        title: submission.title,
        submissionType: submission.submissionType,
        status: submission.status,
        submissionDate: submission.submissionDate,
        fileUrl: submission.fileUrl,
        quarter: submission.quarter
      }
    });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    console.error('Submission error:', error);
    res.status(500).json({ message: 'Server error during submission' });
  }
});

// Submit multiple documents
router.post('/submit-multiple', authenticateParticipant, upload.array('documents', 5), [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('submissionType').isIn([
    'quarterly_report',
    'event_documentation',
    'idea_contest_entry',
    'workshop_certificate',
    'final_report',
    'other'
  ]).withMessage('Invalid submission type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded files if validation fails
      if (req.files) {
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        });
      }
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const {
      title,
      description,
      submissionType,
      quarter,
      eventDetails,
      ideaContestEntry,
      tags
    } = req.body;

    const submissions = [];
    const mainFile = req.files[0];
    const supportingFiles = req.files.slice(1);

    // Create main submission
    const fileUrl = `/uploads/${req.participant._id}/${mainFile.filename}`;
    
    const supportingDocuments = supportingFiles.map(file => ({
      fileName: file.filename,
      filePath: file.path,
      fileUrl: `/uploads/${req.participant._id}/${file.filename}`,
      description: `Supporting document: ${file.originalname}`
    }));

    const submission = new Submission({
      participant: req.participant._id,
      submissionType,
      title,
      description,
      quarter: quarter || undefined,
      fileName: mainFile.filename,
      originalFileName: mainFile.originalname,
      filePath: mainFile.path,
      fileSize: mainFile.size,
      mimeType: mainFile.mimetype,
      fileUrl,
      supportingDocuments,
      eventDetails: eventDetails ? JSON.parse(eventDetails) : undefined,
      ideaContestEntry: ideaContestEntry ? JSON.parse(ideaContestEntry) : undefined,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : []
    });

    await submission.save();

    // Add submission to participant
    await Participant.findByIdAndUpdate(
      req.participant._id,
      { $push: { submissions: submission._id } }
    );

    res.status(201).json({
      message: 'Documents submitted successfully',
      submission: {
        id: submission._id,
        title: submission.title,
        submissionType: submission.submissionType,
        status: submission.status,
        submissionDate: submission.submissionDate,
        fileUrl: submission.fileUrl,
        supportingDocuments: submission.supportingDocuments.length
      }
    });
  } catch (error) {
    // Clean up uploaded files if error occurs
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      });
    }
    
    console.error('Multiple submission error:', error);
    res.status(500).json({ message: 'Server error during submission' });
  }
});

// Get participant's submissions
router.get('/my-submissions', authenticateParticipant, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    
    const filter = { participant: req.participant._id };
    if (type) filter.submissionType = type;
    if (status) filter.status = status;

    const submissions = await Submission.find(filter)
      .sort({ submissionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-filePath'); // Don't expose file paths

    const total = await Submission.countDocuments(filter);

    res.json({
      submissions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error fetching submissions' });
  }
});

// Get submission details
router.get('/submission/:id', authenticateParticipant, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      participant: req.participant._id
    }).select('-filePath');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({ submission });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Server error fetching submission' });
  }
});

// Download file
router.get('/download/:id', authenticateParticipant, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      participant: req.participant._id
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const filePath = submission.filePath;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(filePath, submission.originalFileName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error downloading file' });
  }
});

// Delete submission
router.delete('/submission/:id', authenticateParticipant, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      participant: req.participant._id
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Only allow deletion if submission is not approved
    if (submission.status === 'approved') {
      return res.status(403).json({ message: 'Cannot delete approved submissions' });
    }

    // Delete file from filesystem
    if (fs.existsSync(submission.filePath)) {
      fs.unlinkSync(submission.filePath);
    }

    // Delete supporting documents
    submission.supportingDocuments.forEach(doc => {
      if (fs.existsSync(doc.filePath)) {
        try {
          fs.unlinkSync(doc.filePath);
        } catch (error) {
          console.error('Error deleting supporting document:', error);
        }
      }
    });

    // Remove from database
    await Submission.findByIdAndDelete(req.params.id);

    // Remove from participant's submissions array
    await Participant.findByIdAndUpdate(
      req.participant._id,
      { $pull: { submissions: req.params.id } }
    );

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ message: 'Server error deleting submission' });
  }
});

module.exports = router;