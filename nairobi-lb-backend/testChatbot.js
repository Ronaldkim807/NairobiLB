import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function testChatbot() {
  console.log('🤖 Testing Chatbot Routes...\n');

  const testMessages = [
    "What events are happening this weekend?",
    "I'm looking for music events",
    "How do I book tickets?",
    "What's the most popular event right now?",
    "Tell me about sports events"
  ];

  for (const message of testMessages) {
    try {
      console.log(`🧪 Testing: "${message}"`);
      
      const response = await fetch(`${BASE_URL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Response:', data.data.response.substring(0, 100) + '...');
      } else {
        console.log('❌ Failed:', data.message);
      }
      
      console.log('---');
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test search endpoint
  console.log('\n🔍 Testing event search...');
  try {
    const searchResponse = await fetch(`${BASE_URL}/chatbot/search-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'music' })
    });

    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log(`✅ Found ${searchData.data.events.length} events`);
      if (searchData.data.events.length > 0) {
        console.log('Sample event:', searchData.data.events[0].title);
      }
    }
  } catch (error) {
    console.log('❌ Search test failed:', error.message);
  }

  console.log('\n✨ Chatbot testing complete!');
}

testChatbot();