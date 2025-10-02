// Verify DeepSeek API Key Format
const API_KEY = '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';

console.log('\n🔍 DeepSeek API Key Analysis\n');
console.log('='.repeat(70));
console.log(`\n API Key: ${API_KEY}`);
console.log(`\n Length: ${API_KEY.length} characters`);
console.log(`\n Format: ${API_KEY.startsWith('sk-') ? '✅ Valid prefix (sk-)' : '❌ Invalid prefix'}`);
console.log(`\n Last 4 chars: ...${API_KEY.slice(-4)}`);
console.log('\n' + '='.repeat(70));

console.log('\n📡 Testing with different endpoints...\n');

async function testEndpoints() {
  const endpoints = [
    'https://api.deepseek.com/v1/chat/completions',
    'https://api.deepseek.com/chat/completions',
    'https://api.deepseek.com/v1/completions'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔄 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: 'Say hello'
            }
          ]
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ SUCCESS!', data);
        break;
      } else {
        console.log(`❌ Status ${response.status}:`, data.error?.message || JSON.stringify(data));
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

testEndpoints();
