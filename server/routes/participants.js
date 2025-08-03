const express = require('express');
const { body, validationResult } = require('express-validator');
const Participant = require('../models/Participant');
const Submission = require('../models/Submission');
const { authenticateParticipant } = require('../middleware/auth');

const router = express.Router();

// Update participant profile
router.put('/profile', authenticateParticipant, [
  body('fullName').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('principalName').optional().trim().isLength({ min: 2 }).withMessage('Principal name is required'),
  body('principalEmail').optional().isEmail().normalizeEmail().withMessage('Please provide a valid principal email'),
  body('facultyRepresentative.name').optional().trim().isLength({ min: 2 }).withMessage('Faculty representative name is required'),
  body('facultyRepresentative.email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid faculty email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const participant = await Participant.findById(req.participant._id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'fullName', 'phoneNumber', 'principalName', 'principalEmail',
      'facultyRepresentative', 'partnerParticipant'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        participant[field] = req.body[field];
      }
    });

    await participant.save();

    res.json({
      message: 'Profile updated successfully',
      participant: {
        id: participant._id,
        fullName: participant.fullName,
        email: participant.email,
        phoneNumber: participant.phoneNumber,
        schoolName: participant.schoolName,
        principalName: participant.principalName,
        principalEmail: participant.principalEmail,
        facultyRepresentative: participant.facultyRepresentative,
        partnerParticipant: participant.partnerParticipant
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Add event organized by participant
router.post('/events', authenticateParticipant, [
  body('eventName').trim().isLength({ min: 3 }).withMessage('Event name must be at least 3 characters'),
  body('eventDate').isISO8601().withMessage('Please provide a valid event date'),
  body('eventType').isIn(['Mission LiFE', 'Climate Change', 'Other']).withMessage('Invalid event type'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('participantCount').isInt({ min: 1 }).withMessage('Participant count must be at least 1'),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      eventName,
      eventDate,
      eventType,
      description,
      participantCount,
      location,
      evidenceUrl
    } = req.body;

    const participant = await Participant.findById(req.participant._id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const eventData = {
      eventName,
      eventDate: new Date(eventDate),
      eventType,
      description,
      participantCount,
      location,
      evidenceUrl
    };

    participant.eventsOrganized.push(eventData);
    await participant.save();

    res.status(201).json({
      message: 'Event added successfully',
      event: eventData
    });
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({ message: 'Server error adding event' });
  }
});

// Get participant's events
router.get('/events', authenticateParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.participant._id)
      .select('eventsOrganized');

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    res.json({
      events: participant.eventsOrganized.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

// Update event
router.put('/events/:eventId', authenticateParticipant, [
  body('eventName').optional().trim().isLength({ min: 3 }).withMessage('Event name must be at least 3 characters'),
  body('eventDate').optional().isISO8601().withMessage('Please provide a valid event date'),
  body('eventType').optional().isIn(['Mission LiFE', 'Climate Change', 'Other']).withMessage('Invalid event type'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('participantCount').optional().isInt({ min: 1 }).withMessage('Participant count must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const participant = await Participant.findById(req.participant._id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const event = participant.eventsOrganized.id(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update event fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        event[key] = req.body[key];
      }
    });

    await participant.save();

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error updating event' });
  }
});

// Delete event
router.delete('/events/:eventId', authenticateParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.participant._id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const event = participant.eventsOrganized.id(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    participant.eventsOrganized.pull(req.params.eventId);
    await participant.save();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error deleting event' });
  }
});

// Add workshop attendance
router.post('/workshops', authenticateParticipant, [
  body('workshopName').trim().isLength({ min: 3 }).withMessage('Workshop name must be at least 3 characters'),
  body('attendanceDate').isISO8601().withMessage('Please provide a valid attendance date'),
  body('certificateUrl').optional().isURL().withMessage('Please provide a valid certificate URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { workshopName, attendanceDate, certificateUrl } = req.body;

    const participant = await Participant.findById(req.participant._id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const workshopData = {
      workshopName,
      attendanceDate: new Date(attendanceDate),
      certificateUrl
    };

    participant.workshopsAttended.push(workshopData);
    await participant.save();

    res.status(201).json({
      message: 'Workshop attendance added successfully',
      workshop: workshopData
    });
  } catch (error) {
    console.error('Add workshop error:', error);
    res.status(500).json({ message: 'Server error adding workshop attendance' });
  }
});

// Get participant's workshops
router.get('/workshops', authenticateParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.participant._id)
      .select('workshopsAttended');

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    res.json({
      workshops: participant.workshopsAttended.sort((a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate))
    });
  } catch (error) {
    console.error('Get workshops error:', error);
    res.status(500).json({ message: 'Server error fetching workshops' });
  }
});

// Get participant dashboard data
router.get('/dashboard', authenticateParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.participant._id)
      .select('-password')
      .populate('submissions', 'title submissionType status score submissionDate quarter');

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Calculate progress statistics
    const progressSummary = participant.getProgressSummary();

    // Get upcoming deadlines (mock data for now)
    const upcomingDeadlines = [
      {
        title: 'Q2 Quarterly Report',
        dueDate: new Date('2025-09-30'),
        type: 'quarterly_report',
        quarter: 'Q2'
      },
      {
        title: 'Idea Contest Submission',
        dueDate: new Date('2025-12-15'),
        type: 'idea_contest_entry'
      }
    ].filter(deadline => deadline.dueDate > new Date());

    // Get recent submissions
    const recentSubmissions = participant.submissions
      .sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate))
      .slice(0, 5);

    // Calculate completion status for quarterly reports
    const quarterlyReportStatus = {
      Q1: participant.quarterlyReports.find(r => r.quarter === 'Q1') || null,
      Q2: participant.quarterlyReports.find(r => r.quarter === 'Q2') || null,
      Q3: participant.quarterlyReports.find(r => r.quarter === 'Q3') || null,
      Final: participant.quarterlyReports.find(r => r.quarter === 'Final') || null
    };

    // Get participant rank and percentile
    const totalParticipants = await Participant.countDocuments({
      registrationStatus: 'approved',
      isActive: true
    });

    const percentile = participant.rank && totalParticipants > 0 
      ? Math.round(((totalParticipants - participant.rank + 1) / totalParticipants) * 100)
      : null;

    res.json({
      participant: {
        id: participant._id,
        fullName: participant.fullName,
        email: participant.email,
        schoolName: participant.schoolName,
        registrationStatus: participant.registrationStatus,
        totalScore: participant.totalScore,
        rank: participant.rank,
        percentile,
        profilePicture: participant.profilePicture
      },
      progress: progressSummary,
      quarterlyReportStatus,
      upcomingDeadlines,
      recentSubmissions,
      achievements: participant.badges || []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// Get participant progress timeline
router.get('/timeline', authenticateParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.participant._id)
      .populate('submissions', 'title submissionType status submissionDate score');

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Create timeline events
    const timelineEvents = [];

    // Registration event
    timelineEvents.push({
      type: 'registration',
      title: 'Registered for Climate Champion Programme',
      date: participant.registrationDate,
      status: participant.registrationStatus,
      description: `Joined from ${participant.schoolName}`
    });

    // Submission events
    participant.submissions.forEach(submission => {
      timelineEvents.push({
        type: 'submission',
        title: submission.title,
        date: submission.submissionDate,
        status: submission.status,
        score: submission.score,
        submissionType: submission.submissionType,
        description: `Submitted ${submission.submissionType.replace('_', ' ')}`
      });
    });

    // Event organization
    participant.eventsOrganized.forEach(event => {
      timelineEvents.push({
        type: 'event',
        title: event.eventName,
        date: event.eventDate,
        status: 'completed',
        description: `Organized ${event.eventType} event with ${event.participantCount} participants`,
        participantCount: event.participantCount
      });
    });

    // Workshop attendance
    participant.workshopsAttended.forEach(workshop => {
      timelineEvents.push({
        type: 'workshop',
        title: workshop.workshopName,
        date: workshop.attendanceDate,
        status: 'completed',
        description: 'Attended workshop session',
        certificateUrl: workshop.certificateUrl
      });
    });

    // Sort by date (newest first)
    timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      timeline: timelineEvents,
      summary: {
        totalEvents: timelineEvents.length,
        submissions: timelineEvents.filter(e => e.type === 'submission').length,
        eventsOrganized: timelineEvents.filter(e => e.type === 'event').length,
        workshopsAttended: timelineEvents.filter(e => e.type === 'workshop').length
      }
    });
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ message: 'Server error fetching timeline' });
  }
});

// Get participation statistics
router.get('/stats', authenticateParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.participant._id)
      .populate('submissions', 'submissionType status score');

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Calculate submission statistics
    const submissionStats = {
      total: participant.submissions.length,
      approved: participant.submissions.filter(s => s.status === 'approved').length,
      pending: participant.submissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length,
      rejected: participant.submissions.filter(s => s.status === 'rejected').length,
      needsRevision: participant.submissions.filter(s => s.status === 'needs_revision').length
    };

    // Calculate average score
    const scoredSubmissions = participant.submissions.filter(s => s.score !== undefined);
    const averageScore = scoredSubmissions.length > 0
      ? Math.round(scoredSubmissions.reduce((sum, s) => sum + s.score, 0) / scoredSubmissions.length)
      : 0;

    // Submission type breakdown
    const submissionTypes = {};
    participant.submissions.forEach(submission => {
      submissionTypes[submission.submissionType] = (submissionTypes[submission.submissionType] || 0) + 1;
    });

    // Monthly submission activity (last 12 months)
    const monthlyActivity = {};
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    participant.submissions
      .filter(s => s.submissionDate >= twelveMonthsAgo)
      .forEach(submission => {
        const monthKey = submission.submissionDate.toISOString().substring(0, 7); // YYYY-MM
        monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
      });

    res.json({
      submissionStats,
      averageScore,
      submissionTypes,
      monthlyActivity,
      eventsOrganized: participant.eventsOrganized.length,
      workshopsAttended: participant.workshopsAttended.length,
      badges: participant.badges.length,
      totalScore: participant.totalScore,
      rank: participant.rank
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

// Change password
router.put('/change-password', authenticateParticipant, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    const participant = await Participant.findById(req.participant._id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await participant.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    participant.password = newPassword;
    await participant.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// Deactivate account
router.put('/deactivate', authenticateParticipant, [
  body('reason').optional().trim().isLength({ min: 10 }).withMessage('Reason must be at least 10 characters'),
  body('password').notEmpty().withMessage('Password is required for account deactivation')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { password, reason } = req.body;

    const participant = await Participant.findById(req.participant._id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Verify password
    const isPasswordValid = await participant.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // Deactivate account
    participant.isActive = false;
    participant.deactivationReason = reason;
    participant.deactivationDate = new Date();
    await participant.save();

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Server error deactivating account' });
  }
});

module.exports = router;