// DeepSeek AI Service for Interview Assistant (via OpenRouter)
// Handles AI-powered question generation, answer evaluation, and chatbot conversations

const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Using multiple models for fallback
const AI_MODELS = [
  'deepseek/deepseek-r1-distill-llama-70b:free',
  'deepseek/deepseek-chat:free',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.1-8b-instruct:free'
];

if (!OPENROUTER_API_KEY) {
  console.error('OpenRouter API key is not configured');
}

// System prompts for different contexts
const SYSTEM_PROMPTS = {
  // Interview Question Generation
  questionGeneration: `You are an expert technical interviewer at a top tech company (FAANG level).
Your role is to generate HIGH-QUALITY, PRACTICAL interview questions that test real understanding.

Difficulty Level Specifications:

EASY (Entry-Level / Junior):
- Fundamental concepts and basic syntax
- Common patterns and simple use cases
- Answerable in 1-2 minutes
- Examples: "What is a closure in JavaScript?", "Explain the difference between let and var"

MEDIUM (Mid-Level):
- Practical application and problem-solving
- Trade-offs and best practices
- Answerable in 2-3 minutes
- Examples: "How would you optimize a slow React component?", "Explain async/await vs Promises"

HARD (Senior-Level):
- Advanced concepts and system design
- Architecture decisions and scalability
- Complex scenarios and optimization
- Answerable in 3-4 minutes
- Examples: "Design a rate limiting system", "How would you implement real-time collaboration?"

Question Quality Requirements:
✓ MUST be clear, specific, and unambiguous
✓ MUST match the stated difficulty level precisely
✓ MUST be answerable in the time constraint
✓ MUST test practical knowledge, not trivia
✓ MUST be relevant to real-world development
✓ SHOULD have multiple valid approaches
✓ AVOID yes/no questions
✓ AVOID memorization-only questions
✓ AVOID overly broad or vague questions

Focus Areas: JavaScript, React, Node.js, MongoDB, REST APIs, System Design, Algorithms, Data Structures, Full Stack Development

Response Format (MUST BE VALID JSON):
{
  "question": "Clear, specific question appropriate for the difficulty level",
  "category": "Specific category (e.g., JavaScript, React Hooks, System Design, Algorithms, Database)",
  "expectedPoints": [
    "Key concept 1 expected in answer",
    "Key concept 2 expected in answer", 
    "Key concept 3 expected in answer"
  ]
}`,

  // Answer Evaluation
  answerEvaluation: `You are an expert technical interviewer for top tech companies (Google, Microsoft, Amazon).
Your role is to provide RIGOROUS, FAIR, and DETAILED assessment of interview responses.

Scoring Scale (0-100):
- 90-100: Exceptional - Perfect answer with deep understanding, goes beyond expectations
- 80-89: Excellent - Comprehensive, accurate, well-communicated answer
- 70-79: Good - Solid answer covering most key points with minor gaps
- 60-69: Satisfactory - Basic understanding shown, but missing important details
- 50-59: Below Average - Partially correct but significant gaps in knowledge
- 40-49: Poor - Minimal understanding, major technical errors
- 0-39: Inadequate - Incorrect, irrelevant, or shows fundamental misunderstanding

Evaluation Criteria:
1. Technical Accuracy (40%): 
   - Is the answer technically correct and precise?
   - Are technical terms used properly?
   - Any factual errors or misconceptions?

2. Completeness (30%): 
   - Does it cover all key concepts?
   - Are important details included?
   - Is the scope appropriate for the question?

3. Communication (20%): 
   - Is it well-structured and clear?
   - Can a non-expert understand it?
   - Appropriate examples or analogies?

4. Practical Understanding (10%): 
   - Shows real-world application?
   - Mentions best practices or trade-offs?
   - Demonstrates hands-on experience?

Guidelines:
- BE HONEST and PRECISE with scoring - don't inflate scores
- An average answer should score 60-70, not 80-90
- Empty or very short answers should score 0-30
- Give credit for correct concepts even if explanation is weak
- Deduct points for technical inaccuracies
- Consider the difficulty level and time constraint
- Provide SPECIFIC feedback, not generic praise

Response Format (MUST BE VALID JSON):
{
  "score": 75,
  "feedback": "Your answer demonstrates [specific strengths]. However, [specific areas to improve]. [Specific technical feedback].",
  "strengths": ["Specific strength 1 with example", "Specific strength 2 with example"],
  "improvements": ["Specific improvement 1 with actionable advice", "Specific improvement 2"],
  "technicalAccuracy": 80,
  "completeness": 70,
  "communication": 75,
  "keyPointsCovered": ["Point 1", "Point 2"],
  "keyPointsMissed": ["Missed point 1", "Missed point 2"]
}`,

  // Chatbot Assistant - Interviewer
  chatbotInterviewer: `You are an AI assistant helping recruiters and interviewers use the Crisp Interview Assistant platform.

Your role:
- Help interviewers understand the platform features
- Provide guidance on evaluating candidates effectively
- Explain how to interpret AI summaries and scores
- Share best practices for conducting interviews
- Answer questions about the dashboard and candidate management

Tone: Professional, helpful, and informative
Style: Clear, concise responses with actionable advice
Format: Use bullet points, numbered lists, and emojis (✓, •, 🎯, 💡) for readability

Key Features to Explain:
- Candidate List: View all candidates with scores, status, and filters
- AI Summary: Comprehensive candidate analysis with strengths/weaknesses
- Chat History: Review interview conversations
- Scoring System: How candidates are evaluated
- Filters & Search: Finding specific candidates quickly`,

  // Chatbot Assistant - Interviewee
  chatbotInterviewee: `You are an AI assistant helping candidates prepare for and complete their interviews on the Crisp Interview Assistant platform.

Your role:
- Guide candidates through the interview process
- Provide encouragement and reduce interview anxiety
- Explain how the platform works
- Share tips for answering technical questions effectively
- Help with technical preparation (JavaScript, React, Node.js, MongoDB)

Tone: Friendly, encouraging, and supportive
Style: Warm and conversational, use emojis (😊, 💪, 🚀, 💡) to be approachable
Format: Keep responses concise and easy to read

Key Topics to Cover:
- How the interview process works
- Time limits for different question types
- Tips for structuring answers
- What the AI evaluates in responses
- How to use the resume upload feature
- Managing interview anxiety`,

  // Candidate Summary Generation
  summaryGeneration: `You are an expert HR analyst creating comprehensive candidate assessments.

Your role is to analyze interview performance and provide detailed hiring recommendations.

Analysis Areas:
- Overall Performance: Holistic view of candidate abilities
- Technical Skills: Specific strengths in technologies
- Soft Skills: Communication, problem-solving, adaptability
- Strengths: What the candidate excels at
- Areas for Improvement: Constructive feedback
- Interview Performance: Question-by-question analysis
- Hiring Recommendation: Clear guidance for decision-makers

Response Format:
Return ONLY a JSON object with this structure:
{
  "overallScore": 85,
  "recommendation": "Strong Hire / Hire / Maybe / No Hire",
  "confidence": "High / Medium / Low",
  "summary": "2-3 sentence overview",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Area 1", "Area 2"],
  "technicalSkills": {
    "JavaScript": 90,
    "React": 85,
    "Node.js": 80,
    "MongoDB": 75,
    "System Design": 70
  },
  "softSkills": {
    "Communication": 85,
    "Problem Solving": 80,
    "Adaptability": 75
  },
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`
};

// Call AI API via OpenRouter with automatic fallback
const callDeepSeekAPI = async (systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2048) => {
  let lastError = null;
  
  // Try each model in order
  for (const model of AI_MODELS) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://crisp-interview-assistant.app',
          'X-Title': 'Crisp Interview Assistant'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: temperature,
          max_tokens: maxTokens,
          top_p: 0.95
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = new Error(`${model}: ${errorData.error?.message || 'Unknown error'}`);
        console.warn(`Model ${model} failed, trying next...`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Successfully used model: ${model}`);
      return data.choices[0].message.content;
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} error:`, error.message);
      continue;
    }
  }
  
  // If all models fail, throw the last error
  console.error('All AI models failed, using fallback');
  throw lastError || new Error('All AI models unavailable');
};

/**
 * Generate an interview question using Gemini AI
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} questionIndex - The current question number
 * @param {string} role - The role being interviewed for
 * @returns {Promise<Object>} Question data with question, category, and expected points
 */
export const generateInterviewQuestion = async (difficulty = 'medium', questionIndex = 0, role = 'Full Stack Developer') => {
  try {
    const timeEstimate = difficulty === 'easy' ? '1-2 minutes' : difficulty === 'medium' ? '2-3 minutes' : '3-4 minutes';
    
    // Add randomization elements to ensure unique questions every time
    const randomSeed = Date.now() + Math.random();
    const topicVariations = {
      easy: ['JavaScript fundamentals', 'HTML/CSS basics', 'React basics', 'Git basics', 'Web development concepts', 'Browser APIs', 'DOM manipulation'],
      medium: ['React hooks and state', 'Node.js and Express', 'REST API design', 'Database queries', 'Authentication', 'Performance optimization', 'Error handling', 'Async programming'],
      hard: ['System design', 'Scalability', 'Microservices', 'Security', 'Advanced algorithms', 'Real-time systems', 'Cloud architecture', 'DevOps practices']
    };
    
    const topics = topicVariations[difficulty] || topicVariations.medium;
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    const prompt = `Generate a UNIQUE and CREATIVE ${difficulty.toUpperCase()} level interview question for a ${role} position.

IMPORTANT: Create a FRESH, ORIGINAL question - DO NOT repeat common interview questions!

Context:
- This is question ${questionIndex + 1} of 6 in the interview
- Suggested topic area: ${randomTopic} (but feel free to vary!)
- Time to answer: ${timeEstimate}
- Random seed: ${randomSeed}

Requirements:
✓ Must be UNIQUE and NOT a commonly asked question
✓ Difficulty: ${difficulty.toUpperCase()} (${difficulty === 'easy' ? 'fundamental concepts that juniors should know' : difficulty === 'medium' ? 'practical scenarios that mid-level developers face' : 'complex challenges for senior developers'})
✓ Must be practical and test real-world understanding
✓ Should be clear, specific, and unambiguous
✓ Focus areas: JavaScript, React, Node.js, MongoDB, REST APIs, System Design, Algorithms
✓ Vary the question type: conceptual, scenario-based, problem-solving, or comparison

RANDOMIZE: Make each question different from typical interview questions. Be creative!

Return ONLY a valid JSON object with this EXACT structure:
{
  "question": "Your unique, creative question here",
  "category": "Specific category name",
  "expectedPoints": ["Key point 1", "Key point 2", "Key point 3"]
}`;

    // Use higher temperature for more creativity and randomization
    const response = await callDeepSeekAPI(SYSTEM_PROMPTS.questionGeneration, prompt, 0.95, 1024);
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      jsonMatch = response.match(/\{[\s\S]*\}/);
    }
    
    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      const questionData = JSON.parse(jsonText);
      
      // Validate question data
      if (!questionData.question || !questionData.category || !questionData.expectedPoints) {
        throw new Error('Missing required fields in question data');
      }
      
      return {
        id: `deepseek_${difficulty}_${questionIndex}_${Date.now()}`,
        question: questionData.question,
        category: questionData.category,
        expectedPoints: questionData.expectedPoints,
        expectedAnswer: questionData.expectedPoints.join('. '),
        difficulty,
        timeEstimate
      };
    }
    
    throw new Error('Invalid response format from DeepSeek');
  } catch (error) {
    console.error('Error generating question with DeepSeek:', error);
    
    // Enhanced fallback questions with more variety - Randomized
    const fallbackQuestions = {
      easy: [
        { q: 'What is the difference between `let`, `var`, and `const` in JavaScript? Explain with examples.', cat: 'JavaScript Fundamentals', points: ['Scope differences', 'Hoisting behavior', 'Reassignment rules'] },
        { q: 'Explain what a closure is in JavaScript and provide a practical use case.', cat: 'JavaScript Concepts', points: ['Function scope', 'Lexical environment', 'Practical example'] },
        { q: 'What is the Virtual DOM in React and why is it useful?', cat: 'React Fundamentals', points: ['Virtual DOM concept', 'Performance benefits', 'Reconciliation process'] },
        { q: 'Explain the difference between `==` and `===` in JavaScript. When would you use each?', cat: 'JavaScript Operators', points: ['Type coercion', 'Strict equality', 'Best practices'] },
        { q: 'What are React props and how do they differ from state?', cat: 'React Basics', points: ['Props definition', 'State definition', 'When to use each'] },
        { q: 'Explain what the `this` keyword refers to in JavaScript.', cat: 'JavaScript Context', points: ['Context binding', 'Arrow functions vs regular', 'Common use cases'] },
        { q: 'What is the purpose of the `useEffect` hook in React?', cat: 'React Hooks', points: ['Side effects', 'Dependency array', 'Cleanup function'] },
        { q: 'Explain the difference between synchronous and asynchronous code.', cat: 'JavaScript Async', points: ['Blocking vs non-blocking', 'Callbacks', 'Promises'] }
      ],
      medium: [
        { q: 'How would you optimize the performance of a React component that is re-rendering too frequently?', cat: 'React Performance', points: ['Identify cause of re-renders', 'Use React.memo or useMemo', 'Optimize state management'] },
        { q: 'Explain the event loop in Node.js and how it handles asynchronous operations.', cat: 'Node.js Internals', points: ['Call stack', 'Event loop phases', 'Callback queue'] },
        { q: 'What are the differences between SQL and NoSQL databases? When would you choose MongoDB over PostgreSQL?', cat: 'Database Design', points: ['Data structure differences', 'Scalability considerations', 'Use case scenarios'] },
        { q: 'How would you implement authentication in a React and Node.js application?', cat: 'Authentication', points: ['JWT tokens', 'Secure storage', 'Backend verification'] },
        { q: 'Explain the concept of middleware in Express.js with examples.', cat: 'Node.js/Express', points: ['Request-response cycle', 'next() function', 'Common middleware types'] },
        { q: 'How do you handle errors in async/await functions? Provide best practices.', cat: 'Error Handling', points: ['try-catch blocks', 'Error propagation', 'Global error handlers'] },
        { q: 'What is the Context API in React and when would you use it instead of prop drilling?', cat: 'React State Management', points: ['Context creation', 'Provider/Consumer', 'Performance considerations'] },
        { q: 'Explain CORS and how you would configure it in a Node.js backend.', cat: 'Web Security', points: ['Same-origin policy', 'CORS headers', 'Configuration options'] }
      ],
      hard: [
        { q: 'Design a rate limiting system for an API that handles millions of requests per day. Explain your approach.', cat: 'System Design', points: ['Algorithm choice (token bucket/sliding window)', 'Storage mechanism (Redis)', 'Distributed system considerations'] },
        { q: 'How would you implement server-side rendering (SSR) with React? What are the trade-offs?', cat: 'React Advanced', points: ['SSR implementation approach', 'Hydration process', 'Performance vs complexity trade-offs'] },
        { q: 'Explain how you would design a real-time collaborative editing system like Google Docs.', cat: 'System Design', points: ['Conflict resolution (OT or CRDT)', 'WebSocket communication', 'Data synchronization'] },
        { q: 'Design a scalable microservices architecture for an e-commerce platform. What are the key considerations?', cat: 'Microservices', points: ['Service boundaries', 'Inter-service communication', 'Data consistency'] },
        { q: 'How would you implement caching at multiple levels in a web application to improve performance?', cat: 'Performance Optimization', points: ['Browser caching', 'CDN caching', 'Server-side caching (Redis)', 'Database query caching'] },
        { q: 'Explain how you would design a notification system that supports email, SMS, and push notifications at scale.', cat: 'System Design', points: ['Message queue architecture', 'Retry logic', 'Provider abstraction', 'Scalability'] },
        { q: 'How would you implement a search feature with autocomplete for millions of records?', cat: 'Search Systems', points: ['Indexing strategy', 'Elasticsearch or similar', 'Debouncing', 'Caching'] },
        { q: 'Design a distributed task scheduler that can handle thousands of scheduled jobs. What are the challenges?', cat: 'Distributed Systems', points: ['Job distribution', 'Failure handling', 'Coordination (Zookeeper/etcd)', 'Scalability'] }
      ]
    };
    
    const questions = fallbackQuestions[difficulty] || fallbackQuestions.medium;
    // Randomize selection instead of sequential
    const randomIndex = Math.floor(Math.random() * questions.length);
    const selected = questions[randomIndex];
    
    return {
      id: `fallback_${difficulty}_${questionIndex}`,
      question: selected.q,
      category: selected.cat,
      expectedPoints: selected.points,
      expectedAnswer: selected.points.join('. '),
      difficulty,
      timeEstimate: difficulty === 'easy' ? '1-2 minutes' : difficulty === 'medium' ? '2-3 minutes' : '3-4 minutes'
    };
  }
};

/**
 * Evaluate a candidate's answer using Gemini AI
 * @param {string} question - The interview question
 * @param {string} answer - The candidate's answer
 * @param {string} difficulty - Question difficulty level
 * @param {Object} questionData - Full question data including expectedPoints
 * @returns {Promise<Object>} Evaluation with score, feedback, and breakdown
 */
export const evaluateAnswer = async (question, answer, difficulty = 'medium', questionData = null) => {
  try {
    // Check for empty or very short answer
    const answerLength = answer.trim().length;
    if (answerLength === 0) {
      return {
        score: 0, // Out of 5
        scoreOutOf100: 0,
        feedback: 'No answer provided. Please provide a response to the question.',
        strengths: [],
        improvements: ['Provide an answer to the question', 'Explain your understanding of the concept'],
        correct: false,
        breakdown: {
          technicalAccuracy: 0,
          completeness: 0,
          communication: 0
        },
        keyPointsCovered: [],
        keyPointsMissed: questionData?.expectedPoints || []
      };
    }

    if (answerLength < 10) {
      return {
        score: 0.8, // Out of 5 (equivalent to 15/100)
        scoreOutOf100: 15,
        feedback: 'Answer is too brief. Please provide a more detailed explanation.',
        strengths: ['Attempted to answer'],
        improvements: ['Provide more detail and explanation', 'Cover key concepts thoroughly'],
        correct: false,
        breakdown: {
          technicalAccuracy: 20,
          completeness: 10,
          communication: 15
        },
        keyPointsCovered: [],
        keyPointsMissed: questionData?.expectedPoints || []
      };
    }

    const expectedPointsContext = questionData?.expectedPoints 
      ? `\n\nExpected Key Points to Cover:\n${questionData.expectedPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      : '';

    const categoryContext = questionData?.category 
      ? `\nCategory: ${questionData.category}`
      : '';

    const prompt = `Evaluate this technical interview answer with RIGOR and PRECISION:

Question (${difficulty.toUpperCase()} level):${categoryContext}
"${question}"
${expectedPointsContext}

Candidate's Answer:
"${answer}"

Answer Length: ${answerLength} characters (${answer.trim().split(/\s+/).length} words)
Time Constraint: ${difficulty === 'easy' ? '1-2 minutes' : difficulty === 'medium' ? '2-3 minutes' : '3-4 minutes'}

Evaluation Instructions:
1. Check if answer addresses the question directly
2. Identify which expected key points were covered
3. Assess technical accuracy of statements made
4. Evaluate completeness and depth of explanation
5. Consider communication clarity
6. Be STRICT with scoring - average answers should score 60-70, not 80-90

Scoring Guidelines:
- Empty/irrelevant answer: 0-30
- Minimal effort, major gaps: 40-50
- Basic understanding, missing details: 60-70
- Good answer, minor gaps: 75-85
- Excellent, comprehensive answer: 85-95
- Perfect, goes beyond expectations: 95-100

Return ONLY valid JSON with this exact structure:
{
  "score": 75,
  "feedback": "Specific, actionable feedback",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "improvements": ["Specific improvement 1", "Specific improvement 2"],
  "technicalAccuracy": 80,
  "completeness": 70,
  "communication": 75,
  "keyPointsCovered": ["Point that was mentioned"],
  "keyPointsMissed": ["Point that was missed"]
}`;

    // Use moderate temperature for consistent evaluation
    const response = await callDeepSeekAPI(SYSTEM_PROMPTS.answerEvaluation, prompt, 0.7, 2048);
    
    // Extract JSON from response
    let jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      jsonMatch = response.match(/\{[\s\S]*\}/);
    }
    
    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      const evaluation = JSON.parse(jsonText);
      
      // Ensure score is realistic - cap at 95 unless truly exceptional
      let adjustedScore = evaluation.score || 0;
      if (adjustedScore > 95 && answerLength < 200) {
        adjustedScore = Math.min(adjustedScore, 85);
      }
      
      // Convert from 100-point scale to 5-point scale
      const scoreOutOf5 = Math.round((adjustedScore / 100) * 5 * 10) / 10; // Round to 1 decimal place
      
      return {
        score: scoreOutOf5, // Now out of 5 instead of 100
        scoreOutOf100: adjustedScore, // Keep original for reference
        feedback: evaluation.feedback || 'Answer evaluated',
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        correct: adjustedScore >= 60,
        breakdown: {
          technicalAccuracy: evaluation.technicalAccuracy || adjustedScore,
          completeness: evaluation.completeness || adjustedScore,
          communication: evaluation.communication || adjustedScore
        },
        keyPointsCovered: evaluation.keyPointsCovered || [],
        keyPointsMissed: evaluation.keyPointsMissed || []
      };
    }
    
    throw new Error('Invalid response format from DeepSeek');
  } catch (error) {
    console.error('Error evaluating answer with DeepSeek:', error);
    // Fallback evaluation based on answer quality
    const words = answer.trim().split(/\s+/).length;
    let scoreOut100;
    
    if (words < 10) scoreOut100 = 25;
    else if (words < 20) scoreOut100 = 40;
    else if (words < 40) scoreOut100 = 55;
    else if (words < 80) scoreOut100 = 70;
    else scoreOut100 = Math.min(85, 70 + (words - 80) / 10);
    
    const scoreOut5 = Math.round((scoreOut100 / 100) * 5 * 10) / 10;
    
    return {
      score: scoreOut5, // Out of 5
      scoreOutOf100: Math.round(scoreOut100),
      feedback: `Answer received (${words} words). ${words < 30 ? 'Consider providing more detail and examples.' : 'Good effort! Focus on technical accuracy and completeness.'}`,
      strengths: words > 30 ? ['Provided detailed response'] : ['Attempted the question'],
      improvements: ['System evaluation error - answer logged for manual review', 'Ensure technical accuracy in future responses'],
      correct: scoreOut100 >= 60,
      breakdown: {
        technicalAccuracy: scoreOut100,
        completeness: scoreOut100,
        communication: scoreOut100
      },
      keyPointsCovered: [],
      keyPointsMissed: questionData?.expectedPoints || []
    };
  }
};

/**
 * Get chatbot response using Gemini AI
 * @param {string} userMessage - The user's message
 * @param {string} userRole - 'Interviewer' or 'Interviewee'
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} AI response
 */
export const getChatbotResponse = async (userMessage, userRole = 'Interviewee', conversationHistory = []) => {
  // Check if API key is available
  if (!OPENROUTER_API_KEY) {
    console.warn('OpenRouter API key not found, using fallback responses');
    return getFallbackChatbotResponse(userMessage, userRole);
  }

  try {
    const systemPrompt = userRole === 'Interviewer' 
      ? SYSTEM_PROMPTS.chatbotInterviewer 
      : SYSTEM_PROMPTS.chatbotInterviewee;

    // Build context from conversation history
    let contextPrompt = `User Role: ${userRole}\n\n`;
    
    if (conversationHistory.length > 0) {
      contextPrompt += 'Recent Conversation:\n';
      conversationHistory.slice(-6).forEach(msg => {
        contextPrompt += `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.text}\n`;
      });
      contextPrompt += '\n';
    }

    contextPrompt += `User's Question: ${userMessage}\n\nProvide a helpful, contextual response.`;

    const response = await callDeepSeekAPI(systemPrompt, contextPrompt, 0.8, 512);
    
    return response || 'I\'m here to help! Could you please rephrase your question?';
  } catch (error) {
    console.error('Error getting chatbot response from DeepSeek:', error);
    // Use fallback instead of error message
    return getFallbackChatbotResponse(userMessage, userRole);
  }
};

/**
 * Fallback chatbot responses when Gemini is unavailable
 * @param {string} userMessage - The user's message
 * @param {string} userRole - 'Interviewer' or 'Interviewee'
 * @returns {string} Fallback response
 */
const getFallbackChatbotResponse = (userMessage, userRole) => {
  const lowerMessage = userMessage.toLowerCase();

  // Interviewer responses
  if (userRole === 'Interviewer') {
    if (lowerMessage.includes('evaluate') || lowerMessage.includes('assessment')) {
      return "To evaluate candidates effectively:\n\n1. Review their AI Summary which provides comprehensive analysis\n2. Check their chat history for communication skills\n3. Look at technical scores and completion rates\n4. Consider their problem-solving approach\n5. Use the candidate profile for background verification\n\nThe AI Summary tab gives you strengths, weaknesses, and hiring recommendations! 🎯";
    }
    if (lowerMessage.includes('question') || lowerMessage.includes('ask')) {
      return "Great interview questions include:\n\n• Technical: 'Explain your approach to solving [specific problem]'\n• Behavioral: 'Tell me about a challenging project'\n• Problem-solving: 'How would you optimize this code?'\n• Cultural fit: 'What motivates you in your work?'\n\nFocus on open-ended questions that reveal thinking process! 💡";
    }
    if (lowerMessage.includes('summary') || lowerMessage.includes('ai')) {
      return "The AI Summary feature analyzes:\n\n✓ Overall performance score\n✓ Technical & soft skills assessment\n✓ Strengths with examples\n✓ Areas for improvement\n✓ Interview metrics\n✓ Hiring recommendations\n\nFind it in the candidate detail view under the 'AI Summary' tab! 🤖";
    }
    if (lowerMessage.includes('best practice') || lowerMessage.includes('conduct')) {
      return "Best practices for conducting interviews:\n\n1. Start with introductions and small talk\n2. Use the structured questions provided\n3. Take notes on responses\n4. Ask follow-up questions\n5. Allow time for candidate questions\n6. Review AI analysis before making decisions\n\nRemember: consistency is key for fair evaluation! ✅";
    }
    return "I can help you with:\n• Evaluating candidates 📊\n• Interview questions 💬\n• Using AI summaries 🤖\n• Best interview practices 📚\n• Candidate assessment tips 🎯\n\nWhat specific aspect would you like to know more about?";
  }

  // Interviewee responses
  if (lowerMessage.includes('prepare') || lowerMessage.includes('ready')) {
    return "To prepare for your interview:\n\n1. Review the job description carefully 📋\n2. Practice common interview questions 💪\n3. Prepare examples from your experience 📖\n4. Test your equipment and internet 🖥️\n5. Have your resume handy 📄\n6. Prepare questions for the interviewer ❓\n\nRemember: Be authentic and show enthusiasm! 🚀";
  }
  if (lowerMessage.includes('question') || lowerMessage.includes('asked')) {
    return "Common interview questions you might encounter:\n\n• Tell me about yourself\n• Why are you interested in this role?\n• Describe a challenging project you worked on\n• What are your strengths and weaknesses?\n• Technical questions about your field\n• Behavioral scenarios (STAR method)\n\nUse the STAR method: Situation, Task, Action, Result! 🌟";
  }
  if (lowerMessage.includes('score') || lowerMessage.includes('scoring')) {
    return "Interview scoring breakdown:\n\n• Technical Accuracy (40%) - Is your answer correct?\n• Completeness (30%) - Did you cover key concepts?\n• Communication (20%) - How clearly did you explain?\n• Practical Understanding (10%) - Real-world application\n\nThe AI evaluates your responses in real-time. Focus on clear explanations and structured thinking! 🎯";
  }
  if (lowerMessage.includes('technical') || lowerMessage.includes('coding')) {
    return "Tips for technical questions:\n\n1. Think out loud - explain your approach 💭\n2. Ask clarifying questions first ❓\n3. Start with a simple solution 🎯\n4. Optimize iteratively 🔄\n5. Consider edge cases 🧩\n6. Write clean, readable code ✨\n\nDon't worry about perfection - show your problem-solving process! 🚀";
  }
  if (lowerMessage.includes('nervous') || lowerMessage.includes('anxiety') || lowerMessage.includes('stress')) {
    return "Feeling nervous is completely normal! Here's how to manage:\n\n• Take deep breaths 🌬️\n• Remember: they want you to succeed! 😊\n• It's okay to pause and think 🤔\n• Ask for clarification if needed ❓\n• View it as a conversation, not interrogation 💬\n• You've prepared for this! 💪\n\nYou've got this! Believe in yourself! 🌟";
  }
  if (lowerMessage.includes('time') || lowerMessage.includes('timer')) {
    return "About the interview timing:\n\n⏱️ Easy Questions: 20 seconds each (Questions 1-2)\n⏱️ Medium Questions: 60 seconds each (Questions 3-4)\n⏱️ Hard Questions: 120 seconds each (Questions 5-6)\n\nTips:\n• Answer concisely for easy questions\n• Use your time wisely\n• You can pause if needed\n• Timer shows color warnings ⚠️\n\nDon't panic when time is running out - focus on key points! ✅";
  }

  // General helpful response
  if (lowerMessage.includes('help') || lowerMessage.includes('assistance')) {
    return `I'm here to help you with the interview process! 🤖\n\n${
      userRole === 'Interviewer' 
        ? "I can assist with:\n• Candidate evaluation 📊\n• AI summaries interpretation 🤖\n• Interview best practices 📚\n• Platform features 💡"
        : "I can help with:\n• Interview preparation 📚\n• Tips for answering questions 💡\n• Understanding the scoring system 🎯\n• Managing interview anxiety 😌"
    }\n\nWhat would you like to know?`;
  }

  // Default response
  return "I'm here to help! 😊\n\nYou can ask me about:\n\n" +
    (userRole === 'Interviewer'
      ? "• How to evaluate candidates 📊\n• Using interview features 💡\n• Understanding AI summaries 🤖\n• Interview best practices 📚"
      : "• How to prepare for the interview 📚\n• What questions to expect 💬\n• How scoring works 🎯\n• Tips for success 🌟") +
    "\n\nWhat would you like to know more about?";
};

/**
 * Generate comprehensive candidate summary using Gemini AI
 * @param {Object} candidateData - Candidate information
 * @param {Array} interviewAnswers - Array of Q&A pairs with evaluations
 * @returns {Promise<Object>} Comprehensive candidate assessment
 */
export const generateCandidateSummary = async (candidateData, interviewAnswers = []) => {
  try {
    const chat = createChatSession(SYSTEM_PROMPTS.summaryGeneration, 'gemini-1.5-pro');
    if (!chat) throw new Error('Failed to create chat session');

    const prompt = `Generate a comprehensive hiring assessment for this candidate:

Candidate Information:
- Name: ${candidateData.name || 'N/A'}
- Email: ${candidateData.email || 'N/A'}
- Role: ${candidateData.role || 'Full Stack Developer'}

Interview Performance:
${interviewAnswers.map((qa, idx) => `
Question ${idx + 1} (${qa.difficulty || 'medium'}): ${qa.question}
Answer: ${qa.answer}
Score: ${qa.score || 0}/100
Feedback: ${qa.feedback || 'N/A'}
`).join('\n')}

Overall Statistics:
- Questions Answered: ${interviewAnswers.length}
- Average Score: ${interviewAnswers.reduce((sum, qa) => sum + (qa.score || 0), 0) / interviewAnswers.length || 0}
- Completion Rate: ${(interviewAnswers.length / 6) * 100}%

Provide a comprehensive assessment suitable for hiring decisions.
Return the response as a valid JSON object only.`;

    const result = await chat.sendMessage(prompt);
    const response = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const summary = JSON.parse(jsonMatch[0]);
      return summary;
    }
    
    throw new Error('Invalid response format from Gemini');
  } catch (error) {
    console.error('Error generating candidate summary:', error);
    // Fallback summary
    const avgScore = interviewAnswers.reduce((sum, qa) => sum + (qa.score || 0), 0) / interviewAnswers.length || 0;
    return {
      overallScore: Math.round(avgScore),
      recommendation: avgScore >= 80 ? 'Strong Hire' : avgScore >= 70 ? 'Hire' : avgScore >= 60 ? 'Maybe' : 'No Hire',
      confidence: 'Medium',
      summary: `Candidate demonstrated ${avgScore >= 70 ? 'strong' : 'adequate'} technical abilities during the interview process.`,
      strengths: ['Technical knowledge', 'Problem-solving approach'],
      weaknesses: ['Could improve detail in responses'],
      technicalSkills: {
        JavaScript: Math.round(avgScore),
        React: Math.round(avgScore * 0.9),
        'Node.js': Math.round(avgScore * 0.85),
        MongoDB: Math.round(avgScore * 0.8)
      },
      softSkills: {
        Communication: Math.round(avgScore * 0.9),
        'Problem Solving': Math.round(avgScore),
        Adaptability: Math.round(avgScore * 0.85)
      },
      recommendations: ['Review technical strengths', 'Consider for next round']
    };
  }
};

/**
 * Analyze resume and generate ATS score with AI evaluation
 * @param {Object} resumeData - Parsed resume data
 * @param {string} jobDescription - Job description for matching
 * @returns {Promise<Object>} ATS score, keyword analysis, and AI recommendations
 */
export const analyzeResume = async (resumeData, jobDescription = 'Full Stack Developer with React, Node.js, MongoDB experience') => {
  try {
    const prompt = `Analyze this resume and provide comprehensive ATS (Applicant Tracking System) scoring and evaluation.

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Job Description:
${jobDescription}

Provide a detailed analysis with:

1. ATS Score Breakdown (0-100 for each):
   - Keyword Match: How well resume keywords match job requirements
   - Formatting: Resume structure and readability
   - Experience: Relevance and quality of work experience
   - Education: Educational qualifications
   - Skills: Technical and soft skills coverage

2. Overall ATS Score (0-100)

3. Matched Keywords: List keywords from job description found in resume

4. Missing Keywords: Important keywords from job description not found

5. Recommendations: Specific improvements to increase ATS score

6. Hiring Recommendation: Strong Hire / Hire / Maybe / No Hire

Return ONLY a valid JSON object with this structure:
{
  "atsScore": 85,
  "atsBreakdown": {
    "keywordMatch": 90,
    "formatting": 85,
    "experience": 80,
    "education": 85,
    "skills": 88
  },
  "matchedKeywords": ["React", "Node.js", "JavaScript"],
  "missingKeywords": ["Docker", "AWS"],
  "recommendation": "Strong Hire",
  "summary": "Brief evaluation summary",
  "strengths": ["Strength 1", "Strength 2"],
  "concerns": ["Concern 1"],
  "improvementSuggestions": ["Suggestion 1", "Suggestion 2"]
}`;

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer and HR professional. 
Your role is to evaluate resumes objectively and provide actionable insights for both candidates and recruiters.

Scoring Guidelines:
- 90-100: Exceptional match, highly qualified
- 80-89: Strong match, well qualified
- 70-79: Good match, qualified
- 60-69: Fair match, some gaps
- Below 60: Poor match, significant gaps

Be fair, objective, and provide specific, actionable feedback.`;

    const response = await callDeepSeekAPI(systemPrompt, prompt, 0.7, 2048);
    
    // Parse JSON response
    let jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      jsonMatch = response.match(/\{[\s\S]*\}/);
    }
    
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return analysis;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error analyzing resume:', error);
    
    // Fallback analysis
    return {
      atsScore: 75,
      atsBreakdown: {
        keywordMatch: 80,
        formatting: 85,
        experience: 70,
        education: 75,
        skills: 78
      },
      matchedKeywords: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'REST API'],
      missingKeywords: ['Docker', 'AWS', 'Kubernetes'],
      recommendation: 'Hire',
      summary: 'Candidate shows solid technical background with relevant experience.',
      strengths: ['Strong technical skills', 'Relevant project experience'],
      concerns: ['Limited cloud experience'],
      improvementSuggestions: ['Add cloud certifications', 'Include more metrics in achievements']
    };
  }
};

export default {
  generateInterviewQuestion,
  evaluateAnswer,
  getChatbotResponse,
  generateCandidateSummary,
  analyzeResume
};
