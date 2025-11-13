# Security Notes

## Development Mode

This project is currently in Phase 1 development and includes several temporary security measures that **MUST** be replaced before production deployment.

### Development-Only Files and Features

The following files and features are for development purposes only and must be removed or replaced before production:

1. **JWT Generation Utilities**
   - `generate-jwt.js` - Node.js script for generating development JWTs
   - `src/utils/jwt-generator.ts` - TypeScript JWT generation utilities
   - These files contain hardcoded secrets for development convenience only

2. **Debug Keystore**
   - `android/app/debug.keystore` - Android debug signing key (development only)
   - This must be replaced with a production keystore for release builds

3. **Hardcoded Authentication Bypass**
   - `src/screens/AuthScreen.tsx` - Placeholder authentication screen
   - `App.tsx` - Authentication bypass in `handleAuthenticate()`
   - Will be replaced with OAuth 2.0 flow in Phase 2

4. **Environment Variables**
   - `.env` file contains development secrets (already in `.gitignore`)
   - `DEV_JWT_SECRET` - Development JWT secret key
   - `DEV_ADMIN_UUID` - Development admin user ID
   - `EXPO_PUBLIC_JWT_TOKEN` - Pre-generated JWT for development

### Production Security Checklist

Before deploying to production, ensure:

- [ ] Remove all JWT generation utilities
- [ ] Implement proper OAuth 2.0 authentication flow
- [ ] Replace debug keystore with production signing keys
- [ ] Remove all hardcoded secrets from codebase
- [ ] Implement secure token storage (expo-secure-store)
- [ ] Add input validation across all user inputs
- [ ] Remove all console.log statements that expose sensitive data
- [ ] Enable ProGuard/R8 for Android builds
- [ ] Implement certificate pinning
- [ ] Add jailbreak/root detection
- [ ] Review and minimize app permissions
- [ ] Enable code obfuscation
- [ ] Implement proper session management
- [ ] Add rate limiting for API calls

### Current Security Measures

- HTTPS enforced for all API communications
- JWT tokens used for API authentication
- Environment variables for sensitive configuration

### Planned Security Improvements (Phase 2)

1. OAuth 2.0 authentication implementation
2. Secure token storage using expo-secure-store
3. Biometric authentication support
4. Session timeout and management
5. Input validation and sanitization
6. Certificate pinning for API communications

### Reporting Security Issues

If you discover a security vulnerability, please report it responsibly. Do not create public GitHub issues for security problems.