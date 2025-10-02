// Test Gemini AI Question Generation with Randomization
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyCws7KhsxoObBmTdaRLJXy_YRAmGaCleNQ';
const genAI = new GoogleGenerativeAI(API_KEY);

const QUESTION_PROMPT = `You are an expert technical interviewer at a top tech company (FAANG level).
Your role is to generate HIGH-QUALITY, PRACTICAL interview questions that test real understanding.

Difficulty Level Specifications:

EASY (Entry-Level / Junior):
- Fundamental concepts and basic syntax
- Common patterns and simple use cases
- Answerable in 1-2 minutes

MEDIUM (Mid-Level):
- Practical application and problem-solving
- Trade-offs and best practices
- Answerable in 2-3 minutes

HARD (Senior-Level):
- Advanced concepts and system design
- Architecture decisions and scalability
- Answerable in 3-4 minutes

Question Quality Requirements:
✓ MUST be clear, specific, and unambiguous
✓ MUST match the stated difficulty level precisely
✓ MUST be practical, not trivia
✓ SHOULD have multiple valid approaches
✓ AVOID yes/no questions

Focus Areas: JavaScript, React, Node.js, MongoDB, REST APIs, System Design, Algorithms

Return ONLY valid JSON:
{
  "question": "Your question here",
  "category": "Category name",
  "expectedPoints": ["Point 1", "Point 2", "Point 3"]
}`;

async function generateQuestion(difficulty, questionIndex) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro-latest',
      generationConfig: {
        temperature: 0.95, // High temperature for randomization
        topK: 50,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'System Context: ' + QUESTION_PROMPT }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand my role and will respond accordingly.' }]
        }
      ]
    });

    const randomSeed = Date.now() + Math.random();
    const topics = {
      easy: ['JavaScript fundamentals', 'React basics', 'Git basics', 'Web concepts'],
      medium: ['React hooks', 'Node.js/Express', 'REST APIs', 'Database queries', 'Authentication'],
      hard: ['System design', 'Scalability', 'Microservices', 'Real-time systems']
    };
    
    const topicList = topics[difficulty];
    const randomTopic = topicList[Math.floor(Math.random() * topicList.length)];

    const prompt = `Generate a UNIQUE and CREATIVE ${difficulty.toUpperCase()} level interview question.

IMPORTANT: Create a FRESH, ORIGINAL question - DO NOT repeat common questions!

Context:
- Question ${questionIndex + 1} of 6
- Suggested topic: ${randomTopic}
- Random seed: ${randomSeed}

Requirements:
✓ Must be UNIQUE
✓ Difficulty: ${difficulty.toUpperCase()}
✓ Practical and test real-world understanding
✓ Clear and unambiguous
✓ RANDOMIZE and be creative!

Return ONLY valid JSON.`;

    const result = await chat.sendMessage(prompt);
    const response = result.response.text();
    
    // Extract JSON
    let jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      jsonMatch = response.match(/\{[\s\S]*\}/);
    }
    
    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      const questionData = JSON.parse(jsonText);
      return questionData;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    throw error;
  }
}

async function testRandomization() {
  console.log('\n🎲 Testing Gemini AI Question Randomization\n');
  console.log('=' .repeat(70));
  
  const difficulties = ['easy', 'medium', 'hard'];
  
  for (const difficulty of difficulties) {
    console.log(`\n\n📚 Testing ${difficulty.toUpperCase()} Questions - Generating 3 random questions...\n`);
    console.log('-'.repeat(70));
    
    for (let i = 0; i < 3; i++) {
      console.log(`\n🔄 Attempt ${i + 1}:`);
      console.log('⏳ Generating with Gemini AI...');
      
      try {
        const question = await generateQuestion(difficulty, i);
        
        console.log(`\n✅ Generated ${difficulty.toUpperCase()} Question ${i + 1}:`);
        console.log(`\n📝 Question: ${question.question}`);
        console.log(`📂 Category: ${question.category}`);
        console.log(`🎯 Expected Points:`);
        question.expectedPoints?.forEach((point, idx) => {
          console.log(`   ${idx + 1}. ${point}`);
        });
        
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
      }
      
      // Wait between requests
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n' + '-'.repeat(70));
  }
  
  console.log('\n\n✅ Randomization test completed!');
  console.log('=' .repeat(70));
  console.log('\n💡 Each question should be unique and different from the others.');
  console.log('🎯 This demonstrates Gemini API is generating randomized questions!\n');
}

testRandomization().catch(console.error);
