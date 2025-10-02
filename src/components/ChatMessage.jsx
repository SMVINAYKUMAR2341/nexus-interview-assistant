import React from 'react';
import { Avatar, Tag } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const ChatMessage = ({ message, showTimestamp = true }) => {
  const isAI = message.type === 'ai';
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'orange';
    return 'red';
  };

  return (
    <div className={`chat-message ${isAI ? 'ai-message' : 'user-message'}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <Avatar 
          icon={isAI ? <RobotOutlined /> : <UserOutlined />}
          style={{ 
            backgroundColor: isAI ? '#1890ff' : '#52c41a',
            flexShrink: 0
          }}
        />
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: '500', 
            marginBottom: '4px',
            color: isAI ? '#1890ff' : '#52c41a'
          }}>
            {isAI ? 'AI Interviewer' : 'You'}
          </div>
          
          <div style={{ 
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5',
            color: isAI ? '#333' : '#fff'
          }}>
            {message.text}
          </div>
          
          {message.score !== undefined && message.score !== null && (
            <div style={{ marginTop: '8px' }}>
              <Tag color={getScoreColor(message.score)}>
                Score: {message.score}/100
              </Tag>
            </div>
          )}
          
          {message.feedback && (
            <div style={{ 
              marginTop: '8px',
              fontSize: '14px',
              fontStyle: 'italic',
              color: isAI ? '#666' : 'rgba(255, 255, 255, 0.8)'
            }}>
              {message.feedback}
            </div>
          )}
          
          {showTimestamp && message.timestamp && (
            <div style={{ 
              marginTop: '8px',
              fontSize: '12px',
              color: isAI ? '#999' : 'rgba(255, 255, 255, 0.6)'
            }}>
              {dayjs(message.timestamp).format('HH:mm:ss')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;