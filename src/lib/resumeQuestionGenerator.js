import { parseResumeFile } from './resumeParser.js';

/**
 * Utility functions to parse resume content and generate personalized easy questions
 * based on the candidate's skills, experience, and background
 */

/**
 * Extract skills from resume text
 * @param {string} text - Resume text content
 * @returns {Array} Array of technical skills found in resume
 */
export const extractSkillsFromResume = (text) => {
  const lowerText = text.toLowerCase();
  
  // Common technical skills patterns
  const skillKeywords = [
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    // Frontend Technologies
    'react', 'vue', 'angular', 'html', 'css', 'scss', 'sass', 'bootstrap', 'tailwind', 'jquery',
    // Backend Technologies
    'node.js', 'nodejs', 'express', 'django', 'flask', 'spring', 'asp.net', 'laravel', 'rails',
    // Databases
    'mysql', 'postgresql', 'mongodb', 'sqlite', 'redis', 'cassandra', 'dynamodb', 'elasticsearch',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab', 'ci/cd',
    // Testing
    'jest', 'mocha', 'cypress', 'selenium', 'junit', 'pytest', 'testing',
    // Other
    'api', 'rest', 'graphql', 'microservices', 'agile', 'scrum', 'linux', 'unix'
  ];
  
  const foundSkills = [];
  
  for (const skill of skillKeywords) {
    if (lowerText.includes(skill)) {
      foundSkills.push(skill);
    }
  }
  
  return [...new Set(foundSkills)]; // Remove duplicates
};

/**
 * Extract experience level and years from resume text
 * @param {string} text - Resume text content
 * @returns {Object} Object containing experience level and years
 */
export const extractExperienceFromResume = (text) => {
  const lowerText = text.toLowerCase();
  
  // Look for experience patterns
  const experiencePatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi,
    /experience.*?(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*years?\s*in/gi,
    /\((\d{4})-(\d{4})\)\s*-\s*(\d+)\s*years?/gi, // (2020-2024) - 4 years pattern
    /(\d+)\s*years?\s*at/gi, // X years at Company
    /(\d+)\s*years?\s*of\s*experience/gi
  ];
  
  let totalYears = 0;
  let level = 'Entry';
  
  for (const pattern of experiencePatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      // Handle different capture groups
      let years = 0;
      if (match[3]) { // Pattern with explicit years mentioned
        years = parseInt(match[3]);
      } else if (match[1]) {
        years = parseInt(match[1]);
      }
      
      if (years > totalYears) {
        totalYears = years;
      }
    }
  }
  
  // Also try to calculate from date ranges
  const dateRangePattern = /(\d{4})-(\d{4})/g;
  const dateMatches = [...text.matchAll(dateRangePattern)];
  for (const match of dateMatches) {
    const startYear = parseInt(match[1]);
    const endYear = parseInt(match[2]);
    const yearsInRole = endYear - startYear;
    if (yearsInRole > 0 && yearsInRole <= 20 && yearsInRole > totalYears) { // Reasonable range
      totalYears = yearsInRole;
    }
  }
  
  // Determine experience level
  if (totalYears >= 8) {
    level = 'Senior';
  } else if (totalYears >= 3) {
    level = 'Mid-Level';
  } else if (totalYears >= 1) {
    level = 'Junior';
  }
  
  return {
    totalYears: totalYears || 'Not specified',
    level
  };
};

/**
 * Generate easy questions based on parsed resume content
 * @param {Object} resumeData - Parsed resume data
 * @returns {Array} Array of personalized easy questions
 */
export const generateResumeBasedEasyQuestions = (resumeData) => {
  const questions = [];
  
  if (!resumeData || !resumeData.rawText) {
    return [];
  }
  
  const skills = extractSkillsFromResume(resumeData.rawText);
  const experience = extractExperienceFromResume(resumeData.rawText);
  
  // JavaScript questions if JavaScript skills found
  if (skills.includes('javascript') || skills.includes('typescript')) {
    questions.push({
      id: 'resume_js_1',
      question: "I see you have JavaScript experience on your resume. Can you explain the difference between == and === operators in JavaScript?",
      difficulty: "easy",
      category: "JavaScript",
      options: [
        { id: 'A', text: '== checks value only, === checks value and type' },
        { id: 'B', text: '== checks type only, === checks value only' },
        { id: 'C', text: 'They are exactly the same' },
        { id: 'D', text: '=== is faster but does the same thing as ==' }
      ],
      expectedAnswer: "== performs type coercion and checks value only, while === checks both value and type without coercion.",
      timeLimit: 120
    });
    
    questions.push({
      id: 'resume_js_2',
      question: "Based on your JavaScript background, what is the difference between var, let, and const?",
      difficulty: "easy",
      category: "JavaScript",
      options: [
        { id: 'A', text: 'let and const are block-scoped, var is function-scoped' },
        { id: 'B', text: 'var and let are block-scoped, const is function-scoped' },
        { id: 'C', text: 'All three are block-scoped' },
        { id: 'D', text: 'All three are function-scoped' }
      ],
      expectedAnswer: "let and const are block-scoped, var is function-scoped. const cannot be reassigned.",
      timeLimit: 120
    });
  }
  
  // React questions if React skills found
  if (skills.includes('react')) {
    questions.push({
      id: 'resume_react_1',
      question: "I notice you have React experience. What is JSX in React?",
      difficulty: "easy",
      category: "React",
      options: [
        { id: 'A', text: 'A syntax extension that allows writing HTML-like code in JavaScript' },
        { id: 'B', text: 'A new programming language' },
        { id: 'C', text: 'A database query language' },
        { id: 'D', text: 'A CSS framework' }
      ],
      expectedAnswer: "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in JavaScript files.",
      timeLimit: 120
    });
    
    questions.push({
      id: 'resume_react_2',
      question: "Given your React background, what are React components?",
      difficulty: "easy",
      category: "React",
      options: [
        { id: 'A', text: 'Reusable pieces of UI that can accept props and return JSX' },
        { id: 'B', text: 'CSS classes for styling' },
        { id: 'C', text: 'Database connections' },
        { id: 'D', text: 'Server-side scripts' }
      ],
      expectedAnswer: "React components are reusable pieces of UI that can accept props and return JSX elements.",
      timeLimit: 120
    });
  }
  
  // HTML/CSS questions for web development backgrounds
  if (skills.includes('html') || skills.includes('css')) {
    questions.push({
      id: 'resume_html_1',
      question: "I see you have HTML experience. What does HTML stand for?",
      difficulty: "easy",
      category: "HTML/CSS",
      options: [
        { id: 'A', text: 'HyperText Markup Language' },
        { id: 'B', text: 'High Tech Modern Language' },
        { id: 'C', text: 'Home Tool Markup Language' },
        { id: 'D', text: 'Hyperlink and Text Markup Language' }
      ],
      expectedAnswer: "HTML stands for HyperText Markup Language, used for creating web pages.",
      timeLimit: 90
    });
    
    questions.push({
      id: 'resume_css_1',
      question: "Based on your CSS knowledge, what does CSS stand for?",
      difficulty: "easy",
      category: "HTML/CSS",
      options: [
        { id: 'A', text: 'Cascading Style Sheets' },
        { id: 'B', text: 'Computer Style Sheets' },
        { id: 'C', text: 'Creative Style Sheets' },
        { id: 'D', text: 'Colorful Style Sheets' }
      ],
      expectedAnswer: "CSS stands for Cascading Style Sheets, used for styling web pages.",
      timeLimit: 90
    });
  }
  
  // Python questions if Python skills found
  if (skills.includes('python')) {
    questions.push({
      id: 'resume_python_1',
      question: "I notice you have Python experience. What is the difference between a list and a tuple in Python?",
      difficulty: "easy",
      category: "Python",
      options: [
        { id: 'A', text: 'Lists are mutable, tuples are immutable' },
        { id: 'B', text: 'Lists are immutable, tuples are mutable' },
        { id: 'C', text: 'They are exactly the same' },
        { id: 'D', text: 'Lists store numbers, tuples store strings' }
      ],
      expectedAnswer: "Lists are mutable (can be changed after creation) while tuples are immutable (cannot be changed).",
      timeLimit: 120
    });
  }
  
  // Database questions if database skills found
  if (skills.some(skill => ['mysql', 'postgresql', 'mongodb', 'sqlite'].includes(skill))) {
    questions.push({
      id: 'resume_db_1',
      question: "I see you have database experience. What does SQL stand for?",
      difficulty: "easy",
      category: "Database",
      options: [
        { id: 'A', text: 'Structured Query Language' },
        { id: 'B', text: 'Simple Query Language' },
        { id: 'C', text: 'Standard Query Language' },
        { id: 'D', text: 'System Query Language' }
      ],
      expectedAnswer: "SQL stands for Structured Query Language, used for managing relational databases.",
      timeLimit: 90
    });
  }
  
  // Experience-based questions
  if (experience.level === 'Senior' || experience.totalYears >= 5) {
    questions.push({
      id: 'resume_exp_1',
      question: `With your ${experience.totalYears} years of experience, what is the most important principle in software development?`,
      difficulty: "easy",
      category: "General Programming",
      options: [
        { id: 'A', text: 'Writing clean, maintainable code' },
        { id: 'B', text: 'Using the latest technologies' },
        { id: 'C', text: 'Working as fast as possible' },
        { id: 'D', text: 'Never asking for help' }
      ],
      expectedAnswer: "Writing clean, maintainable code is crucial for long-term project success and team collaboration.",
      timeLimit: 120
    });
  }
  
  // General programming questions based on any technical background
  if (skills.length > 0) {
    questions.push({
      id: 'resume_general_1',
      question: "Given your technical background, what is version control and why is it important?",
      difficulty: "easy",
      category: "General Programming",
      options: [
        { id: 'A', text: 'A system to track changes in code and collaborate with others' },
        { id: 'B', text: 'A way to control software versions for sale' },
        { id: 'C', text: 'A method to encrypt code' },
        { id: 'D', text: 'A technique to make code run faster' }
      ],
      expectedAnswer: "Version control is a system that tracks changes in code over time and enables collaboration between developers.",
      timeLimit: 120
    });
  }
  
  return questions;
};

/**
 * Parse resume file and generate easy questions based on content
 * @param {File} file - Resume file to parse
 * @returns {Promise<Object>} Object containing parsed data and generated questions
 */
export const parseResumeAndGenerateQuestions = async (file) => {
  try {
    console.log('Parsing resume file:', file.name);
    
    // Parse the resume file
    const parseResult = await parseResumeFile(file);
    
    if (!parseResult.success) {
      throw new Error(parseResult.error);
    }
    
    console.log('Resume parsed successfully:', parseResult.data);
    
    // Generate questions based on parsed content
    const questions = generateResumeBasedEasyQuestions(parseResult.data);
    
    console.log(`Generated ${questions.length} resume-based questions`);
    
    return {
      success: true,
      resumeData: parseResult.data,
      questions: questions,
      skillsFound: extractSkillsFromResume(parseResult.data.rawText || ''),
      experience: extractExperienceFromResume(parseResult.data.rawText || '')
    };
    
  } catch (error) {
    console.error('Error parsing resume and generating questions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get resume-specific easy questions for a candidate
 * @param {Object} candidateData - Candidate data with resume information
 * @returns {Array} Array of easy questions based on candidate's resume
 */
export const getResumeBasedEasyQuestions = (candidateData) => {
  if (!candidateData || !candidateData.resumeData) {
    return [];
  }
  
  return generateResumeBasedEasyQuestions(candidateData.resumeData);
};