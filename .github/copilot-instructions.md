# GitHub Copilot Instructions for Stock Charts

## Project Overview

This is a full-stack financial charting application with:

- **Frontend**: Angular LTS with TypeScript, Angular Material, Chart.js
- **Backend**: .NET LTS with Azure Functions and Web API
- **Purpose**: Display and analyze stock market data with interactive charts

## Architecture

```text
stock-charts/
├── client/          # Angular frontend application
│   ├── src/         # Angular source code
│   └── package.json # NPM dependencies and scripts
└── server/          # .NET backend services
    ├── Functions/   # Azure Functions for data processing
    └── WebApi/      # REST API endpoints
```

## Key Technologies

### Frontend Stack

- **Angular LTS**: Modern web framework with standalone components
- **TypeScript**: Primary language for type-safe development
- **Chart.js**: Data visualization library for financial charts
- **Angular Material**: UI component library
- **RxJS**: Reactive programming with observables

### Backend Stack

- **C# / .NET LTS**: Server-side language and framework
- **Azure Functions**: Serverless compute for data processing
- **ASP.NET Core**: Web API for REST endpoints
- **Entity Framework**: Data access and ORM

## Coding Conventions

### Frontend (Angular)

- Use standalone components (not NgModules)
- Implement OnPush change detection strategy
- Follow Angular style guide naming conventions
- Use reactive forms with typed FormControls
- Implement proper error handling with try-catch and RxJS operators
- Use Angular Material components consistently

### Backend (.NET)

- Follow Microsoft C# coding conventions
- Use async/await patterns for I/O operations
- Implement proper dependency injection
- Use record types for DTOs where appropriate
- Follow REST API best practices
- Implement comprehensive error handling and logging

### Common Patterns

- Use TypeScript interfaces for data models
- Implement proper type safety throughout
- Use descriptive variable and method names
- Keep functions small and focused
- Write unit tests for business logic

## Development Workflow

1. **Frontend Development**:
   - Run `npm start` in `/client` for development server
   - Use `npm run build` for production builds
   - Follow Angular CLI patterns for generating components

2. **Backend Development**:
   - Use Visual Studio or VS Code with C# extension
   - Run Azure Functions locally for testing
   - Follow .NET project structure conventions

## Testing Approach

- **Frontend**: Jest for unit tests, Angular testing utilities
- **Backend**: xUnit for unit tests, integration tests for APIs
- Focus on testing business logic and data transformations
- Mock external dependencies and API calls

## Performance Considerations

- Implement OnPush change detection in Angular components
- Use trackBy functions in *ngFor loops
- Lazy load Angular modules where appropriate
- Optimize Chart.js configurations for large datasets
- Use async/await properly in .NET to avoid blocking

## Security Guidelines

- Validate all inputs on both client and server
- Use HTTPS for all communications
- Implement proper CORS policies
- Follow Angular security best practices
- Use .NET security features for API protection

## Common Debugging Patterns

### Frontend

- Use Angular DevTools for component inspection
- Console.log for data flow debugging
- Network tab for API call investigation
- Use breakpoints in TypeScript code

### Backend

- Use debugger in Visual Studio/VS Code
- Implement structured logging
- Use Application Insights for Azure Functions
- Monitor API performance and errors

## Context for AI Assistance

When working on this codebase:

- Prioritize type safety and proper error handling
- Consider the financial data context and accuracy requirements
- Maintain consistency with existing patterns and conventions
- Focus on performance for chart rendering and data processing
- Ensure responsive design for various screen sizes
- Consider accessibility requirements for financial applications
