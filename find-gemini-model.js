// Find working Gemini model
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyCws7KhsxoObBmTdaRLJXy_YRAmGaCleNQ';
const genAI = new GoogleGenerativeAI(API_KEY);

const modelsToTry = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-latest'
];

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say hello');
    const response = result.response.text();
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message.split('\n')[0] };
  }
}

async function findWorkingModel() {
  console.log('\n🔍 Testing Gemini Models with your API key...\n');
  console.log('='.repeat(70));
  
  for (const modelName of modelsToTry) {
    console.log(`\n📡 Testing: ${modelName}`);
    console.log('⏳ Sending request...');
    
    const result = await testModel(modelName);
    
    if (result.success) {
      console.log(`✅ SUCCESS! This model works!`);
      console.log(`📝 Response: ${result.response.substring(0, 100)}...`);
      console.log(`\n🎯 USE THIS MODEL NAME: "${modelName}"`);
      break;
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

findWorkingModel().catch(console.error);
