# Edu-Bridge Backend API

A robust Node.js/Express backend service that powers the Edu-Bridge platform, providing secure data management, real-time job market intelligence, and advanced machine learning capabilities for educational curriculum analysis.

## 🚀 Project Overview

The Edu-Bridge backend serves as the central nervous system of the platform, orchestrating:

- **Secure Authentication**: Hybrid Clerk + custom RBAC system for multi-tenant access control
- **Real-time Data Processing**: Live job market data integration via Adzuna API
- **AI-Powered Analysis**: Local ML inference for curriculum-to-job matching using vector embeddings
- **Asynchronous Processing**: Queue-based architecture for heavy ML computations
- **RESTful API**: Comprehensive endpoints for frontend integration

## 🛠 Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime environment |
| **Framework** | Express.js | ^5.1.0 | Web application framework with middleware support |
| **Database** | MongoDB | Atlas | NoSQL document database for flexible data storage |
| **ODM** | Mongoose | ^8.19.2 | MongoDB object modeling with schema validation |
| **Authentication** | Clerk Backend | ^2.22.0 | JWT verification and user session management |
| **Caching/Queues** | IORedis | ^5.8.2 | High-performance Redis client for caching and queues |
| **Queue System** | BullMQ | ^5.63.2 | Modern job queue for Node.js with Redis |
| **ML/AI** | @xenova/transformers | ^2.17.2 | Local transformer models for embedding generation |
| **ML Runtime** | ONNX Runtime Web | ^1.23.0 | Optimized inference engine for ML models |
| **HTTP Client** | Axios | ^1.12.2 | Promise-based HTTP client for external APIs |
| **Security** | bcryptjs | ^3.0.2 | Password hashing for local auth fallback |
| **Validation** | JWT | ^9.0.2 | JSON Web Token handling |
| **CORS** | cors | ^2.8.5 | Cross-origin resource sharing middleware |
| **Webhooks** | Svix | ^1.81.0 | Webhook verification for Clerk events |
| **API Docs** | Swagger | ^6.2.8 | API documentation generation |
| **Development** | Nodemon | ^3.1.10 | Auto-restart during development |
| **Testing** | Jest | ^30.2.0 | JavaScript testing framework |
| **Test DB** | mongodb-memory-server | ^10.3.0 | In-memory MongoDB for testing |

## 🏗 Architecture

### Local Inference ML Approach

Edu-Bridge employs a **client-side ML strategy** using `@xenova/transformers`, eliminating the need for Python dependencies or external ML services:

#### How It Works:
1. **Model Loading**: Pre-trained transformer models load directly in Node.js runtime
2. **Local Inference**: Text-to-embedding conversion happens entirely server-side
3. **Zero External Dependencies**: No Python, CUDA, or cloud ML APIs required
4. **Offline Capability**: ML processing works without internet connectivity

#### Key Benefits:
- **Cost Effective**: No API costs for embedding generation
- **Privacy Focused**: Sensitive curriculum data never leaves the server
- **Performance**: Direct inference avoids network latency
- **Scalable**: Horizontal scaling without external service limitations

### Producer/Consumer Queue Pattern

Heavy ML tasks are offloaded to a **BullMQ-based queue system** for optimal performance:

#### Architecture Flow:
```
API Request → Producer (Controller) → Redis Queue → Consumer (Worker) → Database Update
```

#### Components:
- **Producer**: Express controllers add jobs to Redis queue
- **Queue**: Redis-backed BullMQ manages job persistence and retries
- **Consumer**: Dedicated worker processes handle ML computations
- **Result**: Processed data stored back in MongoDB

#### Benefits:
- **Non-blocking**: API responses return immediately while ML processes in background
- **Reliability**: Failed jobs automatically retry with exponential backoff
- **Monitoring**: Built-in job tracking and error reporting
- **Scalability**: Multiple worker instances can process jobs concurrently

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Redis server (local or cloud)
- Clerk account for authentication

### Local Development Setup

1. **Clone and navigate:**
   ```bash
   git clone <repository-url>
   cd edu-bridge/backend
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

   | Variable | Description | Development Example | Production Example |
   |----------|-------------|-------------------|-------------------|
   | `PORT` | Server port | `5000` | `5000` |
   | `NODE_ENV` | Environment mode | `development` | `production` |
   | `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/edubridge` | `mongodb+srv://user:pass@cluster.mongodb.net/edubridge` |
   | `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | `redis://username:password@host:port` |
   | `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` | `https://edu-bridge.vercel.app` |
   | `CLERK_SECRET_KEY` | Clerk server-side secret | `sk_test_your_secret_key` | `sk_live_your_secret_key` |
   | `CLERK_PUBLISHABLE_KEY` | Clerk client-side key | `pk_test_your_publishable_key` | `pk_live_your_publishable_key` |
   | `CLERK_WEBHOOK_SECRET` | Webhook verification secret | `whsec_your_webhook_secret` | `whsec_your_webhook_secret` |
   | `ADZUNA_APP_ID` | Adzuna API application ID | `your_adzuna_app_id` | `your_adzuna_app_id` |
   | `ADZUNA_APP_KEY` | Adzuna API application key | `your_adzuna_app_key` | `your_adzuna_app_key` |
   | `ML_MODEL_NAME` | Hugging Face model name | `Xenova/all-MiniLM-L6-v2` | `Xenova/all-MiniLM-L6-v2` |

4. **Start Redis server:**
   ```bash
   # Using local Redis
   redis-server

   # Or using Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

5. **Run database setup scripts:**
   ```bash
   # Seed initial institutions
   node utils/institutionsSeeder.js

   # Seed curriculum data
   node utils/curriculumCoursesSeeder.js

   # Create admin user
   node utils/createAdminUser.js
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

7. **Verify setup:**
   - API available at: http://localhost:5000
   - Health check: http://localhost:5000/

## 📜 Utility Scripts

The `utils/` directory contains essential scripts for development and maintenance:

### Database Seeding Scripts

#### `institutionsSeeder.js`
**Purpose**: Populates the database with initial institution data
```bash
node utils/institutionsSeeder.js
```
- Creates sample universities and educational institutions
- Essential for development and testing
- Run once during initial setup

#### `curriculumCoursesSeeder.js`
**Purpose**: Seeds curriculum and course data for testing
```bash
node utils/curriculumCoursesSeeder.js
```
- Creates sample academic programs and courses
- Links courses to curricula with proper relationships
- Generates realistic test data for ML training

### User Management Scripts

#### `createAdminUser.js`
**Purpose**: Creates an administrative user account
```bash
node utils/createAdminUser.js
```
- Prompts for admin credentials
- Assigns 'admin' role with full system access
- Required for initial system administration

#### `setUserRole.js`
**Purpose**: Updates user roles for access control
```bash
node utils/setUserRole.js
```
- Modifies existing user permissions
- Supports role transitions (viewer → institution → admin)
- Useful for testing different access levels

### ML Maintenance Scripts

#### `regenerateEmbeddings.js`
**Purpose**: Regenerates all ML embeddings after model updates
```bash
node utils/regenerateEmbeddings.js
```
- Updates embeddings when ML model version changes
- Processes both curriculum and job posting embeddings
- Critical after ML model upgrades

#### `testSkillExtraction.js`
**Purpose**: Tests and validates skill extraction algorithms
```bash
node utils/testSkillExtraction.js
```
- Validates ML-based skill identification
- Tests against sample job descriptions
- Ensures accuracy of skill gap analysis

## 📂 Project Structure

```
backend/
├── config/                    # Configuration modules
│   ├── db.js                 # MongoDB connection setup
│   ├── mlConfig.js           # ML model and embedding settings
│   └── queue.js              # BullMQ queue configuration
├── controllers/              # Request handlers (business logic)
│   ├── authController.js     # Authentication endpoints
│   ├── curriculumController.js # Curriculum CRUD operations
│   ├── institutionController.js # Institution management
│   ├── jobController.js      # Job market data handling
│   ├── analyticsController.js # Dashboard analytics
│   └── webhookController.js  # Clerk webhook processing
├── middleware/               # Express middleware functions
│   ├── auth.js               # JWT verification middleware
│   ├── clerkAuth.js          # Clerk authentication wrapper
│   ├── errorHandler.js       # Global error handling
│   └── validiator.js         # Request validation middleware
├── models/                   # Mongoose data models
│   ├── userModel.js          # User schema with roles
│   ├── institutionModel.js   # Educational institution schema
│   ├── curriculumModel.js    # Academic program schema
│   ├── coursesModel.js       # Course schema with skills
│   ├── jobPostingModel.js    # Job posting schema
│   └── skillGapModels.js     # Analysis result schemas
├── routes/                   # API route definitions
│   ├── authRoutes.js         # Authentication endpoints
│   ├── curriculumRoutes.js   # Curriculum management routes
│   ├── institutionRoutes.js  # Institution routes
│   ├── jobRoutes.js          # Job market data routes
│   ├── analyticsRoutes.js    # Analytics and reporting
│   └── webhookRoutes.js      # Webhook handling routes
├── services/                 # Business logic and external integrations
│   ├── authService.js        # Authentication business logic
│   ├── mlService.js          # ML model management and inference
│   ├── gapAnalysis.js        # Skills gap calculation algorithms
│   ├── skillExtractor.js     # ML-based skill identification
│   ├── adzunaService.js      # Adzuna API integration
│   └── testService.js        # Testing utilities
├── utils/                    # Utility scripts and helpers
│   ├── createAdminUser.js    # Admin user creation script
│   ├── curriculumCoursesSeeder.js # Database seeding
│   ├── institutionsSeeder.js # Institution data seeding
│   ├── regenerateEmbeddings.js # ML embedding regeneration
│   ├── setUserRole.js        # User role management
│   ├── skillsTaxonomy.js     # Skill classification system
│   ├── testJWT.js            # JWT testing utilities
│   ├── testModel.js          # Model validation scripts
│   └── testSkillExtraction.js # Skill extraction testing
├── workers/                  # Background job processors
│   └── embeddingWorker.js    # ML embedding generation worker
├── tests/                    # Test suites and fixtures
│   ├── setup.js              # Test environment configuration
│   └── auth.test.js          # Authentication test suite
├── server.js                 # Application entry point
├── jest.config.js            # Jest testing configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This documentation
```

### Directory Explanations

#### `controllers/`
**Purpose**: Handle HTTP requests and orchestrate business logic
- Each controller corresponds to a domain (auth, curriculum, jobs)
- Implements RESTful API patterns
- Handles data validation and error responses
- Coordinates between services and database models

#### `services/`
**Purpose**: Encapsulate complex business logic and external integrations
- `mlService.js`: Manages transformer model lifecycle and inference
- `adzunaService.js`: Handles external job market API communications
- `gapAnalysis.js`: Implements skills gap calculation algorithms
- `authService.js`: Custom authentication logic beyond Clerk

#### `workers/`
**Purpose**: Process background jobs asynchronously
- `embeddingWorker.js`: Handles CPU-intensive ML embedding generation
- Uses BullMQ for job queuing and Redis for persistence
- Enables horizontal scaling of ML processing
- Provides job monitoring and error recovery

#### `utils/`
**Purpose**: Development and maintenance utilities
- Database seeding scripts for initial data population
- ML maintenance scripts for model updates
- User management utilities for role assignments
- Testing helpers and validation scripts

## 🔌 API Overview

### Authentication Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | User registration | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/me` | Get current user | Private |
| POST | `/api/auth/sync` | Sync Clerk user data | Private |

### Curriculum Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/curricula` | List curricula (scoped by role) | Private |
| POST | `/api/curricula` | Create new curriculum | Admin/Institution |
| GET | `/api/curricula/:id` | Get specific curriculum | Private |
| PUT | `/api/curricula/:id` | Update curriculum | Admin/Institution |
| DELETE | `/api/curricula/:id` | Delete curriculum | Admin/Institution |
| POST | `/api/curricula/:id/courses` | Add course to curriculum | Admin/Institution |
| GET | `/api/curricula/:id/skills` | Get curriculum skills | Private |

### Institution Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/institutions` | List all institutions | Private |
| POST | `/api/institutions` | Create institution | Admin |
| GET | `/api/institutions/:id` | Get institution details | Private |
| PUT | `/api/institutions/:id` | Update institution | Admin |
| DELETE | `/api/institutions/:id` | Delete institution | Admin |

### Job Market Data
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/jobs` | Search job postings | Private |
| GET | `/api/jobs/:id` | Get job details | Private |
| POST | `/api/jobs/fetch` | Fetch from Adzuna API | Admin |

### Analytics & ML
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/analytics/dashboard` | Dashboard metrics | Private |
| POST | `/api/analytics/gap-analysis` | Skills gap analysis | Private |
| GET | `/api/curricula/embedding-status` | ML embedding status | Admin |
| POST | `/api/curricula/generate-embeddings` | Bulk embedding generation | Admin |

### Webhooks
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/webhooks/clerk` | Clerk user events | Public (Webhook) |

## 🚀 Deployment

### Production Deployment (Render)

1. **Connect Repository:**
   - Link GitHub repository to Render
   - Configure build settings:
     - **Environment**: Node.js
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

2. **Environment Variables:**
   Set all production environment variables in Render dashboard (see setup section above).

3. **Redis Configuration:**
   - Use Redis cloud provider (e.g., Redis Labs, Upstash)
   - Configure `REDIS_URL` with production Redis instance

4. **Database:**
   - Use MongoDB Atlas for production database
   - Configure `MONGODB_URI` with production connection string

5. **Domain Configuration:**
   - Update `FRONTEND_URL` to production frontend URL
   - Configure CORS settings for production domain

### Health Checks

The API includes built-in health monitoring:
- **GET /**: Basic health check
- **GET /api/curricula/embedding-status**: ML service status
- Comprehensive error logging and monitoring

### Scaling Considerations

- **ML Processing**: Use multiple worker instances for heavy embedding loads
- **Redis Clustering**: Implement Redis cluster for high availability
- **Database Indexing**: Ensure proper MongoDB indexes for query performance
- **Rate Limiting**: Implement API rate limiting for production traffic

---

**Live API Endpoint**: `https://edu-bridge-api-l1uo.onrender.com`

