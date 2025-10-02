// Check available Gemini models
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyCws7KhsxoObBmTdaRLJXy_YRAmGaCleNQ';
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  console.log('\n🔍 Checking available Gemini models...\n');
  
  try {
    // Try the correct model name
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent('Hello');
    console.log('✅ Model "gemini-1.5-flash-latest" is available and working!');
    console.log('Response:', result.response.text());
  } catch (error) {
    console.error('❌ gemini-1.5-flash-latest failed:', error.message);
  }
  
  console.log('\n🔄 Trying alternative model names...\n');
  
  const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'models/gemini-1.5-flash',
    'models/gemini-pro'
  ];
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Test');
      console.log(`✅ ${modelName} - WORKING`);
      break;
    } catch (error) {
      console.log(`❌ ${modelName} - ${error.message.split('\n')[0]}`);
    }
  }
}

listModels().catch(console.error);
