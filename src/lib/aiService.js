// AI service using Perplexity API for accurate evaluations
import axios from 'axios';

// In production (Vercel), use relative URLs to work with the same domain
let API_URL;
if (import.meta.env.PROD) {
  // In production, use relative URL (same domain as frontend)
  API_URL = '/api';
} else {
  // In development, use the full localhost URL
  API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
}

// Fallback question pools for offline mode
const QUESTION_POOLS = {
  easy: [
    {
      id: 'easy_1',
      question: "What is the difference between let, const, and var in JavaScript?",
      expectedAnswer: "let and const are block-scoped, var is function-scoped. const cannot be reassigned after declaration.",
      category: "JavaScript Fundamentals"
    },
    {
      id: 'easy_2',
      question: "Explain what JSX is in React and why it's useful.",
      expectedAnswer: "JSX is a syntax extension for JavaScript that allows writing HTML-like code in React components.",
      category: "React Basics"
    },
    {
      id: 'easy_3',
      question: "What is the purpose of the package.json file in a Node.js project?",
      expectedAnswer: "Package.json contains project metadata, dependencies, scripts, and configuration for Node.js projects.",
      category: "Node.js Basics"
    },
    {
      id: 'easy_4',
      question: "What are the main differences between SQL and NoSQL databases?",
      expectedAnswer: "SQL databases are relational with structured schemas, NoSQL databases are non-relational with flexible schemas.",
      category: "Database Fundamentals"
    },
    {
      id: 'easy_5',
      question: "Explain what CSS Flexbox is and when you would use it.",
      expectedAnswer: "Flexbox is a CSS layout method for arranging items in one dimension, useful for responsive layouts.",
      category: "CSS/Frontend"
    }
  ],
  
  medium: [
    {
      id: 'medium_1',
      question: "Explain the concept of React Hooks. How do useState and useEffect work?",
      expectedAnswer: "Hooks allow functional components to use state and lifecycle methods. useState manages state, useEffect handles side effects.",
      category: "React Advanced"
    },
    {
      id: 'medium_2',
      question: "What is the Event Loop in JavaScript and how does it handle asynchronous operations?",
      expectedAnswer: "Event loop manages execution of code, handles callbacks, promises, and async operations in JavaScript's single-threaded environment.",
      category: "JavaScript Advanced"
    },
    {
      id: 'medium_3',
      question: "Describe RESTful API principles and HTTP methods (GET, POST, PUT, DELETE).",
      expectedAnswer: "REST uses standard HTTP methods for CRUD operations on resources, following stateless communication principles.",
      category: "API Design"
    },
    {
      id: 'medium_4',
      question: "What are JavaScript Promises and how do they compare to async/await?",
      expectedAnswer: "Promises handle asynchronous operations. Async/await provides cleaner syntax for working with promises.",
      category: "JavaScript Async"
    },
    {
      id: 'medium_5',
      question: "Explain database normalization and why it's important.",
      expectedAnswer: "Normalization organizes database structure to reduce redundancy and improve data integrity through normal forms.",
      category: "Database Design"
    }
  ],
  
  hard: [
    {
      id: 'hard_1',
      question: "Describe a complex project where you implemented state management in React. What challenges did you face and how did you solve them?",
      expectedAnswer: "Should demonstrate understanding of state management patterns, tools like Redux/Context API, and problem-solving skills.",
      category: "React Architecture"
    },
    {
      id: 'hard_2',
      question: "How would you optimize a slow-performing Node.js application? Explain your debugging and optimization approach.",
      expectedAnswer: "Should cover profiling, identifying bottlenecks, caching strategies, database optimization, and monitoring.",
      category: "Performance Optimization"
    },
    {
      id: 'hard_3',
      question: "Design a scalable architecture for a real-time chat application. What technologies and patterns would you use?",
      expectedAnswer: "Should include WebSockets, microservices, load balancing, database design, and real-time considerations.",
      category: "System Design"
    },
    {
      id: 'hard_4',
      question: "Explain how you would implement authentication and authorization in a full-stack application. Include security considerations.",
      expectedAnswer: "Should cover JWT tokens, session management, role-based access, security best practices, and threat mitigation.",
      category: "Security & Auth"
    },
    {
      id: 'hard_5',
      question: "How would you handle error handling and logging in a production Node.js application?",
      expectedAnswer: "Should include error boundaries, logging strategies, monitoring, graceful degradation, and debugging approaches.",
      category: "Production Systems"
    }
  ]
};

export const generateQuestion = (difficulty, questionIndex) => {
  const pool = QUESTION_POOLS[difficulty];
  if (!pool || pool.length === 0) {
    return {
      question: `Sample ${difficulty} question ${questionIndex + 1}`,
      category: "General",
      expectedAnswer: "Sample expected answer"
    };
  }

  // Rotate through questions to avoid repetition
  const questionData = pool[questionIndex % pool.length];
  return {
    ...questionData,
    difficulty,
    questionNumber: questionIndex + 1,
    totalQuestions: 6
  };
};

export const evaluateAnswer = (answer, questionData, timeUsed, timeLimit) => {
  // Mock AI evaluation - in real app this would use AI service
  if (!answer || answer.trim().length === 0) {
    return {
      score: 0,
      feedback: "No answer provided within the time limit.",
      strengths: [],
      improvements: ["Provide an answer within the time limit", "Show your knowledge of the topic"]
    };
  }

  const answerLength = answer.trim().length;
  const timePercentage = (timeLimit - timeUsed) / timeLimit;
  
  // Scoring factors
  let baseScore = calculateContentScore(answer, questionData);
  let timeBonus = Math.max(0, timePercentage * 10); // Up to 10 point bonus for quick answers
  let lengthPenalty = answerLength < 50 ? -10 : 0; // Penalty for very short answers
  
  const finalScore = Math.max(0, Math.min(100, baseScore + timeBonus + lengthPenalty));
  
  return {
    score: Math.round(finalScore),
    feedback: generateFeedback(finalScore, questionData.difficulty, answerLength, timeUsed, timeLimit),
    strengths: identifyStrengths(answer, questionData, finalScore),
    improvements: identifyImprovements(answer, questionData, finalScore),
    timeUsed,
    timeLimit,
    answerLength
  };
};

const calculateContentScore = (answer, questionData) => {
  const answerLower = answer.toLowerCase();
  const expectedLower = questionData.expectedAnswer.toLowerCase();
  
  // Keywords based on difficulty and category
  const keywordSets = {
    "JavaScript Fundamentals": ["scope", "block", "function", "hoisting", "variable"],
    "React Basics": ["jsx", "component", "virtual dom", "props", "state"],
    "Node.js Basics": ["package", "dependencies", "npm", "module", "require"],
    "Database Fundamentals": ["relational", "schema", "structured", "flexible", "document"],
    "CSS/Frontend": ["flexbox", "layout", "responsive", "container", "items"],
    "React Advanced": ["hooks", "usestate", "useeffect", "lifecycle", "functional"],
    "JavaScript Advanced": ["event loop", "asynchronous", "callback", "promise", "thread"],
    "API Design": ["rest", "http", "crud", "stateless", "resource"],
    "JavaScript Async": ["promise", "async", "await", "asynchronous", "callback"],
    "Database Design": ["normalization", "redundancy", "integrity", "normal form", "relationship"],
    "React Architecture": ["state management", "redux", "context", "component", "architecture"],
    "Performance Optimization": ["optimization", "performance", "bottleneck", "caching", "profiling"],
    "System Design": ["scalable", "architecture", "websocket", "microservice", "load balancing"],
    "Security & Auth": ["authentication", "authorization", "jwt", "token", "security"],
    "Production Systems": ["error handling", "logging", "monitoring", "production", "debugging"]
  };

  const relevantKeywords = keywordSets[questionData.category] || [];
  let keywordMatches = 0;
  
  relevantKeywords.forEach(keyword => {
    if (answerLower.includes(keyword)) {
      keywordMatches++;
    }
  });

  // Base score calculation
  let score = questionData.difficulty === 'easy' ? 40 : 
              questionData.difficulty === 'medium' ? 30 : 20;

  // Keyword matching bonus
  const keywordBonus = (keywordMatches / relevantKeywords.length) * 40;
  
  // Answer completeness (based on similarity to expected answer)
  const completenessScore = calculateSimilarity(answerLower, expectedLower) * 30;
  
  return score + keywordBonus + completenessScore;
};

const calculateSimilarity = (answer, expected) => {
  const answerWords = answer.split(/\s+/).filter(word => word.length > 2);
  const expectedWords = expected.split(/\s+/).filter(word => word.length > 2);
  
  let matches = 0;
  expectedWords.forEach(word => {
    if (answerWords.some(answerWord => 
      answerWord.includes(word) || word.includes(answerWord)
    )) {
      matches++;
    }
  });
  
  return expectedWords.length > 0 ? matches / expectedWords.length : 0;
};

const generateFeedback = (score, difficulty, answerLength, timeUsed, timeLimit) => {
  let feedback = "";
  
  if (score >= 90) {
    feedback = "Excellent answer! Comprehensive understanding demonstrated.";
  } else if (score >= 75) {
    feedback = "Great answer with solid technical knowledge.";
  } else if (score >= 60) {
    feedback = "Good answer showing understanding of key concepts.";
  } else if (score >= 40) {
    feedback = "Fair answer but could benefit from more detail and examples.";
  } else {
    feedback = "Answer needs significant improvement. Consider reviewing the fundamentals.";
  }
  
  // Add time-based feedback
  const timePercentage = timeUsed / timeLimit;
  if (timePercentage < 0.3) {
    feedback += " Quick response time shows confidence.";
  } else if (timePercentage > 0.9) {
    feedback += " Used most of the available time - ensure you can answer more efficiently.";
  }
  
  // Add length-based feedback
  if (answerLength < 50) {
    feedback += " Consider providing more detailed explanations.";
  } else if (answerLength > 500) {
    feedback += " Good detail, but try to be more concise in your explanations.";
  }
  
  return feedback;
};

const identifyStrengths = (answer, questionData, score) => {
  const strengths = [];
  const answerLower = answer.toLowerCase();
  
  if (score >= 75) {
    strengths.push("Strong technical understanding");
  }
  
  if (answer.length > 100) {
    strengths.push("Detailed explanation");
  }
  
  if (answerLower.includes("example") || answerLower.includes("for instance")) {
    strengths.push("Used examples to illustrate concepts");
  }
  
  if (questionData.difficulty === 'hard' && score >= 60) {
    strengths.push("Tackled complex question well");
  }
  
  // Category-specific strengths
  if (questionData.category.includes("React") && (answerLower.includes("component") || answerLower.includes("jsx"))) {
    strengths.push("Good React terminology usage");
  }
  
  if (questionData.category.includes("JavaScript") && (answerLower.includes("scope") || answerLower.includes("function"))) {
    strengths.push("Understanding of JavaScript fundamentals");
  }
  
  return strengths;
};

const identifyImprovements = (answer, questionData, score) => {
  const improvements = [];
  const answerLower = answer.toLowerCase();
  
  if (score < 50) {
    improvements.push("Review fundamental concepts for this topic");
  }
  
  if (answer.length < 50) {
    improvements.push("Provide more detailed explanations");
  }
  
  if (!answerLower.includes("example") && questionData.difficulty !== 'easy') {
    improvements.push("Include practical examples to demonstrate understanding");
  }
  
  if (score < 75 && questionData.difficulty === 'easy') {
    improvements.push("Focus on mastering basic concepts before moving to advanced topics");
  }
  
  // Category-specific improvements
  const keywordSets = {
    "JavaScript Fundamentals": ["scope", "hoisting", "closure"],
    "React Basics": ["component", "props", "state", "jsx"],
    "Node.js Basics": ["npm", "module", "require", "package"],
    "Database Fundamentals": ["schema", "relational", "query"],
  };
  
  const expectedKeywords = keywordSets[questionData.category] || [];
  const missingKeywords = expectedKeywords.filter(keyword => !answerLower.includes(keyword));
  
  if (missingKeywords.length > 0) {
    improvements.push(`Consider mentioning: ${missingKeywords.slice(0, 2).join(", ")}`);
  }
  
  return improvements;
};

export const generateInterviewSummary = (candidate) => {
  const answers = candidate.answers || [];
  const totalQuestions = 6;
  const answeredQuestions = answers.length;
  
  if (answeredQuestions === 0) {
    return {
      overallScore: 0,
      summary: `${candidate.name} did not complete any interview questions.`,
      strengths: [],
      improvements: ["Complete the interview questions", "Demonstrate technical knowledge"],
      recommendation: "Not recommended - interview not completed"
    };
  }
  
  const totalScore = answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
  const averageScore = Math.round(totalScore / answeredQuestions);
  
  // Calculate performance by difficulty
  const easyQuestions = answers.filter(a => a.questionType === 'easy');
  const mediumQuestions = answers.filter(a => a.questionType === 'medium');
  const hardQuestions = answers.filter(a => a.questionType === 'hard');
  
  const easyAvg = easyQuestions.length > 0 ? 
    Math.round(easyQuestions.reduce((sum, a) => sum + a.score, 0) / easyQuestions.length) : 0;
  const mediumAvg = mediumQuestions.length > 0 ? 
    Math.round(mediumQuestions.reduce((sum, a) => sum + a.score, 0) / mediumQuestions.length) : 0;
  const hardAvg = hardQuestions.length > 0 ? 
    Math.round(hardQuestions.reduce((sum, a) => sum + a.score, 0) / hardQuestions.length) : 0;
  
  // Generate overall assessment
  let performanceLevel = "Poor";
  let recommendation = "Not recommended";
  
  if (averageScore >= 85) {
    performanceLevel = "Excellent";
    recommendation = "Highly recommended";
  } else if (averageScore >= 75) {
    performanceLevel = "Very Good";
    recommendation = "Recommended";
  } else if (averageScore >= 65) {
    performanceLevel = "Good";
    recommendation = "Recommended with some reservations";
  } else if (averageScore >= 50) {
    performanceLevel = "Fair";
    recommendation = "Consider for junior position";
  }
  
  // Compile all strengths and improvements
  const allStrengths = answers.flatMap(a => a.strengths || []);
  const allImprovements = answers.flatMap(a => a.improvements || []);
  
  const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5);
  const uniqueImprovements = [...new Set(allImprovements)].slice(0, 5);
  
  const summary = `${candidate.name} completed ${answeredQuestions}/${totalQuestions} interview questions with an overall score of ${averageScore}%. Performance breakdown: Easy (${easyAvg}%), Medium (${mediumAvg}%), Hard (${hardAvg}%). ${performanceLevel} performance overall.`;
  
  return {
    overallScore: averageScore,
    summary,
    performanceLevel,
    recommendation,
    questionBreakdown: {
      easy: { answered: easyQuestions.length, averageScore: easyAvg },
      medium: { answered: mediumQuestions.length, averageScore: mediumAvg },
      hard: { answered: hardQuestions.length, averageScore: hardAvg }
    },
    strengths: uniqueStrengths,
    improvements: uniqueImprovements,
    completionRate: Math.round((answeredQuestions / totalQuestions) * 100)
  };
};

// ==================== Perplexity AI Integration ====================

/**
 * Calculate ATS Score using Perplexity AI
 * @param {string} resumeText - Resume text content
 * @param {string} jobDescription - Optional job description
 * @returns {Promise<Object>} ATS score and analysis
 */
export const calculateATSScoreWithAI = async (resumeText, jobDescription = '') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/ai/ats-score`, {
      resumeText,
      jobDescription
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('ATS Score API Error:', error);
    // Fallback to basic calculation
    return {
      success: false,
      atsScore: Math.floor(Math.random() * 40) + 40, // 40-80 range fallback
      breakdown: {
        formatting: 60,
        keywords: 50,
        experience: 70,
        education: 65,
        skills: 55
      },
      strengths: ['Resume uploaded successfully'],
      weaknesses: ['AI analysis temporarily unavailable'],
      recommendations: ['Please ensure Perplexity API is configured'],
      extractedSkills: [],
      experienceYears: 0,
      matchPercentage: 0
    };
  }
};

/**
 * Evaluate answer using Perplexity AI
 * @param {string} question - The question
 * @param {string} answer - The candidate's answer
 * @param {Object} questionData - Question metadata
 * @param {number} timeUsed - Time taken
 * @param {number} timeLimit - Time limit
 * @returns {Promise<Object>} Evaluation result
 */
export const evaluateAnswerWithAI = async (answer, questionData, timeUsed, timeLimit) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/ai/evaluate-answer`, {
      question: questionData.question,
      answer,
      difficulty: questionData.difficulty,
      timeUsed,
      timeLimit
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      return response.data;
    } else {
      // Fallback to basic evaluation
      return evaluateAnswer(answer, questionData, timeUsed, timeLimit);
    }
  } catch (error) {
    console.error('AI Answer Evaluation Error:', error);
    // Fallback to basic evaluation
    return evaluateAnswer(answer, questionData, timeUsed, timeLimit);
  }
};

/**
 * Generate interview summary using Perplexity AI
 * @param {Object} candidate - Candidate data
 * @param {Array} answers - All answers
 * @returns {Promise<Object>} Interview summary
 */
export const generateInterviewSummaryWithAI = async (candidate, answers) => {
  try {
    const token = localStorage.getItem('token');
    const totalScore = answers.reduce((sum, a) => sum + (a.score || 0), 0);
    
    const response = await axios.post(`${API_URL}/api/ai/interview-summary`, {
      candidateName: candidate.name,
      answers: answers.map(a => ({
        question: a.question || '',
        answer: a.answer || '',
        difficulty: a.difficulty || 'medium',
        score: a.score || 0
      })),
      totalQuestions: 6,
      totalScore
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      return {
        ...response.data,
        overallScore: response.data.overallScore || Math.round(totalScore / answers.length)
      };
    } else {
      // Fallback to basic summary
      return generateInterviewSummary(candidate, answers);
    }
  } catch (error) {
    console.error('AI Summary Generation Error:', error);
    // Fallback to basic summary
    return generateInterviewSummary(candidate, answers);
  }
};

/**
 * Check if Perplexity AI is configured
 * @returns {Promise<boolean>} Configuration status
 */
export const checkAIHealth = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/ai/health`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data.configured || false;
  } catch (error) {
    console.error('AI Health Check Error:', error);
    return false;
  }
};