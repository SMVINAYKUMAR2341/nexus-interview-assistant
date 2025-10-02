import React from 'react';
import { Card, Timeline, Typography, Avatar, Space, Tag, Empty } from 'antd';
import { UserOutlined, RobotOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

const ChatHistory = ({ candidate }) => {
  // Mock chat history - will be replaced with real API data
  const mockChatHistory = [
    {
      id: 1,
      type: 'system',
      message: 'Interview session started',
      timestamp: '2025-09-28T10:00:00',
      sender: 'System'
    },
    {
      id: 2,
      type: 'ai',
      message: 'Hello! Welcome to your interview. Let\'s start with a brief introduction. Can you tell me about yourself and your professional background?',
      timestamp: '2025-09-28T10:00:15',
      sender: 'AI Interviewer'
    },
    {
      id: 3,
      type: 'candidate',
      message: 'Hi! I\'m a software engineer with 5 years of experience in full-stack development. I specialize in React, Node.js, and cloud technologies. I\'ve worked on several enterprise applications and led a team of 3 developers in my current role.',
      timestamp: '2025-09-28T10:01:30',
      sender: candidate?.name || 'Candidate'
    },
    {
      id: 4,
      type: 'ai',
      message: 'Excellent background! Now, let\'s dive into a technical question. Can you explain the difference between REST and GraphQL APIs? What are the advantages and disadvantages of each?',
      timestamp: '2025-09-28T10:02:00',
      sender: 'AI Interviewer'
    },
    {
      id: 5,
      type: 'candidate',
      message: 'Sure! REST uses multiple endpoints for different resources, while GraphQL uses a single endpoint with flexible queries. REST advantages include simplicity and caching, but can lead to over-fetching. GraphQL allows precise data fetching and reduces network requests, but has a steeper learning curve and more complex caching.',
      timestamp: '2025-09-28T10:03:45',
      sender: candidate?.name || 'Candidate'
    },
    {
      id: 6,
      type: 'ai',
      message: 'Great answer! You demonstrated good understanding of both technologies. Let\'s move on to a scenario-based question...',
      timestamp: '2025-09-28T10:04:15',
      sender: 'AI Interviewer'
    },
    {
      id: 7,
      type: 'system',
      message: 'Question 3 of 10 answered',
      timestamp: '2025-09-28T10:05:00',
      sender: 'System'
    }
  ];

  const getMessageStyle = (type) => {
    switch (type) {
      case 'candidate':
        return {
          backgroundColor: '#e6f7ff',
          borderLeft: '3px solid #1890ff',
          padding: '12px 16px',
          borderRadius: '8px',
          marginLeft: '40px'
        };
      case 'ai':
        return {
          backgroundColor: '#f6ffed',
          borderLeft: '3px solid #52c41a',
          padding: '12px 16px',
          borderRadius: '8px',
          marginRight: '40px'
        };
      case 'system':
        return {
          backgroundColor: '#fafafa',
          border: '1px dashed #d9d9d9',
          padding: '8px 12px',
          borderRadius: '8px',
          textAlign: 'center',
          fontStyle: 'italic',
          color: '#8c8c8c'
        };
      default:
        return {};
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'candidate':
        return '#1890ff';
      case 'ai':
        return '#52c41a';
      case 'system':
        return '#8c8c8c';
      default:
        return '#d9d9d9';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'candidate':
        return <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />;
      case 'ai':
        return <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />;
      case 'system':
        return <Avatar icon={<ClockCircleOutlined />} style={{ backgroundColor: '#8c8c8c' }} size="small" />;
      default:
        return <Avatar icon={<UserOutlined />} />;
    }
  };

  if (!candidate) {
    return (
      <Card style={{ margin: '24px' }}>
        <Empty description="Select a candidate to view chat history" />
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <Avatar icon={<UserOutlined />} src={candidate.avatar} />
            <div>
              <div style={{ fontWeight: 'bold' }}>Chat History - {candidate.name}</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Interview Date: {new Date(candidate.interviewDate).toLocaleString()}
              </Text>
            </div>
          </Space>
        }
        extra={
          <Space>
            <Tag color="blue">{mockChatHistory.length} Messages</Tag>
            <Tag color="green">Duration: 45 min</Tag>
          </Space>
        }
        style={{ borderRadius: '12px' }}
      >
        <Timeline
          mode="left"
          items={mockChatHistory.map(chat => ({
            key: chat.id,
            dot: getIcon(chat.type),
            color: getIconColor(chat.type),
            label: (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {new Date(chat.timestamp).toLocaleTimeString()}
              </Text>
            ),
            children: (
              <div style={getMessageStyle(chat.type)}>
                {chat.type !== 'system' && (
                  <Text strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                    {chat.sender}
                  </Text>
                )}
                <Paragraph style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  {chat.message}
                </Paragraph>
              </div>
            )
          }))}
        />

        {/* Summary Stats */}
        <Card
          size="small"
          style={{
            marginTop: '24px',
            backgroundColor: '#fafafa',
            border: '1px solid #f0f0f0'
          }}
        >
          <Space size="large" style={{ width: '100%', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {mockChatHistory.filter(c => c.type === 'candidate').length}
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Candidate Messages</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {mockChatHistory.filter(c => c.type === 'ai').length}
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>AI Messages</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {Math.round(mockChatHistory.filter(c => c.type === 'candidate').reduce((sum, c) => sum + c.message.length, 0) / mockChatHistory.filter(c => c.type === 'candidate').length)}
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Avg Response Length</div>
            </div>
          </Space>
        </Card>
      </Card>
    </div>
  );
};

export default ChatHistory;
