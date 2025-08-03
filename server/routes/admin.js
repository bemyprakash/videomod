const express = require('express');
const { body, validationResult } = require('express-validator');
const Participant = require('../models/Participant');
const Admin = require('../models/Admin');
const Submission = require('../models/Submission');
const { authenticateAdmin, requirePermission, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Participant statistics
    const participantStats = await Participant.aggregate([
      {
        $group: {
          _id: '$registrationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const participantsByStatus = {};
    participantStats.forEach(stat => {
      participantsByStatus[stat._id] = stat.count;
    });

    // Submission statistics
    const submissionStats = await Submission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const submissionsByStatus = {};
    submissionStats.forEach(stat => {
      submissionsByStatus[stat._id] = stat.count;
    });

    // Recent activities
    const recentSubmissions = await Submission.find()
      .populate('participant', 'fullName schoolName')
      .sort({ submissionDate: -1 })
      .limit(10)
      .select('title submissionType status submissionDate participant');

    const recentRegistrations = await Participant.find()
      .sort({ registrationDate: -1 })
      .limit(10)
      .select('fullName schoolName registrationStatus registrationDate');

    // School statistics
    const schoolStats = await Participant.aggregate([
      {
        $group: {
          _id: '$schoolState',
          schools: { $addToSet: '$schoolName' },
          participants: { $sum: 1 }
        }
      },
      {
        $project: {
          state: '$_id',
          schoolCount: { $size: '$schools' },
          participantCount: '$participants'
        }
      },
      {
        $sort: { participantCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      overview: {
        participants: participantsByStatus,
        submissions: submissionsByStatus,
        totalSchools: await Participant.distinct('schoolName').then(schools => schools.length),
        totalStates: await Participant.distinct('schoolState').then(states => states.length)
      },
      recentActivities: {
        submissions: recentSubmissions,
        registrations: recentRegistrations
      },
      topStates: schoolStats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// Get all participants with filters and pagination
router.get('/participants', authenticateAdmin, requirePermission('view_participants'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search, 
      state, 
      sortBy = 'registrationDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.registrationStatus = status;
    if (state) filter.schoolState = state;
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { schoolName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const participants = await Participant.find(filter)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Participant.countDocuments(filter);

    res.json({
      participants,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ message: 'Server error fetching participants' });
  }
});

// Get participant details
router.get('/participants/:id', authenticateAdmin, requirePermission('view_participants'), async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id)
      .select('-password')
      .populate('submissions', 'title submissionType status score submissionDate');

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    res.json({ participant });
  } catch (error) {
    console.error('Get participant error:', error);
    res.status(500).json({ message: 'Server error fetching participant' });
  }
});

// Approve participant registration
router.put('/participants/:id/approve', authenticateAdmin, requirePermission('manage_participants'), async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    if (participant.registrationStatus === 'approved') {
      return res.status(400).json({ message: 'Participant is already approved' });
    }

    participant.registrationStatus = 'approved';
    await participant.save();

    res.json({ 
      message: 'Participant approved successfully',
      participant: {
        id: participant._id,
        fullName: participant.fullName,
        registrationStatus: participant.registrationStatus
      }
    });
  } catch (error) {
    console.error('Approve participant error:', error);
    res.status(500).json({ message: 'Server error approving participant' });
  }
});

// Reject participant registration
router.put('/participants/:id/reject', authenticateAdmin, requirePermission('manage_participants'), [
  body('reason').optional().trim().isLength({ min: 10 }).withMessage('Rejection reason must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const participant = await Participant.findById(req.params.id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    participant.registrationStatus = 'rejected';
    participant.rejectionReason = req.body.reason;
    await participant.save();

    res.json({ 
      message: 'Participant rejected',
      participant: {
        id: participant._id,
        fullName: participant.fullName,
        registrationStatus: participant.registrationStatus
      }
    });
  } catch (error) {
    console.error('Reject participant error:', error);
    res.status(500).json({ message: 'Server error rejecting participant' });
  }
});

// Get all submissions with filters
router.get('/submissions', authenticateAdmin, requirePermission('review_submissions'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type, 
      participant,
      sortBy = 'submissionDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.submissionType = type;
    if (participant) filter.participant = participant;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const submissions = await Submission.find(filter)
      .populate('participant', 'fullName schoolName schoolCity schoolState')
      .populate('evaluatedBy', 'fullName')
      .sort(sort)
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

// Get submission details for review
router.get('/submissions/:id', authenticateAdmin, requirePermission('review_submissions'), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('participant', 'fullName schoolName schoolCity schoolState email phoneNumber')
      .populate('evaluatedBy', 'fullName')
      .select('-filePath'); // Don't expose file paths

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({ submission });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Server error fetching submission' });
  }
});

// Review and score submission
router.put('/submissions/:id/review', authenticateAdmin, requirePermission('review_submissions'), [
  body('status').isIn(['approved', 'rejected', 'needs_revision']).withMessage('Invalid status'),
  body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('feedback').optional().trim().isLength({ min: 10 }).withMessage('Feedback must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { status, score, feedback } = req.body;

    const submission = await Submission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update submission
    submission.status = status;
    submission.score = score;
    submission.feedback = feedback;
    submission.evaluatedBy = req.admin._id;
    submission.evaluatedAt = new Date();

    await submission.save();

    // Update participant's quarterly report if this is a quarterly report
    if (submission.submissionType === 'quarterly_report') {
      await Participant.findOneAndUpdate(
        { 
          _id: submission.participant,
          'quarterlyReports.quarter': submission.quarter
        },
        {
          $set: {
            'quarterlyReports.$.status': status,
            'quarterlyReports.$.score': score,
            'quarterlyReports.$.feedback': feedback
          }
        }
      );

      // Recalculate participant's total score
      const participant = await Participant.findById(submission.participant);
      if (participant) {
        participant.calculateTotalScore();
        await participant.save();
      }
    }

    res.json({ 
      message: 'Submission reviewed successfully',
      submission: {
        id: submission._id,
        status: submission.status,
        score: submission.score,
        evaluatedAt: submission.evaluatedAt
      }
    });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ message: 'Server error reviewing submission' });
  }
});

// Bulk approve submissions
router.put('/submissions/bulk-approve', authenticateAdmin, requirePermission('review_submissions'), [
  body('submissionIds').isArray({ min: 1 }).withMessage('At least one submission ID is required'),
  body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('feedback').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { submissionIds, score, feedback } = req.body;

    const updateData = {
      status: 'approved',
      evaluatedBy: req.admin._id,
      evaluatedAt: new Date()
    };

    if (score !== undefined) updateData.score = score;
    if (feedback) updateData.feedback = feedback;

    const result = await Submission.updateMany(
      { _id: { $in: submissionIds } },
      { $set: updateData }
    );

    res.json({ 
      message: `${result.modifiedCount} submissions approved successfully`,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ message: 'Server error during bulk approval' });
  }
});

// Download submission file
router.get('/submissions/:id/download', authenticateAdmin, requirePermission('review_submissions'), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const fs = require('fs');
    if (!fs.existsSync(submission.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(submission.filePath, submission.originalFileName);
  } catch (error) {
    console.error('Download submission error:', error);
    res.status(500).json({ message: 'Server error downloading file' });
  }
});

// Get admin management (super admin only)
router.get('/admins', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const admins = await Admin.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Admin.countDocuments();

    res.json({
      admins,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Server error fetching admins' });
  }
});

// Create new admin (super admin only)
router.post('/admins', authenticateAdmin, requireRole('super_admin'), [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['admin', 'evaluator']).withMessage('Invalid role'),
  body('department').isIn(['ASCA', 'AARAMBH', 'Academic', 'Technical']).withMessage('Invalid department')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { fullName, email, password, role, department, phoneNumber } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const admin = new Admin({
      fullName,
      email,
      password,
      role,
      department,
      phoneNumber
    });

    await admin.save();

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        department: admin.department
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error creating admin' });
  }
});

// Update admin (super admin only)
router.put('/admins/:id', authenticateAdmin, requireRole('super_admin'), [
  body('fullName').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('role').optional().isIn(['admin', 'evaluator']).withMessage('Invalid role'),
  body('department').optional().isIn(['ASCA', 'AARAMBH', 'Academic', 'Technical']).withMessage('Invalid department'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Update fields
    const { fullName, role, department, isActive, phoneNumber } = req.body;
    
    if (fullName) admin.fullName = fullName;
    if (role) admin.role = role;
    if (department) admin.department = department;
    if (isActive !== undefined) admin.isActive = isActive;
    if (phoneNumber) admin.phoneNumber = phoneNumber;

    await admin.save();

    res.json({
      message: 'Admin updated successfully',
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        role: admin.role,
        department: admin.department,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ message: 'Server error updating admin' });
  }
});

// Generate reports
router.get('/reports/export', authenticateAdmin, requirePermission('generate_reports'), async (req, res) => {
  try {
    const { type = 'participants', format = 'json' } = req.query;

    let data;
    
    switch (type) {
      case 'participants':
        data = await Participant.find({ registrationStatus: 'approved' })
          .select('-password')
          .populate('submissions', 'title submissionType status score');
        break;
        
      case 'submissions':
        data = await Submission.find()
          .populate('participant', 'fullName schoolName')
          .select('-filePath');
        break;
        
      case 'leaderboard':
        data = await Participant.find({ 
          registrationStatus: 'approved',
          isActive: true 
        })
        .select('fullName schoolName schoolCity schoolState totalScore rank')
        .sort({ totalScore: -1 });
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvFields = Object.keys(data[0]?.toObject() || {});
      const csvData = data.map(item => csvFields.map(field => item[field] || '').join(',')).join('\n');
      const csvHeader = csvFields.join(',');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
      res.send(csvHeader + '\n' + csvData);
    } else {
      res.json({ data, total: data.length, generated: new Date() });
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error generating report' });
  }
});

module.exports = router;