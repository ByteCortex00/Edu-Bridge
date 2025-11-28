# Edu-Bridge Frontend

A modern React Single Page Application (SPA) that provides an intuitive interface for analyzing educational curricula against real-time job market demands. Built with cutting-edge technologies to deliver a seamless user experience for institutions, administrators, and educational stakeholders.

## 🚀 Project Overview

Edu-Bridge Frontend serves as the client-side application for the Edu-Bridge platform, enabling users to:

- **Visualize Skills Gaps**: Interactive dashboards showing curriculum alignment with job market requirements
- **Manage Educational Content**: CRUD operations for institutions, curricula, and course offerings
- **Access Market Intelligence**: Real-time job posting analysis and market trend insights
- **Role-Based Access**: Secure, permissioned access for different user types (admins, institutions, viewers)

The application follows a hybrid authentication approach, combining Clerk's user management with custom backend synchronization for enhanced security and data integrity.

## 🛠 Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Core Framework** | React | ^19.2.0 | UI library with modern hooks and concurrent features |
| **Build Tool** | Vite | ^7.2.2 | Fast development server and optimized production builds |
| **Language** | JavaScript/JSX | ES2022 | Modern JavaScript with JSX syntax |
| **Styling** | Tailwind CSS | ^4.1.17 | Utility-first CSS framework |
| **State Management** | Zustand | ^5.0.8 | Lightweight, scalable state management |
| **Authentication** | Clerk React | ^5.55.0 | User authentication and session management |
| **Routing** | React Router DOM | ^7.9.5 | Client-side routing with protected routes |
| **HTTP Client** | Axios | ^1.13.2 | Promise-based HTTP client with interceptors |
| **Data Visualization** | Recharts | ^3.4.1 | Responsive charting library |
| **Icons** | Lucide React | ^0.553.0 | Beautiful, consistent icon library |
| **Date Utilities** | date-fns | ^4.1.0 | Modern date utility library |

## 📂 Project Structure

```
frontend/
├── src/
│   ├── api/                    # Centralized API service layer
│   │   ├── client.js          # Axios instance with auth interceptors
│   │   ├── auth.js            # Authentication endpoints
│   │   ├── analytics.js       # Dashboard & analysis endpoints
│   │   ├── curricula.js       # Curriculum CRUD operations
│   │   ├── institutions.js    # Institution management
│   │   └── jobs.js            # Job market data endpoints
│   ├── assets/                # Static assets (images, icons)
│   ├── components/            # Reusable UI components
│   │   ├── auth/              # Authentication components
│   │   │   ├── ClerkAuth.jsx      # Clerk authentication wrapper
│   │   │   ├── LoginForm.jsx      # Login form component
│   │   │   ├── RegisterForm.jsx   # Registration form
│   │   │   └── ProtectedRoute.jsx # Route protection wrapper
│   │   └── layout/            # Layout components
│   │       ├── MainLayout.jsx     # Main app layout with navigation
│   │       └── PageLayout.jsx     # Page-specific layouts
│   ├── hooks/                 # Custom React hooks
│   │   └── useClerkSync.js    # Clerk-to-backend user synchronization
│   ├── pages/                 # Route-level page components
│   │   ├── Dashboard.jsx      # Role-based dashboard
│   │   ├── Analysis.jsx       # Skills gap analysis
│   │   ├── Analytics.jsx      # Market trends & insights
│   │   ├── Curricula.jsx      # Curriculum management
│   │   ├── Institutions.jsx   # Institution directory
│   │   ├── Jobs.jsx          # Job market data
│   │   ├── Profile.jsx       # User profile management
│   │   ├── Settings.jsx      # Application settings
│   │   └── Onboarding.jsx    # Institution setup flow
│   ├── store/                 # Global state management
│   │   └── authStore.js       # Authentication state (Zustand)
│   ├── tests/                 # Test utilities and setup
│   │   └── setup.js          # Vitest test configuration
│   ├── App.jsx               # Main application router
│   ├── App.css               # Global styles
│   ├── index.css             # Tailwind CSS imports
│   └── main.jsx              # Application entry point
├── public/                   # Static public assets
├── tests/                    # Integration tests
├── vitest.config.ts          # Vitest configuration
├── vite.config.ts           # Vite build configuration
├── vercel.json              # Vercel deployment configuration
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── eslint.config.js         # ESLint configuration
└── README.md                # This file
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Access to Edu-Bridge backend API
- Clerk account for authentication

### Local Development Setup

1. **Clone and navigate to frontend directory:**
   ```bash
   git clone <repository-url>
   cd edu-bridge/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment configuration:**
   ```bash
   cp .env.example .env
   ```

   Configure the following variables in `.env`:

   | Variable | Description | Development Example |
   |----------|-------------|-------------------|
   | `VITE_API_BASE_URL` | Backend API endpoint | `http://localhost:5000/api` |
   | `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_your_clerk_key_here` |

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend should be running on http://localhost:5000

## 🔑 Key Concepts

### Authentication Sync Flow

Edu-Bridge uses a **hybrid authentication approach** that combines Clerk's user management with custom backend synchronization:

#### How It Works:
1. **Clerk Authentication**: Users authenticate through Clerk's hosted UI
2. **Token Generation**: Clerk provides JWT tokens for API access
3. **Backend Sync**: `useClerkSync` hook synchronizes Clerk user data with MongoDB
4. **Role Assignment**: Backend assigns roles (`admin`, `institution`, `viewer`) and institution relationships
5. **State Persistence**: `authStore` maintains authenticated user state across sessions

#### Key Files:
- `src/hooks/useClerkSync.js`: Handles Clerk-to-backend synchronization
- `src/store/authStore.js`: Zustand store for user session management
- `src/api/auth.js`: Authentication API endpoints

#### Flow Diagram:
```
Clerk Login → useClerkSync → Backend API (/auth/sync) → MongoDB User → authStore → UI Access
```

### API Client Pattern

The application uses a **centralized API client** with automatic authentication injection:

#### Architecture:
- **Base Client**: `src/api/client.js` - Axios instance with interceptors
- **Service Modules**: Feature-specific API modules (auth.js, curricula.js, etc.)
- **Automatic Auth**: Request interceptor injects Clerk JWT tokens
- **Error Handling**: Response interceptor manages authentication errors

#### Key Features:
```javascript
// Automatic token injection
apiClient.interceptors.request.use(async (config) => {
  const token = await getToken(); // From Clerk
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Centralized error handling
apiClient.interceptors.response.use(
  (response) => response.data, // Return data only
  (error) => {
    if (error.status === 401) {
      window.location.href = '/sign-in'; // Auto-redirect
    }
    return Promise.reject(new Error(message));
  }
);
```

#### Usage Example:
```javascript
import { useAPI } from '../api/client';

function MyComponent() {
  const api = useAPI();

  const fetchData = async () => {
    const data = await api.get('/curricula'); // Auto-authenticated
    // Handle response...
  };
}
```

## 🧪 Testing

The frontend uses **Vitest** with **React Testing Library** for comprehensive testing coverage.

### Test Structure:
```
src/
├── components/
│   └── auth/
│       └── __tests__/
│           └── LoginForm.test.jsx
└── tests/
    └── setup.js                    # Global test configuration
```

### Running Tests:

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run coverage
```

### Test Configuration:
- **Environment**: jsdom for DOM simulation
- **Setup**: Global test utilities and cleanup
- **CSS**: CSS processing enabled for styled components
- **Globals**: Vitest globals available without imports

## 🚀 Deployment

### Vercel Deployment

The application is configured for seamless deployment on Vercel:

1. **Connect Repository:**
   - Link your GitHub repository to Vercel
   - Configure build settings:
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

2. **Environment Variables:**
   Set the following in Vercel dashboard:
   ```
   VITE_API_BASE_URL=https://your-backend-api-url/api
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
   ```

3. **Vercel Configuration:**
   The `vercel.json` file handles SPA routing:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

4. **Domain Setup:**
   - Configure custom domain in Vercel
   - Update CORS settings in backend for production domain

### Build Process:
```bash
npm run build    # Creates optimized production build
npm run preview  # Preview production build locally
```

## 🔗 Live Deployment

- **Frontend**: [https://edu-bridge-2b36.vercel.app](https://edu-bridge-2b36.vercel.app)
- **Backend API**: [https://edu-bridge-api-l1uo.onrender.com](https://edu-bridge-api-l1uo.onrender.com)

## 📝 Development Guidelines

### Code Style:
- ESLint configuration for consistent code quality
- Prettier integration recommended
- TypeScript support configured for future migration

### State Management:
- Use Zustand for global state
- Component-level state for local UI concerns
- Persist authentication state across sessions

### API Integration:
- Always use the centralized API client
- Handle loading states and errors appropriately
- Implement proper error boundaries

### Authentication:
- Use `ProtectedRoute` for role-based access control
- Leverage `useClerkSync` for user data synchronization
- Handle authentication errors gracefully

---

For backend documentation, see `../backend/README.md`.