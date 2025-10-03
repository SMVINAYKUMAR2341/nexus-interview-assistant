import React, { useState, useEffect, useRef } from 'react';
import { message as antdMessage } from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  CloseOutlined,
  UserOutlined,
  WechatOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';
import styles from './AIChatbot.module.css';

// Backend API configuration
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuthStore();

  // Initial suggestions based on user role
  const getSuggestions = () => {
    if (user?.role === 'Interviewer') {
      return [
        "How do I evaluate candidates effectively?",
        "What are good interview questions?",
        "How to use the AI summary feature?",
        "Best practices for conducting interviews"
      ];
    } else {
      return [
        "How do I prepare for the interview?",
        "What questions might I be asked?",
        "How does the scoring work?",
        "Tips for answering technical questions"
      ];
    }
  };

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg = {
        id: Date.now(),
        type: 'bot',
        text: `Hi ${user?.username || 'there'}! 👋 I'm your AI assistant. I'm here to help you with any questions about the interview process. How can I assist you today?`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMsg]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle new message notification
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages, isOpen]);

  // Reset unread count when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // AI Response logic
  const getAIResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Interviewer responses
    if (user?.role === 'Interviewer') {
      if (lowerMessage.includes('evaluate') || lowerMessage.includes('assessment')) {
        return "To evaluate candidates effectively:\n\n1. Review their AI Summary which provides comprehensive analysis\n2. Check their chat history for communication skills\n3. Look at technical scores and completion rates\n4. Consider their problem-solving approach\n5. Use the candidate profile for background verification\n\nThe AI Summary tab gives you strengths, weaknesses, and hiring recommendations!";
      }
      if (lowerMessage.includes('question') || lowerMessage.includes('ask')) {
        return "Great interview questions include:\n\n• Technical: 'Explain your approach to solving [specific problem]'\n• Behavioral: 'Tell me about a challenging project'\n• Problem-solving: 'How would you optimize this code?'\n• Cultural fit: 'What motivates you in your work?'\n\nFocus on open-ended questions that reveal thinking process!";
      }
      if (lowerMessage.includes('summary') || lowerMessage.includes('ai')) {
        return "The AI Summary feature analyzes:\n\n✓ Overall performance score\n✓ Technical & soft skills assessment\n✓ Strengths with examples\n✓ Areas for improvement\n✓ Interview metrics\n✓ Hiring recommendations\n\nFind it in the candidate detail view under the 'AI Summary' tab!";
      }
      if (lowerMessage.includes('best practice') || lowerMessage.includes('conduct')) {
        return "Best practices for conducting interviews:\n\n1. Start with introductions and small talk\n2. Use the structured questions provided\n3. Take notes on responses\n4. Ask follow-up questions\n5. Allow time for candidate questions\n6. Review AI analysis before making decisions\n\nRemember: consistency is key for fair evaluation!";
      }
      return "I can help you with:\n• Evaluating candidates\n• Interview questions\n• Using AI summaries\n• Best interview practices\n• Candidate assessment\n\nWhat specific aspect would you like to know more about?";
    }

    // Interviewee responses
    if (lowerMessage.includes('prepare') || lowerMessage.includes('ready')) {
      return "To prepare for your interview:\n\n1. Review the job description carefully\n2. Practice common interview questions\n3. Prepare examples from your experience\n4. Test your equipment and internet\n5. Have your resume handy\n6. Prepare questions for the interviewer\n\nRemember: Be authentic and show enthusiasm! 🚀";
    }
    if (lowerMessage.includes('question') || lowerMessage.includes('asked')) {
      return "Common interview questions:\n\n• Tell me about yourself\n• Why are you interested in this role?\n• Describe a challenging project\n• What are your strengths/weaknesses?\n• Technical questions about your field\n• Behavioral scenarios\n\nUse the STAR method (Situation, Task, Action, Result) for behavioral questions!";
    }
    if (lowerMessage.includes('score') || lowerMessage.includes('scoring')) {
      return "Interview scoring breakdown:\n\n• Technical Accuracy (30%)\n• Problem-solving approach (25%)\n• Communication clarity (20%)\n• Code quality (15%)\n• Time management (10%)\n\nThe AI evaluates your responses in real-time. Focus on clear explanations and structured thinking!";
    }
    if (lowerMessage.includes('technical') || lowerMessage.includes('coding')) {
      return "Tips for technical questions:\n\n1. Think out loud - explain your approach\n2. Ask clarifying questions\n3. Start with a simple solution\n4. Optimize iteratively\n5. Consider edge cases\n6. Write clean, readable code\n\nDon't worry about perfection - show your problem-solving process!";
    }
    if (lowerMessage.includes('nervous') || lowerMessage.includes('anxiety')) {
      return "Feeling nervous is normal! Here's how to manage:\n\n• Take deep breaths\n• Remember: they want you to succeed\n• It's okay to pause and think\n• Ask for clarification if needed\n• View it as a conversation, not interrogation\n\nYou've got this! 💪";
    }

    // General responses
    if (lowerMessage.includes('help') || lowerMessage.includes('assistance')) {
      return `I'm here to help you with the interview process! ${
        user?.role === 'Interviewer' 
          ? "I can assist with candidate evaluation, AI summaries, and interview best practices."
          : "I can help with interview preparation, tips, and answering your questions."
      }\n\nWhat would you like to know?`;
    }

    // Default response
    return "I'm here to help! Could you please rephrase your question or try asking about:\n\n" +
      (user?.role === 'Interviewer'
        ? "• Candidate evaluation\n• Interview questions\n• AI summaries\n• Best practices"
        : "• Interview preparation\n• Common questions\n• Scoring system\n• Technical tips");
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessageText = inputValue;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: userMessageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Get AI response from backend Perplexity API
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/ai/chatbot`, {
        message: userMessageText,
        userRole: user?.role || 'Interviewee',
        conversationHistory: messages.slice(-6) // Send last 6 messages for context
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.data.message || 'I\'m here to help! Could you please rephrase your question?',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response from backend:', error);
      
      // Fallback to keyword-based response if backend fails
      const fallbackResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: getAIResponse(userMessageText),
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.chatbotContainer}>
      {/* Chatbot Button */}
      <button
        className={styles.chatbotButton}
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
      >
        <RobotOutlined className={styles.chatbotIcon} />
        {unreadCount > 0 && !isOpen && (
          <span className={styles.notificationBadge}>{unreadCount}</span>
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className={styles.chatbotWindow}>
          {/* Header */}
          <div className={styles.chatbotHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.headerAvatar}>
                <RobotOutlined />
              </div>
              <div className={styles.headerInfo}>
                <h3>AI Assistant</h3>
                <p>
                  <span className={styles.statusDot}></span>
                  Always here to help
                </p>
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.chatbotMessages}>
            {messages.length === 1 && (
              <div className={styles.suggestionsList}>
                <p className={styles.suggestionsTitle}>💡 Quick Questions:</p>
                {getSuggestions().map((suggestion, index) => (
                  <div
                    key={index}
                    className={styles.suggestionItem}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={styles.messageGroup}>
                <div className={`${styles.message} ${styles[msg.type]}`}>
                  <div className={styles.messageAvatar}>
                    {msg.type === 'bot' ? <RobotOutlined /> : <UserOutlined />}
                  </div>
                  <div className={styles.messageBubble}>
                    <p className={styles.messageText}>
                      {msg.text.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < msg.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                    <span className={styles.messageTime}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className={styles.messageGroup}>
                <div className={`${styles.message} ${styles.bot}`}>
                  <div className={styles.messageAvatar}>
                    <RobotOutlined />
                  </div>
                  <div className={styles.typingIndicator}>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.chatbotInput}>
            <div className={styles.inputWrapper}>
              <textarea
                ref={inputRef}
                className={styles.inputField}
                placeholder="Type your question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
              />
              <button
                className={styles.sendButton}
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                title="Send message"
              >
                <SendOutlined />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;
