import dotenv from 'dotenv';
dotenv.config();

const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluMTIzIiwiZW1haWwiOiJhZG1pbkBuYWlyb2JpLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1OTEzNDI4NSwiZXhwIjoxNzU5MTM3ODg1fQ.-pgTsFXCZutjkquRC0wKFWO19hBK3HN-igsdXGr1ttY';
const BASE_URL = 'http://localhost:5000/api';

async function testAdminRoute(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    console.log(`Testing ${method} ${endpoint}...`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ SUCCESS: ${data.message || 'Request successful'}`);
      if (data.data) {
        console.log(`   Data received:`, Object.keys(data.data));
      }
    } else {
      console.log(`❌ FAILED: ${data.message || 'Request failed'}`);
    }

    return data;
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
   }
}

async function runAdminTests() {
  console.log('🧪 Testing Admin Routes...\n');

  // Test 1: Dashboard
  await testAdminRoute('/admin/dashboard');

  // Test 2: Users list
  await testAdminRoute('/admin/users?limit=5');

  // Test 3: Events list
  await testAdminRoute('/admin/events?limit=5');

  // Test 4: Payments list
  await testAdminRoute('/admin/payments?limit=5');

  console.log('\n📋 Admin Routes Test Complete!');
  console.log('\nNext steps:');
  console.log('1. Check your server logs for any errors');
  console.log('2. Verify data is being returned correctly');
  console.log('3. Proceed to Chatbot implementation');
}

runAdminTests();