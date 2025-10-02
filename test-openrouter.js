// Test OpenRouter + DeepSeek R1 Integration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODELS = [
  'deepseek/deepseek-r1-distill-llama-70b:free',
  'deepseek/deepseek-chat:free',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.1-8b-instruct:free'
];

async function testWithModel(model) {
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
            role: 'user',
            content: 'Say hello and tell me your name in 10 words or less.'
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error?.message || 'Unknown error' };
    }

    const data = await response.json();
    return { success: true, content: data.choices[0].message.content };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testOpenRouter() {
  console.log('\n🚀 Testing OpenRouter AI Models\n');
  console.log('='.repeat(70));
  
  console.log('\n🔍 Finding available model...\n');
  
  let workingModel = null;
  
  for (const model of AI_MODELS) {
    console.log(`📡 Testing: ${model}`);
    const result = await testWithModel(model);
    
    if (result.success) {
      console.log(`✅ SUCCESS! Response: ${result.content}`);
      workingModel = model;
      break;
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!workingModel) {
    console.log('\n❌ No available models found. All are rate-limited.');
    return;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ Using model: ${workingModel}\n`);
  console.log('='.repeat(70));
  
  // Test 1: Question Generation
  console.log('\n📝 Test 1: Question Generation\n');
  console.log('⏳ Calling OpenRouter API...\n');
  
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
        model: workingModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Generate creative interview questions.'
          },
          {
            role: 'user',
            content: 'Generate an EASY JavaScript interview question. Return ONLY valid JSON: {"question": "...", "category": "...", "expectedPoints": ["...", "...", "..."]}'
          }
        ],
        temperature: 0.9,
        max_tokens: 512
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error:', errorData);
      return;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('✅ DeepSeek R1 Response:\n');
    console.log(content);
    console.log('\n' + '-'.repeat(70));
    
    // Test 2: Answer Evaluation
    console.log('\n\n📊 Test 2: Answer Evaluation\n');
    console.log('⏳ Calling OpenRouter API...\n');
    
    const evalResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://crisp-interview-assistant.app',
        'X-Title': 'Crisp Interview Assistant'
      },
      body: JSON.stringify({
        model: workingModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer evaluating answers. Be rigorous and fair.'
          },
          {
            role: 'user',
            content: `Evaluate this answer and return ONLY valid JSON:

Question: What is a closure in JavaScript?
Answer: A closure is a function that has access to variables from its outer scope.

Return: {"score": 70, "feedback": "...", "strengths": ["..."], "improvements": ["..."], "technicalAccuracy": 75, "completeness": 65, "communication": 70}`
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
    const evalContent = evalData.choices[0].message.content;
    
    console.log('✅ DeepSeek R1 Evaluation:\n');
    console.log(evalContent);
    console.log('\n' + '-'.repeat(70));
    
    // Test 3: Chatbot
    console.log('\n\n💬 Test 3: Chatbot Response\n');
    console.log('⏳ Calling OpenRouter API...\n');
    
    const chatResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://crisp-interview-assistant.app',
        'X-Title': 'Crisp Interview Assistant'
      },
      body: JSON.stringify({
        model: workingModel,
        messages: [
          {
            role: 'system',
            content: 'You are a friendly AI assistant helping candidates with interview preparation.'
          },
          {
            role: 'user',
            content: 'Give me 3 quick tips for a technical interview.'
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      })
    });

    if (!chatResponse.ok) {
      const errorData = await chatResponse.json();
      console.error('❌ Error:', errorData);
      return;
    }

    const chatData = await chatResponse.json();
    const chatContent = chatData.choices?.[0]?.message?.content || 'No response';
    
    console.log('✅ AI Chatbot Response:\n');
    console.log(chatContent);
    console.log('\n' + '='.repeat(70));
    
    console.log('\n\n✅ All tests completed successfully!');
    console.log(`🎯 OpenRouter + AI (${workingModel}) integration is working!`);
    console.log('\n💡 Your interview system now uses AI for:');
    console.log('   • Randomized question generation');
    console.log('   • Intelligent answer evaluation with detailed feedback');
    console.log('   • Chatbot assistance for candidates\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

testOpenRouter();
