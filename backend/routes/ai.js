const express = require('express');
const router = express.Router();
const deepseekService = require('../services/deepseekService');
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

    const result = await deepseekService.generateQuestions(
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
      message: 'DeepSeek AI service is configured and ready'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

module.exports = router;
