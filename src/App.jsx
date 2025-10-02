import React, { useEffect } from 'react';
import { Layout, Tabs, ConfigProvider, Button } from 'antd';
import { UserOutlined, DashboardOutlined, LogoutOutlined } from '@ant-design/icons';
import { useInterviewStore } from './store/useInterviewStore';
import { useAuthStore } from './store/useAuthStore';
import IntervieweeView from './pages/IntervieweeView';
import InterviewerView from './pages/InterviewerView';
import AIChatbot from './components/AIChatbot';
import AuthPageNeon from './pages/AuthPageNeon';
import WelcomeBackModal from './components/WelcomeBackModal';
import ErrorBoundary from './components/ErrorBoundary';
import 'antd/dist/reset.css';

const { Header, Content } = Layout;

function App() {
  console.log('App component rendering')
  
  const { checkForIncompleteSession } = useInterviewStore();
  const { isAuthenticated, user, logout, initializeAuth } = useAuthStore();

  console.log('Auth state:', { isAuthenticated, user })

  useEffect(() => {
    // Initialize auth state on app load
    console.log('App useEffect running')
    initializeAuth();
    // Check for incomplete sessions on app load
    checkForIncompleteSession();
  }, []); // Empty dependency array - only run once on mount

  // If user is not authenticated, show auth page
  if (!isAuthenticated) {
    console.log('Rendering AuthPageNeon - user not authenticated')
    return <AuthPageNeon />;
  }

  console.log('User is authenticated, rendering main dashboard')
  console.log('User data:', user)

  // Build tab items based on user role
  const tabItems = [];
  
  // Interviewee tab - always show
  tabItems.push({
    key: 'interviewee',
    label: (
      <span>
        <UserOutlined />
        Interviewee
      </span>
    ),
    children: (
      <ErrorBoundary>
        <IntervieweeView />
      </ErrorBoundary>
    ),
  });

  // Interviewer Dashboard - only show for Interviewers
  if (user && user.role === 'Interviewer') {
    tabItems.push({
      key: 'interviewer',
      label: (
        <span>
          <DashboardOutlined />
          Interviewer Dashboard
        </span>
      ),
      children: (
        <ErrorBoundary>
          <InterviewerView />
        </ErrorBoundary>
      ),
    });
  }

  console.log('Rendering main app for authenticated user')

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
          <Header style={{ 
            background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)',
            padding: '0 32px',
            borderBottom: '1px solid rgba(88, 166, 255, 0.2)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(88, 166, 255, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Animated Background Effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(88, 166, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
              animation: 'pulse 4s ease-in-out infinite'
            }} />
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              height: '100%',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ 
                  fontSize: '40px',
                  animation: 'float 3s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 15px rgba(124, 58, 237, 0.8)) drop-shadow(0 0 30px rgba(88, 166, 255, 0.5))'
                }}>
                  ⚡
                </div>
                <div style={{ 
                  fontSize: '36px', 
                  fontWeight: '800', 
                  background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 30%, #ff00ff 60%, #00d4ff 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  animation: 'neonShift 3s linear infinite',
                  filter: 'drop-shadow(0 0 10px rgba(124, 58, 237, 0.5)) drop-shadow(0 0 20px rgba(0, 212, 255, 0.3))',
                  textShadow: '0 0 10px rgba(124, 58, 237, 0.5)',
                  fontFamily: "'Orbitron', 'Rajdhani', sans-serif"
                }}>
                  NEXUS
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(88, 166, 255, 0.1)',
                  border: '1px solid rgba(88, 166, 255, 0.3)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <span style={{ 
                    color: '#58a6ff',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    👋 Welcome, <span style={{ color: '#fff' }}>{user?.username || 'User'}</span>
                  </span>
                </div>
                <Button 
                  icon={<LogoutOutlined />}
                  onClick={logout}
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontWeight: '600',
                    height: '38px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </Header>
          
          <Content style={{ background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)' }}>
            <Tabs
              defaultActiveKey={user?.role === 'Interviewer' ? 'interviewer' : 'interviewee'}
              items={tabItems}
              size="large"
              style={{
                background: 'transparent',
                margin: 0,
                minHeight: 'calc(100vh - 64px)'
              }}
              tabBarStyle={{
                padding: '0 32px',
                margin: 0,
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(10px)',
                borderBottom: '2px solid rgba(88, 166, 255, 0.2)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}
              className="neon-tabs"
            />
          </Content>
        </Layout>
        
        {/* Welcome Back Modal */}
        <WelcomeBackModal />

        {/* AI Chatbot - Fixed position */}
        <AIChatbot />
    </ConfigProvider>
  );
}

export default App;