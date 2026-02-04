import axios from 'axios';
import moment from 'moment';

class MpesaService {
    constructor() {
        // Don't initialize credentials in constructor - they load before .env
        this.authURL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
        this.stkPushURL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    }

    // Get credentials dynamically when needed
    getCredentials() {
        return {
            consumerKey: process.env.MPESA_CONSUMER_KEY,
            consumerSecret: process.env.MPESA_CONSUMER_SECRET,
            shortCode: process.env.MPESA_SHORTCODE,
            passkey: process.env.MPESA_PASSKEY,
            callbackURL: process.env.MPESA_CALLBACK_URL
        };
    }

    // Get access token with proper error handling
    async getAccessToken() {
        try {
            console.log('🔐 Requesting M-Pesa access token...');
            
            const { consumerKey, consumerSecret } = this.getCredentials();
            
            if (!consumerKey || !consumerSecret) {
                throw new Error('M-Pesa credentials are not configured in environment variables');
            }

            const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
            
            console.log('Auth URL:', this.authURL);
            console.log('Consumer Key (last 4):', '***' + consumerKey.slice(-4));

            const response = await axios.get(this.authURL, {
                headers: { 
                    Authorization: `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('✅ Access token retrieved successfully');
            return response.data.access_token;

        } catch (error) {
            console.error('❌ Error getting M-Pesa access token:');
            
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            } else if (error.request) {
                console.error('No response received');
            } else {
                console.error('Error:', error.message);
            }
            
            throw new Error(`Failed to get M-Pesa access token: ${error.response?.data?.error_message || error.message}`);
        }
    }

    // Generate timestamp
    getTimestamp() {
        return moment().format('YYYYMMDDHHmmss');
    }

    // Generate STK push password
    generatePassword(timestamp) {
        const { shortCode, passkey } = this.getCredentials();
        const data = `${shortCode}${passkey}${timestamp}`;
        return Buffer.from(data).toString('base64');
    }

    // Format phone number to 254 format
    formatPhoneNumber(phoneNumber) {
        let formatted = phoneNumber.trim().replace(/\s/g, '');
        
        if (formatted.startsWith('0')) {
            formatted = '254' + formatted.substring(1);
        } else if (formatted.startsWith('+')) {
            formatted = formatted.substring(1);
        } else if (!formatted.startsWith('254')) {
            formatted = '254' + formatted;
        }
        
        return formatted;
    }

    // Initiate STK Push
    async initiateSTKPush(phoneNumber, amount, accountReference = 'TestAccount', transactionDesc = 'Payment') {
        try {
            console.log('🚀 Starting STK Push process...');
            
            const { shortCode, callbackURL } = this.getCredentials();
            const token = await this.getAccessToken();
            const timestamp = this.getTimestamp();
            const password = this.generatePassword(timestamp);
            const formattedPhone = this.formatPhoneNumber(phoneNumber);

            const payload = {
                BusinessShortCode: shortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: Math.floor(amount),
                PartyA: formattedPhone,
                PartyB: shortCode,
                PhoneNumber: formattedPhone,
                CallBackURL: callbackURL,
                AccountReference: accountReference.substring(0, 12),
                TransactionDesc: transactionDesc.substring(0, 13)
            };

            console.log('📦 STK Push payload:', {
                ...payload,
                Password: '***',
                PhoneNumber: formattedPhone
            });

            const response = await axios.post(this.stkPushURL, payload, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            console.log('✅ STK Push initiated successfully');
            console.log('Response:', response.data);
            
            return {
                success: true,
                data: response.data,
                checkoutRequestID: response.data.CheckoutRequestID
            };

        } catch (error) {
            console.error('❌ Error initiating STK push:');
            
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            } else if (error.request) {
                console.error('No response received');
            } else {
                console.error('Error:', error.message);
            }
            
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }
}

// Export as ES Module
export default new MpesaService();