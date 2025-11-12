# Wicket Mobile App

A cross-platform mobile app (iOS/Android) built with Expo and TypeScript that allows Wicket MDP customers to access their CRM data on mobile devices.

## Features

- View People and Organizations lists
- Search and filter functionality
- View related data (addresses, memberships)
- Pull-to-refresh on all list views
- Clean, professional UI following Wicket brand guidelines

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: React hooks (useState, useContext)
- **API**: Wicket REST API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device for testing

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd mdp-mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your JWT token to the `.env` file:
```
EXPO_PUBLIC_JWT_TOKEN=your_jwt_token_here
```

### Running the App

1. Start the Expo development server:
```bash
npm start
```

2. Use the Expo Go app to scan the QR code and run the app on your device

## Project Structure

```
/src
  /api          - API service layer (JWT auth handling)
  /screens      - Screen components
  /components   - Reusable components
  /navigation   - Navigation configuration
  /types        - TypeScript types/interfaces
  /config       - Configuration files
  /utils        - Utility functions
  /theme        - Wicket branding (colors, fonts, styles)
```

## Environment Configuration

### Development
- API Base URL: `https://demo-api.staging.wicketcloud.com`
- Uses JWT token for authentication

### Production (Future)
- API Base URL: `https://demo-api.wicketcloud.com`
- Will use OAuth flow with expo-auth-session

## API Integration

The app integrates with the Wicket REST API to:
- List People with their addresses and memberships
- List Organizations with their addresses and memberships
- View detailed information for People and Organizations
- Create Touchpoints (coming soon)

## Development Phases

### Phase 1 (Current) ✅
- [x] Expo TypeScript project setup
- [x] Wicket branding implementation
- [x] React Navigation setup
- [x] API service layer with JWT auth
- [x] People list screen
- [x] Organizations list screen
- [ ] People detail screen
- [ ] Organizations detail screen
- [ ] Add Touchpoint functionality

### Phase 2 (Future)
- [ ] OAuth authentication flow
- [ ] Multi-tenant support
- [ ] Secure token storage
- [ ] Token refresh logic

### Phase 3 (Future)
- [ ] UI/UX improvements
- [ ] Additional features
- [ ] Performance optimization
- [ ] Testing

## Troubleshooting

### API Connection Issues
- Ensure your JWT token is correctly set in the `.env` file
- Check that you have internet connectivity
- Verify the API base URL is correct

### Build Issues
- Clear the Metro bundler cache: `npx expo start --clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## License

Proprietary - Wicket Software