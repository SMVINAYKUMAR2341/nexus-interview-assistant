import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Form, message, Space, Typography, Divider, Dropdown, Modal } from 'antd';
import { SendOutlined, PauseOutlined, PlayCircleOutlined, LoadingOutlined, RocketOutlined, ThunderboltOutlined, MoreOutlined, EyeOutlined, DeleteOutlined, UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useInterviewStore } from '../store/useInterviewStore';
import { generateQuestion, evaluateAnswer } from '../lib/aiService';
import { evaluateAnswer as evaluateAnswerGemini } from '../lib/geminiService';
import axios from 'axios';
import { checkMissingFields, validateEmail, validatePhone, validateName } from '../lib/resumeParser';
import ResumeUpload from '../components/ResumeUpload';
import QuizInterface from '../components/QuizInterface';
import Timer from '../components/Timer';
import ChatMessage from '../components/ChatMessage';
import QuestionProgress from '../components/QuestionProgress';
import '../styles/IntervieweeNeon.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

// Backend API configuration
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Generate interview question using backend Perplexity service
const generateInterviewQuestion = async (difficulty = 'medium', questionIndex = 0, role = 'Full Stack Developer') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/ai/generate-questions`, {
      difficulty,
      count: 1,
      role,
      questionIndex
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.questions && response.data.questions[0]) {
      return response.data.questions[0];
    } else {
      throw new Error('No question returned from API');
    }
  } catch (error) {
    console.error('Error generating question with backend:', error);
    
    // Fallback to offline questions
    const fallbackQuestions = {
      easy: [
        {
          id: 'easy_fallback_1',
          question: "What is the difference between let, const, and var in JavaScript?",
          category: "JavaScript Fundamentals",
          timeLimit: 20
        },
        {
          id: 'easy_fallback_2', 
          question: "Explain what JSX is in React and why it's useful.",
          category: "React Basics",
          timeLimit: 20
        }
      ],
      medium: [
        {
          id: 'medium_fallback_1',
          question: "Explain how React's virtual DOM works and why it's beneficial for performance.",
          category: "React",
          timeLimit: 60
        },
        {
          id: 'medium_fallback_2',
          question: "What are the differences between SQL and NoSQL databases? Give examples of each.",
          category: "Database Design",
          timeLimit: 60
        }
      ],
      hard: [
        {
          id: 'hard_fallback_1',
          question: "Design a rate limiting system that can handle millions of requests per second. Explain your approach and the trade-offs involved.",
          category: "System Design",
          timeLimit: 120
        },
        {
          id: 'hard_fallback_2',
          question: "How would you implement real-time collaboration features (like Google Docs) in a web application? Discuss the technical challenges and solutions.",
          category: "System Design",
          timeLimit: 120
        }
      ]
    };

    const questions = fallbackQuestions[difficulty] || fallbackQuestions.medium;
    return questions[questionIndex % questions.length];
  }
};

const IntervieweeView = () => {
  console.log('🎯 IntervieweeView component rendering');
  
  const [form] = Form.useForm();
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [collectingField, setCollectingField] = useState(null); // 'name', 'email', 'phone', or null
  const chatContainerRef = useRef(null);
  
  const {
    candidates,
    activeCandidateId,
    interviewState,
    timer,
    currentQuestionIndex,
    addCandidate,
    updateCandidate,
    addChatMessage,
    startInterview,
    submitAnswer,
    pauseInterview,
    resumeInterview,
    setInterviewState
  } = useInterviewStore();
  
  console.log('IntervieweeView state:', {
    activeCandidateId,
    interviewState,
    currentQuestionIndex,
    candidatesCount: candidates?.length || 0
  });

  const activeCandidate = candidates.find(c => c.id === activeCandidateId);

  useEffect(() => {
    // Scroll to bottom of chat when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeCandidate?.chatHistory]);

  useEffect(() => {
    // Generate and display next question when interview is active
    if (interviewState === 'active' && activeCandidate && !isGeneratingQuestion) {
      const questionType = getQuestionType(currentQuestionIndex);
      
      // Check if this question is already in chat history
      const lastMessage = activeCandidate.chatHistory[activeCandidate.chatHistory.length - 1];
      const isQuestionAlreadyShown = lastMessage && lastMessage.type === 'ai' && 
        lastMessage.text.includes(`Question ${currentQuestionIndex + 1}`);
      
      if (!isQuestionAlreadyShown) {
        generateAndDisplayQuestion(questionType, currentQuestionIndex);
      }
    }
  }, [interviewState, currentQuestionIndex, activeCandidate?.id]);

  const generateAndDisplayQuestion = async (questionType, questionIndex) => {
    setIsGeneratingQuestion(true);
    
    try {
      // Use Gemini AI to generate question
      const questionData = await generateInterviewQuestion(questionType, questionIndex, 'Full Stack Developer');
      
      addChatMessage(activeCandidateId, {
        type: 'ai',
        text: `**Question ${questionIndex + 1}** (${questionType.toUpperCase()})\n\n${questionData.question}\n\n📝 Category: ${questionData.category}`,
        questionData
      });
    } catch (error) {
      console.error('Error generating question:', error);
      
      // Fallback to mock questions
      const fallbackQuestion = generateQuestion(questionType, questionIndex);
      addChatMessage(activeCandidateId, {
        type: 'ai',
        text: `**Question ${questionIndex + 1}** (${questionType.toUpperCase()})\n\n${fallbackQuestion.question}`,
        questionData: fallbackQuestion
      });
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const getQuestionType = (index) => {
    if (index < 2) return 'easy';
    if (index < 4) return 'medium';
    return 'hard';
  };

  const handleResumeUploaded = async (resumeData) => {
    const candidateData = {
      name: resumeData.name,
      email: resumeData.email,
      phone: resumeData.phone,
      resumeData
    };

    const candidateId = addCandidate(candidateData);
    const missingFields = checkMissingFields(candidateData);

    if (missingFields.length > 0) {
      updateCandidate(candidateId, { missingFields });
      setInterviewState('collecting-info');
      
      // Greet and ask for first missing field via chatbot
      addChatMessage(candidateId, {
        type: 'ai',
        text: `Hello! 👋 I've successfully uploaded your resume to our database.\n\nHowever, I need some additional information to complete your profile before we can start the interview.`
      });
      
      // Ask for the first missing field
      setTimeout(() => {
        askForNextMissingField(candidateId, missingFields);
      }, 1000);
    } else {
      // All fields present - ready to start interview
      setInterviewState('ready');
      
      addChatMessage(candidateId, {
        type: 'ai',
        text: `Welcome ${candidateData.name}! 🎉\n\nI've successfully processed your resume. Click "Start Interview" when you're ready to begin the Full Stack Developer interview.\n\nThe interview consists of 6 questions:\n• 2 Easy questions (20 seconds each)\n• 2 Medium questions (60 seconds each)\n• 2 Hard questions (120 seconds each)`
      });
    }
  };

  const askForNextMissingField = (candidateId, missingFields) => {
    if (!missingFields || missingFields.length === 0) {
      // All fields collected, ready to start interview
      const candidate = candidates.find(c => c.id === candidateId);
      addChatMessage(candidateId, {
        type: 'ai',
        text: `Perfect! Thank you ${candidate.name}. ✅\n\nYour profile is now complete. Click "Start Interview" when you're ready to begin.`
      });
      setCollectingField(null);
      setInterviewState('ready');
      return;
    }

    const field = missingFields[0];
    setCollectingField(field);

    const fieldMessages = {
      name: "📝 Please provide your **full name**:",
      email: "📧 Please provide your **email address**:",
      phone: "📱 Please provide your **phone number**:"
    };

    addChatMessage(candidateId, {
      type: 'ai',
      text: fieldMessages[field] || `Please provide your ${field}:`
    });
  };

  const handleCollectFieldResponse = (value) => {
    if (!activeCandidate || !collectingField) return;

    const trimmedValue = value.trim();

    // Validate the field
    let isValid = false;
    let errorMessage = '';

    if (collectingField === 'name') {
      isValid = validateName(trimmedValue);
      errorMessage = '❌ Please provide a valid full name (at least 2 characters).';
    } else if (collectingField === 'email') {
      isValid = validateEmail(trimmedValue);
      errorMessage = '❌ Please provide a valid email address (e.g., name@example.com).';
    } else if (collectingField === 'phone') {
      isValid = validatePhone(trimmedValue);
      errorMessage = '❌ Please provide a valid phone number (10 digits).';
    }

    // Add user's response to chat
    addChatMessage(activeCandidateId, {
      type: 'user',
      text: trimmedValue
    });

    if (!isValid) {
      // Show validation error and ask again
      setTimeout(() => {
        addChatMessage(activeCandidateId, {
          type: 'ai',
          text: errorMessage
        });
      }, 500);
      setCurrentAnswer('');
      return;
    }

    // Update candidate with the field
    const updatedData = { ...activeCandidate };
    updatedData[collectingField] = trimmedValue;
    
    // Remove this field from missing fields
    const updatedMissingFields = (updatedData.missingFields || []).filter(f => f !== collectingField);
    updatedData.missingFields = updatedMissingFields;
    
    updateCandidate(activeCandidateId, updatedData);

    // Show confirmation
    setTimeout(() => {
      const confirmationMessages = {
        name: `✅ Thank you, **${trimmedValue}**!`,
        email: `✅ Email confirmed: **${trimmedValue}**`,
        phone: `✅ Phone number confirmed: **${trimmedValue}**`
      };

      addChatMessage(activeCandidateId, {
        type: 'ai',
        text: confirmationMessages[collectingField]
      });

      // Ask for next missing field after a short delay
      setTimeout(() => {
        askForNextMissingField(activeCandidateId, updatedMissingFields);
      }, 1000);
    }, 500);

    setCurrentAnswer('');
  };

  const handleFormSubmit = (values) => {
    if (!activeCandidate) return;

    const updatedData = { ...activeCandidate };
    
    // Update missing fields
    if (!updatedData.name || !validateName(updatedData.name)) {
      updatedData.name = values.name;
    }
    if (!updatedData.email || !validateEmail(updatedData.email)) {
      updatedData.email = values.email;
    }
    if (!updatedData.phone || !validatePhone(updatedData.phone)) {
      updatedData.phone = values.phone;
    }

    updateCandidate(activeCandidateId, updatedData);
    setShowForm(false);
    
    addChatMessage(activeCandidateId, {
      type: 'ai',
      text: `Perfect! Thank you ${updatedData.name}. Your profile is now complete. Click "Start Interview" when you're ready to begin.`
    });
  };

  const handleStartInterview = () => {
    if (!activeCandidate) return;
    
    addChatMessage(activeCandidateId, {
      type: 'ai',
      text: `Great! Let's begin your Full Stack Developer interview. You'll have specific time limits for each question. Good luck!\n\n---`
    });
    
    startInterview(activeCandidateId);
  };

  const handleSubmitAnswer = async () => {
    if (!activeCandidate || !currentAnswer.trim()) {
      message.warning('Please provide an answer before submitting.');
      return;
    }

    // Check if we're collecting missing fields
    if (interviewState === 'collecting-info' && collectingField) {
      handleCollectFieldResponse(currentAnswer);
      return;
    }

    if (isEvaluating) {
      message.info('Please wait for the current answer to be evaluated.');
      return;
    }

    setIsEvaluating(true);
    const questionType = getQuestionType(currentQuestionIndex);
    const lastMessage = activeCandidate.chatHistory[activeCandidate.chatHistory.length - 1];
    const currentQuestion = lastMessage?.questionData?.question || 'Question';
    
    // Add user message immediately
    addChatMessage(activeCandidateId, {
      type: 'user',
      text: currentAnswer
    });

    // Submit the answer
    submitAnswer(activeCandidateId, currentAnswer, currentQuestionIndex);
    const answerText = currentAnswer;
    setCurrentAnswer('');

    try {
      // Use Gemini AI to evaluate answer with question data
      const evaluation = await evaluateAnswerGemini(currentQuestion, answerText, questionType, lastMessage?.questionData);
      
      // Add AI feedback with Gemini evaluation (without showing scores)
      setTimeout(() => {
        const feedbackText = [
          `✅ ${evaluation.feedback}`,
          ``
        ];

        if (evaluation.strengths?.length > 0) {
          feedbackText.push('💪 **Strengths:**');
          evaluation.strengths.forEach(s => feedbackText.push(`• ${s}`));
          feedbackText.push('');
        }

        if (evaluation.improvements?.length > 0) {
          feedbackText.push('📈 **Areas to Improve:**');
          evaluation.improvements.forEach(i => feedbackText.push(`• ${i}`));
          feedbackText.push('');
        }

        if (evaluation.keyPointsCovered?.length > 0) {
          feedbackText.push('✓ **Key Points Covered:**');
          evaluation.keyPointsCovered.forEach(p => feedbackText.push(`• ${p}`));
          feedbackText.push('');
        }

        if (evaluation.keyPointsMissed?.length > 0) {
          feedbackText.push('✗ **Key Points Missed:**');
          evaluation.keyPointsMissed.forEach(p => feedbackText.push(`• ${p}`));
          feedbackText.push('');
        }

        if (currentQuestionIndex + 1 < 6) {
          feedbackText.push('⏭️ Moving to the next question...');
        } else {
          feedbackText.push('🎉 **Interview Complete!** Thank you for completing the interview. Your responses have been evaluated by AI. The interviewer will review your performance and publish the results.');
        }

        addChatMessage(activeCandidateId, {
          type: 'ai',
          text: feedbackText.join('\n'),
          score: evaluation.score,
          feedback: evaluation.feedback
        });
        setIsEvaluating(false);
      }, 500);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      
      // Fallback evaluation
      const timeUsed = getTimeLimit(questionType) - timer;
      const fallbackEvaluation = evaluateAnswer(answerText, lastMessage?.questionData, timeUsed, getTimeLimit(questionType));
      
      setTimeout(() => {
        addChatMessage(activeCandidateId, {
          type: 'ai',
          text: `${fallbackEvaluation.feedback}\n\n${currentQuestionIndex + 1 < 6 ? '⏭️ Moving to the next question...' : '🎉 **Interview Complete!** Thank you for completing the interview. Your responses have been evaluated. The interviewer will review your performance and publish the results.'}`,
          score: fallbackEvaluation.score,
          feedback: fallbackEvaluation.feedback
        });
        setIsEvaluating(false);
      }, 500);
    }
  };

  const getTimeLimit = (questionType) => {
    switch (questionType) {
      case 'easy': return 20;
      case 'medium': return 60;
      case 'hard': return 120;
      default: return 60;
    }
  };

  const handlePauseResume = () => {
    if (interviewState === 'active') {
      pauseInterview();
    } else if (interviewState === 'paused') {
      resumeInterview();
    }
  };

  const renderContent = () => {
    if (!activeCandidate) {
      return (
        <div className="neon-welcome-card">
          <div style={{ marginBottom: '24px', fontSize: '48px' }}>
            🚀
          </div>
          <h2>Welcome to Crisp AI Interview Assistant!</h2>
          <p>
            Experience the future of technical interviews with our advanced AI-powered system.<br/>
            Upload your resume and let's begin your journey to success!
          </p>
          <div style={{ marginTop: '24px' }}>
            <ResumeUpload onResumeUploaded={handleResumeUploaded} />
          </div>
        </div>
      );
    }

    // Use Quiz Interface for the interview
    return <QuizInterface candidateId={activeCandidateId} />;
  };

  return (
    <div className="interviewee-container">
      {renderContent()}
    </div>
  );
};

export default IntervieweeView;