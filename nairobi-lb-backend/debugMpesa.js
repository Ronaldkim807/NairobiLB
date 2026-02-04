import dotenv from 'dotenv';
dotenv.config();

console.log('=== M-PESA CONFIGURATION DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MPESA_CONSUMER_KEY exists:', !!process.env.MPESA_CONSUMER_KEY);
console.log('MPESA_CONSUMER_KEY length:', process.env.MPESA_CONSUMER_KEY?.length);
console.log('MPESA_CONSUMER_SECRET exists:', !!process.env.MPESA_CONSUMER_SECRET);
console.log('MPESA_CONSUMER_SECRET length:', process.env.MPESA_CONSUMER_SECRET?.length);
console.log('MPESA_SHORTCODE:', process.env.MPESA_SHORTCODE);
console.log('MPESA_PASSKEY exists:', !!process.env.MPESA_PASSKEY);
console.log('MPESA_PASSKEY length:', process.env.MPESA_PASSKEY?.length);
console.log('MPESA_CALLBACK_URL:', process.env.MPESA_CALLBACK_URL);

// Test credentials format
try {
    const credentials = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    console.log('Credentials Base64 length:', credentials.length);
    console.log('First 20 chars of Base64:', credentials.substring(0, 20) + '...');
} catch (error) {
    console.error('Error creating Base64 credentials:', error.message);
}

console.log('================================');