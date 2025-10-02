import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { useAuthStore } from '../store/useAuthStore';

const SignupForm = ({ onTogglePanel }) => {
  const { signup, isLoading, role } = useAuthStore();
  const [form] = Form.useForm();
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  const validateForm = () => {
    const values = form.getFieldsValue();
    const errors = {};

    // Username validation
    if (!values.username || values.username.length < 3) {
      errors.username = 'At least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!values.email || !emailRegex.test(values.email)) {
      errors.email = 'Invalid email';
    }

    // Password validation
    if (!values.password || values.password.length < 6) {
      errors.password = 'Min 6 chars';
    }

    // Confirm password validation
    if (!values.confirmPassword || values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!values.agreeTerms) {
      errors.agreeTerms = 'You must agree';
    }

    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  const handleFieldChange = () => {
    setTimeout(validateForm, 100); // Small delay to ensure form values are updated
  };

  const handleSubmit = async (values) => {
    if (!validateForm()) {
      return;
    }

    const result = await signup({
      username: values.username,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      agreeTerms: values.agreeTerms
    });

    if (result.success) {
      message.success(`Welcome to Crisp, ${values.username}!`);
    } else {
      message.error(result.error || 'Signup failed');
    }
  };

  return (
    <div className="form-container sign-up-container">
      <form className="auth-form">
        <h1>Create Account</h1>
        
        <div className="social-container">
          <a href="#" className="social-icon" onClick={(e) => e.preventDefault()}>
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#" className="social-icon" onClick={(e) => e.preventDefault()}>
            <i className="fab fa-google-plus-g"></i>
          </a>
          <a href="#" className="social-icon" onClick={(e) => e.preventDefault()}>
            <i className="fab fa-linkedin-in"></i>
          </a>
        </div>
        
        <span>or use your email for registration</span>
        
        <Form
          form={form}
          onFinish={handleSubmit}
          onFieldsChange={handleFieldChange}
          layout="vertical"
          style={{ width: '100%' }}
        >
          <Form.Item
            name="username"
            style={{ marginBottom: validationErrors.username ? '0px' : '4px' }}
          >
            <Input 
              className="auth-input"
              placeholder="Username"
            />
          </Form.Item>
          {validationErrors.username && (
            <div className="validation-message">{validationErrors.username}</div>
          )}

          <Form.Item
            name="email"
            style={{ marginBottom: validationErrors.email ? '0px' : '4px' }}
          >
            <Input 
              className="auth-input"
              placeholder="Email"
              type="email"
            />
          </Form.Item>
          {validationErrors.email && (
            <div className="validation-message">{validationErrors.email}</div>
          )}

          <Form.Item
            name="password"
            style={{ marginBottom: validationErrors.password ? '0px' : '4px' }}
          >
            <Input.Password 
              className="auth-input"
              placeholder="Password"
            />
          </Form.Item>
          {validationErrors.password && (
            <div className="validation-message">{validationErrors.password}</div>
          )}

          <Form.Item
            name="confirmPassword"
            style={{ marginBottom: validationErrors.confirmPassword ? '0px' : '4px' }}
          >
            <Input.Password 
              className="auth-input"
              placeholder="Confirm Password"
            />
          </Form.Item>
          {validationErrors.confirmPassword && (
            <div className="validation-message">{validationErrors.confirmPassword}</div>
          )}

          <Form.Item
            name="agreeTerms"
            valuePropName="checked"
            style={{ marginBottom: validationErrors.agreeTerms ? '0px' : '12px', marginTop: '12px' }}
          >
            <label className="terms-label">
              <Checkbox className="terms-checkbox" />
              I agree to the Terms and Conditions
            </label>
          </Form.Item>
          {validationErrors.agreeTerms && (
            <div className="validation-message">{validationErrors.agreeTerms}</div>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              disabled={!isFormValid}
              className="auth-button"
              style={{ width: 'auto' }}
            >
              Sign Up
            </Button>
          </Form.Item>
        </Form>
      </form>
    </div>
  );
};

export default SignupForm;