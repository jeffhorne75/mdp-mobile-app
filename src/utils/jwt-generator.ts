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

// Generate a JWT with the provided credentials
export function generateCurrentJWT(): string {
  const adminUserUUID = '2a7a74eb-0ead-4f4e-aeb1-e5b91d2908a0';
  const tenantUrl = 'demo-api.staging.wicketcloud.com';
  const secretKey = '07a8661ee7735e66ec659448b1ed9379efdda89974f540ec7caad152d35836c546e44ab08f6b022d9ab433090878538284311a57211b7524e647969a8145bce0';
  
  return generateWicketJWT(adminUserUUID, tenantUrl, secretKey);
}