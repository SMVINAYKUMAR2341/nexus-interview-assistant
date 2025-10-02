import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/useAuthStore';
import styles from './AuthPage.module.css';

const AuthPage = () => {
  const { role, setRole, login, signup, loginWithGoogle, isLoading, error } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Sign Up form state
  const [signUpData, setSignUpData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    agreeTerms: false
  });
  
  // Sign In form state
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  
  // Validation messages
  const [validationMessages, setValidationMessages] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: ''
  });
  
  const [isSignUpValid, setIsSignUpValid] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Update validation messages and button state
  useEffect(() => {
    if (!isSignUp) return;
    
    const messages = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: ''
    };
    
    let valid = true;
    
    if (signUpData.username.trim() && signUpData.username.length < 3) {
      messages.username = 'At least 3 characters';
      valid = false;
    } else if (!signUpData.username.trim()) {
      valid = false;
    }
    
    if (signUpData.email.trim() && !validateEmail(signUpData.email.trim())) {
      messages.email = 'Invalid email';
      valid = false;
    } else if (!signUpData.email.trim()) {
      valid = false;
    }
    
    if (signUpData.password && signUpData.password.length < 6) {
      messages.password = 'Min 6 chars';
      valid = false;
    } else if (!signUpData.password) {
      valid = false;
    }
    
    if (signUpData.confirmPassword !== signUpData.password || signUpData.confirmPassword === '') {
      if (signUpData.confirmPassword) {
        messages.confirmPassword = 'Passwords do not match';
      }
      valid = false;
    }
    
    if (!signUpData.agreeTerms) {
      messages.agreeTerms = 'You must agree';
      valid = false;
    }
    
    setValidationMessages(messages);
    setIsSignUpValid(valid);
  }, [signUpData, isSignUp]);

  // Handle role selection
  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
  };

  // Handle sign up form changes
  const handleSignUpChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignUpData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle sign in form changes
  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    setSignInData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle sign up submit
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!isSignUpValid) return;
    
    try {
      await signup({
        username: signUpData.username,
        email: signUpData.email,
        password: signUpData.password,
        confirmPassword: signUpData.confirmPassword,
        firstName: signUpData.firstName,
        lastName: signUpData.lastName,
        agreeTerms: signUpData.agreeTerms
      });
    } catch (err) {
      console.error('Sign up error:', err);
    }
  };

  // Handle sign in submit
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await login({
        email: signInData.email,
        password: signInData.password
      });
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  // Handle Google sign in success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
    } catch (err) {
      console.error('Google sign in error:', err);
    }
  };

  // Handle Google sign in error
  const handleGoogleError = () => {
    console.error('Google sign in failed');
  };

  // Update overlay content based on panel state
  const [overlayContent, setOverlayContent] = useState({
    leftTitle: 'Welcome Back!',
    leftText: 'To keep connected with us please login with your personal info',
    rightText: 'Create an account and start your journey with us'
  });

  useEffect(() => {
    if (isSignUp) {
      setOverlayContent({
        leftTitle: 'Already have an account?',
        leftText: 'Sign in to access your account and continue your journey',
        rightText: 'Create an account and start your journey with us'
      });
    } else {
      setOverlayContent({
        leftTitle: 'Welcome Back!',
        leftText: 'To keep connected with us please login with your personal info',
        rightText: 'Create an account and start your journey with us'
      });
    }
  }, [isSignUp]);

  return (
    <div className={styles.authContainer}>
      {/* Role Selector - Always visible */}
      <div className={styles.roleSelectorContainer}>
        <div className={`${styles.roleToggle} ${role === 'Interviewee' ? styles.intervieweeActive : ''}`}>
          <div className={styles.sliderBackground}></div>
          <button
            className={`${styles.shinyButton} ${role === 'Interviewer' ? styles.active : ''}`}
            onClick={() => handleRoleChange('Interviewer')}
          >
            Interviewer
          </button>
          <button
            className={`${styles.shinyButton} ${role === 'Interviewee' ? styles.active : ''}`}
            onClick={() => handleRoleChange('Interviewee')}
          >
            Interviewee
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className={`${styles.container} ${isSignUp ? styles.rightPanelActive : ''}`}>
        {/* Sign Up Form */}
        <div className={`${styles.formContainer} ${styles.signUpContainer}`}>
          <form className={styles.form} onSubmit={handleSignUpSubmit}>
            <h1 className={styles.title}>Create Account</h1>
            <div className={styles.socialContainer}>
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="signup_with"
                  shape="rectangular"
                  width="280"
                />
              </GoogleOAuthProvider>
            </div>
            <span className={styles.span}>or use your email for registration</span>
            
            <input
              type="text"
              name="username"
              className={styles.input}
              placeholder="Username"
              value={signUpData.username}
              onChange={handleSignUpChange}
              required
            />
            <div className={styles.validationMessage}>{validationMessages.username}</div>
            
            <input
              type="email"
              name="email"
              className={styles.input}
              placeholder="Email"
              value={signUpData.email}
              onChange={handleSignUpChange}
              required
            />
            <div className={styles.validationMessage}>{validationMessages.email}</div>
            
            <input
              type="password"
              name="password"
              className={styles.input}
              placeholder="Password"
              value={signUpData.password}
              onChange={handleSignUpChange}
              required
            />
            <div className={styles.validationMessage}>{validationMessages.password}</div>
            
            <input
              type="password"
              name="confirmPassword"
              className={styles.input}
              placeholder="Confirm Password"
              value={signUpData.confirmPassword}
              onChange={handleSignUpChange}
              required
            />
            <div className={styles.validationMessage}>{validationMessages.confirmPassword}</div>
            
            <label className={styles.checkboxLabel} style={{ fontSize: '12px', marginTop: '12px' }}>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={signUpData.agreeTerms}
                onChange={handleSignUpChange}
              />
              I agree to the Terms and Conditions
            </label>
            <div className={styles.validationMessage}>{validationMessages.agreeTerms}</div>
            
            {error && (
              <div style={{ 
                color: '#ff4d4f', 
                textAlign: 'center', 
                marginTop: '10px',
                fontSize: '12px'
              }}>
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              className={styles.button}
              disabled={!isSignUpValid || isLoading}
            >
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className={`${styles.formContainer} ${styles.signInContainer}`}>
          <form className={styles.form} onSubmit={handleSignInSubmit}>
            <div className={styles.welcomeText} style={{ marginBottom: '2px', fontSize: '13px' }}>Welcome Back</div>
            <h1 className={styles.title} style={{ margin: '2px 0 4px 0', fontSize: '22px' }}>Sign in</h1>
            
            <div style={{
              fontSize: '10px',
              color: '#94a3b8',
              textAlign: 'center',
              padding: '4px 8px',
              background: 'rgba(88, 166, 255, 0.1)',
              borderRadius: '4px',
              marginBottom: '4px',
              border: '1px solid rgba(88, 166, 255, 0.2)'
            }}>
              💡 Logging in with your registered role. The slider above is for new signups only.
            </div>
            
            <input
              type="email"
              name="email"
              className={styles.input}
              placeholder="Email"
              value={signInData.email}
              onChange={handleSignInChange}
              required
            />
            
            <input
              type="password"
              name="password"
              className={styles.input}
              placeholder="Password"
              value={signInData.password}
              onChange={handleSignInChange}
              required
            />
            
            <a href="#" className={styles.link}>Forgot your password?</a>
            
            {error && (
              <div style={{ 
                color: '#ff4d4f', 
                textAlign: 'center', 
                marginTop: '10px',
                fontSize: '12px'
              }}>
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              className={styles.button}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
            
            <div style={{ 
              fontSize: '11px', 
              color: '#999', 
              margin: '8px 0 6px 0',
              textAlign: 'center'
            }}>
              or continue with
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              transform: 'scale(0.85)',
              transformOrigin: 'center'
            }}>
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="medium"
                  text="signin_with"
                  shape="rectangular"
                  width="240"
                />
              </GoogleOAuthProvider>
            </div>
          </form>
        </div>

        {/* Overlay */}
        <div className={styles.overlayContainer}>
          <div className={styles.overlay}>
            <div className={`${styles.overlayPanel} ${styles.overlayLeft}`}>
              <h1>{overlayContent.leftTitle}</h1>
              <p>{overlayContent.leftText}</p>
              <button 
                className={styles.ghostButton}
                onClick={() => setIsSignUp(false)}
              >
                Sign In
              </button>
            </div>
            <div className={`${styles.overlayPanel} ${styles.overlayRight}`}>
              <h1>Hello, {role}!</h1>
              <p>{overlayContent.rightText}</p>
              <button 
                className={styles.ghostButton}
                onClick={() => setIsSignUp(true)}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
