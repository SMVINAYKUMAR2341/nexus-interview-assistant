import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useAuthStore } from '../store/useAuthStore';

const LoginForm = ({ onTogglePanel }) => {
  const { login, isLoading, role } = useAuthStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    const result = await login({
      email: values.email,
      password: values.password
    });

    if (result.success) {
      message.success(`Welcome back, ${role}!`);
    } else {
      message.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="form-container sign-in-container">
      <form className="auth-form">
        <div className="welcome-text">Welcome Back</div>
        <h1>Sign in</h1>
        
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
        
        <span>or use your account</span>
        
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          style={{ width: '100%' }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
            style={{ marginBottom: '6px' }}
          >
            <Input 
              className="auth-input"
              placeholder="Email"
              type="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' }
            ]}
            style={{ marginBottom: '15px' }}
          >
            <Input.Password 
              className="auth-input"
              placeholder="Password"
            />
          </Form.Item>

          <a 
            href="#" 
            className="forgot-password"
            onClick={(e) => {
              e.preventDefault();
              message.info('Password reset functionality coming soon!');
            }}
          >
            Forgot your password?
          </a>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              className="auth-button"
              style={{ width: 'auto' }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </form>
    </div>
  );
};

export default LoginForm;