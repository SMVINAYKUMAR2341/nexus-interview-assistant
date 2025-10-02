// Test script to verify Gemini API key is working
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyCws7KhsxoObBmTdaRLJXy_YRAmGaCleNQ';

async function testGeminiAPI() {
  console.log('🔍 Testing Gemini API Key...\n');
  
  if (!API_KEY) {
    console.error('❌ API Key is not set!');
    return false;
  }
  
  console.log('✅ API Key found:', API_KEY.substring(0, 20) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('📡 Attempting to connect to Gemini API...');
    
    const prompt = 'Say hello in one sentence.';
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('\n✅ SUCCESS! Gemini API is working!');
    console.log('📝 Response:', response);
    console.log('\n🎉 Your Gemini API key is valid and functional!');
    
    return true;
  } catch (error) {
    console.error('\n❌ ERROR! Gemini API is NOT working!');
    console.error('Error details:', error.message);
    
    if (error.message.includes('API key')) {
      console.error('\n⚠️  Issue: Invalid API key');
      console.error('Solution: Check your API key at https://makersuite.google.com/app/apikey');
    } else if (error.message.includes('quota')) {
      console.error('\n⚠️  Issue: API quota exceeded');
      console.error('Solution: Check your usage at https://console.cloud.google.com/');
    } else if (error.message.includes('network')) {
      console.error('\n⚠️  Issue: Network connection problem');
      console.error('Solution: Check your internet connection');
    } else {
      console.error('\n⚠️  Issue: Unknown error');
      console.error('Solution: Check the error details above');
    }
    
    return false;
  }
}

// Run the test
testGeminiAPI()
  .then(success => {
    if (success) {
      console.log('\n' + '='.repeat(50));
      console.log('✅ GEMINI API TEST PASSED');
      console.log('='.repeat(50));
    } else {
      console.log('\n' + '='.repeat(50));
      console.log('❌ GEMINI API TEST FAILED');
      console.log('='.repeat(50));
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
