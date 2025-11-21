# Edu-Bridge

Edu-Bridge is an AI-powered platform designed to bridge the gap between academic curricula and real-time job market demands. By leveraging machine learning to analyze job postings and university programs, it provides data-driven insights to help institutions align their education with industry needs.

## 🚀 Live Demo

- **Frontend Application:** [https://edu-bridge-2b36.vercel.app](https://edu-bridge-2b36.vercel.app)
- **Backend API:** [https://edu-bridge-api-l1uo.onrender.com](https://edu-bridge-api-l1uo.onrender.com)

## 🌟 Key Features

-   **Skills Gap Analysis:** Uses NLP and Vector Search to compare curriculum content against thousands of live job descriptions.
-   **Real-Time Market Data:** Integrates with the Adzuna API to fetch current job postings across multiple countries.
-   **Interactive Dashboards:** Role-based dashboards for Institutions and Administrators to visualize match rates, critical gaps, and emerging skills.
-   **Curriculum Management:** robust tools for universities to create, manage, and update their course offerings.
-   **Secure Authentication:** Enterprise-grade user management powered by Clerk.

## 🏗 Architecture

Edu-Bridge follows a modern monorepo structure:

-   **`frontend/`**: A Single Page Application (SPA) built with React, Vite, and Tailwind CSS.
-   **`backend/`**: A Node.js/Express REST API utilizing MongoDB, BullMQ for background processing, and Transformers.js for on-device ML.

## 🛠 Tech Stack

| Area | Technologies |
|------|--------------|
| **Frontend** | React, Vite, Tailwind CSS, Recharts, Clerk SDK, Zustand, Axios |
| **Backend** | Node.js, Express, MongoDB (Mongoose), BullMQ (Redis), Xenova/Transformers.js |
| **Infrastructure** | Vercel (Frontend), Render (Backend/Redis), MongoDB Atlas |

## 🏁 Getting Started

To run the entire project locally:

### Prerequisites
-   Node.js (v18+ recommended)
-   MongoDB installed locally or an Atlas URI
-   Redis (required for background job queues)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/ByteCortex00/Edu-Bridge.git](https://github.com/ByteCortex00/Edu-Bridge.git)
    cd Edu-Bridge
    ```

2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    cp .env.example .env
    # Fill in your .env variables (DB, Clerk, Adzuna keys)
    npm run dev
    ```

3.  **Setup Frontend:**
    Open a new terminal window:
    ```bash
    cd frontend
    npm install
    cp .env.example .env
    # Set VITE_API_BASE_URL=http://localhost:5000/api
    npm run dev
    ```

Your app should now be running at `http://localhost:5173`!

## 📄 License

This project is licensed under the ISC License.