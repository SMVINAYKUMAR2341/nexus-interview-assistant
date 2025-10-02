const axios = require('axios');

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 seconds timeout
    });
  }

  /**
   * Calculate ATS (Applicant Tracking System) Score for a resume
   * @param {string} resumeText - The extracted text from resume
   * @param {string} jobDescription - Optional job description to match against
   * @returns {Promise<Object>} ATS score and detailed analysis
   */
  async calculateATSScore(resumeText, jobDescription = '') {
    try {
      const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume and provide a detailed scoring.

${jobDescription ? `Job Description:\n${jobDescription}\n\n` : ''}Resume Content:
${resumeText}

Please analyze and return a JSON response with the following structure:
{
  "atsScore": <number 0-100>,
  "breakdown": {
    "formatting": <number 0-100>,
    "keywords": <number 0-100>,
    "experience": <number 0-100>,
    "education": <number 0-100>,
    "skills": <number 0-100>
  },
  "strengths": [<array of 3-5 strength points>],
  "weaknesses": [<array of 3-5 weakness points>],
  "recommendations": [<array of 3-5 improvement suggestions>],
  "extractedSkills": [<array of identified technical skills>],
  "experienceYears": <estimated years of experience>,
  "matchPercentage": <percentage match with job description if provided>
}

Provide accurate, professional analysis based on industry standards.`;

      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert ATS analyzer and resume evaluator. Provide accurate, data-driven assessments in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.data.choices[0].message.content);
      
      return {
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('DeepSeek ATS Score Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        atsScore: 0,
        breakdown: {
          formatting: 0,
          keywords: 0,
          experience: 0,
          education: 0,
          skills: 0
        },
        strengths: ['Unable to analyze'],
        weaknesses: ['Analysis failed'],
        recommendations: ['Please try again'],
        extractedSkills: [],
        experienceYears: 0,
        matchPercentage: 0
      };
    }
  }

  /**
   * Evaluate a candidate's answer to an interview question
   * @param {string} question - The interview question
   * @param {string} answer - The candidate's answer
   * @param {string} difficulty - Question difficulty (easy, medium, hard)
   * @param {number} timeUsed - Time taken to answer (in seconds)
   * @param {number} timeLimit - Time limit for the question (in seconds)
   * @returns {Promise<Object>} Evaluation results with score and feedback
   */
  async evaluateAnswer(question, answer, difficulty, timeUsed, timeLimit) {
    try {
      const prompt = `You are an expert technical interviewer evaluating a candidate's response.

Question (${difficulty} difficulty): ${question}
Candidate's Answer: ${answer}
Time Used: ${timeUsed}s / ${timeLimit}s

Provide a comprehensive evaluation in JSON format:
{
  "score": <number 0-100>,
  "feedback": "<detailed feedback paragraph>",
  "strengths": [<array of 2-4 specific strengths>],
  "improvements": [<array of 2-4 specific areas for improvement>],
  "technicalAccuracy": <number 0-100>,
  "completeness": <number 0-100>,
  "clarity": <number 0-100>,
  "timeManagement": <number 0-100>,
  "keyPointsCovered": [<array of key concepts covered>],
  "keyPointsMissed": [<array of important concepts missed>],
  "overallRating": "<Excellent/Good/Fair/Poor>"
}

Consider:
1. Technical accuracy and depth of knowledge
2. Completeness of the answer
3. Communication clarity
4. Time management (answered within ${timeLimit}s)
5. Relevance to the question
6. Real-world application understanding`;

      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Evaluate answers fairly and provide constructive feedback in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.data.choices[0].message.content);
      
      return {
        success: true,
        ...result,
        timeUsed,
        timeLimit,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('DeepSeek Answer Evaluation Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        score: 0,
        feedback: 'Unable to evaluate answer at this time.',
        strengths: [],
        improvements: ['Please try again'],
        technicalAccuracy: 0,
        completeness: 0,
        clarity: 0,
        timeManagement: 0,
        keyPointsCovered: [],
        keyPointsMissed: [],
        overallRating: 'Unable to evaluate'
      };
    }
  }

  /**
   * Generate interview questions based on job role and difficulty
   * @param {string} role - Job role/position
   * @param {string} difficulty - Question difficulty (easy, medium, hard)
   * @param {number} count - Number of questions to generate
   * @returns {Promise<Array>} Array of generated questions
   */
  async generateQuestions(role, difficulty, count = 1) {
    try {
      const prompt = `Generate ${count} high-quality technical interview question(s) for a ${role} position at ${difficulty} difficulty level.

Return a JSON array of questions with this structure:
{
  "questions": [
    {
      "question": "<the interview question>",
      "category": "<category like React, JavaScript, System Design, etc.>",
      "difficulty": "${difficulty}",
      "expectedAnswer": "<brief overview of expected answer points>",
      "evaluationCriteria": [<array of 3-4 key points to evaluate>]
    }
  ]
}

Make questions practical, relevant to ${role}, and appropriate for ${difficulty} level.`;

      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Generate relevant, practical interview questions in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.data.choices[0].message.content);
      
      return {
        success: true,
        questions: result.questions || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('DeepSeek Question Generation Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        questions: []
      };
    }
  }

  /**
   * Generate comprehensive interview summary
   * @param {Object} interviewData - Complete interview data with questions and answers
   * @returns {Promise<Object>} Interview summary and recommendations
   */
  async generateInterviewSummary(interviewData) {
    try {
      const { candidateName, answers, totalQuestions, totalScore } = interviewData;

      const prompt = `Generate a comprehensive interview summary for ${candidateName}.

Interview Data:
- Total Questions: ${totalQuestions}
- Questions Answered: ${answers.length}
- Average Score: ${totalScore / answers.length}

Answers:
${answers.map((a, i) => `
Question ${i + 1} (${a.difficulty}): ${a.question}
Answer: ${a.answer}
Score: ${a.score}/100
`).join('\n')}

Provide a detailed summary in JSON format:
{
  "overallPerformance": "<Excellent/Good/Fair/Poor>",
  "overallScore": <number 0-100>,
  "summary": "<2-3 paragraph comprehensive summary>",
  "technicalStrengths": [<array of specific technical strengths>],
  "areasForImprovement": [<array of specific improvement areas>],
  "communicationSkills": "<assessment of communication>",
  "problemSolvingAbility": "<assessment of problem-solving>",
  "recommendation": "<Strongly Recommend/Recommend/Consider/Not Recommended>",
  "nextSteps": [<array of recommended next steps>],
  "detailedFeedback": {
    "easy": "<feedback on easy questions>",
    "medium": "<feedback on medium questions>",
    "hard": "<feedback on hard questions>"
  }
}`;

      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR interviewer providing comprehensive candidate assessments in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.data.choices[0].message.content);
      
      return {
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('DeepSeek Summary Generation Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        overallPerformance: 'Unable to generate',
        overallScore: 0,
        summary: 'Unable to generate summary at this time.',
        technicalStrengths: [],
        areasForImprovement: [],
        communicationSkills: 'Unable to assess',
        problemSolvingAbility: 'Unable to assess',
        recommendation: 'Unable to provide',
        nextSteps: [],
        detailedFeedback: {
          easy: 'N/A',
          medium: 'N/A',
          hard: 'N/A'
        }
      };
    }
  }
}

module.exports = new DeepSeekService();
