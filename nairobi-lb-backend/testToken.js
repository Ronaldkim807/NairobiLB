import dotenv from 'dotenv';
dotenv.config();

import mpesaService from './services/mpesaService.js';

async function testToken() {
    try {
        console.log('🧪 Testing M-Pesa access token...');
        console.log('Consumer Key exists:', !!process.env.MPESA_CONSUMER_KEY);
        console.log('Consumer Secret exists:', !!process.env.MPESA_CONSUMER_SECRET);
        
        const token = await mpesaService.getAccessToken();
        console.log('✅ Access token retrieved successfully!');
        console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
        
    } catch (error) {
        console.error('❌ Token test failed:', error.message);
    }
}

testToken();