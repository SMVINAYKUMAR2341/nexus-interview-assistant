import React, { useState, useEffect } from 'react';
import { Card, Radio, Button, Progress, Space, Tag, Modal, Input, message, Popconfirm, Dropdown } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  FireOutlined,
  TrophyOutlined,
  FileTextOutlined,
  DeleteOutlined,
  UploadOutlined,
  EyeOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { useInterviewStore } from '../store/useInterviewStore';
import { evaluateAnswer as evaluateAnswerGemini } from '../lib/geminiService';
import axios from 'axios';
import { evaluateAnswerWithAI } from '../lib/aiService';
import fileUploadService from '../lib/fileUploadService';
import { useAuthStore } from '../store/useAuthStore';
import { getResumeBasedEasyQuestions, parseResumeAndGenerateQuestions } from '../lib/resumeQuestionGenerator';
import '../styles/QuizInterface.css';

const { TextArea } = Input;

// Backend API configuration
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Helper function to generate intelligent options based on question content
const createIntelligentOptions = (question) => {
  const lowerQuestion = question.toLowerCase();
  
  // JavaScript-related questions
  if (lowerQuestion.includes('javascript') || lowerQuestion.includes('js')) {
    if (lowerQuestion.includes('let') || lowerQuestion.includes('const') || lowerQuestion.includes('var')) {
      return [
        { id: 'A', text: 'let and const are block-scoped, var is function-scoped' },
        { id: 'B', text: 'let and const are function-scoped, var is block-scoped' },
        { id: 'C', text: 'They are all exactly the same' },
        { id: 'D', text: 'Only let is block-scoped' }
      ];
    }
    if (lowerQuestion.includes('==') || lowerQuestion.includes('===')) {
      return [
        { id: 'A', text: '== checks value only, === checks value and type' },
        { id: 'B', text: '== checks type only, === checks value only' },
        { id: 'C', text: 'They are exactly the same' },
        { id: 'D', text: '=== is faster but does the same thing' }
      ];
    }
  }
  
  // React-related questions
  if (lowerQuestion.includes('react')) {
    if (lowerQuestion.includes('jsx')) {
      return [
        { id: 'A', text: 'A syntax extension that allows writing HTML-like code in JavaScript' },
        { id: 'B', text: 'A new programming language' },
        { id: 'C', text: 'A database query language' },
        { id: 'D', text: 'A CSS framework' }
      ];
    }
    if (lowerQuestion.includes('component')) {
      return [
        { id: 'A', text: 'Reusable pieces of UI that can accept props and return JSX' },
        { id: 'B', text: 'CSS classes for styling' },
        { id: 'C', text: 'Database connections' },
        { id: 'D', text: 'Server-side scripts' }
      ];
    }
  }
  
  // Generic fallback options
  return [
    { id: 'A', text: 'True - This statement is correct' },
    { id: 'B', text: 'False - This statement is incorrect' },
    { id: 'C', text: 'Partially true - Depends on context' },
    { id: 'D', text: 'Not applicable - Question needs clarification' }
  ];
};

// Generate interview question using backend Perplexity service
const generateInterviewQuestion = async (difficulty = 'medium', candidate = null, resumeBasedQuestions = []) => {
  try {
    const token = localStorage.getItem('crisp_auth_token');
    const response = await axios.post(`${API_URL}/ai/generate-questions`, {
      difficulty,
      count: 1,
      skills: candidate?.resumeData?.skills?.technical || ['JavaScript', 'React', 'Node.js'],
      experience: candidate?.resumeData?.experience?.level || 'Mid-Level'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.questions && response.data.questions[0]) {
      const question = response.data.questions[0];
      
      // Ensure question has options for easy/medium questions
      if ((question.difficulty === 'easy' || question.difficulty === 'medium') && !question.options) {
        console.log('API question missing options, generating intelligent options...');
        question.options = createIntelligentOptions(question.question);
      }
      
      console.log('✅ API question with options:', question);
      return question;
    } else {
      throw new Error('No question returned from API');
    }
  } catch (error) {
    console.error('Error generating question with backend:', error);
    
    // Fallback to offline questions
    const defaultEasyQuestions = [
      {
        id: 'easy_fallback_1',
        question: "What is the difference between let, const, and var in JavaScript?",
        expectedAnswer: "let and const are block-scoped, var is function-scoped. const cannot be reassigned after declaration.",
        difficulty: "easy",
        category: "JavaScript Fundamentals",
        timeLimit: 120,
        options: [
          { id: 'A', text: 'let and const are block-scoped, var is function-scoped' },
          { id: 'B', text: 'let and const are function-scoped, var is block-scoped' },
          { id: 'C', text: 'They are all exactly the same' },
          { id: 'D', text: 'Only let is block-scoped' }
        ]
      }
    ];
    
    // Combine default questions with resume-based questions for easy difficulty
    const easyQuestions = difficulty === 'easy' && resumeBasedQuestions.length > 0
      ? [...resumeBasedQuestions, ...defaultEasyQuestions]
      : defaultEasyQuestions;
    
    const fallbackQuestions = {
      easy: easyQuestions,
      medium: [
        {
          id: 'medium_fallback_1', 
          question: "Explain how React's virtual DOM works and why it's beneficial for performance.",
          expectedAnswer: "Virtual DOM is a JavaScript representation of the real DOM. React compares virtual DOM trees to find minimal changes needed, reducing expensive DOM operations.",
          difficulty: "medium",
          category: "React",
          timeLimit: 180,
          options: [
            { id: 'A', text: 'Virtual DOM creates a copy of the real DOM in memory for faster updates' },
            { id: 'B', text: 'Virtual DOM replaces the real DOM completely' },
            { id: 'C', text: 'Virtual DOM is just a marketing term with no benefits' },
            { id: 'D', text: 'Virtual DOM makes applications slower' }
          ]
        }
      ],
      hard: [
        {
          id: 'hard_fallback_1',
          question: "Design a rate limiting system that can handle millions of requests per second. Explain your approach and the trade-offs involved.",
          expectedAnswer: "Use distributed rate limiting with Redis, implement sliding window or token bucket algorithms, consider geographic distribution and consistency vs availability trade-offs.",
          difficulty: "hard", 
          category: "System Design",
          timeLimit: 300
        }
      ]
    };

    const questions = fallbackQuestions[difficulty] || fallbackQuestions.medium;
    return questions[Math.floor(Math.random() * questions.length)];
  }
};

const QuizInterface = ({ candidateId }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  // Resume management state
  const [userFiles, setUserFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  
  // Resume parsing state
  const [resumeBasedQuestions, setResumeBasedQuestions] = useState([]);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeParseData, setResumeParseData] = useState(null);
  
  const {
    candidates,
    currentQuestionIndex,
    interviewState,
    addChatMessage,
    submitAnswer,
    startInterview,
    setInterviewState,
    resetCandidateAssessment,
    setActiveCandidateId,
    addCandidate,
    updateCandidate,
    setCurrentQuestionIndex
  } = useInterviewStore();

  const { user } = useAuthStore();

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
    if (!activeCandidate?.chatHistory) {
      console.log('❌ No chat history found');
      return null;
    }
    
    const messages = activeCandidate.chatHistory;
    console.log('🔍 Looking for current question in', messages.length, 'messages');
    
    // Find the most recent AI question that matches our current question index
    let questionCount = 0;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].type === 'ai' && messages[i].questionData) {
        if (questionCount === currentQuestionIndex) {
          console.log('✅ Found current question at index', currentQuestionIndex, ':', messages[i].questionData);
          return messages[i].questionData;
        }
        questionCount++;
      }
    }
    
    // Fallback: get the last question if index doesn't match
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'ai' && messages[i].questionData) {
        console.log('🔄 Using last question as fallback:', messages[i].questionData);
        return messages[i].questionData;
      }
    }
    
    console.log('❌ No question found in chat history');
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
    console.log('🚀 handleStartInterview called');
    console.log('📋 Debugging Info:', {
      candidateId,
      activeCandidate,
      userRole: user?.role,
      interviewState,
      actualInterviewState,
      candidateStatus: activeCandidate?.status,
      candidateName: activeCandidate?.name,
      candidateEmail: activeCandidate?.email,
      candidatePhone: activeCandidate?.phone,
      resumeData: !!activeCandidate?.resumeData,
      chatHistoryLength: activeCandidate?.chatHistory?.length || 0
    });
    
    if (!candidateId) {
      console.error('❌ No candidate ID available');
      message.error('No candidate ID available. Please upload your resume first.');
      return;
    }
    
    if (!activeCandidate) {
      console.error('❌ No active candidate found');
      console.log('🔧 Attempting to create a fallback candidate...');
      
      // Create a fallback candidate if user is authenticated
      if (user && user.email) {
        const fallbackCandidateData = {
          name: user.name || 'Test Candidate',
          email: user.email,
          phone: user.phone || '000-000-0000',
          resumeData: null
        };
        
        const newCandidateId = addCandidate(fallbackCandidateData, user.id);
        console.log('✅ Created fallback candidate:', newCandidateId);
        
        // Use the new candidate
        setTimeout(() => {
          handleStartInterview();
        }, 100);
        return;
      }
      
      message.error('No active candidate found. Please upload your resume first.');
      return;
    }
    
    // Check if candidate has required fields and fill in defaults if needed
    const missingFields = [];
    if (!activeCandidate.name) missingFields.push('name');
    if (!activeCandidate.email) missingFields.push('email');
    if (!activeCandidate.phone) missingFields.push('phone');
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Missing required fields:', missingFields);
      console.log('🔧 Filling in default values for missing fields...');
      
      // Fill in default values to allow assessment to proceed
      const updates = {};
      if (!activeCandidate.name) updates.name = user?.name || 'Test Candidate';
      if (!activeCandidate.email) updates.email = user?.email || 'test@example.com';
      if (!activeCandidate.phone) updates.phone = '000-000-0000';
      
      updateCandidate(candidateId, updates);
      console.log('✅ Updated candidate with default values:', updates);
      
      message.info('Starting assessment with default information. You can update your profile later.');
    }
    
    try {
      console.log('✅ All validations passed, starting interview...');
      console.log('📞 Calling startInterview with candidateId:', candidateId);
      
      startInterview(candidateId);
      
      console.log('🔄 Interview state after startInterview:', {
        interviewState,
        candidateStatus: activeCandidate?.status
      });
      
      console.log('🎯 Calling generateNextQuestion...');
      generateNextQuestion(0);
      console.log('✅ generateNextQuestion called successfully');
      
    } catch (error) {
      console.error('❌ Error starting interview:', error);
      message.error(`Failed to start interview: ${error.message}`);
    }
  };

  const generateNextQuestion = async (questionIndex) => {
    console.log('🎯 generateNextQuestion called with index:', questionIndex);
    console.log('📋 questionStructure:', questionStructure);
    
    if (questionIndex >= questionStructure.length) {
      console.error('❌ Question index out of bounds:', questionIndex, 'max:', questionStructure.length - 1);
      message.error('Assessment completed or invalid question index');
      return;
    }
    
    const config = questionStructure[questionIndex];
    console.log('⚙️ Question config:', config);
    
    if (!config) {
      console.error('❌ No config found for question index:', questionIndex);
      message.error('Invalid question configuration');
      return;
    }
    
    try {
      console.log('Calling generateInterviewQuestion with params:', {
        difficulty: config.difficulty,
        hasActiveCandidate: !!activeCandidate,
        resumeBasedQuestionsCount: resumeBasedQuestions.length
      });
      
      const questionData = await generateInterviewQuestion(
        config.difficulty,
        activeCandidate,
        resumeBasedQuestions
      );
      
      console.log('Question data received from generateInterviewQuestion:', {
        question: questionData?.question?.substring(0, 50) + '...',
        hasOptions: !!questionData?.options,
        optionsCount: questionData?.options?.length || 0,
        difficulty: questionData?.difficulty,
        timeLimit: questionData?.timeLimit,
        fullData: questionData
      });
      
      if (!questionData || !questionData.question) {
        throw new Error('Invalid question data received');
      }
      
      // Ensure question has options for easy/medium difficulties
      let finalQuestionData = { ...questionData };
      
      if (config.difficulty !== 'hard') {
        if (!finalQuestionData.options || !Array.isArray(finalQuestionData.options) || finalQuestionData.options.length === 0) {
          console.log('🔧 Question missing options, generating them...', finalQuestionData);
          finalQuestionData.options = generateMockOptions(finalQuestionData.question);
          console.log('✅ Generated options:', finalQuestionData.options);
        }
      }
      
      console.log('📝 Final question data being added to chat:', finalQuestionData);
      
      // Double-check: if we still don't have options, force generate them
      if (config.difficulty !== 'hard' && (!finalQuestionData.options || finalQuestionData.options.length === 0)) {
        console.log('🚨 FORCING option generation - question still missing options!');
        finalQuestionData.options = [
          { id: 'A', text: 'let and const are block-scoped, var is function-scoped' },
          { id: 'B', text: 'let and const are function-scoped, var is block-scoped' }, 
          { id: 'C', text: 'They are all exactly the same' },
          { id: 'D', text: 'Only let is block-scoped' }
        ];
        
        // If it's not a JavaScript question, use generic options
        if (!finalQuestionData.question.toLowerCase().includes('javascript') && 
            !finalQuestionData.question.toLowerCase().includes('var') &&
            !finalQuestionData.question.toLowerCase().includes('let')) {
          finalQuestionData.options = [
            { id: 'A', text: 'True - This statement is correct' },
            { id: 'B', text: 'False - This statement is incorrect' },
            { id: 'C', text: 'Partially true - Depends on context' },
            { id: 'D', text: 'Not applicable - Need more information' }
          ];
        }
        
        console.log('🔧 Force-generated options:', finalQuestionData.options);
      }

      addChatMessage(candidateId, {
        type: 'ai',
        text: questionData.question,
        questionData: finalQuestionData
      });

      setSelectedAnswer(null);
      setTimeLeft(config.time);
      setIsTimerActive(true);
      
      console.log('Question generated successfully, state updated');
    } catch (error) {
      console.error('❌ Error generating question:', error);
      console.log('🔄 Falling back to predefined questions...');
      
      // Fallback to predefined questions, including resume-based ones
      const defaultEasyQuestions = [
        {
          question: "What is the difference between let, const, and var in JavaScript?",
          difficulty: "easy",
          category: "JavaScript Fundamentals",
          options: [
            { id: 'A', text: 'let and const are block-scoped, var is function-scoped' },
            { id: 'B', text: 'let and const are function-scoped, var is block-scoped' },
            { id: 'C', text: 'They are all the same' },
            { id: 'D', text: 'Only let is block-scoped' }
          ]
        },
        {
          question: "What does HTML stand for?",
          difficulty: "easy", 
          category: "HTML/CSS",
          options: [
            { id: 'A', text: 'HyperText Markup Language' },
            { id: 'B', text: 'High Tech Modern Language' },
            { id: 'C', text: 'Home Tool Markup Language' },
            { id: 'D', text: 'Hyperlink and Text Markup Language' }
          ]
        }
      ];
      
      // Combine default questions with resume-based questions for easy difficulty
      const easyQuestions = config.difficulty === 'easy' && resumeBasedQuestions.length > 0
        ? [...resumeBasedQuestions, ...defaultEasyQuestions]
        : defaultEasyQuestions;
      
      const fallbackQuestions = {
        easy: easyQuestions,
        medium: [
          {
            question: "Explain how React's virtual DOM works and why it's beneficial for performance.",
            difficulty: "medium",
            category: "React",
            options: [
              { id: 'A', text: 'Virtual DOM creates a copy of the real DOM in memory for faster updates' },
              { id: 'B', text: 'Virtual DOM replaces the real DOM completely' },
              { id: 'C', text: 'Virtual DOM is just a marketing term' },
              { id: 'D', text: 'Virtual DOM makes the browser slower' }
            ]
          },
          {
            question: "What is the purpose of CSS flexbox?",
            difficulty: "medium",
            category: "CSS",
            options: [
              { id: 'A', text: 'To create flexible layouts and distribute space' },
              { id: 'B', text: 'To make text flexible' },
              { id: 'C', text: 'To add animations' },
              { id: 'D', text: 'To change colors dynamically' }
            ]
          }
        ],
        hard: [
          {
            question: "Design a rate limiting system that can handle millions of requests per second. Explain your approach and the trade-offs involved.",
            difficulty: "hard",
            category: "System Design"
          },
          {
            question: "How would you implement real-time collaboration features (like Google Docs) in a web application? Discuss the technical challenges and solutions.",
            difficulty: "hard", 
            category: "System Design"
          }
        ]
      };
      
      const questionsForDifficulty = fallbackQuestions[config.difficulty] || fallbackQuestions.medium;
      const fallbackQuestion = questionsForDifficulty[questionIndex % questionsForDifficulty.length];
      
      console.log('📝 Using fallback question:', fallbackQuestion);
      
      if (!fallbackQuestion) {
        console.error('❌ No fallback question available');
        message.error('Unable to generate question. Please try again.');
        return;
      }
      
      // Ensure fallback question has options for easy/medium difficulties
      let finalFallbackQuestion = { ...fallbackQuestion };
      
      if (config.difficulty !== 'hard') {
        if (!finalFallbackQuestion.options || !Array.isArray(finalFallbackQuestion.options) || finalFallbackQuestion.options.length === 0) {
          console.log('🔧 Fallback question missing options, generating them...');
          finalFallbackQuestion.options = generateMockOptions(finalFallbackQuestion.question);
          console.log('✅ Generated fallback options:', finalFallbackQuestion.options);
        }
      }
      
      try {
        // Double-check: if fallback still doesn't have options, force generate them
        if (config.difficulty !== 'hard' && (!finalFallbackQuestion.options || finalFallbackQuestion.options.length === 0)) {
          console.log('🚨 FORCING fallback option generation!');
          finalFallbackQuestion.options = [
            { id: 'A', text: 'True - This statement is correct' },
            { id: 'B', text: 'False - This statement is incorrect' },
            { id: 'C', text: 'Partially true - Depends on context' },
            { id: 'D', text: 'Not applicable - Need more information' }
          ];
          console.log('🔧 Force-generated fallback options:', finalFallbackQuestion.options);
        }

        addChatMessage(candidateId, {
          type: 'ai',
          text: fallbackQuestion.question,
          questionData: finalFallbackQuestion
        });

        setSelectedAnswer(null);
        setTimeLeft(config.time);
        setIsTimerActive(true);
        
        console.log('✅ Fallback question added successfully');
        message.success('Question loaded successfully!');
        
      } catch (chatError) {
        console.error('❌ Error adding chat message:', chatError);
        message.error('Failed to display question. Please refresh and try again.');
      }
    }
  };

  const generateMockOptions = (question) => {
    const lowerQuestion = question.toLowerCase();
    
    // JavaScript-related questions
    if (lowerQuestion.includes('javascript') || lowerQuestion.includes('js')) {
      if (lowerQuestion.includes('let') || lowerQuestion.includes('const') || lowerQuestion.includes('var')) {
        return [
          { id: 'A', text: 'let and const are block-scoped, var is function-scoped' },
          { id: 'B', text: 'let and const are function-scoped, var is block-scoped' },
          { id: 'C', text: 'They are all exactly the same' },
          { id: 'D', text: 'Only let is block-scoped' }
        ];
      }
      if (lowerQuestion.includes('==') || lowerQuestion.includes('===')) {
        return [
          { id: 'A', text: '== checks value only, === checks value and type' },
          { id: 'B', text: '== checks type only, === checks value only' },
          { id: 'C', text: 'They are exactly the same' },
          { id: 'D', text: '=== is faster but does the same thing' }
        ];
      }
    }
    
    // React-related questions
    if (lowerQuestion.includes('react')) {
      if (lowerQuestion.includes('jsx')) {
        return [
          { id: 'A', text: 'A syntax extension that allows writing HTML-like code in JavaScript' },
          { id: 'B', text: 'A new programming language' },
          { id: 'C', text: 'A database query language' },
          { id: 'D', text: 'A CSS framework' }
        ];
      }
      if (lowerQuestion.includes('component')) {
        return [
          { id: 'A', text: 'Reusable pieces of UI that can accept props and return JSX' },
          { id: 'B', text: 'CSS classes for styling' },
          { id: 'C', text: 'Database connections' },
          { id: 'D', text: 'Server-side scripts' }
        ];
      }
      if (lowerQuestion.includes('virtual dom')) {
        return [
          { id: 'A', text: 'A JavaScript representation of the real DOM for better performance' },
          { id: 'B', text: 'A replacement for the real DOM' },
          { id: 'C', text: 'Just a marketing term' },
          { id: 'D', text: 'Makes applications slower' }
        ];
      }
    }
    
    // HTML/CSS questions
    if (lowerQuestion.includes('html')) {
      return [
        { id: 'A', text: 'HyperText Markup Language' },
        { id: 'B', text: 'High Tech Modern Language' },
        { id: 'C', text: 'Home Tool Markup Language' },
        { id: 'D', text: 'Hyperlink and Text Markup Language' }
      ];
    }
    
    if (lowerQuestion.includes('css')) {
      return [
        { id: 'A', text: 'Cascading Style Sheets' },
        { id: 'B', text: 'Computer Style Sheets' },
        { id: 'C', text: 'Creative Style Sheets' },
        { id: 'D', text: 'Colorful Style Sheets' }
      ];
    }
    
    // Python questions
    if (lowerQuestion.includes('python')) {
      if (lowerQuestion.includes('list') && lowerQuestion.includes('tuple')) {
        return [
          { id: 'A', text: 'Lists are mutable, tuples are immutable' },
          { id: 'B', text: 'Lists are immutable, tuples are mutable' },
          { id: 'C', text: 'They are exactly the same' },
          { id: 'D', text: 'Lists store numbers, tuples store strings' }
        ];
      }
    }
    
    // Database questions
    if (lowerQuestion.includes('sql')) {
      return [
        { id: 'A', text: 'Structured Query Language' },
        { id: 'B', text: 'Simple Query Language' },
        { id: 'C', text: 'Standard Query Language' },
        { id: 'D', text: 'System Query Language' }
      ];
    }
    
    // Version control questions
    if (lowerQuestion.includes('version control') || lowerQuestion.includes('git')) {
      return [
        { id: 'A', text: 'A system to track changes in code and collaborate with others' },
        { id: 'B', text: 'A way to control software versions for sale' },
        { id: 'C', text: 'A method to encrypt code' },
        { id: 'D', text: 'A technique to make code run faster' }
      ];
    }
    
    // Generic programming questions
    if (lowerQuestion.includes('programming') || lowerQuestion.includes('software')) {
      return [
        { id: 'A', text: 'Writing clean, maintainable code' },
        { id: 'B', text: 'Using the latest technologies always' },
        { id: 'C', text: 'Working as fast as possible' },
        { id: 'D', text: 'Never asking for help' }
      ];
    }
    
    // Default fallback options
    return [
      { id: 'A', text: 'True - This statement is correct' },
      { id: 'B', text: 'False - This statement is incorrect' },
      { id: 'C', text: 'Partially true - Depends on context' },
      { id: 'D', text: 'Not applicable - Question needs clarification' }
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
      // Evaluate answer with Perplexity AI (with fallback to OpenAI)
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
      console.log('📊 Current progress:', {
        currentQuestionIndex,
        totalQuestions,
        isLastQuestion: currentQuestionIndex >= totalQuestions - 1
      });
      
      if (currentQuestionIndex < totalQuestions - 1) {
        console.log('➡️ Moving to next question...');
        const nextIndex = currentQuestionIndex + 1;
        
        // Update the question index in the store first
        setCurrentQuestionIndex(nextIndex);
        updateCandidate(candidateId, { currentQuestionIndex: nextIndex });
        
        setTimeout(() => {
          setSelectedAnswer(null);
          setTextAnswer('');
          console.log('🎯 Generating question at index:', nextIndex);
          generateNextQuestion(nextIndex);
        }, 2000);
      } else {
        console.log('🏁 Assessment completed!');
        setInterviewState('finished');
        message.success('Assessment completed! Thank you for your participation.');
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

  // Resume parsing functions
  const parseResumeForQuestions = async (fileData) => {
    try {
      setIsParsingResume(true);
      console.log('Parsing resume for questions:', fileData);
      
      // If we already have parsed data for this file, use it
      if (activeCandidate?.resumeData && fileData.fileName === activeCandidate.resumeData.fileName) {
        console.log('Using existing resume data from candidate');
        const questions = getResumeBasedEasyQuestions(activeCandidate);
        setResumeBasedQuestions(questions);
        setResumeParseData(activeCandidate.resumeData);
        return;
      }
      
      // Download and parse the file
      if (fileData.downloadUrl || fileData.url) {
        try {
          const response = await fetch(fileData.downloadUrl || fileData.url);
          const blob = await response.blob();
          const file = new File([blob], fileData.fileName || 'resume.pdf', { 
            type: fileData.mimeType || 'application/pdf' 
          });
          
          const parseResult = await parseResumeAndGenerateQuestions(file);
          
          if (parseResult.success) {
            console.log('Resume parsed successfully:', parseResult);
            setResumeBasedQuestions(parseResult.questions || []);
            setResumeParseData(parseResult.resumeData);
            
            // Store parsed data in candidate for future use
            if (activeCandidate) {
              activeCandidate.resumeData = parseResult.resumeData;
              activeCandidate.skillsFound = parseResult.skillsFound;
              activeCandidate.experienceLevel = parseResult.experience;
            }
          } else {
            console.warn('Resume parsing failed:', parseResult.error);
            message.warning('Unable to parse resume content for personalized questions');
          }
        } catch (downloadError) {
          console.error('Error downloading resume file:', downloadError);
        }
      }
    } catch (error) {
      console.error('Error parsing resume for questions:', error);
    } finally {
      setIsParsingResume(false);
    }
  };

  // Resume management functions
  const loadUserFiles = async () => {
    try {
      setIsLoadingFiles(true);
      console.log('Loading user files for user:', user);
      if (user && user.role === 'Interviewee') {
        const result = await fileUploadService.getFiles({ category: 'resume' });
        console.log('File service result:', result);
        if (result.success) {
          setUserFiles(result.files || []);
          console.log('User files loaded:', result.files);
          
          // Parse the first resume file to generate personalized questions
          const files = result.files || [];
          if (files.length > 0) {
            await parseResumeForQuestions(files[0]);
          }
        } else {
          console.log('File service returned unsuccessfully:', result);
          message.warning('No resume files found');
        }
      } else {
        console.log('User is not an interviewee:', user?.role);
      }
    } catch (error) {
      console.error('Error loading user files:', error);
      message.error('Failed to load uploaded resumes');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleViewResume = async (file) => {
    console.log('handleViewResume called with file:', file);
    if (!file) {
      message.error('No file selected');
      return;
    }
    setSelectedResume(file);
    setShowResumeModal(true);
    console.log('Modal should be showing now');
  };

  const handleDeleteResume = async (fileId) => {
    try {
      await fileUploadService.deleteFile(fileId);
      message.success('Resume deleted successfully');
      loadUserFiles(); // Refresh the list
    } catch (error) {
      console.error('Error deleting resume:', error);
      message.error('Failed to delete resume');
    }
  };

  const handleGoToUpload = () => {
    Modal.confirm({
      title: 'Go to Upload Resume Page',
      content: 'This will reset your current assessment progress and take you back to the resume upload page. Are you sure?',
      okText: 'Yes, Go to Upload',
      cancelText: 'Cancel',
      onOk: () => {
        // Reset the current candidate's assessment state
        if (candidateId) {
          resetCandidateAssessment(candidateId);
        }
        
        // Clear the active candidate to return to upload screen
        setActiveCandidateId(null);
        
        message.success('Returning to resume upload page...');
      }
    });
  };

  // Load files when component mounts
  useEffect(() => {
    if (user && user.role === 'Interviewee') {
      loadUserFiles();
    }
  }, [user]);

  // Monitor interview state changes
  useEffect(() => {
    console.log('Interview state changed:', {
      actualInterviewState,
      interviewState,
      candidateStatus: activeCandidate?.status,
      candidateId,
      hasActiveCandidate: !!activeCandidate
    });
  }, [actualInterviewState, interviewState, activeCandidate?.status, candidateId]);

  // Monitor candidate changes
  useEffect(() => {
    console.log('Active candidate changed:', activeCandidate);
  }, [activeCandidate]);

  // Monitor current question changes
  useEffect(() => {
    console.log('🔍 Current question changed:', {
      questionIndex: currentQuestionIndex,
      question: currentQuestion,
      hasOptions: currentQuestion?.options?.length || 0,
      difficulty: currentConfig.difficulty
    });
  }, [currentQuestion, currentQuestionIndex]);

  const getQuestionStatus = (index) => {
    if (index < currentQuestionIndex) return 'completed';
    if (index === currentQuestionIndex) return 'active';
    return 'pending';
  };

  // Add debugging
  console.log('QuizInterface Debug:', {
    candidateId,
    activeCandidate: activeCandidate ? {
      id: activeCandidate.id,
      name: activeCandidate.name,
      email: activeCandidate.email,
      phone: activeCandidate.phone,
      status: activeCandidate.status,
      hasResumeData: !!activeCandidate.resumeData,
      chatHistoryLength: activeCandidate.chatHistory?.length || 0,
      missingFields: activeCandidate.missingFields
    } : null,
    actualInterviewState,
    interviewState,
    candidatesCount: candidates.length,
    user: user ? { email: user.email, role: user.role } : null,
    resumeBasedQuestionsCount: resumeBasedQuestions.length,
    isParsingResume
  });

  if (actualInterviewState === 'idle' || !activeCandidate) {
    // Resume dropdown menu items
    const resumeMenuItems = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: `View Uploaded Resume ${userFiles.length > 0 ? `(${userFiles.length})` : ''}`,
        disabled: userFiles.length === 0,
        onClick: () => {
          console.log('View resume clicked, userFiles:', userFiles);
          if (userFiles.length > 0) {
            console.log('Calling handleViewResume with:', userFiles[0]);
            handleViewResume(userFiles[0]);
          } else {
            message.warning('No resume files found. Please upload a resume first.');
          }
        }
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete Resume',
        disabled: userFiles.length === 0,
        onClick: () => {
          if (userFiles.length > 0) {
            Modal.confirm({
              title: 'Delete Resume',
              content: 'Are you sure you want to delete your uploaded resume?',
              okText: 'Delete',
              okType: 'danger',
              cancelText: 'Cancel',
              onOk: () => handleDeleteResume(userFiles[0]._id)
            });
          }
        }
      },
      {
        key: 'upload',
        icon: <UploadOutlined />,
        label: 'Go to Upload Resume Page',
        onClick: handleGoToUpload
      }
    ];

    return (
      <div className="quiz-welcome">
        {/* Resume Management Buttons - Top Right */}
        {user && user.role === 'Interviewee' && (
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px',
            zIndex: 10,
            display: 'flex',
            gap: '8px'
          }}>
            {/* Debug Buttons - only in development */}
            {!import.meta.env.PROD && (
              <>
                <Button 
                  type="default" 
                  size="small"
                  onClick={() => {
                    console.log('🧪 Test Assessment Debug Info:');
                    console.log('- User:', user);
                    console.log('- Candidates:', candidates);
                    console.log('- Active Candidate:', activeCandidate);
                    console.log('- Interview State:', interviewState);
                    console.log('- Resume Questions:', resumeBasedQuestions.length);
                    message.info('Debug info logged to console');
                  }}
                  style={{ 
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)'
                  }}
                >
                  Debug Info
                </Button>
                
                <Button 
                  type="default" 
                  size="small"
                  onClick={() => {
                    console.log('🚀 Force Start Assessment (Test Mode)');
                    if (!candidateId && user) {
                      console.log('Creating test candidate...');
                      const testCandidateId = addCandidate({
                        name: 'Test User',
                        email: user.email || 'test@example.com',
                        phone: '123-456-7890'
                      });
                      setTimeout(() => {
                        generateNextQuestion(0);
                      }, 500);
                    } else {
                      generateNextQuestion(0);
                    }
                  }}
                  style={{ 
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)'
                  }}
                >
                  Force Start
                </Button>
                
                <Button 
                  type="default" 
                  size="small"
                  onClick={() => {
                    console.log('🧪 Testing Question with Proper Options');
                    const testQuestion = {
                      question: "What is the difference between let, const, and var in JavaScript?",
                      difficulty: "easy",
                      category: "JavaScript Fundamentals",
                      options: [
                        { id: 'A', text: 'let and const are block-scoped, var is function-scoped' },
                        { id: 'B', text: 'let and const are function-scoped, var is block-scoped' },
                        { id: 'C', text: 'They are all exactly the same' },
                        { id: 'D', text: 'Only let is block-scoped' }
                      ]
                    };
                    
                    if (candidateId) {
                      addChatMessage(candidateId, {
                        type: 'ai',
                        text: testQuestion.question,
                        questionData: testQuestion
                      });
                      setSelectedAnswer(null);
                      setTimeLeft(20);
                      setIsTimerActive(true);
                      message.success('Test question with proper options added!');
                    }
                  }}
                  style={{ 
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)'
                  }}
                >
                  Test Q
                </Button>
                
                <Button 
                  type="default" 
                  size="small"
                  onClick={() => {
                    console.log('🔄 Regenerating Current Question');
                    generateNextQuestion(currentQuestionIndex);
                  }}
                  style={{ 
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)'
                  }}
                >
                  Retry Q
                </Button>
              </>
            )}

            <Dropdown
              menu={{ items: resumeMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button 
                type="text" 
                icon={<MoreOutlined />} 
                style={{ 
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)'
                }}
                loading={isLoadingFiles}
              >
                Resume Options ({userFiles.length})
              </Button>
            </Dropdown>
          </div>
        )}
        
        <div className="quiz-welcome-content">
          <TrophyOutlined className="quiz-welcome-icon" />
          <h1>Full Stack Developer Assessment</h1>
          <p>This assessment consists of 6 questions covering various topics</p>
          
          {/* Resume parsing status */}
          {isParsingResume && (
            <div style={{ 
              background: 'rgba(24, 144, 255, 0.1)', 
              border: '1px solid rgba(24, 144, 255, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              margin: '16px 0',
              textAlign: 'center'
            }}>
              <p style={{ color: '#1890ff', margin: 0, fontSize: '14px' }}>
                🔍 Analyzing your resume to generate personalized questions...
              </p>
            </div>
          )}
          
          {resumeBasedQuestions.length > 0 && !isParsingResume && (
            <div style={{ 
              background: 'rgba(82, 196, 26, 0.1)', 
              border: '1px solid rgba(82, 196, 26, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              margin: '16px 0',
              textAlign: 'center'
            }}>
              <p style={{ color: '#52c41a', margin: 0, fontSize: '14px' }}>
                ✅ {resumeBasedQuestions.length} personalized questions generated from your resume!
              </p>
            </div>
          )}
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
          {!activeCandidate ? (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <p style={{ color: '#fbbf24', marginBottom: '16px' }}>
                ⚠️ Please upload your resume first to start the assessment
              </p>
              <Button 
                type="primary" 
                size="large" 
                onClick={handleGoToUpload}
                className="quiz-start-btn"
              >
                Go to Resume Upload
              </Button>
            </div>
          ) : (
            <Button 
              type="primary" 
              size="large" 
              onClick={handleStartInterview}
              className="quiz-start-btn"
            >
              Start Assessment
            </Button>
          )}
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

  // If interview is active but no question is available, show loading state
  if (actualInterviewState === 'active' && !currentQuestion) {
    return (
      <div className="quiz-welcome">
        <div className="quiz-welcome-content">
          <div style={{ marginBottom: '24px', fontSize: '48px' }}>
            ⏳
          </div>
          <h1>Loading Question...</h1>
          <p>Please wait while we generate your next question.</p>
          <Button 
            type="default" 
            onClick={() => generateNextQuestion(currentQuestionIndex)}
            style={{ marginTop: '16px' }}
          >
            Retry Loading Question
          </Button>
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

          <div className="quiz-question-text" style={{ 
            fontSize: '16px', 
            fontWeight: '500', 
            color: '#ffffff',
            lineHeight: '1.5',
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0
          }}>
            {currentQuestion?.question || 'Loading question...'}
          </div>

          {/* MCQ Options for Easy and Medium Questions */}
          {currentConfig.difficulty !== 'hard' && (
            <div className="quiz-options">
              {(() => {
                // Force generate options if missing
                let questionWithOptions = currentQuestion;
                if (!currentQuestion?.options || !Array.isArray(currentQuestion.options) || currentQuestion.options.length === 0) {
                  console.log('🚨 Force generating options in render for:', currentQuestion);
                  const forceOptions = generateMockOptions(currentQuestion?.question || 'Default question');
                  questionWithOptions = {
                    ...currentQuestion,
                    options: forceOptions
                  };
                  console.log('✅ Force generated options:', forceOptions);
                }
                return questionWithOptions?.options && Array.isArray(questionWithOptions.options) && questionWithOptions.options.length > 0;
              })() ? (
                <Radio.Group 
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  value={selectedAnswer}
                  className="quiz-radio-group"
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {(() => {
                      // Use the same logic to get options for rendering
                      let questionWithOptions = currentQuestion;
                      if (!currentQuestion?.options || !Array.isArray(currentQuestion.options) || currentQuestion.options.length === 0) {
                        const forceOptions = generateMockOptions(currentQuestion?.question || 'Default question');
                        questionWithOptions = {
                          ...currentQuestion,
                          options: forceOptions
                        };
                      }
                      return questionWithOptions.options.map((option) => (
                      <Radio 
                        key={option.id}
                        value={option.id}
                        className="quiz-option"
                        style={{ 
                          color: '#ffffff', 
                          fontSize: '16px',
                          padding: '12px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          marginBottom: '8px'
                        }}
                      >
                        <span className="quiz-option-id" style={{ 
                          fontWeight: 'bold', 
                          marginRight: '12px',
                          color: '#64b5f6'
                        }}>{option.id}</span>
                        <span className="quiz-option-text" style={{ color: '#ffffff' }}>
                          {option.text}
                        </span>
                      </Radio>
                      ));
                    })()}
                  </Space>
                </Radio.Group>
              ) : (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center',
                  backgroundColor: 'rgba(255,193,7,0.1)',
                  border: '1px solid rgba(255,193,7,0.3)',
                  borderRadius: '8px',
                  color: '#ffc107'
                }}>
                  <p>⚠️ Options not available for this question</p>
                  <p style={{ fontSize: '14px', opacity: 0.8 }}>
                    Question data: {JSON.stringify(currentQuestion, null, 2)}
                  </p>
                  <Button 
                    type="primary" 
                    onClick={() => {
                      console.log('🔧 Manually generating options for question:', currentQuestion);
                      if (currentQuestion?.question) {
                        const options = generateMockOptions(currentQuestion.question);
                        console.log('✅ Manually generated options:', options);
                        
                        // Create a completely new question with options
                        const fixedQuestion = {
                          ...currentQuestion,
                          options: options,
                          id: `fixed_${Date.now()}`,
                          difficulty: currentConfig.difficulty,
                          category: currentQuestion.category || 'General'
                        };
                        
                        // Add the fixed question to chat
                        addChatMessage(candidateId, {
                          type: 'ai',
                          text: `✅ Fixed Question: ${currentQuestion.question}`,
                          questionData: fixedQuestion
                        });
                        
                        // Reset state
                        setSelectedAnswer(null);
                        setTimeLeft(currentConfig.time);
                        setIsTimerActive(true);
                        
                        message.success('Options generated! Question is now ready.');
                      }
                    }}
                  >
                    Generate Options
                  </Button>
                </div>
              )}
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

        {/* Resume View Modal */}
        <Modal
          title="Uploaded Resume Details"
          open={showResumeModal}
          onCancel={() => {
            console.log('Modal closing');
            setShowResumeModal(false);
          }}
          footer={[
            <Button key="close" onClick={() => setShowResumeModal(false)}>
              Close
            </Button>
          ]}
          width={800}
        >
          {selectedResume ? (
            <div>
              <p><strong>File Name:</strong> {selectedResume.originalName || selectedResume.filename || 'Unknown'}</p>
              <p><strong>Upload Date:</strong> {
                selectedResume.uploadedAt || selectedResume.uploadDate 
                  ? new Date(selectedResume.uploadedAt || selectedResume.uploadDate).toLocaleDateString()
                  : 'Unknown'
              }</p>
              <p><strong>File Size:</strong> {
                selectedResume.size 
                  ? `${(selectedResume.size / 1024).toFixed(2)} KB`
                  : 'Unknown'
              }</p>
              <p><strong>File Type:</strong> {selectedResume.mimetype || 'Unknown'}</p>
              
              {/* Debug info */}
              <details style={{ marginTop: '16px' }}>
                <summary>Debug Info (Click to expand)</summary>
                <pre style={{ background: '#f0f0f0', padding: '8px', fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
                  {JSON.stringify(selectedResume, null, 2)}
                </pre>
              </details>
              
              {/* Resume content preview */}
              {selectedResume.extractedText && (
                <div style={{ marginTop: '16px' }}>
                  <h4>Resume Content Preview:</h4>
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '4px',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                      {selectedResume.extractedText.substring(0, 1000)}
                      {selectedResume.extractedText.length > 1000 && '...'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>No resume data available</div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default QuizInterface;
