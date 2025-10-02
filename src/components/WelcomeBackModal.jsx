import React from 'react';
import { Modal, Button, Typography, Card, Tag, Space } from 'antd';
import { PlayCircleOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useInterviewStore } from '../store/useInterviewStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const WelcomeBackModal = () => {
  const {
    showWelcomeBack,
    setShowWelcomeBack,
    candidates,
    activeCandidateId,
    resumeInterview,
    resetInterview,
    currentQuestionIndex
  } = useInterviewStore();

  const activeCandidate = candidates.find(c => c.id === activeCandidateId);

  const handleResumeInterview = () => {
    resumeInterview();
    setShowWelcomeBack(false);
  };

  const handleStartFresh = () => {
    resetInterview();
    setShowWelcomeBack(false);
  };

  if (!showWelcomeBack || !activeCandidate) {
    return null;
  }

  const getQuestionType = (index) => {
    if (index < 2) return 'easy';
    if (index < 4) return 'medium';
    return 'hard';
  };

  const getQuestionTypeColor = (type) => {
    switch (type) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'blue';
    }
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            🎉 Welcome Back!
          </Title>
        </div>
      }
      open={showWelcomeBack}
      onCancel={() => setShowWelcomeBack(false)}
      footer={null}
      width={600}
      centered
      maskClosable={false}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Text style={{ fontSize: '16px', color: '#666' }}>
          We found an unfinished interview session for:
        </Text>
        
        <Card style={{ margin: '20px 0', textAlign: 'left' }}>
          <div style={{ marginBottom: '16px' }}>
            <Text strong style={{ fontSize: '18px' }}>
              {activeCandidate.name}
            </Text>
            <br />
            <Text type="secondary">
              {activeCandidate.email} • {activeCandidate.phone}
            </Text>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text strong>Progress: </Text>
                <Text>
                  Question {currentQuestionIndex + 1} of 6
                </Text>
              </div>
              
              <div>
                <Text strong>Current Question Type: </Text>
                <Tag color={getQuestionTypeColor(getQuestionType(currentQuestionIndex))}>
                  {getQuestionType(currentQuestionIndex).toUpperCase()}
                </Tag>
              </div>
              
              <div>
                <Text strong>Questions Answered: </Text>
                <Text>
                  {activeCandidate.answers?.length || 0} / 6
                </Text>
              </div>
              
              <div>
                <Text strong>Last Activity: </Text>
                <Text type="secondary">
                  <ClockCircleOutlined /> {dayjs(activeCandidate.createdAt).format('MMM DD, YYYY HH:mm')}
                </Text>
              </div>
            </Space>
          </div>
        </Card>

        <div style={{ marginTop: '24px' }}>
          <Text style={{ fontSize: '16px', marginBottom: '20px', display: 'block' }}>
            Would you like to continue where you left off or start a new interview?
          </Text>
          
          <Space size="large">
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={handleResumeInterview}
              style={{ minWidth: '140px' }}
            >
              Continue Interview
            </Button>
            
            <Button
              size="large"
              icon={<DeleteOutlined />}
              onClick={handleStartFresh}
              style={{ minWidth: '140px' }}
            >
              Start Fresh
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: '16px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Your progress is automatically saved. You can always resume later.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;