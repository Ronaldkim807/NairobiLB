// oneShotStk.js
import 'dotenv/config';
import axios from 'axios';
import moment from 'moment';

(async () => {
  try {
    console.log('=== oneShotStk.js ===');
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY;
    const callback = process.env.MPESA_CALLBACK_URL;

    if (!key || !secret || !passkey || !callback) {
      console.error('Missing MPESA_* env vars. Check .env.');
      process.exit(1);
    }

    // 1) get token
    const basic = Buffer.from(`${key}:${secret}`).toString('base64');
    console.log('Requesting token...');
    const tokenRes = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${basic}` }, timeout: 10000 }
    );
    const token = tokenRes.data.access_token;
    console.log('TOKEN (first 8):', token.slice(0, 8) + '...');

    // 2) build STK payload
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 1,
      PartyA: '254716012357',   // your phone
      PartyB: shortcode,
      PhoneNumber: '254716012357',
      CallBackURL: callback,
      AccountReference: 'TestEvent123',
      TransactionDesc: 'Test Payment'
    };

    console.log('Sending STK Push...');
    const stkRes = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 20000 }
    );

    console.log('STK Response:', stkRes.data);
    process.exit(0);
  } catch (err) {
    console.error('STK error:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Body:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    process.exit(2);
  }
})();
