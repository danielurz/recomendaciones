import { validationResult } from 'express-validator';
import AuthService from '../services/auth.service.js';

const AuthController = {
  async register(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      const { user, token } = await AuthService.register(req.body);
      res.status(201).json({ success: true, data: { user, token }, message: 'User registered successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message, message: 'Registration failed' });
    }
  },

  async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      const { user, token } = await AuthService.login(req.body);
      res.status(200).json({ success: true, data: { user, token }, message: 'Login successful' });
    } catch (error) {
      res.status(401).json({ success: false, error: error.message, message: 'Login failed' });
    }
  }
};

export default AuthController;
