# Claude Development Guidelines

This file contains important guidelines for Claude when working on this project.

## Core Principles

1. **Only implement what is explicitly requested**
   - Do not add extra features or functionality unless specifically asked
   - Do not add debugging code, logging, or helper functions without permission
   - If you think something additional might be helpful, ASK FIRST

2. **Keep commits focused**
   - Each commit should address only the specific task requested
   - Do not bundle unrelated changes together
   - Separate concerns: UI changes, bug fixes, and infrastructure changes should be in different commits

3. **Be explicit about changes**
   - Clearly communicate what you're about to change before doing it
   - If making multiple changes, list them out for approval
   - Don't make assumptions about what might be "helpful"

## Project-Specific Guidelines

- **Authentication**: The app uses a JWT token stored in environment variables. Do not modify authentication flow without explicit request.
- **API Client**: Do not add debugging, logging, or test methods to the API client without permission
- **Navigation**: Changes to navigation structure should be minimal and focused on the specific request

## Testing Commands

When changes are complete, run these commands to ensure code quality:
- `npm run lint` - Check for linting errors
- `npm run typecheck` - Check for TypeScript errors

## Common Issues

- **Authentication Errors (401)**: Usually caused by invalid JWT token or unauthorized API calls during initialization
- **Navigation Issues**: Check that all navigation params are properly typed in the navigator files

## Recent Context

- The app recently had authentication issues caused by unwanted network debugging code added to the API client
- Always be cautious about adding initialization code that makes API calls