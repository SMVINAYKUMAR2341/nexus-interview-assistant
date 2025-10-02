import React, { useState } from 'react';
import { Button, Input, Form, Card, Radio, Space, Typography, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/useAuthStore';

const { Title, Text } = Typography;

const AuthPageSimple = () => {
  console.log('AuthPageSimple rendering')
  
  const { role, setRole, login, signup, loginWithGoogle, isLoading, error } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [form] = Form.useForm();

  console.log('AuthPage state:', { role, isLogin, isLoading, error })

  const handleSubmit = async (values) => {
    try {
      if (isLogin) {
        await login(values);
      } else {
        await signup(values);
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google login success:', credentialResponse);
      const result = await loginWithGoogle(credentialResponse.credential);
      if (result.success) {
        message.success('Successfully logged in with Google!');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      message.error('Google authentication failed');
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    message.error('Google login failed. Please try again.');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f2f5',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
            🎯 Crisp Interview Assistant
          </Title>
          <Text type="secondary">
            AI-powered interview preparation platform
          </Text>
        </div>

        {/* Role Selection */}
        <div style={{ marginBottom: '24px' }}>
          <Text strong>I am a:</Text>
          <Radio.Group
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', marginTop: '8px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="Interviewer">👔 Interviewer</Radio>
              <Radio value="Interviewee">👤 Interviewee</Radio>
            </Space>
          </Radio.Group>
        </div>

        <Divider />

        {/* Login/Signup Toggle */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Button.Group>
            <Button 
              type={isLogin ? 'primary' : 'default'}
              onClick={() => setIsLogin(true)}
            >
              Login
            </Button>
            <Button 
              type={!isLogin ? 'primary' : 'default'}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </Button>
          </Button.Group>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            color: '#ff4d4f', 
            textAlign: 'center', 
            marginBottom: '16px',
            padding: '8px',
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '6px'
          }}>
            {error}
          </div>
        )}

        {/* Auth Form */}
        <Form
          form={form}
          name="auth"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          {!isLogin && (
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Username" 
                size="large"
              />
            </Form.Item>
          )}

          <Form.Item
            name={isLogin ? 'username' : 'email'}
            rules={[
              { required: true, message: `Please input your ${isLogin ? 'username' : 'email'}!` },
              !isLogin && { type: 'email', message: 'Please enter a valid email!' }
            ].filter(Boolean)}
          >
            <Input 
              prefix={isLogin ? <UserOutlined /> : <MailOutlined />} 
              placeholder={isLogin ? 'Username or Email' : 'Email'} 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              !isLogin && { min: 6, message: 'Password must be at least 6 characters!' }
            ].filter(Boolean)}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Password" 
              size="large"
            />
          </Form.Item>

          {!isLogin && (
            <>
              <Form.Item
                name="firstName"
                rules={[{ required: true, message: 'Please input your first name!' }]}
              >
                <Input placeholder="First Name" size="large" />
              </Form.Item>

              <Form.Item
                name="lastName"
                rules={[{ required: true, message: 'Please input your last name!' }]}
              >
                <Input placeholder="Last Name" size="large" />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              style={{ width: '100%' }}
              loading={isLoading}
            >
              {isLogin ? `Login as ${role}` : `Sign Up as ${role}`}
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>OR</Divider>

        {/* Google Sign In Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="100%"
              text={isLogin ? "signin_with" : "signup_with"}
            />
          </GoogleOAuthProvider>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Button 
              type="link" 
              size="small"
              onClick={() => setIsLogin(!isLogin)}
              style={{ padding: 0, fontSize: '12px' }}
            >
              {isLogin ? 'Sign up here' : 'Login here'}
            </Button>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default AuthPageSimple;