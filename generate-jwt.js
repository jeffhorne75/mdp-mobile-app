// TODO: Remove this file before production - temporary JWT generation for development only
// This will be replaced with OAuth flow in Phase 2
// WARNING: This file contains hardcoded secrets for development purposes only

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Use environment variables with fallback for development
const adminUserUUID = process.env.DEV_ADMIN_UUID || '2a7a74eb-0ead-4f4e-aeb1-e5b91d2908a0';
const tenantUrl = 'demo-api.staging.wicketcloud.com';
const secretKey = process.env.DEV_JWT_SECRET || '07a8661ee7735e66ec659448b1ed9379efdda89974f540ec7caad152d35836c546e44ab08f6b022d9ab433090878538284311a57211b7524e647969a8145bce0';

const now = Math.floor(Date.now() / 1000);
const expirationTime = now + (24 * 60 * 60); // 24 hours from now

const payload = {
  exp: expirationTime,
  sub: adminUserUUID,
  aud: `https://${tenantUrl}`,
};

const token = jwt.sign(payload, secretKey, {
  algorithm: 'HS256',
  header: {
    alg: 'HS256',
    typ: 'JWT'
  }
});

console.log('\nGenerated JWT Token:');
console.log(token);
console.log('\nToken expires at:', new Date(expirationTime * 1000).toISOString());
console.log('\nDecoded payload:');
console.log(jwt.decode(token));
console.log('\nUpdate your .env file with:');
console.log(`EXPO_PUBLIC_JWT_TOKEN=${token}`);