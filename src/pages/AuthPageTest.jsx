import React from 'react';
import { Button } from 'antd';
import { useAuthStore } from '../store/useAuthStore';

const AuthPageTest = () => {
  const { role, setRole } = useAuthStore();
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          color: '#1890ff', 
          marginBottom: '20px',
          fontSize: '28px'
        }}>
          🎯 Crisp Interview Assistant
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: '#666', 
          marginBottom: '30px' 
        }}>
          Welcome! Please select your role to continue.
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>I am a:</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Button 
              type={role === 'Interviewer' ? 'primary' : 'default'}
              onClick={() => setRole('Interviewer')}
              style={{ flex: 1 }}
            >
              👔 Interviewer
            </Button>
            <Button 
              type={role === 'Interviewee' ? 'primary' : 'default'}
              onClick={() => setRole('Interviewee')}
              style={{ flex: 1 }}
            >
              👤 Interviewee
            </Button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Button type="primary" size="large" style={{ width: '100%', marginBottom: '10px' }}>
            Login as {role}
          </Button>
          <Button size="large" style={{ width: '100%' }}>
            Sign Up as {role}
          </Button>
        </div>
        
        <p style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
          This is the authentication page working correctly!
        </p>
      </div>
    </div>
  );
};

export default AuthPageTest;