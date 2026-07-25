# Clearforms - Backend

This is the backend API for Clearforms, built with NestJS. It provides a robust, scalable, and secure foundation for managing users, workspaces, complex form structures, form submissions, and background processing.

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database ORM**: Prisma
- **Database Engine**: PostgreSQL (via `@prisma/adapter-pg`)
- **Queue & Background Jobs**: BullMQ & Redis (ioredis)
- **Authentication**: JWT, Passport, Firebase Admin, Supabase
- **Integrations**: AI (Anthropic / AI SDK), Resend (Emails), Razorpay (Billing), AWS Secrets Manager, Composio
- **Monitoring**: Sentry, NestJS Terminus (Health checks)
- **Testing**: Jest (Unit & E2E)

## Project Structure

```text
src/
├── app.module.ts       # Root module of the application
├── main.ts             # Application entry point
├── billing/            # Razorpay integration, subscription management
├── common/             # Shared guards, decorators, interceptors, and filters
├── forms/              # Form CRUD, publishing, and pause/archive workflows
├── prisma/             # Prisma service initialization and configuration
├── redis/              # Redis connection and caching configuration
├── responses/          # Form submission handling and response management
├── users/              # User management and authentication
└── workspaces/         # Workspace CRUD and access control
```

## Setup & Installation

### Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL database
- Redis server (required for BullMQ and caching)
- npm or bun

### Step-by-Step Guide

1. **Install Dependencies**
   Navigate to the backend directory and install the required packages:
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root of the `backend` directory. You will need to configure your database connection and other secrets. Example configuration:
   ```env
   # Application
   PORT=3000
   NODE_ENV=development

   # Database (Prisma)
   DATABASE_URL="postgresql://user:password@localhost:5432/clearforms?schema=public"

   # Redis
   REDIS_URL="redis://localhost:6379"

   # JWT Auth
   JWT_SECRET="your_jwt_secret"
   
   # Add other integration keys (Resend, Razorpay, Supabase, Anthropic) as needed
   ```

3. **Database Setup**
   Apply the Prisma migrations to set up your PostgreSQL schema and generate the Prisma Client:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start the Server**
   Start the application in development mode with hot-reloading:
   ```bash
   npm run start:dev
   ```
   The API will typically be available at `http://localhost:3000`.

## Available Scripts

- `npm run start:dev`: Starts the server in watch mode for local development.
- `npm run build`: Compiles the application into the `dist` folder.
- `npm run start:prod`: Runs the compiled application in production.
- `npm run format`: Runs Prettier to format the codebase.
- `npm run lint`: Runs ESLint to identify and fix code issues.
- `npm run test`: Runs unit tests using Jest.
- `npm run test:e2e`: Runs end-to-end tests.
- `npm run billing:verify-env`: Utility script to verify billing environment configuration.

## Architecture Notes

- **Database as Source of Truth**: The backend manages all authoritative state. Endpoints are designed to ensure data consistency, particularly around form status (e.g., Live, Paused, Archived).
- **Caching**: Redis is utilized extensively to cache public form configurations, ensuring high performance and minimal database load when rendering live forms to respondents.
- **Background Processing**: BullMQ is used to handle asynchronous tasks such as AI processing, email notifications, and data exports, ensuring the main API thread remains responsive.
