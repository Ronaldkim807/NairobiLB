import dotenv from 'dotenv';
dotenv.config();

// First, let's test if we can access admin routes
// You'll need to get an admin token first

console.log('Admin Routes Test');
console.log('================');
console.log('Make sure you have an admin user created and get the JWT token');
console.log('Then test these endpoints:');
console.log('- GET /api/admin/dashboard');
console.log('- GET /api/admin/users');
console.log('- GET /api/admin/events');
console.log('- GET /api/admin/payments');
console.log('');
console.log('Use tools like Postman or curl with Authorization header:');
console.log('Authorization: Bearer <your-admin-token>');