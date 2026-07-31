# Clearforms - Frontend

This is the frontend application for Clearforms, a modern, highly interactive form builder built with React and Vite. It features a robust state management architecture, real-time UI updates, and a beautiful design system powered by Tailwind CSS.

## Tech Stack

- **Framework**: React 19 (via Vite)
- **State Management**: Redux Toolkit (with persist middleware)
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4
- **Animation**: Motion (Framer Motion)
- **Analytics/Monitoring**: PostHog, Sentry
- **Authentication**: Supabase Auth / Firebase Auth
- **Testing**: Vitest, React Testing Library, Playwright (E2E)

## Project Structure

```text
src/
├── api/             # API client and service endpoints
├── components/      # Reusable UI components (buttons, modals, etc.)
├── config/          # Environment and third-party configuration (env, posthog, sentry)
├── features/        # Feature-based modular code (Domain Driven Design approach)
│   ├── auth/        # Authentication logic and UI
│   ├── forms/       # Core form builder, settings, response viewing, and public pages
│   ├── onboarding/  # First-time user experience flows
│   ├── profile/     # User profile and settings
│   └── templates/   # Form templates management
├── hooks/           # Shared custom React hooks
├── store/           # Redux store configuration, slices, and middleware
├── utils/           # Helper functions and utilities
└── App.jsx          # Main application entry point and router setup
```

## Setup & Installation

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Step-by-Step Guide

1. **Install Dependencies**
   Navigate to the frontend directory and install the required packages:
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` or `.env.local` file in the root of the `frontend` directory. Ensure you have the necessary keys for your backend API, Supabase/Firebase, and other integrations. Example variables you might need:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   # Add other required keys as per your configuration
   ```

3. **Start the Development Server**
   Run the Vite development server:
   ```bash
   npm run dev
   ```
   The application will typically be available at `http://localhost:5173` (or another port if specified by Vite).

## Available Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Builds the app for production into the `dist` folder.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint to check for code quality and style issues.
- `npm run test`: Runs unit tests using Vitest.
- `npm run test:watch`: Runs Vitest in watch mode for active test development.
- `npm run test:smoke`: Runs Playwright smoke tests.

## Architecture Notes

- **Offline / API Mode**: The application is designed to smoothly transition between local offline data (using `localStorage` via utilities in `utils/localStorageSafe.js`) and live database data (via the backend API). When the API is configured, the Redux store acts as a cache for the database, which remains the single source of truth.
- **Redux State**: The state is divided into slices (e.g., `formsSlice`, `uiSlice`, `authSlice`). The `persistAppMiddleware` selectively persists certain states (like UI preferences) to localStorage to improve the user experience across sessions.
