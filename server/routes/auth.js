const express = require('express');
const { body, validationResult } = require('express-validator');
const Participant = require('../models/Participant');
const Admin = require('../models/Admin');
const { generateToken, authenticateParticipant, authenticateAdmin } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Participant Registration
router.post('/participant/register', [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('schoolName').trim().isLength({ min: 2 }).withMessage('School name is required'),
  body('schoolAddress').trim().isLength({ min: 5 }).withMessage('School address is required'),
  body('schoolCity').trim().isLength({ min: 2 }).withMessage('School city is required'),
  body('schoolState').trim().isLength({ min: 2 }).withMessage('School state is required'),
  body('schoolPincode').isLength({ min: 6, max: 6 }).withMessage('Please provide a valid pincode'),
  body('principalName').trim().isLength({ min: 2 }).withMessage('Principal name is required'),
  body('principalEmail').isEmail().normalizeEmail().withMessage('Please provide a valid principal email'),
  body('facultyRepresentative.name').trim().isLength({ min: 2 }).withMessage('Faculty representative name is required'),
  body('facultyRepresentative.email').isEmail().normalizeEmail().withMessage('Please provide a valid faculty email')
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
      fullName,
      email,
      password,
      phoneNumber,
      schoolName,
      schoolAddress,
      schoolCity,
      schoolState,
      schoolPincode,
      principalName,
      principalEmail,
      facultyRepresentative,
      partnerParticipant
    } = req.body;

    // Check if participant already exists
    const existingParticipant = await Participant.findOne({ email });
    if (existingParticipant) {
      return res.status(400).json({ message: 'Participant with this email already exists' });
    }

    // Create new participant
    const participant = new Participant({
      fullName,
      email,
      password,
      phoneNumber,
      schoolName,
      schoolAddress,
      schoolCity,
      schoolState,
      schoolPincode,
      principalName,
      principalEmail,
      facultyRepresentative,
      partnerParticipant: partnerParticipant || undefined
    });

    await participant.save();

    // Generate token
    const token = generateToken(participant._id, 'participant', {
      schoolName: participant.schoolName
    });

    res.status(201).json({
      message: 'Registration successful! Your application is pending approval.',
      token,
      participant: {
        id: participant._id,
        fullName: participant.fullName,
        email: participant.email,
        schoolName: participant.schoolName,
        registrationStatus: participant.registrationStatus,
        registrationDate: participant.registrationDate
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Participant Login
router.post('/participant/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find participant
    const participant = await Participant.findOne({ email });
    if (!participant) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is active
    if (!participant.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
    }

    // Verify password
    const isMatch = await participant.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    participant.lastLogin = new Date();
    await participant.save();

    // Generate token
    const token = generateToken(participant._id, 'participant', {
      schoolName: participant.schoolName
    });

    res.json({
      message: 'Login successful',
      token,
      participant: {
        id: participant._id,
        fullName: participant.fullName,
        email: participant.email,
        schoolName: participant.schoolName,
        registrationStatus: participant.registrationStatus,
        totalScore: participant.totalScore,
        rank: participant.rank,
        profilePicture: participant.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Admin Login
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({ message: 'Your admin account has been deactivated.' });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id, 'admin', {
      role: admin.role,
      department: admin.department
    });

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        department: admin.department,
        permissions: admin.permissions,
        profilePicture: admin.profilePicture
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// Get current participant profile
router.get('/participant/me', authenticateParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.participant._id)
      .select('-password')
      .populate('submissions', 'title submissionType status score submissionDate');

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const progressSummary = participant.getProgressSummary();

    res.json({
      participant,
      progress: progressSummary
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Get current admin profile
router.get('/admin/me', authenticateAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ admin });
  } catch (error) {
    console.error('Admin profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching admin profile' });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ message: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'climate_champion_secret_key_2025');
    
    let user;
    if (decoded.userType === 'participant') {
      user = await Participant.findById(decoded.userId).select('-password');
    } else if (decoded.userType === 'admin') {
      user = await Admin.findById(decoded.userId).select('-password');
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const newToken = generateToken(user._id, decoded.userType, {
      schoolName: user.schoolName,
      role: user.role,
      department: user.department
    });

    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;