# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js blog starter template with Rollbar integration for error tracking. The project appears to be used for testing or development purposes with Rollbar integration, as it references a local Rollbar package.

## Commands

### Development

```bash
# Install dependencies (must use npm to create symlink to local rollbar library)
npm install

# Start the development server on port 3001
npm run dev

# Build the application for production
npm run build

# Start the production server on port 3001
npm run start
```

## Architecture

### Key Components

1. **Next.js Framework**: The project is built on Next.js, a React framework for production.

2. **Rollbar Integration**: 
   - The project includes Rollbar for error tracking
   - Uses @rollbar/react for React components like Provider and ErrorBoundary
   - Points to a local Rollbar package (../../rollbar/rollbar-js)
   - The main page (index.js) is wrapped with Rollbar Provider and ErrorBoundary

3. **Webpack Configuration**:
   - Source maps are enabled for debugging
   - Optimization/minimization is disabled
   - Custom alias for the Rollbar package

### Pages Structure

- `pages/index.js`: Main page with Rollbar configuration and example components
- `pages/posts/first-post.js`: Simple blog post page with a link back to home

### Styling

- Global CSS in `styles/global.css`
- Component-specific CSS using CSS Modules (e.g., `styles/Home.module.css`)
- Some inline styles using styled-jsx

## Important Notes

- The codebase has test error components (TestError, AnotherError) for triggering Rollbar errors
- Node.js version >=18 is required as specified in package.json
- npm must be used for installation to properly create symlinks to the local Rollbar library