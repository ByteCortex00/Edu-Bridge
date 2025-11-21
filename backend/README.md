# Edu-Bridge Backend API

The backend service for Edu-Bridge, responsible for data management, authentication, external API integrations, and machine learning inference.

## 🔗 Deployment
**Live Base URL:** `https://edu-bridge-api-l1uo.onrender.com`

## 🛠 Tech Stack
-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Database:** MongoDB with Mongoose
-   **Auth:** Clerk (JWT verification) & custom Role-Based Access Control (RBAC)
-   **ML/AI:** `@xenova/transformers` for local embedding generation & vector similarity
-   **Queues:** BullMQ & IORedis for offloading heavy ML tasks

## ⚙️ Configuration

Create a `.env` file in this directory with the following variables:

```env
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/edubridge
REDIS_URL=redis://localhost:6379

# Security (CORS)
FRONTEND_URL=http://localhost:5173

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# External APIs
ADZUNA_APP_ID=your_adzuna_id
ADZUNA_APP_KEY=your_adzuna_key

# Machine Learning
ML_MODEL_NAME=Xenova/all-MiniLM-L6-v2