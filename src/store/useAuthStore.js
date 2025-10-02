import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../lib/authService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      role: 'Interviewee', // 'Interviewer' | 'Interviewee' - default to Interviewee
      isLoading: false,
      error: null,
      authInitialized: false,

      // Actions
      setRole: (role) => {
        set({ role });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      login: async (credentials) => {
        const { role, isLoading } = get();
        
        // Prevent duplicate login attempts
        if (isLoading) {
          console.warn('Login already in progress, ignoring duplicate request');
          return { success: false, error: 'Login already in progress' };
        }
        
        set({ isLoading: true, error: null });

        try {
          console.log('Attempting login with credentials...');
          const result = await authService.login(credentials);
          console.log('Login successful:', result.user?.username, 'Role:', result.user?.role);
          
          // Use the role from database, NOT the UI selection
          const user = result.user;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            authInitialized: true,
            role: user.role // Update UI role to match database role
          });

          return { success: true, user };
        } catch (error) {
          console.error('Login error:', error.message);
          set({
            isLoading: false,
            error: error.message || 'Login failed'
          });
          return { success: false, error: error.message };
        }
      },

      signup: async (userData) => {
        const { role } = get();
        set({ isLoading: true, error: null });

        try {
          const result = await authService.signup({ ...userData, role });
          
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return { success: true, user: result.user };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message || 'Signup failed'
          });
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        // Clear interview data when logging out
        try {
          const { clearUserData } = require('./useInterviewStore').useInterviewStore.getState();
          clearUserData();
        } catch (error) {
          console.warn('Could not clear interview data on logout:', error);
        }

        set({
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false
        });
      },

      // Update user profile
      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updates }
          });
        }
      },

      // Check if current user has specific role
      hasRole: (requiredRole) => {
        const { user, role } = get();
        return user && (user.role === requiredRole || role === requiredRole);
      },

      // Initialize user session (for app startup)
      initializeAuth: () => {
        const { user, authInitialized } = get();
        // Prevent multiple initializations
        if (authInitialized) {
          return;
        }
        if (user) {
          set({ isAuthenticated: true, authInitialized: true });
        } else {
          set({ authInitialized: true });
        }
      },

      // Google OAuth Login
      loginWithGoogle: async (googleToken) => {
        const { role } = get();
        set({ isLoading: true, error: null });

        try {
          const result = await authService.loginWithGoogle(googleToken, role);
          
          // Use the role from database during login, or use selected role during signup
          const user = result.isNewUser ? { ...result.user, role: role } : result.user;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            role: user.role // Update UI role to match actual user role
          });

          return { success: true, user };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message || 'Google authentication failed'
          });
          return { success: false, error: error.message };
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role
      })
    }
  )
);

