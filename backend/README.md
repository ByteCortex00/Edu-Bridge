# Edu-Bridge Backend

This directory contains the backend server for the Edu-Bridge application. It is a Node.js application responsible for handling business logic, serving the REST API, managing the database, authenticating users, and running machine learning tasks for skill analysis.

## Technology Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ODM
- **Authentication:** [Clerk](https://clerk.com/) for user management and backend authentication
- **Job Queue:** [BullMQ](https://bullmq.io/) with Redis for processing background jobs (e.g., ML model embedding generation)
- **Machine Learning:** [@xenova/transformers](https://github.com/xenova/transformers.js) for running NLP models directly within Node.js
- **API Integrations:** [Adzuna API](https://developer.adzuna.com/) for fetching job market data
- **Development:** [Nodemon](https://nodemon.io/) for automatic server restarts

## Core Features

- **REST API:** Provides endpoints for managing users, institutions, curricula, jobs, and analytics.
- **User Authentication:** Securely handles user sign-up, sign-in, and session management via Clerk.
- **Skill Gap Analysis:** Runs ML models to extract skills from text and performs analysis.
- **Background Processing:** Offloads long-running tasks like data seeding and ML embedding generation to a separate worker process.

## Setup and Installation

1.  **Install Dependencies:**
    From the root of the project, run:
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in the root directory by copying the `.env.example` file.
    ```bash
    cp .env.example .env
    ```
    Fill in the required variables:
    - `MONGODB_URI`: Your MongoDB connection string.
    - `FRONTEND_URL`: The URL of the running frontend application (for CORS).
    - `CLERK_SECRET_KEY`: Your secret key from the Clerk dashboard.
    - `ADZUNA_APP_ID`: Your Adzuna Application ID.
    - `ADZUNA_APP_KEY`: Your Adzuna Application Key.

## Running the Server

-   **Development Mode:**
    From the root of the project, run:
    ```bash
    npm run dev
    ```
    This will start the server using `nodemon`, which automatically restarts on file changes. The server will typically run on the port specified in your `.env` file (default is 5000).

## API Endpoints

The API routes are defined in the `backend/routes/` directory. The major endpoints include:

-   `/api/auth`: User authentication and role management.
-   `/api/curriculum`: Managing curricula and courses.
-   `/api/jobs`: Fetching and managing job postings.
-   `/api/institutions`: Managing institutional data.
-   `/api/analytics`: Endpoints for skill gap analysis data.
-   `/api/webhooks`: Handles incoming webhooks (e.g., from Clerk for user synchronization).

## Folder Structure

```
backend/
├── config/         # Configuration files (DB, ML, Queues)
├── controllers/    # Request handlers and business logic
├── middleware/     # Express middleware (auth, error handling)
├── models/         # Mongoose database schemas
├── routes/         # API route definitions
├── services/       # Business logic and external service integrations
├── utils/          # Seeder scripts and utility functions
└── workers/        # Background job processors
```
