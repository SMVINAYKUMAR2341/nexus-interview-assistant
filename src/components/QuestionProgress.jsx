import React from 'react';
import { Progress, Tag } from 'antd';

const QuestionProgress = ({ currentQuestion = 0, totalQuestions = 6, questionType = 'easy' }) => {
  const percentage = ((currentQuestion + 1) / totalQuestions) * 100;
  
  const getQuestionTypeColor = (type) => {
    switch (type) {
      case 'easy':
        return 'green';
      case 'medium':
        return 'orange';
      case 'hard':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getQuestionTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="question-progress">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div>
          <span style={{ fontSize: '16px', fontWeight: '500' }}>
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
        </div>
        
        <Tag color={getQuestionTypeColor(questionType)} style={{ fontSize: '14px' }}>
          {getQuestionTypeLabel(questionType)}
        </Tag>
      </div>
      
      <Progress 
        percent={percentage} 
        showInfo={false}
        strokeColor={{
          '0%': '#108ee9',
          '50%': '#87d068',
          '100%': '#52c41a',
        }}
        strokeWidth={8}
      />
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginTop: '8px',
        fontSize: '12px',
        color: '#666'
      }}>
        <span>Questions 1-2: Easy</span>
        <span>Questions 3-4: Medium</span>
        <span>Questions 5-6: Hard</span>
      </div>
    </div>
  );
};

export default QuestionProgress;