// TODO: Remove this file before production - temporary JWT generation for development only
// This will be replaced with OAuth flow in Phase 2
// WARNING: This file should NOT be included in production builds

import jwt from 'jsonwebtoken';

interface JWTPayload {
  exp: number;
  sub: string;
  aud: string;
  iss?: string;
}

export function generateWicketJWT(
  adminUserUUID: string,
  tenantUrl: string,
  secretKey: string,
  issuer?: string,
  expiresInHours: number = 24
): string {
  const now = Math.floor(Date.now() / 1000);
  const expirationTime = now + (expiresInHours * 60 * 60);

  const payload: JWTPayload = {
    exp: expirationTime,
    sub: adminUserUUID,
    aud: `https://${tenantUrl}`,
    ...(issuer && { iss: issuer })
  };

  const token = jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT'
    }
  });

  return token;
}

// TODO: This function uses hardcoded values for development only
// Will be removed when OAuth is implemented
export function generateCurrentJWT(): string {
  // These values should come from environment variables in development
  // and will be replaced by OAuth tokens in production
  const adminUserUUID = process.env.DEV_ADMIN_UUID || '2a7a74eb-0ead-4f4e-aeb1-e5b91d2908a0';
  const tenantUrl = 'demo-api.staging.wicketcloud.com';
  const secretKey = process.env.DEV_JWT_SECRET || '07a8661ee7735e66ec659448b1ed9379efdda89974f540ec7caad152d35836c546e44ab08f6b022d9ab433090878538284311a57211b7524e647969a8145bce0';
  
  return generateWicketJWT(adminUserUUID, tenantUrl, secretKey);
}