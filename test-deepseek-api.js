// Test DeepSeek API Integration
const DEEPSEEK_API_KEY = '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';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function testDeepSeekAPI() {
  console.log('\n🤖 Testing DeepSeek R1 API Integration\n');
  console.log('='.repeat(70));
  
  // Test 1: Simple question generation
  console.log('\n📝 Test 1: Generating Interview Question (EASY)\n');
  console.log('⏳ Calling DeepSeek API...\n');
  
  try {
    const questionResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Generate creative, unique interview questions.'
          },
          {
            role: 'user',
            content: `Generate an EASY level JavaScript interview question. Return ONLY valid JSON:
{
  "question": "Your question here",
  "category": "Category name",
  "expectedPoints": ["Point 1", "Point 2", "Point 3"]
}`
          }
        ],
        temperature: 0.9,
        max_tokens: 512
      })
    });

    if (!questionResponse.ok) {
      const errorData = await questionResponse.json();
      console.error('❌ Error:', errorData);
      return;
    }

    const questionData = await questionResponse.json();
    const questionText = questionData.choices[0].message.content;
    
    console.log('✅ DeepSeek Response:\n');
    console.log(questionText);
    console.log('\n' + '-'.repeat(70));
    
    // Test 2: Answer evaluation
    console.log('\n\n📊 Test 2: Evaluating Answer\n');
    console.log('⏳ Calling DeepSeek API...\n');
    
    const evalResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer evaluating candidate answers. Be rigorous and fair.'
          },
          {
            role: 'user',
            content: `Evaluate this answer:

Question: What is a closure in JavaScript?
Answer: A closure is when a function remembers variables from its outer scope even after the outer function has returned.

Return ONLY valid JSON:
{
  "score": 75,
  "feedback": "Your feedback here",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1"],
  "technicalAccuracy": 80,
  "completeness": 70,
  "communication": 75
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!evalResponse.ok) {
      const errorData = await evalResponse.json();
      console.error('❌ Error:', errorData);
      return;
    }

    const evalData = await evalResponse.json();
    const evalText = evalData.choices[0].message.content;
    
    console.log('✅ DeepSeek Evaluation:\n');
    console.log(evalText);
    console.log('\n' + '-'.repeat(70));
    
    // Test 3: Chatbot response
    console.log('\n\n💬 Test 3: Chatbot Response\n');
    console.log('⏳ Calling DeepSeek API...\n');
    
    const chatResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly AI assistant helping candidates prepare for interviews. Be encouraging and supportive.'
          },
          {
            role: 'user',
            content: 'How can I prepare for a JavaScript interview?'
          }
        ],
        temperature: 0.8,
        max_tokens: 512
      })
    });

    if (!chatResponse.ok) {
      const errorData = await chatResponse.json();
      console.error('❌ Error:', errorData);
      return;
    }

    const chatData = await chatResponse.json();
    const chatText = chatData.choices[0].message.content;
    
    console.log('✅ DeepSeek Chatbot:\n');
    console.log(chatText);
    console.log('\n' + '='.repeat(70));
    
    console.log('\n\n✅ All DeepSeek API tests completed successfully!');
    console.log('🎯 DeepSeek R1 integration is working!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

testDeepSeekAPI();
