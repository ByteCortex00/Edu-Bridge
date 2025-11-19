# Edu-Bridge

Edu-Bridge is a full-stack web application designed to analyze and bridge the gap between educational curricula and the skills demanded by the job market. It provides data-driven insights for educational institutions, students, and industry professionals by leveraging machine learning to compare academic offerings with real-world job requirements.

![Edu-Bridge Logo](frontend/src/assets/edubridge-logo.png)

## Core Mission

The primary goal of Edu-Bridge is to create a symbiotic relationship between education and industry. By identifying skill gaps, the platform aims to help institutions adapt their curricula, empower students to choose relevant career paths, and enable employers to find talent more effectively.

## Features

-   **Skill Gap Analysis:** Utilizes NLP models to extract skills from course descriptions and job postings, then visualizes the alignment and discrepancies.
-   **Role-Based Dashboards:** Provides tailored experiences for different users, including administrators and institution representatives.
-   **Curriculum & Job Management:** Allows users to create, view, and manage curriculum data and job postings.
-   **Data-Driven Insights:** Features an analytics dashboard with interactive charts to explore trends in the job market and educational landscape.
-   **Secure Authentication:** Employs Clerk for robust and easy-to-use user management.

## Architecture

Edu-Bridge is built with a modern monorepo architecture, containing a separate frontend and backend.

-   **Backend:** A Node.js/Express server that handles the core business logic, API services, database interactions, and machine learning tasks. See the [backend README](./backend/README.md) for more details.
-   **Frontend:** A React single-page application (SPA) built with Vite and TypeScript that provides the user interface. See the [frontend README](./frontend/README.md) for more details.

### Technology Snapshot

| Area                | Technology                                                              |
| ------------------- | ----------------------------------------------------------------------- |
| **Backend**         | Node.js, Express, MongoDB, BullMQ (Redis), Clerk, Transformers.js       |
| **Frontend**        | React, TypeScript, Vite, Tailwind CSS, React Router, Zustand, Recharts  |
| **DevOps/Tools**    | Git, GitHub, Nodemon                                                    |

## Getting Started

Follow these steps to set up and run the entire project locally.

### Prerequisites

-   [Node.js](https://nodejs.org/en/download/) (LTS version recommended)
-   [npm](https://www.npmjs.com/get-npm) (comes with Node.js)
-   [MongoDB](https://www.mongodb.com/try/download/community) installed and running.
-   A [Clerk](https://clerk.com/) account for authentication keys.
-   An [Adzuna](https://developer.adzuna.com/) developer account for API keys.

### 1. Clone the Repository

```bash
git clone https://github.com/ByteCortex00/Edu-Bridge.git
cd Edu-Bridge
```

### 2. Configure Backend

1.  **Install Dependencies:**
    From the project root, install all backend dependencies.
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**
    Create a `.env` file in the project root by copying the example file.
    ```bash
    cp .env.example .env
    ```
    Open the `.env` file and fill in the following values:
    - `MONGODB_URI`: Your MongoDB connection string.
    - `CLERK_SECRET_KEY`: Your secret key from the Clerk dashboard.
    - `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`: Your API credentials from Adzuna.
    - `FRONTEND_URL`: Set to `http://localhost:5173`.

### 3. Configure Frontend

1.  **Navigate to Frontend Directory & Install Dependencies:**
    ```bash
    cd frontend
    npm install
    ```

2.  **Set Up Environment Variables:**
    In the `frontend/` directory, create a `.env` file from the example.
    ```bash
    cp .env.example .env
    ```
    Open `frontend/.env` and fill in the following:
    - `VITE_CLERK_PUBLISHABLE_KEY`: Your publishable key from the Clerk dashboard.
    - `VITE_API_BASE_URL`: Set to `http://localhost:5000/api`.

### 4. Run the Application

You will need two separate terminal windows to run both the backend and frontend servers concurrently.

-   **Terminal 1: Start the Backend**
    In the project root directory (`/Edu-Bridge`):
    ```bash
    npm run dev
    ```
    The backend server should now be running on `http://localhost:5000`.

-   **Terminal 2: Start the Frontend**
    In the `frontend/` directory:
    ```bash
    npm run dev
    ```
    The frontend development server should now be running on `http://localhost:5173`.

You can now access the Edu-Bridge application by navigating to `http://localhost:5173` in your web browser.
