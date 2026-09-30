import { body, validationResult } from 'express-validator';
import { login, refreshAccessToken, logout, verify2FALogin } from '../services/authService.js';
import { generateAccessToken } from '../services/authService.js';
import User from '../models/User.js';

/**
 * Validation rules for login
 */
export const validateLogin = [
  body('login')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Login must be between 3 and 50 characters'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
];

/**
 * Login controller
 */
export const loginController = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const { login: userLogin, password } = req.body;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.get('user-agent');

    const result = await login(userLogin, password, ipAddress, userAgent);

    // If 2FA is required, return temporary token
    if (result.requires2FA) {
      return res.json({
        message: '2FA required',
        requires2FA: true,
        tempToken: result.tempToken,
        user: result.user
      });
    }

    // Set httpOnly cookies
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: result.user,
      accessToken: result.accessToken // Also send in response for localStorage option
    });
  } catch (error) {
    req.logger?.error('Login error:', error);
    res.status(401).json({ 
      error: 'Login failed',
      message: error.message
    });
  }
};

/**
 * Refresh token controller
 */
export const refreshTokenController = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Refresh token required'
      });
    }

    const accessToken = await refreshAccessToken(refreshToken);

    // Update access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.json({
      message: 'Token refreshed',
      accessToken
    });
  } catch (error) {
    req.logger?.error('Token refresh error:', error);
    res.status(401).json({ 
      error: 'Token refresh failed',
      message: error.message
    });
  }
};

/**
 * Logout controller
 */
export const logoutController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.get('user-agent');

    if (userId) {
      await logout(userId, ipAddress, userAgent);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logout successful' });
  } catch (error) {
    req.logger?.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      message: error.message
    });
  }
};

/**
 * Validation rules for 2FA verification during login
 */
export const validate2FALogin = [
  body('tempToken')
    .notEmpty()
    .withMessage('Temporary token is required'),
  body('token')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('2FA token must be 6 digits')
];

/**
 * Verify 2FA and complete login
 */
export const verify2FALoginController = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const { tempToken, token } = req.body;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.get('user-agent');

    const result = await verify2FALogin(tempToken, token, ipAddress, userAgent);

    // Set httpOnly cookies
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: result.user,
      accessToken: result.accessToken
    });
  } catch (error) {
    req.logger?.error('2FA verification error:', error);
    res.status(401).json({ 
      error: '2FA verification failed',
      message: error.message
    });
  }
};

/**
 * Get current user info
 */
export const getCurrentUserController = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found'
      });
    }

    res.json({ user });
  } catch (error) {
    req.logger?.error('Get current user error:', error);
    res.status(500).json({ 
      error: 'Failed to get user',
      message: error.message
    });
  }
};

