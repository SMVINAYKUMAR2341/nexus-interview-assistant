import React from 'react';

function TestApp() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#1890ff', marginBottom: '16px' }}>
          🎉 React App is Working!
        </h1>
        <p>If you can see this, React is rendering correctly.</p>
        <p>Loading main app...</p>
      </div>
    </div>
  );
}

export default TestApp;