// Authentication service for handling login, signup, and validation
// Real backend API integration with MongoDB

class AuthService {
  constructor() {
    // Use import.meta.env for Vite instead of process.env
    // In production (Vercel), use relative URLs to work with the same domain
    if (import.meta.env.PROD) {
      // In production, use relative URL (same domain as frontend)
      this.baseURL = '/api';
    } else {
      // In development, use the full localhost URL
      this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    }
    
    console.log('AuthService initialized with baseURL:', this.baseURL);
    this.token = localStorage.getItem('crisp_auth_token');
    this.pendingRequests = new Map(); // Track pending requests to prevent duplicates
  }

  // Get authentication headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Handle API responses
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      // Handle validation errors with detailed messages
      if (data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
        throw new Error(`${data.message} - ${errorMessages}`);
      }
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Prevent duplicate requests
  async makeSafeRequest(key, requestFn) {
    // If a request with this key is already pending, wait for it
    if (this.pendingRequests.has(key)) {
      return await this.pendingRequests.get(key);
    }

    // Make the request and store the promise
    const requestPromise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, requestPromise);
    return await requestPromise;
  }

  // Store authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('crisp_auth_token', token);
  }

  // Remove authentication token
  removeToken() {
    this.token = null;
    localStorage.removeItem('crisp_auth_token');
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  isValidPassword(password) {
    return password && password.length >= 6;
  }

  // Hash password (mock implementation)
  hashPassword(password) {
    // In a real app, use proper hashing like bcrypt
    return btoa(password + 'crisp_salt');
  }

  // Verify password (mock implementation)
  verifyPassword(password, hashedPassword) {
    return this.hashPassword(password) === hashedPassword;
  }

  // Login user
  async login(credentials) {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await this.handleResponse(response);
      
      if (data.success && data.data.token) {
        this.setToken(data.data.token);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token
        };
      }

      throw new Error(data.message || 'Login failed');
    } catch (error) {
      throw new Error(error.message || 'Network error during login');
    }
  }

  // Sign up new user
  async signup(userData) {
    const { username, email, password, confirmPassword, agreeTerms, role = 'Interviewee' } = userData;

    // Client-side validation
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (!email || !this.isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    if (!this.isValidPassword(password)) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (!agreeTerms) {
      throw new Error('You must agree to the terms and conditions');
    }

    try {
      const payload = {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password,
        confirmPassword,
        role,
        agreeTerms
      };
      
      console.log('Signup payload:', payload);
      
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await this.handleResponse(response);
      console.log('Signup response:', data);
      
      if (data.success && data.data.token) {
        this.setToken(data.data.token);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token
        };
      }

      throw new Error(data.message || 'Signup failed');
    } catch (error) {
      console.error('Signup error details:', error);
      // If there are validation errors, show them
      if (error.message && error.message.includes('Validation failed')) {
        throw error;
      }
      throw new Error(error.message || 'Network error during signup');
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.token) {
        await fetch(`${this.baseURL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders()
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.removeToken();
    }
    
    return { success: true };
  }

  // Verify token
  async verifyToken(token = null) {
    const tokenToVerify = token || this.token;
    
    if (!tokenToVerify) {
      return { valid: false };
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      
      if (data.success && data.data.user) {
        return {
          valid: true,
          user: data.data.user
        };
      }

      return { valid: false };
    } catch (error) {
      console.warn('Token verification failed:', error);
      return { valid: false };
    }
  }

  // Get current user profile
  async getUserProfile() {
    if (!this.token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);
      
      if (data.success && data.data.user) {
        return data.data.user;
      }

      throw new Error(data.message || 'Failed to fetch user profile');
    } catch (error) {
      throw new Error(error.message || 'Network error while fetching profile');
    }
  }

  // Update user profile
  async updateUserProfile(updates) {
    if (!this.token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await this.handleResponse(response);
      
      if (data.success && data.data.user) {
        return data.data.user;
      }

      throw new Error(data.message || 'Failed to update profile');
    } catch (error) {
      throw new Error(error.message || 'Network error while updating profile');
    }
  }

  // Change password
  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    if (!this.token) {
      throw new Error('No authentication token found');
    }

    if (!this.isValidPassword(newPassword)) {
      throw new Error('New password must be at least 6 characters long');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('New passwords do not match');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await this.handleResponse(response);
      
      if (data.success) {
        return { success: true };
      }

      throw new Error(data.message || 'Failed to change password');
    } catch (error) {
      throw new Error(error.message || 'Network error while changing password');
    }
  }

  // Reset password
  async resetPassword(email) {
    if (!email || !this.isValidEmail(email)) {
      throw new Error('Please provide a valid email address');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await this.handleResponse(response);
      
      return {
        success: true,
        message: data.message || 'If an account with this email exists, a reset link has been sent.'
      };
    } catch (error) {
      // Don't reveal specific errors for security
      return {
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.'
      };
    }
  }

  // Initialize authentication (check for existing token)
  async initializeAuth() {
    if (!this.token) {
      return { authenticated: false };
    }

    try {
      const verification = await this.verifyToken();
      
      if (verification.valid) {
        return {
          authenticated: true,
          user: verification.user
        };
      } else {
        this.removeToken();
        return { authenticated: false };
      }
    } catch (error) {
      this.removeToken();
      return { authenticated: false };
    }
  }

  // Google OAuth Login
  async loginWithGoogle(googleToken, role) {
    if (!googleToken) {
      throw new Error('Google token is required');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/google/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: googleToken,
          role: role || 'Interviewee'
        })
      });

      const data = await this.handleResponse(response);
      
      if (data.success && data.data.token) {
        this.setToken(data.data.token);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token
        };
      }

      throw new Error(data.message || 'Google authentication failed');
    } catch (error) {
      throw new Error(error.message || 'Google authentication failed');
    }
  }

  // Get Google OAuth URL
  getGoogleAuthUrl() {
    return `${this.baseURL}/auth/google`;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;