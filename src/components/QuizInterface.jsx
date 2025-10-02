import React, { useState, useEffect } from 'react';
import { Card, Radio, Button, Progress, Space, Tag, Modal, Input } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  FireOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useInterviewStore } from '../store/useInterviewStore';
import { generateInterviewQuestion, evaluateAnswer as evaluateAnswerGemini } from '../lib/geminiService';
import { evaluateAnswerWithAI } from '../lib/aiService';
import '../styles/QuizInterface.css';

const { TextArea } = Input;

const QuizInterface = ({ candidateId }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const {
    candidates,
    currentQuestionIndex,
    interviewState,
    addChatMessage,
    submitAnswer,
    startInterview,
    setInterviewState
  } = useInterviewStore();

  const activeCandidate = candidates.find(c => c.id === candidateId);
  const totalQuestions = 6;

  // Determine the actual interview state - prioritize candidate status over global state
  const actualInterviewState = activeCandidate?.status === 'completed' && interviewState === 'finished' 
    ? 'finished' 
    : activeCandidate?.status === 'in-progress' 
    ? 'active' 
    : 'idle';

  // Question structure with difficulty
  const questionStructure = [
    { index: 0, difficulty: 'easy', time: 20 },
    { index: 1, difficulty: 'easy', time: 20 },
    { index: 2, difficulty: 'medium', time: 60 },
    { index: 3, difficulty: 'medium', time: 60 },
    { index: 4, difficulty: 'hard', time: 120 },
    { index: 5, difficulty: 'hard', time: 120 }
  ];

  // Get current question from chat history
  const getCurrentQuestion = () => {
    if (!activeCandidate?.chatHistory) return null;
    const messages = activeCandidate.chatHistory;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'ai' && messages[i].questionData) {
        return messages[i].questionData;
      }
    }
    return null;
  };

  const currentQuestion = getCurrentQuestion();
  const currentConfig = questionStructure[currentQuestionIndex] || questionStructure[0];

  // Detect when assessment has been reset and clear local state
  useEffect(() => {
    if (activeCandidate?.status === 'pending' && activeCandidate?.chatHistory?.length === 0) {
      // Assessment has been reset - clear all local state
      setSelectedAnswer(null);
      setTextAnswer('');
      setIsSubmitting(false);
      setTimeLeft(null);
      setIsTimerActive(false);
    }
  }, [activeCandidate?.status, activeCandidate?.chatHistory?.length]);

  // Timer effect
  useEffect(() => {
    if (actualInterviewState === 'active' && currentConfig) {
      setTimeLeft(currentConfig.time);
      setIsTimerActive(true);
    }
  }, [currentQuestionIndex, actualInterviewState]);

  useEffect(() => {
    if (!isTimerActive || timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerActive(false);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft]);

  const handleTimeUp = () => {
    Modal.warning({
      title: 'Time\'s Up!',
      content: 'Moving to next question...',
      onOk: () => handleSubmit(true)
    });
  };

  const handleStartInterview = () => {
    startInterview(candidateId);
    generateNextQuestion(0);
  };

  const generateNextQuestion = async (questionIndex) => {
    const config = questionStructure[questionIndex];
    try {
      const questionData = await generateInterviewQuestion(
        config.difficulty,
        questionIndex,
        'Full Stack Developer'
      );
      
      addChatMessage(candidateId, {
        type: 'ai',
        text: questionData.question,
        questionData: {
          ...questionData,
          options: questionData.options || generateMockOptions(questionData.question)
        }
      });

      setSelectedAnswer(null);
      setTimeLeft(config.time);
      setIsTimerActive(true);
    } catch (error) {
      console.error('Error generating question:', error);
    }
  };

  const generateMockOptions = (question) => {
    // Generate 4 mock options based on question type
    return [
      { id: 'A', text: 'Option A - First possible answer' },
      { id: 'B', text: 'Option B - Second possible answer' },
      { id: 'C', text: 'Option C - Third possible answer' },
      { id: 'D', text: 'Option D - Fourth possible answer' }
    ];
  };

  const handleSubmit = async (isTimeout = false) => {
    // Check if answer is provided based on question difficulty
    const isHardQuestion = currentConfig.difficulty === 'hard';
    if (!isTimeout && !isHardQuestion && !selectedAnswer) return;
    if (!isTimeout && isHardQuestion && !textAnswer.trim()) return;

    setIsSubmitting(true);
    setIsTimerActive(false);

    let answerText;
    if (isTimeout) {
      answerText = 'No answer submitted (Time out)';
    } else if (isHardQuestion) {
      answerText = textAnswer.trim();
    } else {
      answerText = currentQuestion?.options?.find(opt => opt.id === selectedAnswer)?.text || selectedAnswer;
    }

    // Add user answer to chat
    addChatMessage(candidateId, {
      type: 'user',
      text: answerText
    });

    try {
      // Evaluate answer with DeepSeek AI (with fallback to Gemini)
      const timeUsed = currentConfig.timeLimit - (timeLeft || 0);
      const evaluation = await evaluateAnswerWithAI(
        answerText,
        {
          question: currentQuestion?.question || 'Question',
          difficulty: currentConfig.difficulty
        },
        timeUsed,
        currentConfig.timeLimit
      );

      // evaluation.score is already out of 5 from the updated geminiService
      const scoreOutOf5 = evaluation.score || 0;

      // Submit answer to store
      submitAnswer(candidateId, answerText, scoreOutOf5);

      // Add AI feedback
      const scoreDisplay = evaluation.scoreOutOf100 
        ? `${scoreOutOf5}/5 (${evaluation.scoreOutOf100}/100)` 
        : `${scoreOutOf5}/5`;
        
      addChatMessage(candidateId, {
        type: 'ai',
        text: `✅ Answer recorded! Score: ${scoreDisplay}\n\n${evaluation.feedback}`
      });

      // Move to next question or finish
      if (currentQuestionIndex < totalQuestions - 1) {
        setTimeout(() => {
          setSelectedAnswer(null);
          setTextAnswer('');
          generateNextQuestion(currentQuestionIndex + 1);
        }, 2000);
      } else {
        setInterviewState('finished');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4ade80';
      case 'medium': return '#fbbf24';
      case 'hard': return '#f87171';
      default: return '#94a3b8';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy': return <ThunderboltOutlined />;
      case 'medium': return <FireOutlined />;
      case 'hard': return <RocketOutlined />;
      default: return <ThunderboltOutlined />;
    }
  };

  const getQuestionStatus = (index) => {
    if (index < currentQuestionIndex) return 'completed';
    if (index === currentQuestionIndex) return 'active';
    return 'pending';
  };

  if (actualInterviewState === 'idle' || !activeCandidate) {
    return (
      <div className="quiz-welcome">
        <div className="quiz-welcome-content">
          <TrophyOutlined className="quiz-welcome-icon" />
          <h1>Full Stack Developer Assessment</h1>
          <p>This assessment consists of 6 questions covering various topics</p>
          <div className="quiz-info-grid">
            <div className="quiz-info-card">
              <ThunderboltOutlined style={{ color: '#4ade80' }} />
              <span>2 Easy Questions</span>
              <small>20 seconds each</small>
            </div>
            <div className="quiz-info-card">
              <FireOutlined style={{ color: '#fbbf24' }} />
              <span>2 Medium Questions</span>
              <small>60 seconds each</small>
            </div>
            <div className="quiz-info-card">
              <RocketOutlined style={{ color: '#f87171' }} />
              <span>2 Hard Questions</span>
              <small>120 seconds each</small>
            </div>
          </div>
          <Button 
            type="primary" 
            size="large" 
            onClick={handleStartInterview}
            className="quiz-start-btn"
          >
            Start Assessment
          </Button>
        </div>
      </div>
    );
  }

  if (actualInterviewState === 'finished') {
    const finalScore = activeCandidate?.finalScore || 0;
    const maxScore = 30; // 6 questions × 5 points each
    const percentage = Math.round((finalScore / maxScore) * 100);
    const scoresPublished = activeCandidate?.scoresPublished || false;
    
    return (
      <div className="quiz-welcome">
        <div className="quiz-welcome-content">
          <CheckCircleOutlined className="quiz-welcome-icon" style={{ color: '#4ade80' }} />
          <h1>Assessment Complete!</h1>
          <p>Thank you for completing the Full Stack Developer assessment.</p>
          {scoresPublished ? (
            <>
              <p>Your responses have been evaluated and scored.</p>
              <div className="quiz-completion-stats">
                <div className="quiz-stat">
                  <span className="quiz-stat-value">{totalQuestions}</span>
                  <span className="quiz-stat-label">Questions Answered</span>
                </div>
                <div className="quiz-stat">
                  <span className="quiz-stat-value">{finalScore}/{maxScore}</span>
                  <span className="quiz-stat-label">Final Score ({percentage}%)</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <p>Your responses are being reviewed by the interviewer.</p>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '16px' }}>
                ⏳ Scores will be available once the interviewer publishes the results.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      {/* Left Sidebar - Question Navigator */}
      <div className="quiz-sidebar">
        <div className="quiz-sidebar-header">
          <h3>Questions</h3>
          <Progress 
            percent={Math.round((currentQuestionIndex / totalQuestions) * 100)} 
            size="small"
            strokeColor="#58a6ff"
          />
        </div>
        
        <div className="quiz-question-list">
          {questionStructure.map((config, index) => {
            const status = getQuestionStatus(index);
            return (
              <div 
                key={index}
                className={`quiz-question-item ${status}`}
              >
                <div className="quiz-question-number">
                  {status === 'completed' ? (
                    <CheckCircleOutlined style={{ color: '#4ade80' }} />
                  ) : status === 'active' ? (
                    <span className="active-indicator">{index + 1}</span>
                  ) : (
                    <span className="pending-indicator">{index + 1}</span>
                  )}
                </div>
                <div className="quiz-question-info">
                  <span className="quiz-question-title">Question {index + 1}</span>
                  <Tag 
                    color={getDifficultyColor(config.difficulty)}
                    style={{ fontSize: '10px', padding: '0 6px' }}
                  >
                    {config.difficulty.toUpperCase()}
                  </Tag>
                </div>
                <div className="quiz-question-score">
                  {status === 'completed' && (
                    <span className="score-badge">
                      {activeCandidate?.answers?.[index]?.score || 0}/10
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="quiz-sidebar-footer">
          <div className="quiz-stats">
            <div className="quiz-stat-item">
              <span className="quiz-stat-label">Completed</span>
              <span className="quiz-stat-value">{currentQuestionIndex}/{totalQuestions}</span>
            </div>
            <div className="quiz-stat-item">
              <span className="quiz-stat-label">Max Score</span>
              <span className="quiz-stat-value">60</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="quiz-main">
        {/* Top Bar with Timer */}
        <div className="quiz-topbar">
          <div className="quiz-topbar-left">
            <span className="quiz-progress-text">
              {currentQuestionIndex + 1} / {totalQuestions} Completed
            </span>
          </div>
          <div className="quiz-topbar-center">
            <Tag 
              icon={getDifficultyIcon(currentConfig.difficulty)}
              color={getDifficultyColor(currentConfig.difficulty)}
              style={{ fontSize: '14px', padding: '4px 12px' }}
            >
              {currentConfig.difficulty.toUpperCase()}
            </Tag>
          </div>
          <div className="quiz-topbar-right">
            <div className={`quiz-timer ${timeLeft <= 10 ? 'timer-warning' : ''}`}>
              <ClockCircleOutlined />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="quiz-question-card">
          <div className="quiz-question-header">
            <h2>Question {currentQuestionIndex + 1}</h2>
            <span className="quiz-max-score">Max. score: 10.00</span>
          </div>

          <div className="quiz-question-text">
            {currentQuestion?.question || 'Loading question...'}
          </div>

          {/* MCQ Options for Easy and Medium Questions */}
          {currentConfig.difficulty !== 'hard' && currentQuestion?.options && (
            <div className="quiz-options">
              <Radio.Group 
                onChange={(e) => setSelectedAnswer(e.target.value)}
                value={selectedAnswer}
                className="quiz-radio-group"
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {currentQuestion.options.map((option) => (
                    <Radio 
                      key={option.id}
                      value={option.id}
                      className="quiz-option"
                    >
                      <span className="quiz-option-id">{option.id}</span>
                      <span className="quiz-option-text">{option.text}</span>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          )}

          {/* Text Input for Hard Questions */}
          {currentConfig.difficulty === 'hard' && (
            <div className="quiz-text-input">
              <TextArea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Type your detailed answer here..."
                autoSize={{ minRows: 6, maxRows: 12 }}
                disabled={isSubmitting}
                className="quiz-textarea"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                  fontSize: '15px',
                  padding: '16px',
                  resize: 'none'
                }}
              />
              <div style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                color: '#94a3b8',
                textAlign: 'right' 
              }}>
                {textAnswer.length} characters
              </div>
            </div>
          )}

          <div className="quiz-actions">
            <Button
              type="primary"
              size="large"
              onClick={() => handleSubmit(false)}
              disabled={
                (currentConfig.difficulty === 'hard' ? !textAnswer.trim() : !selectedAnswer) || 
                isSubmitting
              }
              loading={isSubmitting}
              className="quiz-submit-btn"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </Button>
            <Button
              size="large"
              onClick={() => {
                setSelectedAnswer(null);
                setTextAnswer('');
              }}
              disabled={isSubmitting}
              className="quiz-reset-btn"
            >
              Reset Answer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QuizInterface;
