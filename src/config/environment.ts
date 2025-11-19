interface Environment {
  apiBaseUrl: string;
  jwtToken: string;
  isDevelopment: boolean;
}

const development: Environment = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://demo-api.staging.wicketcloud.com',
  jwtToken: process.env.EXPO_PUBLIC_JWT_TOKEN || '[INSERT YOUR JWT TOKEN HERE]',
  isDevelopment: true,
};

console.log('Environment config loaded:', {
  hasToken: !!process.env.EXPO_PUBLIC_JWT_TOKEN,
  tokenLength: process.env.EXPO_PUBLIC_JWT_TOKEN?.length || 0,
  tokenPreview: process.env.EXPO_PUBLIC_JWT_TOKEN?.substring(0, 10) || 'NO TOKEN',
});

const _production: Environment = {
  apiBaseUrl: 'https://demo-api.wicketcloud.com',
  jwtToken: '', // Will be replaced by OAuth-generated tokens
  isDevelopment: false,
};

// For now, we're always in development mode (Phase 1)
export const config = development;

// Export types for use in the app
export type Config = typeof config;