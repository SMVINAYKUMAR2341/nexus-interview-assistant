const express = require('express');
const router = express.Router();
const deepseekService = require('../services/deepseekService');
const aiAnalyzer = require('../services/aiAnalyzer');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/ai/ats-score
 * Calculate ATS score for a resume
 */
router.post('/ats-score', authenticate, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Resume text is required'
      });
    }

    const result = await deepseekService.calculateATSScore(resumeText, jobDescription);

    res.json(result);
  } catch (error) {
    console.error('ATS Score API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate ATS score',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/evaluate-answer
 * Evaluate a candidate's answer to an interview question
 */
router.post('/evaluate-answer', authenticate, async (req, res) => {
  try {
    const { question, answer, difficulty, timeUsed, timeLimit } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }

    const result = await deepseekService.evaluateAnswer(
      question,
      answer,
      difficulty || 'medium',
      timeUsed || 0,
      timeLimit || 300
    );

    res.json(result);
  } catch (error) {
    console.error('Answer Evaluation API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate answer',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/generate-questions
 * Generate interview questions
 */
router.post('/generate-questions', authenticate, async (req, res) => {
  try {
    const { role, difficulty, count } = req.body;

    if (!role || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Role and difficulty are required'
      });
    }

    const result = await aiAnalyzer.generateQuestions(
      role,
      difficulty,
      count || 1
    );

    res.json(result);
  } catch (error) {
    console.error('Question Generation API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/interview-summary
 * Generate comprehensive interview summary
 */
router.post('/interview-summary', authenticate, async (req, res) => {
  try {
    const { candidateName, answers, totalQuestions, totalScore } = req.body;

    if (!candidateName || !answers || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name and answers are required'
      });
    }

    const result = await deepseekService.generateInterviewSummary({
      candidateName,
      answers,
      totalQuestions: totalQuestions || answers.length,
      totalScore: totalScore || 0
    });

    res.json(result);
  } catch (error) {
    console.error('Interview Summary API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interview summary',
      error: error.message
    });
  }
});

/**
 * GET /api/ai/health
 * Check DeepSeek API health
 */
router.get('/health', authenticate, async (req, res) => {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey || apiKey === 'your-deepseek-api-key-here') {
      return res.json({
        success: false,
        configured: false,
        message: 'DeepSeek API key not configured. Please add DEEPSEEK_API_KEY to your .env file.'
      });
    }

    res.json({
      success: true,
      configured: true,
      message: 'Perplexity AI service is configured and ready'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/chatbot
 * Get chatbot response using Perplexity AI
 */
router.post('/chatbot', authenticate, async (req, res) => {
  try {
    const { message, userRole = 'Interviewee', conversationHistory = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

    if (!PERPLEXITY_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Perplexity API key not configured'
      });
    }

    // System prompts for different user roles
    const systemPrompts = {
      Interviewer: `You are an AI assistant helping recruiters and interviewers use the Crisp Interview Assistant platform.

Your role:
- Help interviewers understand the platform features
- Provide guidance on evaluating candidates effectively
- Explain how to interpret AI summaries and scores
- Share best practices for conducting interviews

Tone: Professional, helpful, and informative
Style: Clear, concise responses with actionable advice`,

      Interviewee: `You are an AI assistant helping candidates prepare for and complete their interviews on the Crisp Interview Assistant platform.

Your role:
- Guide candidates through the interview process
- Provide encouragement and reduce interview anxiety
- Explain how the platform works
- Share tips for answering technical questions effectively

Tone: Friendly, encouraging, and supportive
Style: Warm and conversational, use emojis to be approachable`
    };

    const systemPrompt = systemPrompts[userRole] || systemPrompts.Interviewee;

    // Build context from conversation history
    let contextPrompt = `User Role: ${userRole}\n\n`;
    
    if (conversationHistory.length > 0) {
      contextPrompt += 'Recent Conversation:\n';
      conversationHistory.slice(-6).forEach(msg => {
        contextPrompt += `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.text}\n`;
      });
      contextPrompt += '\n';
    }

    contextPrompt += `User's Question: ${message}\n\nProvide a helpful, contextual response.`;

    const axios = require('axios');
    
    const response = await axios.post(PERPLEXITY_API_URL, {
      model: 'llama-3.1-sonar-small-128k-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 512
    }, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const chatbotMessage = response.data.choices[0].message.content;
      
      res.json({
        success: true,
        message: chatbotMessage,
        model: 'llama-3.1-sonar-small-128k-chat',
        userRole
      });
    } else {
      throw new Error('Invalid response format from Perplexity API');
    }

  } catch (error) {
    console.error('Chatbot API Error:', error);
    
    // Provide fallback responses
    const fallbackResponses = {
      Interviewer: "I'm here to help you with the interview platform! You can ask me about evaluating candidates, understanding AI summaries, or best practices for conducting interviews. How can I assist you today?",
      Interviewee: "Hi there! 😊 I'm here to help you prepare for your interview. You can ask me about the interview process, tips for answering questions, or how the platform works. What would you like to know?"
    };

    res.json({
      success: true,
      message: fallbackResponses[req.body.userRole] || fallbackResponses.Interviewee,
      model: 'fallback',
      note: 'Using fallback response due to API unavailability'
    });
  }
});

module.exports = router;
