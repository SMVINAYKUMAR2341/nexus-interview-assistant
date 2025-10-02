// Test Gemini AI Evaluation System
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyCws7KhsxoObBmTdaRLJXy_YRAmGaCleNQ';
const genAI = new GoogleGenerativeAI(API_KEY);

const EVALUATION_PROMPT = `You are an expert technical interviewer for top tech companies (Google, Microsoft, Amazon).
Your role is to provide RIGOROUS, FAIR, and DETAILED assessment of interview responses.

Scoring Scale (0-100):
- 90-100: Exceptional - Perfect answer with deep understanding
- 80-89: Excellent - Comprehensive, accurate answer
- 70-79: Good - Solid answer covering most key points
- 60-69: Satisfactory - Basic understanding with gaps
- 50-59: Below Average - Partially correct with significant gaps
- 40-49: Poor - Minimal understanding
- 0-39: Inadequate - Incorrect or irrelevant

Return ONLY valid JSON with this structure:
{
  "score": 75,
  "feedback": "Detailed feedback",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "technicalAccuracy": 80,
  "completeness": 70,
  "communication": 75
}`;

async function testEvaluation() {
  console.log('\n🤖 Testing Gemini AI Evaluation System\n');
  console.log('━'.repeat(60));
  
  const testCases = [
    {
      question: "What is a closure in JavaScript?",
      answer: "A closure is when a function remembers variables from its outer scope even after the outer function has returned.",
      difficulty: "easy"
    },
    {
      question: "Explain the Virtual DOM in React and why it's useful.",
      answer: "The Virtual DOM is a lightweight copy of the real DOM. React uses it to compare changes and update only what's necessary, which makes it faster than updating the entire DOM.",
      difficulty: "easy"
    },
    {
      question: "How would you optimize a slow React component?",
      answer: "I would use React.memo to prevent unnecessary re-renders, use useMemo for expensive calculations, and make sure I'm not creating new objects or functions in render.",
      difficulty: "medium"
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`\n📝 Test Case ${i + 1}: ${test.difficulty.toUpperCase()}\n`);
    console.log(`Question: ${test.question}`);
    console.log(`Answer: ${test.answer}\n`);
    console.log('⏳ Evaluating with Gemini AI...\n');

    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      });

      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: 'System Context: ' + EVALUATION_PROMPT }]
          },
          {
            role: 'model',
            parts: [{ text: 'I understand my role and will respond accordingly.' }]
          }
        ]
      });

      const prompt = `Evaluate this interview answer:

Question (${test.difficulty.toUpperCase()}): ${test.question}

Candidate's Answer: ${test.answer}

Provide a fair evaluation considering:
- The difficulty level (${test.difficulty})
- Technical accuracy vs communication quality
- Partial credit for incomplete but correct answers

Return the response as a valid JSON object only.`;

      const result = await chat.sendMessage(prompt);
      const response = result.response.text();
      
      // Extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        
        console.log('✅ Evaluation Complete!\n');
        console.log(`📊 Score: ${evaluation.score}/100`);
        console.log(`\n💬 Feedback: ${evaluation.feedback}`);
        console.log(`\n📈 Breakdown:`);
        console.log(`   • Technical Accuracy: ${evaluation.technicalAccuracy}%`);
        console.log(`   • Completeness: ${evaluation.completeness}%`);
        console.log(`   • Communication: ${evaluation.communication}%`);
        
        if (evaluation.strengths?.length > 0) {
          console.log(`\n💪 Strengths:`);
          evaluation.strengths.forEach(s => console.log(`   • ${s}`));
        }
        
        if (evaluation.improvements?.length > 0) {
          console.log(`\n📈 Improvements:`);
          evaluation.improvements.forEach(i => console.log(`   • ${i}`));
        }
      }
      
      console.log('\n' + '━'.repeat(60));
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    // Wait a bit between requests
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n✅ All tests completed!\n');
}

testEvaluation().catch(console.error);
