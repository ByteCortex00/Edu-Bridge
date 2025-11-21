# Edu-Bridge Frontend

The client-side application for Edu-Bridge, engineered to provide a seamless and interactive experience for analyzing educational data. It is built as a Single Page Application (SPA) using React and Vite.

## 🔗 Deployment
**Live URL:** [https://edu-bridge-2b36.vercel.app](https://edu-bridge-2b36.vercel.app)

## 🛠 Technology Stack

-   **Core:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (Build Tool)
-   **Language:** JavaScript / JSX (with TypeScript support configured)
-   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Utility-first styling)
-   **State Management:** [Zustand](https://github.com/pmndrs/zustand) (Global state & persistence)
-   **Authentication:** [Clerk SDK](https://clerk.com/) (User management & sessions)
-   **Routing:** [React Router v6](https://reactrouter.com/)
-   **Data Fetching:** [Axios](https://axios-http.com/) (HTTP client with interceptors)
-   **Visualization:** [Recharts](https://recharts.org/) (Responsive charts)
-   **Icons:** [Lucide React](https://lucide.dev/)

## ⚙️ Environment Configuration

Create a `.env` file in the `frontend/` directory. You can copy `.env.example` as a starting point.

| Variable | Description | Example (Dev) | Example (Prod) |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | URL of the Backend API | `http://localhost:5000/api` | `https://edu-bridge-api-l1uo.onrender.com/api` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Public key from Clerk Dashboard | `pk_test_...` | `pk_live_...` |

> **⚠️ Important:** In production (Vercel), ensure `VITE_API_BASE_URL` points to the live Render backend, NOT localhost.

## 📂 Project Architecture

The source code is organized in `src/` following a feature-based and functional structure:

```text
src/
├── api/                 # Centralized API service layer
│   ├── client.js        # Axios instance with Auth interceptors
│   ├── auth.js          # Auth-related endpoints
│   ├── analytics.js     # Analysis & Dashboard endpoints
│   ├── curricula.js     # Curriculum CRUD endpoints
│   ├── institutions.js  # Institution CRUD endpoints
│   └── jobs.js          # Job market data endpoints
├── assets/              # Static assets (images, SVGs)
├── components/          # Reusable UI components
│   ├── auth/            # Authentication forms & wrappers (ClerkAuth, ProtectedRoute)
│   └── layout/          # Layout shells (MainLayout, PageLayout)
├── hooks/               # Custom React Hooks
│   └── useClerkSync.js  # Synchronizes Clerk user data with our MongoDB backend
├── pages/               # Full page views (Route targets)
│   ├── Dashboard.jsx    # Role-based dashboard entry point
│   ├── Analysis.jsx     # Detailed skills gap visualization
│   ├── Analytics.jsx    # Global market trends
│   ├── Curricula.jsx    # Curriculum management
│   └── ...
├── store/               # Global State Management
│   └── authStore.js     # Zustand store for user session & persistence
├── App.jsx              # Main Router configuration
└── main.jsx             # Entry point & Provider wrapping