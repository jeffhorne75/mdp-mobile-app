# Wicket Mobile - Project Specification

## Overview
Build a cross-platform mobile app (iOS/Android) using Expo and TypeScript that allows Wicket MDP customers to access their CRM data on mobile devices. Users should be able to view People and Organizations, see related data, and add Touchpoints to person records.

## Technical Stack
* Framework: Expo (React Native)
* Language: TypeScript
* Navigation: React Navigation
* State Management: React hooks (useState, useContext) - keep it simple for now
* API: Wicket REST API
* API Documentation: https://wicketapi.docs.apiary.io/

## Branding
* Use Wicket branding based on https://wicket.io
* Keep design simple and clean
* Extract brand colors, fonts, and style from Wicket website
* Professional, modern aesthetic consistent with Wicket's brand identity

## Environment Configuration

### Demo Environment (Current Development)
* API Base URL: https://demo-api.staging.wicketcloud.com
* Use for all initial development and testing

### Production Environment (Future)
* API Base URL: https://demo-api.wicketcloud.com (note: remove "staging.")
* Make environment easily configurable via config file

## Authentication Approach

### Phase 1 (Current - Development)
* Use JWT token for authentication
* Add token to Authorization header: Authorization: Bearer {JWT_TOKEN}
* Store JWT token in environment variables or config file
* Design the auth system to be easily swappable for real OAuth later

### Phase 2 (Future - Production)
* Implement OAuth flow using expo-auth-session
* OAuth flow will automatically generate and refresh JWT tokens
* Support multi-tenant architecture where each customer has their own instance (e.g., pace-admin.staging.wicketcloud.com)
* Instance selection screen where user enters their organization name
* Secure token storage using expo-secure-store
* Implement token refresh logic
* OAuth configuration will be provided by backend team

## Core Features (MVP)

### 1. Authentication Screen
* Simple login screen for Phase 1 (can be just a "Continue" button with hardcoded JWT)
* Placeholder for future instance selection

### 2. People List
* Display list of people from Wicket API
* Display fields (in this order):
    * Name: Last Name, First Name format
    * Email Address
    * City, State/Prov: From primary address
    * Active Memberships: Display list/count of active memberships
* Search/filter functionality
* Pull-to-refresh
* Tap person to view details

### 3. Person Detail View
* Display full person information
* Show related data (organizations, touchpoints, active memberships, etc.)
* "Add Touchpoint" button

### 4. Add Touchpoint
* Form to create a new touchpoint for a person
* Required fields based on Wicket API requirements
* Success/error handling

### 5. Organizations List
* Display list of organizations
* Display fields (in this order):
    * Name
    * Type
    * City, State/Prov: From primary address
    * Active Memberships: Display list/count of active memberships
* Search/filter functionality
* Pull-to-refresh
* Tap organization to view details

### 6. Organization Detail View
* Display full organization information
* Show related data (members, touchpoints, active memberships, etc.)

## API Integration

### Base Configuration
* Base URL (Demo): https://demo-api.staging.wicketcloud.com
* Base URL (Production): https://demo-api.wicketcloud.com
* API Format: JSON API specification (https://jsonapi.org/)
* Authentication: JWT token in Authorization header
    * Header format: Authorization: Bearer 07a8661ee7735e66ec659448b1ed9379efdda89974f540ec7caad152d35836c546e44ab08f6b022d9ab433090878538284311a57211b7524e647969a8145bce0
* All requests require authentication
* Handle multi-tenant by allowing base URL to be configured per customer instance

### Key Endpoints Needed
Refer to https://wicketapi.docs.apiary.io/ for exact endpoint specifications:
* GET /people - list people (include primary address and active memberships)
* GET /people/{id} - person details
* GET /organizations - list organizations (include primary address and active memberships)
* GET /organizations/{id} - organization details
* POST /touchpoints - create touchpoint

### Data Requirements
* Primary Address: Needed to display City, State/Prov
* Active Memberships: Need to fetch and display active memberships for both People and Organizations
* Check API documentation for proper query parameters to include related data

## Error Handling
* Network errors
* Authentication errors (401/403)
* API errors (400/500)
* Display user-friendly error messages
* Handle expired JWT tokens gracefully

## Technical Requirements

### Project Structure
```
/src
  /api          - API service layer (JWT auth handling)
  /screens      - Screen components
  /components   - Reusable components
  /navigation   - Navigation configuration
  /types        - TypeScript types/interfaces
  /config       - Configuration files (including environment/branding)
  /utils        - Utility functions
  /theme        - Wicket branding (colors, fonts, styles)
```

## Design Considerations
* No offline storage required - assume internet connectivity
* Clean, professional UI following Wicket brand guidelines
* Reference https://wicket.io for brand colors, typography, and style
* Loading states for all API calls
* Pull-to-refresh on list views
* Proper TypeScript types for all API responses
* Responsive design that works on various screen sizes

## Development Setup
* Use Expo Go app for testing on physical devices
* Environment variables for API configuration and JWT token
* TypeScript strict mode enabled

## Development Phases

### Phase 1 - Foundation (Start Here)
1. Create Expo TypeScript project
2. Extract and implement Wicket branding from https://wicket.io
3. Set up React Navigation with tab navigator (People, Organizations)
4. Create API service layer with JWT authentication
5. Build People list with required fields (Name, Email, City/State, Active Memberships)
6. Build People detail screen
7. Build Organizations list with required fields (Name, Type, City/State, Active Memberships)
8. Build Organizations detail screen
9. Implement Add Touchpoint functionality

### Phase 2 - OAuth Integration (Future)
1. Integrate expo-auth-session
2. Build instance selection flow
3. Implement secure token storage with expo-secure-store
4. Implement JWT token refresh logic
5. Replace hardcoded JWT with OAuth-generated tokens

### Phase 3 - Polish (Future)
1. Improve UI/UX
2. Add more features based on user feedback
3. Performance optimization
4. Testing

## Notes for Claude Code
* Start with Phase 1 only
* Visit https://wicket.io to extract brand colors, fonts, and styling
* Keep code clean and well-commented
* Use functional components with hooks
* Prioritize working functionality, but maintain Wicket brand consistency
* Make auth layer modular so OAuth can be swapped in easily
* Ensure API calls properly fetch primary address and active memberships for list views
* For development, use the demo environment: https://demo-api.staging.wicketcloud.com
* Development JWT Token: [INSERT YOUR JWT TOKEN HERE]
* Set up JWT token in a way that makes it easy to swap in OAuth-generated tokens later

## Questions/Blockers
* Waiting on backend team to configure OAuth in CAS
* Need development JWT token for testing
* May need to verify exact API query parameters for fetching related data (addresses, memberships)
* Confirm JWT token expiration time (if applicable)