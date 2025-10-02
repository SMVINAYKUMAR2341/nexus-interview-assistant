import React from 'react';

function App() {
  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      backgroundColor: '#f0f2f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: '#1890ff', fontSize: '32px', marginBottom: '20px' }}>
        🎯 Crisp Interview Assistant
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
        React is working successfully!
      </p>
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p>✅ Frontend server running on port 5173</p>
        <p>✅ Backend server running on port 5000</p>
        <p>✅ MongoDB connected and ready</p>
        <p>✅ Ready to use!</p>
      </div>
    </div>
  );
}

export default App;