# Edu-Bridge Frontend

This directory contains the frontend for the Edu-Bridge application. It is a modern single-page application (SPA) built with React, designed to provide a user-friendly interface for interacting with the Edu-Bridge platform.

## Technology Stack

- **Framework:** [React](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/) / [JavaScript](https://www.javascript.com/) (JSX/TSX)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Routing:** [React Router](https://reactrouter.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) for simple, global state management
- **Authentication:** [Clerk React](https://clerk.com/docs/references/react/overview) for handling user sessions and displaying UI components
- **Data Fetching:** [Axios](https://axios-http.com/) for making API requests to the backend
- **Data Visualization:** [Recharts](https://recharts.org/) for displaying charts and graphs in the analytics dashboards

## Core Features

- **User Dashboards:** Custom dashboards for different user roles (Admin, Institution, etc.).
- **Data Visualization:** Interactive charts to display skill gap analysis results.
- **Responsive Design:** A fully responsive interface that works on various screen sizes.
- **Secure Authentication:** Seamless sign-in, sign-up, and profile management powered by Clerk.
- **Data Management:** Forms and tables for creating, reading, updating, and deleting curricula, jobs, and other resources.

## Setup and Installation

1.  **Navigate to Directory:**
    ```bash
    cd frontend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the `frontend/` directory by copying the `frontend/.env.example` file.
    ```bash
    cp .env.example .env
    ```
    Fill in the required variables:
    - `VITE_API_BASE_URL`: The base URL for the backend API (e.g., `http://localhost:5000/api`).
    - `VITE_CLERK_PUBLISHABLE_KEY`: Your publishable key from the Clerk dashboard.

## Running the Development Server

1.  **Start the Server:**
    From the `frontend/` directory, run:
    ```bash
    npm run dev
    ```
    This will start the Vite development server, typically available at `http://localhost:5173`.

2.  **Linting:**
    To check for code quality and style issues, run:
    ```bash
    npm run lint
    ```

## Building for Production

To create a production-ready build of the application, run the following command from the `frontend/` directory:

```bash
npm run build
```
This will generate a `dist/` folder with optimized and minified static assets ready for deployment.

## Folder Structure

```
frontend/src/
├── api/          # Functions for making backend API calls
├── assets/       # Static assets like images and logos
├── components/   # Reusable React components (e.g., layouts, forms)
├── hooks/        # Custom React hooks
├── pages/        # Top-level components for each application route/page
└── store/        # Zustand store for global state management
```