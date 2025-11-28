# Edu-Bridge

An AI-powered platform that bridges the gap between university curricula and real-time job market demands. Using advanced machine learning, Edu-Bridge analyzes course content against live job postings to provide data-driven insights that help educational institutions align their programs with industry needs.

## 🏗 Architecture Overview

Edu-Bridge follows a modern **decoupled monorepo architecture** with separate frontend and backend applications:

### Frontend (`/frontend`)
- **Framework**: React 19 with Vite build system
- **Styling**: Tailwind CSS v4 for utility-first styling
- **State Management**: Zustand for client-side state
- **Authentication**: Clerk SDK for user management
- **Data Visualization**: Recharts for interactive charts

### Backend (`/backend`)
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Caching/Queues**: Redis with BullMQ for background processing
- **AI/ML**: @xenova/transformers for local ML inference
- **Authentication**: Clerk backend integration with custom RBAC

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Database**: MongoDB Atlas
- **Caching**: Redis (cloud)

## 🌟 Key Features

- **Local ML Inference**: Runs transformer models directly in Node.js without Python dependencies or external APIs
- **Real-Time Job Intelligence**: Integrates with Adzuna API for live job market data across multiple countries
- **Multi-Tenant Data Isolation**: Strict role-based access control ensuring institutions only see their own data
- **Asynchronous Processing**: Queue-based architecture for heavy ML computations using BullMQ
- **Skills Gap Analysis**: Vector similarity search comparing curriculum content against job requirements
- **Interactive Dashboards**: Role-specific interfaces for institutions and administrators
- **Curriculum Management**: Complete CRUD operations for academic programs and courses

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js**: Version 18 or higher (includes npm)
- **MongoDB**: Local installation or MongoDB Atlas account
- **Redis**: Local Redis server or cloud Redis service
- **Git**: For cloning the repository

## 🚀 Getting Started

Follow these steps to set up the complete Edu-Bridge development environment:

### 1. Clone the Repository
```bash
git clone https://github.com/ByteCortex00/Edu-Bridge.git
cd Edu-Bridge
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration (see backend/README.md for details)
# Required: MONGODB_URI, REDIS_URL, CLERK_SECRET_KEY, ADZUNA_APP_ID, etc.

# Seed initial data
node utils/institutionsSeeder.js
node utils/curriculumCoursesSeeder.js
node utils/createAdminUser.js

# Start development server
npm run dev
```

The backend will be available at `http://localhost:5000`

### 3. Frontend Setup
Open a new terminal window and run:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure environment variables
# VITE_API_BASE_URL=http://localhost:5000/api
# VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Verify Setup
- **Frontend**: Visit `http://localhost:5173` to access the application
- **Backend API**: Check `http://localhost:5000/` for the health endpoint
- **Database**: Ensure MongoDB and Redis are running and accessible

## 📁 Directory Structure

```
Edu-Bridge/
├── frontend/                 # React SPA application
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   └── README.md            # Frontend documentation
├── backend/                 # Node.js/Express API
│   ├── controllers/         # Route handlers
│   ├── models/             # Database schemas
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   ├── workers/            # Background job processors
│   ├── utils/              # Utility scripts
│   ├── package.json        # Backend dependencies
│   └── README.md           # Backend documentation
├── .github/                # CI/CD workflows
├── .gitignore             # Git ignore rules
├── package.json           # Root package configuration
└── README.md              # This file
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test          # Run test suite
npm run test:ui   # Run tests with UI
npm run coverage  # Generate coverage report
```

## 🔗 Live Demo

- **Frontend Application**: [https://edu-bridge-2b36.vercel.app](https://edu-bridge-2b36.vercel.app)
- **Backend API**: [https://edu-bridge-api-l1uo.onrender.com](https://edu-bridge-api-l1uo.onrender.com)

## 📄 License

This project is licensed under the ISC License.


## for commit history this project was developed overtime on another repo i just changed the origin to the assignment origin for submission {link to repo: https://github.com/ByteCortex00/Edu-Bridge } 