const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validatePasswordResetRequest,
  validateInterviewerInfo,
  validateIntervieweeInfo,
  handleValidationErrors
} = require('../middleware/validation');

const router = express.Router();

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

// Apply general rate limiting to all auth routes
router.use(generalLimiter);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  validateRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, password, role, profile, interviewerInfo, intervieweeInfo } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username }
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.email === email.toLowerCase() 
            ? 'An account with this email already exists'
            : 'This username is already taken'
        });
      }

      // Create user object
      const userData = {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password,
        role,
        profile: profile || {}
      };

      // Add role-specific information
      if (role === 'Interviewer' && interviewerInfo) {
        userData.interviewerInfo = interviewerInfo;
      } else if (role === 'Interviewee' && intervieweeInfo) {
        userData.intervieweeInfo = intervieweeInfo;
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate JWT token
      const token = user.generateAuthToken();

      // Return user data without password
      const userResponse = user.toJSON();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login',
  authLimiter,
  validateLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user and include password for comparison
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment login attempts
        await user.incLoginAttempts();
        
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Generate JWT token
      const token = user.generateAuthToken();

      // Return user data without password
      const userResponse = user.toJSON();

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('intervieweeInfo.documents.fileId', 'filename originalname uploadDate')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authenticate,
  validateProfileUpdate,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, profile, interviewerInfo, intervieweeInfo } = req.body;
      const updates = {};

      // Check for conflicts if updating username or email
      if (username && username !== req.user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Username is already taken'
          });
        }
        updates.username = username;
      }

      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email is already in use'
          });
        }
        updates.email = email.toLowerCase();
      }

      // Update profile information
      if (profile) {
        updates.profile = { ...req.user.profile, ...profile };
      }

      // Update role-specific information
      if (req.user.role === 'Interviewer' && interviewerInfo) {
        updates.interviewerInfo = { ...req.user.interviewerInfo, ...interviewerInfo };
      } else if (req.user.role === 'Interviewee' && intervieweeInfo) {
        updates.intervieweeInfo = { ...req.user.intervieweeInfo, ...intervieweeInfo };
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser.toJSON()
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error while updating profile'
      });
    }
  }
);

/**
 * @route   PUT /api/auth/password
 * @desc    Change user password
 * @access  Private
 */
router.put('/password',
  authenticate,
  validatePasswordChange,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id).select('+password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while changing password'
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, (req, res) => {
  // JWT tokens are stateless, so logout is handled client-side
  // This endpoint exists for consistency and future token blacklisting
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify JWT token validity
 * @access  Private
 */
router.get('/verify-token', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user.toJSON()
    }
  });
});

/**
 * @route   GET /api/auth/stats
 * @desc    Get user statistics (admin only for now)
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await User.getStats();
    
    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth authentication
 * @access  Public
 */
const passport = require('passport');
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173',
    session: false 
  }),
  async (req, res) => {
    try {
      // Generate JWT token for the user
      const token = req.user.generateAuthToken();
      
      // Redirect to frontend with token
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}?token=${token}&role=${req.user.role}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=authentication_failed`);
    }
  }
);

/**
 * @route   POST /api/auth/google/token
 * @desc    Verify Google token and authenticate user
 * @access  Public
 */
router.post('/google/token',
  authLimiter,
  async (req, res) => {
    try {
      const { token, role } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Google token is required'
        });
      }

      // Verify the Google token with Google's API
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      const { sub: googleId, email, name, picture } = payload;

      // Check if user exists
      let user = await User.findOne({ googleId });

      if (!user) {
        // Check if user exists with this email
        user = await User.findOne({ email });

        if (user) {
          // Link Google account to existing user
          user.googleId = googleId;
          user.name = user.name || name;
          user.profilePicture = user.profilePicture || picture;
          await user.save();
        } else {
          // Create new user
          user = new User({
            googleId,
            email,
            name,
            profilePicture: picture,
            role: role || 'Interviewee',
            username: email.split('@')[0] + '_' + Math.random().toString(36).substring(7)
          });
          await user.save();
        }
      } else if (role && user.role !== role) {
        // Update role if provided and different
        user.role = role;
        await user.save();
      }

      // Generate JWT token
      const authToken = user.generateAuthToken();

      res.json({
        success: true,
        message: 'Google authentication successful',
        data: {
          token: authToken,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            profilePicture: user.profilePicture
          }
        }
      });
    } catch (error) {
      console.error('Google token verification error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid Google token'
      });
    }
  }
);

module.exports = router;