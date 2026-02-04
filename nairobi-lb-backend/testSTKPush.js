// testSTKPush.js
import 'dotenv/config';               // ensure .env loaded
import mpesaService from './services/mpesaService.js';

async function testSTKPush() {
  try {
    console.log('🧪 Testing M-Pesa STK Push...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('ShortCode:', process.env.MPESA_SHORTCODE || '(not set)');
    console.log('MPESA_CALLBACK_URL:', process.env.MPESA_CALLBACK_URL || '(not set)');

    // Use sandbox test number (example)
    const inputPhone = process.env.TEST_PHONE || '254708374149'; // change if needed
    const amount = 1;

    console.log('Using phone:', inputPhone, 'amount:', amount);

    const result = await mpesaService.initiateSTKPush(
      inputPhone,
      amount,
      'TestEvent123',
      'Test Payment'
    );

    if (result && result.success) {
      console.log('✅ STK Push initiated successfully!');
      console.log('Checkout Request ID:', result.checkoutRequestID || result.data?.CheckoutRequestID);
      console.log('Response Code:', result.data?.ResponseCode);
      console.log('Response Description:', result.data?.ResponseDescription);
      console.log('\n📱 TEST INSTRUCTIONS: For sandbox use PIN: 174379; watch server logs or ngrok UI at http://127.0.0.1:4040');
      process.exit(0);
    } else {
      console.error('❌ STK Push failed:', result?.error ?? result);
      process.exit(2);
    }
  } catch (error) {
    console.error('❌ Test failed:', error?.message ?? error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(3);
  }
}

testSTKPush();
