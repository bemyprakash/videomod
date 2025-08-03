const jwt = require('jsonwebtoken');
const Participant = require('../models/Participant');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'climate_champion_secret_key_2025';

// General authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Participant authentication middleware
const authenticateParticipant = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.userType !== 'participant') {
      return res.status(403).json({ message: 'Access denied. Participant access required.' });
    }

    const participant = await Participant.findById(decoded.userId).select('-password');
    
    if (!participant) {
      return res.status(401).json({ message: 'Participant not found.' });
    }

    if (!participant.isActive) {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    req.participant = participant;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin access required.' });
    }

    const admin = await Admin.findById(decoded.userId).select('-password');
    
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found.' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: 'Admin account is deactivated.' });
    }

    req.admin = admin;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Permission-based middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    if (!req.admin.hasPermission(permission)) {
      return res.status(403).json({ 
        message: `Access denied. Required permission: ${permission}` 
      });
    }

    next();
  };
};

// Role-based middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const rolesArray = Array.isArray(roles) ? roles : [roles];
    
    if (!rolesArray.includes(req.admin.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${rolesArray.join(' or ')}` 
      });
    }

    next();
  };
};

// Generate JWT token
const generateToken = (userId, userType, additionalPayload = {}) => {
  return jwt.sign(
    { 
      userId, 
      userType,
      ...additionalPayload
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticate,
  authenticateParticipant,
  authenticateAdmin,
  requirePermission,
  requireRole,
  generateToken,
  verifyToken
};