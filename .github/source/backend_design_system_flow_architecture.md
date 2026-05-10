# Backend Design System, Flow, Architecture, and Database Design

The goal is to build a **Node.js + Express + MongoDB + Ollama VPS** MVP step by step.

You should **not build the whole backend at once**. Build one small phase, test it independently, confirm expected behavior, then move to the next phase.

One important correction before the design: in current Ollama documentation, the embeddings endpoint is **`POST /api/embed`**, not `/api/embeddings`. The old name may still appear in some examples, but your Node backend should wrap this behind an internal `ollamaService.createEmbedding()` method so the rest of your app does not care which Ollama endpoint is used. Ollama’s current API exposes `/api/chat`, `/api/generate`, `/api/embed`, `/api/tags`, `/api/ps`, and admin/model-management endpoints like pull, copy, push, and delete. ([docs.ollama.com](https://docs.ollama.com/api/introduction))

---

# 1. Final Backend Goal

You are building a backend for a MERN AI chatbot with:

1. User authentication.
2. Multi-chat conversation history.
3. Model selector.
4. Ollama-powered chat.
5. MongoDB-based long-term memory using vector search.
6. Safe hidden backend wrappers around Ollama.
7. No PDF upload in MVP.
8. RAG used only for conversational memory.
9. Admin-only monitoring routes.
10. Strict blocking of dangerous Ollama endpoints.

The final flow should look like this:

```txt
React Frontend
   |
   | HTTPS request
   v
Node.js / Express Backend
   |
   |-- Auth / JWT / sessions
   |
   |-- MongoDB Atlas
   |      |-- users
   |      |-- conversations
   |      |-- messages with embeddings
   |
   |-- Ollama VPS
          |-- /api/chat
          |-- /api/generate
          |-- /api/embed
          |-- /api/tags
          |-- /api/ps
```

MongoDB Vector Search is suitable for this because it lets you store embeddings with normal operational data and perform semantic search for RAG-style retrieval. MongoDB’s `$vectorSearch` stage performs semantic search on indexed vector fields, can use pre-filters, and vector fields must be no more than 4096 dimensions wide. ([mongodb.com](https://www.mongodb.com/docs/manual/reference/operator/aggregation/vectorsearch/))

---

# 2. Backend Architecture

## 2.1 Main Backend Layers

Use a layered backend structure:

```txt
src/
  server.js
  app.js

  config/
    env.js
    database.js
    cors.js
    security.js

  models/
    User.model.js
    Conversation.model.js
    Message.model.js
    RefreshSession.model.js
    SystemLog.model.js

  routes/
    auth.routes.js
    user.routes.js
    model.routes.js
    conversation.routes.js
    chat.routes.js
    generate.routes.js
    admin.routes.js
    health.routes.js

  controllers/
    auth.controller.js
    user.controller.js
    model.controller.js
    conversation.controller.js
    chat.controller.js
    generate.controller.js
    admin.controller.js

  services/
    auth.service.js
    token.service.js
    password.service.js
    ollama.service.js
    rag.service.js
    embedding.service.js
    memory.service.js
    conversation.service.js
    message.service.js
    model.service.js

  repositories/
    user.repository.js
    conversation.repository.js
    message.repository.js
    refreshSession.repository.js

  middlewares/
    auth.middleware.js
    admin.middleware.js
    error.middleware.js
    rateLimit.middleware.js
    validate.middleware.js
    requestId.middleware.js

  validators/
    auth.validators.js
    chat.validators.js
    conversation.validators.js
    model.validators.js

  utils/
    apiResponse.js
    AppError.js
    logger.js
    asyncHandler.js
    constants.js

  tests/
    unit/
    integration/
```

## 2.2 Backend Design Rules

Follow these rules throughout every phase:

```txt
Controller = receives HTTP request and sends HTTP response.
Service = contains business logic.
Repository = talks to MongoDB.
Middleware = handles cross-cutting concerns like auth, logging, errors.
Ollama service = the only place allowed to call Ollama.
RAG service = the only place allowed to build AI context.
Frontend = never talks directly to Ollama.
```

This separation protects you later. For example, if Ollama changes `/api/embed` again, only `ollama.service.js` changes.

---

# 3. Core Backend API Design

## 3.1 Public User APIs

These are safe for logged-in users:

```txt
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/models
GET    /api/models/status

POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:conversationId
PATCH  /api/conversations/:conversationId
DELETE /api/conversations/:conversationId

GET    /api/conversations/:conversationId/messages
POST   /api/conversations/:conversationId/messages

POST   /api/tools/:toolId/run
```

## 3.2 Internal Backend-to-Ollama Calls

These should never be exposed directly to React:

```txt
ollamaService.chat()
  -> calls Ollama POST /api/chat

ollamaService.generate()
  -> calls Ollama POST /api/generate

ollamaService.createEmbedding()
  -> calls Ollama POST /api/embed

ollamaService.listModels()
  -> calls Ollama GET /api/tags

ollamaService.listRunningModels()
  -> calls Ollama GET /api/ps
```

Ollama’s `/api/tags` returns locally available models, and `/api/ps` returns models currently loaded/running in memory. ([docs.ollama.com](https://docs.ollama.com/api/tags))

## 3.3 Admin-Only APIs

These are only for you:

```txt
GET /api/admin/status
GET /api/admin/ollama/tags
GET /api/admin/ollama/ps
GET /api/admin/system/logs
```

## 3.4 Endpoints You Should Not Build

Do **not** build backend routes that proxy these Ollama endpoints:

```txt
POST   /api/pull
DELETE /api/delete
POST   /api/copy
POST   /api/push
POST   /api/create
```

Ollama exposes model-management endpoints such as pull, copy, push, and delete; delete can remove a local model. These should not be reachable from your app users. ([docs.ollama.com](https://docs.ollama.com/api/introduction))

---

# 4. Standard API Response Format

Use one response format everywhere.

## Success Response

```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {},
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-05-09T10:00:00.000Z"
  }
}
```

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-05-09T10:00:00.000Z"
  }
}
```

## Common Status Codes

```txt
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Internal Server Error
503 AI Service Unavailable
```

---

# 5. Database Design

You can start with four core collections:

```txt
users
refresh_sessions
conversations
messages
```

Later, add:

```txt
system_logs
model_cache
memory_facts
usage_events
```

---

## 5.1 Users Collection

```js
{
  _id: ObjectId,

  name: String,
  email: String,
  passwordHash: String,

  role: "user" | "admin",
  plan: "free" | "pro",

  isEmailVerified: Boolean,
  isActive: Boolean,

  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

### Indexes

```js
email: unique
role
createdAt
```

### Purpose

Stores the user account, login identity, and authorization role.

---

## 5.2 Refresh Sessions Collection

```js
{
  _id: ObjectId,

  userId: ObjectId,
  refreshTokenHash: String,

  userAgent: String,
  ipAddress: String,

  isRevoked: Boolean,
  revokedAt: Date,

  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```js
userId
refreshTokenHash
expiresAt TTL
```

### Purpose

Lets you support secure refresh tokens and logout.

---

## 5.3 Conversations Collection

```js
{
  _id: ObjectId,

  userId: ObjectId,
  userIdStr: String,

  title: String,
  selectedModel: String,

  status: "active" | "archived" | "deleted",

  messageCount: Number,

  lastMessageAt: Date,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}
```

### Indexes

```js
userId + updatedAt
userId + status
userId + lastMessageAt
```

### Purpose

Represents a single chat thread in the sidebar.

---

## 5.4 Messages Collection

This is the most important collection for your MVP.

```js
{
  _id: ObjectId,

  userId: ObjectId,
  userIdStr: String,

  conversationId: ObjectId,
  conversationIdStr: String,

  role: "user" | "assistant" | "system",

  content: String,
  contentPreview: String,

  model: String,

  embedding: [Number],
  embeddingModel: String,
  embeddingDim: Number,

  isMemoryEligible: Boolean,

  tokenUsage: {
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number
  },

  metadata: {
    source: "chat" | "tool" | "system",
    ragUsed: Boolean,
    retrievedMemoryIds: [ObjectId],
    ollamaDurationMs: Number
  },

  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}
```

### Normal Indexes

```js
userId + conversationId + createdAt
conversationId + createdAt
userId + createdAt
userId + role
isMemoryEligible
```

### Vector Search Index

Example MongoDB Atlas Vector Search index:

```js
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userIdStr"
    },
    {
      "type": "filter",
      "path": "conversationIdStr"
    },
    {
      "type": "filter",
      "path": "role"
    },
    {
      "type": "filter",
      "path": "isMemoryEligible"
    }
  ]
}
```

Use the actual `numDimensions` returned by your chosen embedding model. Ollama’s current embed endpoint accepts `model`, `input`, optional `dimensions`, and returns an `embeddings` array. ([docs.ollama.com](https://docs.ollama.com/api/embed))

MongoDB Vector Search must have a vector search index before querying, and the Node.js driver can run vector search through an aggregation pipeline using `$vectorSearch`. ([mongodb.com](https://www.mongodb.com/docs/drivers/node/current/atlas-vector-search/))

---

# 6. RAG Memory Design

Your MVP memory system should work like this:

```txt
User sends message
   |
   v
Save user message without embedding first
   |
   v
Create embedding for user message
   |
   v
Update message with embedding
   |
   v
Create embedding for current question
   |
   v
Run MongoDB Vector Search against past messages
   |
   v
Fetch recent messages from current conversation
   |
   v
Build prompt:
   - system instructions
   - relevant long-term memories
   - recent conversation window
   - current user message
   |
   v
Call Ollama /api/chat
   |
   v
Save assistant response
   |
   v
Return answer to React
```

Use `$vectorSearch` as the first stage in the aggregation pipeline, because MongoDB documents that `$vectorSearch` must be the first stage wherever it appears. MongoDB also returns vector similarity scores in a 0-to-1 range. ([mongodb.com](https://www.mongodb.com/docs/vector-search/query/aggregation-stages/vector-search-stage/))

---

# 7. RAG Prompt Structure

Use this structure when calling Ollama `/api/chat`:

```json
{
  "model": "qwen2.5-coder:1.5b",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful AI assistant. Use the provided memory only when relevant. Do not claim memory if it is not in the context."
    },
    {
      "role": "system",
      "content": "Relevant long-term memory:\n1. User said: Hi, I am Rahul. I love MERN stack."
    },
    {
      "role": "user",
      "content": "What is my name and what do I do?"
    }
  ],
  "stream": false
}
```

For the MVP, keep it simple:

```txt
recentMessagesLimit = 6 to 10
memoryTopK = 3 to 5
numCandidates = 50 to 100
embed only user messages first
```

Later, you can add extracted factual memories.

---

# 8. Recommended Environment Variables

```env
NODE_ENV=development
PORT=5000

CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://...

JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

OLLAMA_BASE_URL=http://your-vps-ip:11434/api
OLLAMA_CHAT_MODEL_DEFAULT=qwen2.5-coder:1.5b
OLLAMA_EMBEDDING_MODEL=embeddinggemma

ALLOWED_CHAT_MODELS=qwen2.5-coder:1.5b,llama3.2:1b
ADMIN_EMAILS=your-email@example.com

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
```

Express 5 requires Node.js 18 or higher, so your backend deployment should use at least that runtime. ([expressjs.com](https://expressjs.com/en/5x/api.html))

---

# 9. Final Request Flow

## 9.1 Signup Flow

```txt
React signup form
   |
POST /api/auth/signup
   |
Validate email/password/name
   |
Hash password
   |
Create user
   |
Return access token + refresh token
```

## 9.2 Login Flow

```txt
React login form
   |
POST /api/auth/login
   |
Find user by email
   |
Compare password
   |
Create refresh session
   |
Return tokens
```

## 9.3 Chat Flow

```txt
React sends message
   |
POST /api/conversations/:id/messages
   |
Auth middleware confirms user
   |
Validate conversation ownership
   |
Save user message
   |
Create embedding
   |
Search memory
   |
Fetch recent conversation messages
   |
Build Ollama chat payload
   |
Call Ollama /api/chat
   |
Save assistant message
   |
Return assistant message
```

## 9.4 Model Selector Flow

```txt
React loads chat page
   |
GET /api/models
   |
Node calls Ollama /api/tags
   |
Node filters by ALLOWED_CHAT_MODELS
   |
React displays dropdown
```

## 9.5 Admin Status Flow

```txt
Admin opens hidden dashboard
   |
GET /api/admin/ollama/ps
   |
Node calls Ollama /api/ps
   |
Admin sees currently loaded models
```

---

# 10. Phase-by-Phase Backend Development Plan

I am dividing this into **32 small phases**. Each phase should be implemented, tested, and committed before moving forward.

> Note: The numbering below intentionally goes beyond 32 because several additional production-readiness phases were added after the core MVP phases.

---

## Phase 1: Requirements Lock and Backend Scope

### Goal

Freeze the MVP backend scope so you do not keep changing architecture mid-build.

### Implement

Create a simple `MVP_BACKEND_SCOPE.md` file.

Define:

```txt
Included:
- Auth
- JWT login
- Multi-chat conversations
- Message history
- Ollama chat
- Model selector
- MongoDB Vector Search memory
- Admin status dashboard

Excluded from MVP:
- PDF uploads
- Excel uploads
- File parsing
- Payments
- Team accounts
- Voice chat
- Image chat
```

### API Endpoints Added

None.

### Database Changes

None.

### Test

Manual review.

### Expected Result

You have one written document that says exactly what the backend will and will not do.

### Move to Next Phase When

You can explain the MVP in one sentence:

```txt
A logged-in user can chat with an Ollama model, maintain multiple conversations, and the AI can retrieve relevant past messages using MongoDB Vector Search.
```

---

## Phase 2: Git Repository and Project Structure

### Goal

Create the backend project skeleton.

### Implement

Create project:

```txt
backend/
  src/
  tests/
  .env.example
  .gitignore
  package.json
  README.md
```

Install base dependencies:

```txt
express
mongoose
dotenv
cors
helmet
bcrypt
jsonwebtoken
zod
axios
cookie-parser
express-rate-limit
```

Install dev dependencies:

```txt
nodemon
jest or vitest
supertest
eslint
prettier
```

### API Endpoints Added

None.

### Database Changes

None.

### Test

Run:

```bash
npm install
npm run lint
npm test
```

### Expected Result

No syntax errors. Empty test suite should run successfully.

### Move to Next Phase When

The backend can be installed and started without errors.

---

## Phase 3: Environment Configuration System

### Goal

Centralize all environment variables.

### Implement

Create:

```txt
src/config/env.js
```

Validate required environment variables:

```txt
NODE_ENV
PORT
MONGODB_URI
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
OLLAMA_BASE_URL
OLLAMA_CHAT_MODEL_DEFAULT
OLLAMA_EMBEDDING_MODEL
ALLOWED_CHAT_MODELS
```

Use Zod or a manual validator.

### API Endpoints Added

None.

### Database Changes

None.

### Test

Start server with missing `.env`.

### Expected Result

Server should fail clearly:

```json
{
  "error": "Missing required environment variable: MONGODB_URI"
}
```

Start server with valid `.env`.

### Expected Result

Server should boot.

### Move to Next Phase When

Bad config fails fast and good config starts cleanly.

---

## Phase 4: Basic Express App

### Goal

Create the Express app and server entry point.

### Implement

Create:

```txt
src/app.js
src/server.js
```

Add:

```txt
express.json()
cookieParser()
cors()
helmet()
request logging placeholder
global 404 handler
global error handler placeholder
```

### API Endpoints Added

```txt
GET /api/health
```

### Expected Response

```json
{
  "success": true,
  "message": "Backend is healthy"
}
```

### Database Changes

None.

### Test

Call:

```bash
curl http://localhost:5000/api/health
```

### Expected Result

Status `200`.

### Move to Next Phase When

Health endpoint works every time.

---

## Phase 5: Standard API Response and Error Classes

### Goal

Make all responses consistent.

### Implement

Create:

```txt
src/utils/apiResponse.js
src/utils/AppError.js
src/middlewares/error.middleware.js
src/utils/asyncHandler.js
```

Define reusable helpers:

```txt
sendSuccess()
sendCreated()
sendError()
AppError
asyncHandler
```

### API Endpoints Added

Update:

```txt
GET /api/health
GET /api/unknown-route
```

### Database Changes

None.

### Test

Call unknown route:

```bash
curl http://localhost:5000/api/not-found
```

### Expected Result

```json
{
  "success": false,
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Route not found"
  }
}
```

### Move to Next Phase When

All success and error responses follow one format.

---

## Phase 6: MongoDB Connection

### Goal

Connect Express to MongoDB.

### Implement

Create:

```txt
src/config/database.js
```

Add:

```txt
connectDB()
disconnectDB()
connection event logging
graceful shutdown
```

### API Endpoints Added

Update:

```txt
GET /api/health
```

Return:

```json
{
  "database": "connected"
}
```

### Database Changes

None yet.

### Test

Use valid `MONGODB_URI`.

### Expected Result

Server logs:

```txt
MongoDB connected successfully
```

Use invalid `MONGODB_URI`.

### Expected Result

Server should fail clearly and not pretend to be healthy.

### Move to Next Phase When

MongoDB connection is reliable.

---

## Phase 7: Request ID and Logging

### Goal

Every request should have a trace ID.

### Implement

Create:

```txt
src/middlewares/requestId.middleware.js
src/utils/logger.js
```

Every request gets:

```txt
req.requestId
```

Every response includes:

```json
{
  "meta": {
    "requestId": "req_xxx"
  }
}
```

### API Endpoints Added

No new endpoint.

### Database Changes

None.

### Test

Call:

```bash
curl http://localhost:5000/api/health
```

### Expected Result

Response includes `requestId`.

### Move to Next Phase When

Every response includes a request ID.

---

## Phase 8: User Model

### Goal

Create the user database model.

### Implement

Create:

```txt
src/models/User.model.js
src/repositories/user.repository.js
```

Fields:

```txt
name
email
passwordHash
role
plan
isActive
isEmailVerified
lastLoginAt
createdAt
updatedAt
```

### API Endpoints Added

None.

### Database Changes

Create `users` collection.

### Indexes

```txt
email unique
role
createdAt
```

### Test

Use a temporary script or unit test to create a user.

### Expected Result

User is saved with:

```txt
email lowercased
password not stored as plain text
timestamps present
```

### Move to Next Phase When

User model saves and unique email index works.

---

## Phase 9: Password Hashing Service

### Goal

Create secure password hashing utilities.

### Implement

Create:

```txt
src/services/password.service.js
```

Methods:

```txt
hashPassword(password)
comparePassword(password, passwordHash)
```

Use bcrypt.

### API Endpoints Added

None.

### Database Changes

None.

### Test

Unit test:

```txt
hashPassword("Password123!")
comparePassword("Password123!", hash) => true
comparePassword("wrong", hash) => false
```

### Expected Result

Plain password is never equal to hash.

### Move to Next Phase When

Password hashing and comparison pass tests.

---

## Phase 10: Signup API

### Goal

Allow new users to register.

### Implement

Create:

```txt
src/routes/auth.routes.js
src/controllers/auth.controller.js
src/services/auth.service.js
src/validators/auth.validators.js
```

Validation:

```txt
name required
email valid
password minimum length
password must not be empty
```

### API Endpoints Added

```txt
POST /api/auth/signup
```

### Request

```json
{
  "name": "Rahul",
  "email": "rahul@example.com",
  "password": "Password123!"
}
```

### Expected Response

```json
{
  "success": true,
  "message": "Signup successful",
  "data": {
    "user": {
      "id": "...",
      "name": "Rahul",
      "email": "rahul@example.com"
    }
  }
}
```

### Database Changes

New document in `users`.

### Test

Test valid signup.

Expected:

```txt
201 Created
user saved
passwordHash exists
password not returned
```

Test duplicate signup.

Expected:

```txt
409 Conflict
EMAIL_ALREADY_EXISTS
```

Test bad email.

Expected:

```txt
422 Validation Error
```

### Move to Next Phase When

Signup works and password is never leaked.

---

## Phase 11: Login API

### Goal

Allow users to log in.

### Implement

Add login logic in:

```txt
auth.controller.js
auth.service.js
```

### API Endpoints Added

```txt
POST /api/auth/login
```

### Request

```json
{
  "email": "rahul@example.com",
  "password": "Password123!"
}
```

### Expected Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "...",
    "user": {
      "id": "...",
      "name": "Rahul",
      "email": "rahul@example.com",
      "role": "user"
    }
  }
}
```

### Database Changes

Update:

```txt
users.lastLoginAt
```

### Test

Valid credentials.

Expected:

```txt
200 OK
access token returned
```

Wrong password.

Expected:

```txt
401 Unauthorized
AUTH_INVALID_CREDENTIALS
```

Unknown email.

Expected:

```txt
401 Unauthorized
AUTH_INVALID_CREDENTIALS
```

### Move to Next Phase When

Login is secure and does not reveal whether email or password was wrong.

---

## Phase 12: JWT Access Token Service

### Goal

Protect private routes.

### Implement

Create:

```txt
src/services/token.service.js
src/middlewares/auth.middleware.js
```

Methods:

```txt
signAccessToken(user)
verifyAccessToken(token)
requireAuth()
```

### API Endpoints Added

```txt
GET /api/auth/me
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Rahul",
      "email": "rahul@example.com"
    }
  }
}
```

### Database Changes

None.

### Test

Call `/api/auth/me` without token.

Expected:

```txt
401 Unauthorized
```

Call with valid token.

Expected:

```txt
200 OK
user returned
```

Call with invalid token.

Expected:

```txt
401 Unauthorized
```

### Move to Next Phase When

Private route protection works.

---

## Phase 13: Refresh Token and Logout

### Goal

Make authentication production-friendly.

### Implement

Create:

```txt
src/models/RefreshSession.model.js
src/repositories/refreshSession.repository.js
```

Add:

```txt
createRefreshSession()
rotateRefreshToken()
revokeRefreshToken()
logout()
```

### API Endpoints Added

```txt
POST /api/auth/refresh
POST /api/auth/logout
```

### Database Changes

Create `refresh_sessions`.

### Test

Login.

Expected:

```txt
refresh session created
```

Refresh token.

Expected:

```txt
new access token returned
```

Logout.

Expected:

```txt
refresh session revoked
```

Use old refresh token after logout.

Expected:

```txt
401 Unauthorized
```

### Move to Next Phase When

Session lifecycle works.

---

## Phase 14: Authorization Roles

### Goal

Separate normal users from admins.

### Implement

Create:

```txt
src/middlewares/admin.middleware.js
```

Add:

```txt
requireAdmin()
```

### API Endpoints Added

```txt
GET /api/admin/status
```

### Expected Response for Admin

```json
{
  "success": true,
  "message": "Admin API available"
}
```

### Test

Normal user calls admin route.

Expected:

```txt
403 Forbidden
```

Admin user calls admin route.

Expected:

```txt
200 OK
```

### Move to Next Phase When

Admin protection is working.

---

## Phase 15: Ollama Service Wrapper

### Goal

Create one safe internal service for all Ollama communication.

### Implement

Create:

```txt
src/services/ollama.service.js
```

Methods:

```txt
chat({ model, messages, options })
generate({ model, prompt, system, options })
createEmbedding({ model, input })
listModels()
listRunningModels()
```

Important:

```txt
Do not expose raw Ollama URLs to controllers.
Do not let user pass arbitrary Ollama endpoint names.
Do not implement pull/delete/copy/push.
```

### API Endpoints Added

None yet.

### Database Changes

None.

### Test

Unit test with mocked HTTP client.

Expected:

```txt
ollamaService.chat() calls only /api/chat
ollamaService.createEmbedding() calls only /api/embed
ollamaService.listModels() calls only /api/tags
```

### Move to Next Phase When

Ollama is wrapped behind a safe internal interface.

---

## Phase 16: Ollama Health Check

### Goal

Check whether the AI server is reachable.

### Implement

Add a health method:

```txt
ollamaService.healthCheck()
```

It can call:

```txt
GET /api/tags
```

### API Endpoints Added

```txt
GET /api/health/ai
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "ollama": "reachable"
  }
}
```

### Test

Ollama running.

Expected:

```txt
200 OK
ollama reachable
```

Ollama stopped or wrong URL.

Expected:

```txt
503 AI Service Unavailable
```

### Move to Next Phase When

Backend can detect whether Ollama is reachable.

---

## Phase 17: Model List API

### Goal

Build the model selector backend.

### Implement

Use:

```txt
ollamaService.listModels()
```

Filter returned models using:

```txt
ALLOWED_CHAT_MODELS
```

Never show every installed model unless you want users to access all of them.

### API Endpoints Added

```txt
GET /api/models
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "name": "qwen2.5-coder:1.5b",
        "isDefault": true
      },
      {
        "name": "llama3.2:1b",
        "isDefault": false
      }
    ]
  }
}
```

### Database Changes

None.

### Test

With allowed models configured.

Expected:

```txt
Only allowed models are returned
```

With Ollama returning extra models.

Expected:

```txt
Extra models are hidden
```

### Move to Next Phase When

Frontend can safely populate model dropdown.

---

## Phase 18: Model Status API

### Goal

Show whether the selected model is currently loaded.

### Implement

Use:

```txt
ollamaService.listRunningModels()
```

### API Endpoints Added

```txt
GET /api/models/status
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "runningModels": [
      {
        "name": "qwen2.5-coder:1.5b",
        "loaded": true
      }
    ]
  }
}
```

### Database Changes

None.

### Test

Call endpoint before chat.

Expected:

```txt
Maybe empty list
```

Call after using model.

Expected:

```txt
Model may appear as running
```

### Move to Next Phase When

Frontend can show “AI Ready” or “Waking up AI”.

---

## Phase 19: Conversation Model

### Goal

Create chat sidebar backend storage.

### Implement

Create:

```txt
src/models/Conversation.model.js
src/repositories/conversation.repository.js
src/services/conversation.service.js
```

Fields:

```txt
userId
userIdStr
title
selectedModel
status
messageCount
lastMessageAt
createdAt
updatedAt
deletedAt
```

### API Endpoints Added

None yet.

### Database Changes

Create `conversations`.

### Test

Create conversation from test script.

Expected:

```txt
conversation saved
belongs to user
default title exists
status active
```

### Move to Next Phase When

Conversation model works.

---

## Phase 20: Conversation CRUD APIs

### Goal

Let users create, list, rename, and delete chats.

### API Endpoints Added

```txt
POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:conversationId
PATCH  /api/conversations/:conversationId
DELETE /api/conversations/:conversationId
```

### Implement

Rules:

```txt
User can only access own conversations.
Delete should be soft delete.
Default title can be "New Chat".
selectedModel must be in allowed model list.
```

### Test

Create conversation.

Expected:

```txt
201 Created
```

List conversations.

Expected:

```txt
Only current user's conversations
```

Access another user’s conversation.

Expected:

```txt
404 Not Found or 403 Forbidden
```

Rename conversation.

Expected:

```txt
title updated
```

Delete conversation.

Expected:

```txt
status becomes deleted
deletedAt set
```

### Move to Next Phase When

Sidebar backend is complete.

---

## Phase 21: Message Model

### Goal

Create storage for chat messages.

### Implement

Create:

```txt
src/models/Message.model.js
src/repositories/message.repository.js
src/services/message.service.js
```

Fields:

```txt
userId
userIdStr
conversationId
conversationIdStr
role
content
contentPreview
model
embedding
embeddingModel
embeddingDim
isMemoryEligible
tokenUsage
metadata
createdAt
updatedAt
deletedAt
```

### API Endpoints Added

None yet.

### Database Changes

Create `messages`.

### Test

Create user message.

Expected:

```txt
role = user
content saved
userId saved
conversationId saved
isMemoryEligible = true
```

Create assistant message.

Expected:

```txt
role = assistant
isMemoryEligible can be false for MVP
```

### Move to Next Phase When

Messages can be saved and queried by conversation.

---

## Phase 22: Get Conversation Messages API

### Goal

Let frontend load old messages when user clicks a chat.

### API Endpoints Added

```txt
GET /api/conversations/:conversationId/messages
```

### Query Params

```txt
limit
before
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "...",
        "role": "user",
        "content": "Hi, I am Rahul",
        "createdAt": "..."
      },
      {
        "id": "...",
        "role": "assistant",
        "content": "Nice to meet you, Rahul!",
        "createdAt": "..."
      }
    ]
  }
}
```

### Test

Conversation with messages.

Expected:

```txt
Messages returned oldest to newest
```

Empty conversation.

Expected:

```txt
Empty array
```

Another user’s conversation.

Expected:

```txt
404 or 403
```

### Move to Next Phase When

Frontend can display chat history.

---

## Phase 23: Simple Chat Without RAG

### Goal

First prove Ollama chat works before adding memory.

### Implement

When user sends message:

```txt
1. Validate conversation ownership.
2. Save user message.
3. Fetch last 6 messages from same conversation.
4. Send them to Ollama /api/chat.
5. Save assistant response.
6. Return assistant response.
```

### API Endpoints Added

```txt
POST /api/conversations/:conversationId/messages
```

### Request

```json
{
  "content": "Hello, who are you?",
  "model": "qwen2.5-coder:1.5b"
}
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "userMessage": {},
    "assistantMessage": {}
  }
}
```

### Database Changes

Two messages saved:

```txt
user message
assistant message
```

### Test

Send first message.

Expected:

```txt
User message saved
Assistant response saved
Conversation messageCount increases
lastMessageAt updated
```

Send second message.

Expected:

```txt
Ollama receives recent context
```

### Move to Next Phase When

Basic chat works without vector memory.

---

## Phase 24: Chat Error Handling

### Goal

Make chat failure safe.

### Implement

Handle:

```txt
Ollama timeout
Ollama 500 error
Ollama unavailable
Invalid model
Empty message
Message too long
```

### API Endpoints Updated

```txt
POST /api/conversations/:conversationId/messages
```

### Test

Stop Ollama and send message.

Expected:

```txt
503 AI Service Unavailable
user message may be saved with metadata.aiFailed = true
assistant message not saved
```

Send empty message.

Expected:

```txt
422 Validation Error
```

Send disallowed model.

Expected:

```txt
400 Bad Request
MODEL_NOT_ALLOWED
```

### Move to Next Phase When

Chat failures do not crash backend.

---

## Phase 25: Embedding Service

### Goal

Create embeddings for text.

### Implement

Create:

```txt
src/services/embedding.service.js
```

Method:

```txt
createTextEmbedding(text)
```

Internally calls:

```txt
ollamaService.createEmbedding({
  model: OLLAMA_EMBEDDING_MODEL,
  input: text
})
```

### API Endpoints Added

For development only:

```txt
POST /api/dev/embeddings/test
```

Protect this route or remove it before production.

### Request

```json
{
  "text": "Hi, I am Rahul. I love MERN stack."
}
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "dimension": 768,
    "embeddingPreview": [0.012, -0.453, 0.881]
  }
}
```

### Database Changes

None yet.

### Test

Send normal text.

Expected:

```txt
embedding array returned
dimension is stable
```

Send same text twice.

Expected:

```txt
same dimension both times
```

### Move to Next Phase When

Embedding generation works reliably.

---

## Phase 26: Save Embeddings on User Messages

### Goal

Store vector memory in MongoDB.

### Implement

Update chat message flow:

```txt
1. Save user message.
2. Generate embedding for user message.
3. Update user message with embedding, embeddingModel, embeddingDim.
```

For MVP:

```txt
Embed only role = user messages.
Do not embed assistant responses yet.
```

### API Endpoints Updated

```txt
POST /api/conversations/:conversationId/messages
```

### Database Changes

`messages.embedding` now populated.

### Test

Send:

```txt
Hi, I am Rahul. I love MERN stack.
```

Expected in DB:

```txt
content saved
embedding exists
embedding.length matches expected dimension
embeddingModel saved
isMemoryEligible = true
```

If embedding fails.

Expected:

```txt
message still saved
metadata.embeddingFailed = true
chat can still continue
```

### Move to Next Phase When

User messages are stored with embeddings.

---

## Phase 27: MongoDB Vector Search Index

### Goal

Enable semantic memory search.

### Implement

Create Atlas Vector Search index on `messages`.

Example:

```js
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userIdStr"
    },
    {
      "type": "filter",
      "path": "role"
    },
    {
      "type": "filter",
      "path": "isMemoryEligible"
    }
  ]
}
```

### API Endpoints Added

Development only:

```txt
POST /api/dev/memory/search
```

### Request

```json
{
  "query": "What is my name and what technology do I like?"
}
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "content": "Hi, I am Rahul. I love MERN stack.",
        "score": 0.89
      }
    ]
  }
}
```

### Database Changes

Atlas Vector Search index created.

### Test

Insert message:

```txt
Hi, I am Rahul. I love MERN stack.
```

Search:

```txt
What is my name?
```

Expected:

```txt
Rahul message appears in top results
```

Search from another user.

Expected:

```txt
Other user's messages do not appear
```

### Move to Next Phase When

Vector search returns relevant private user memories.

---

## Phase 28: Memory Retrieval Service

### Goal

Move vector search into a clean service.

### Implement

Create:

```txt
src/services/memory.service.js
```

Method:

```txt
retrieveRelevantMemories({
  userId,
  queryText,
  limit
})
```

Steps:

```txt
1. Create query embedding.
2. Run $vectorSearch on messages.
3. Filter by userIdStr.
4. Filter isMemoryEligible = true.
5. Exclude deleted messages.
6. Return content, score, messageId, createdAt.
```

### API Endpoints Updated

No public endpoint yet.

### Database Changes

None.

### Test

Unit test with mocked vector results.

Expected:

```txt
Only high-quality memory snippets returned
```

Integration test with real MongoDB Atlas.

Expected:

```txt
Relevant memories returned
```

### Move to Next Phase When

Memory retrieval is reusable and independent.

---

## Phase 29: RAG Prompt Builder

### Goal

Build the final prompt safely.

### Implement

Create:

```txt
src/services/rag.service.js
```

Methods:

```txt
buildSystemPrompt()
formatMemoryBlock()
formatRecentMessages()
buildChatMessages()
```

Final payload shape:

```txt
system instructions
memory system block
recent conversation messages
current user message
```

### Rules

```txt
Do not inject unlimited memories.
Do not include memories from other users.
Do not include raw database IDs in prompt.
Do not say "I remember" unless memory is present.
Limit memory block size.
```

### API Endpoints Added

None.

### Database Changes

None.

### Test

Input:

```txt
current message = "What is my name?"
memory = "Hi, I am Rahul."
recent messages = []
```

Expected output:

```txt
Ollama messages include memory block before current user message
```

Input with no memory.

Expected:

```txt
No fake memory block
```

### Move to Next Phase When

Prompt builder creates clean, predictable Ollama payloads.

---

## Phase 30: Full RAG Chat Endpoint

### Goal

Upgrade chat from simple recent-history chat to long-term memory chat.

### Implement

Update:

```txt
POST /api/conversations/:conversationId/messages
```

Final flow:

```txt
1. Auth user.
2. Validate request.
3. Validate conversation ownership.
4. Save user message.
5. Embed user message.
6. Retrieve relevant memories using current message.
7. Fetch recent messages from current conversation.
8. Build RAG prompt.
9. Call Ollama /api/chat.
10. Save assistant response.
11. Save metadata:
    - ragUsed
    - retrievedMemoryIds
    - selectedModel
    - timing
12. Return response.
```

### Test

Step 1:

Send:

```txt
Hi, I am Rahul. I love MERN stack.
```

Expected:

```txt
Message saved with embedding.
Assistant replies normally.
```

Step 2, after new chat or later:

Send:

```txt
What is my name and what tech stack do I like?
```

Expected:

```txt
Assistant answers:
Your name is Rahul and you like the MERN stack.
```

Step 3:

Create another user.

Ask:

```txt
What is Rahul's name?
```

Expected:

```txt
No access to Rahul's memory.
```

### Move to Next Phase When

Long-term memory works across time and does not leak between users.

---

## Phase 31: Conversation Auto-Title

### Goal

Generate sidebar titles automatically.

### Implement

After first user message, call:

```txt
ollamaService.generate()
```

Use hidden prompt:

```txt
Generate a short chat title under 6 words.
Return only the title.
```

Ollama’s `/api/generate` accepts a `model` and `prompt`, with options such as `system`, `stream`, and `format`. ([docs.ollama.com](https://docs.ollama.com/api/generate))

### API Endpoints Updated

```txt
POST /api/conversations/:conversationId/messages
```

### Database Changes

Update:

```txt
conversations.title
```

### Test

First message:

```txt
Can you help me learn Express middleware?
```

Expected title:

```txt
Learning Express Middleware
```

If title generation fails.

Expected:

```txt
Chat still works
title remains New Chat
```

### Move to Next Phase When

Titles generate without breaking chat.

---

## Phase 32: One-Click Generate Tools

### Goal

Add `/api/generate` style backend features without exposing raw prompts.

### Implement

Create tool registry:

```txt
src/utils/toolRegistry.js
```

Example tools:

```txt
summarize_text
rewrite_text
extract_action_items
draft_reply
explain_code
```

### API Endpoints Added

```txt
POST /api/tools/:toolId/run
```

### Request

```json
{
  "input": "Long text here...",
  "model": "qwen2.5-coder:1.5b"
}
```

### Backend Behavior

```txt
1. Validate toolId.
2. Load hidden prompt template.
3. Insert user input safely.
4. Call ollamaService.generate().
5. Return output.
```

### Test

Valid tool.

Expected:

```txt
200 OK
generated result returned
```

Invalid tool.

Expected:

```txt
404 TOOL_NOT_FOUND
```

User tries to pass custom system prompt.

Expected:

```txt
Ignored or rejected
```

### Move to Next Phase When

One-click tools work without exposing raw prompt engineering.

---

## Phase 33: Rate Limiting

### Goal

Protect your 2 vCPU VPS from abuse.

### Implement

Add rate limits:

```txt
auth routes: strict
chat routes: stricter
model routes: moderate
admin routes: strict
```

Example:

```txt
POST /api/auth/login: 5 requests per minute
POST /api/conversations/:id/messages: 10 requests per minute
GET /api/models: 60 requests per minute
```

### API Endpoints Updated

All.

### Database Changes

None for simple in-memory rate limit.

### Test

Send too many login attempts.

Expected:

```txt
429 Too Many Requests
```

Send too many chat messages quickly.

Expected:

```txt
429 Too Many Requests
```

### Move to Next Phase When

Backend protects expensive routes.

---

## Phase 34: Security Hardening

### Goal

Make the backend safer before real users.

### Implement

Add:

```txt
helmet
strict CORS
request body size limits
input validation everywhere
model allowlist
admin role checks
no dangerous Ollama proxy routes
```

### API Endpoints Updated

All.

### Test

Try unknown Ollama proxy path:

```txt
POST /api/ollama/pull
POST /api/admin/ollama/delete
DELETE /api/models/qwen2.5-coder
```

Expected:

```txt
404 Not Found
```

Try model not in allowlist.

Expected:

```txt
400 MODEL_NOT_ALLOWED
```

Try huge message body.

Expected:

```txt
413 Payload Too Large
```

### Move to Next Phase When

Users cannot trigger unsafe Ollama actions.

---

## Phase 35: Admin Dashboard Backend

### Goal

Give yourself hidden monitoring APIs.

### Implement

Admin routes:

```txt
GET /api/admin/status
GET /api/admin/ollama/tags
GET /api/admin/ollama/ps
GET /api/admin/users/count
GET /api/admin/conversations/count
GET /api/admin/messages/count
```

### Database Changes

None.

### Test

Normal user.

Expected:

```txt
403 Forbidden
```

Admin user.

Expected:

```txt
200 OK
```

Ollama unavailable.

Expected:

```txt
admin status shows ollama unavailable
```

### Move to Next Phase When

You can monitor system status without SSH.

---

## Phase 36: System Logs

### Goal

Track important backend events.

### Implement

Create:

```txt
SystemLog.model.js
```

Fields:

```txt
level
event
userId
requestId
message
metadata
createdAt
```

Log events:

```txt
USER_SIGNUP
USER_LOGIN
CHAT_COMPLETED
CHAT_FAILED
OLLAMA_UNAVAILABLE
VECTOR_SEARCH_FAILED
ADMIN_ACCESS
```

### API Endpoints Added

```txt
GET /api/admin/system/logs
```

### Test

Trigger successful chat.

Expected:

```txt
CHAT_COMPLETED log created
```

Trigger Ollama failure.

Expected:

```txt
CHAT_FAILED or OLLAMA_UNAVAILABLE log created
```

### Move to Next Phase When

Major backend events are visible.

---

## Phase 37: Usage Tracking

### Goal

Know how much each user is using the system.

### Implement

Add fields to messages:

```txt
metadata.ollamaDurationMs
tokenUsage.promptTokens
tokenUsage.completionTokens
tokenUsage.totalTokens
```

If Ollama returns duration/token fields, store them.

### API Endpoints Added

Admin:

```txt
GET /api/admin/usage/summary
```

User:

```txt
GET /api/me/usage
```

### Test

Send chat message.

Expected:

```txt
message contains duration metadata
```

Call usage endpoint.

Expected:

```txt
message count and approximate usage returned
```

### Move to Next Phase When

You can see user-level AI usage.

---

## Phase 38: Automated Unit Tests

### Goal

Protect services from breaking.

### Implement Tests For

```txt
password.service
token.service
auth.service
ollama.service with mocked HTTP
rag.service
memory.service with mocked repository
conversation.service
message.service
```

### API Endpoints Added

None.

### Test

Run:

```bash
npm test
```

### Expected Result

All unit tests pass.

### Move to Next Phase When

Core services are covered.

---

## Phase 39: Integration Tests

### Goal

Test real API behavior.

### Implement Tests For

```txt
POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me
POST /api/conversations
GET /api/conversations
POST /api/conversations/:id/messages
GET /api/conversations/:id/messages
GET /api/models
```

Use Supertest.

Mock Ollama for most tests.

### Expected Result

```txt
All main API routes work together.
Auth protects private routes.
Conversation ownership is enforced.
```

### Move to Next Phase When

Main backend flows pass integration tests.

---

## Phase 40: Manual RAG Test Script

### Goal

Prove memory works end-to-end.

### Implement

Create:

```txt
scripts/test-rag-memory.js
```

Script flow:

```txt
1. Create test user.
2. Login.
3. Create conversation.
4. Send: "Hi, I am Rahul. I love MERN stack."
5. Create second conversation.
6. Send: "What is my name and what stack do I like?"
7. Print assistant response.
```

### Expected Result

Assistant should answer:

```txt
Your name is Rahul and you like the MERN stack.
```

### Move to Next Phase When

Memory works across conversations for the same user.

---

## Phase 41: Privacy and Data Isolation Test

### Goal

Ensure user memories never leak.

### Implement

Manual or automated test:

```txt
User A says: My secret code is mango123.
User B asks: What is my secret code?
```

### Expected Result

User B should not receive User A’s memory.

### Database Check

Vector search must filter by:

```txt
userIdStr
```

### Move to Next Phase When

Cross-user memory leakage is impossible in tests.

---

## Phase 42: Performance Tuning for Small VPS

### Goal

Make the app realistic for 2 vCPU hardware.

### Implement

Tune:

```txt
memoryTopK = 3
recentMessagesLimit = 6
chat timeout = 60s
embedding timeout = 30s
max input length = maybe 4000 chars
disable huge models
allow only small models
```

Optional:

```txt
OLLAMA_KEEP_ALIVE
```

### Test

Send 10 normal chat messages.

Expected:

```txt
No server crash
No memory explosion
Acceptable response time
```

Send very long message.

Expected:

```txt
Rejected or truncated safely
```

### Move to Next Phase When

Backend behaves well under realistic MVP usage.

---

## Phase 43: Streaming Chat

### Goal

Improve UX by streaming tokens.

### Implement

Add:

```txt
POST /api/conversations/:conversationId/messages/stream
```

Use Server-Sent Events or fetch streaming.

For first MVP, keep non-streaming chat working. Streaming should be an enhancement, not a replacement.

### Test

Send message from frontend or curl.

Expected:

```txt
Partial response chunks arrive progressively.
Final assistant message is saved after stream completes.
```

If stream disconnects.

Expected:

```txt
Partial message is either discarded or saved as interrupted.
```

### Move to Next Phase When

Streaming is stable.

---

## Phase 44: Production Config

### Goal

Prepare for deployment.

### Implement

Add:

```txt
NODE_ENV=production
secure cookies
production CORS origin
production MongoDB URI
production Ollama URL
log level
process manager config
```

Use:

```txt
pm2 or systemd
nginx reverse proxy
HTTPS
```

### API Endpoints Updated

All.

### Test

Deploy to staging VPS.

Expected:

```txt
/api/health works
/api/health/ai works
auth works
chat works
```

### Move to Next Phase When

Staging behaves like local.

---

## Phase 45: Backup and Recovery

### Goal

Protect user data.

### Implement

MongoDB Atlas backup policy.

Export `.env.example`.

Document recovery:

```txt
How to restore DB
How to restart backend
How to restart Ollama
How to check logs
```

### API Endpoints Added

None.

### Test

Manual checklist.

### Expected Result

You know how to recover from accidental failure.

### Move to Next Phase When

You have backup and recovery documentation.

---

## Phase 46: API Documentation

### Goal

Make frontend integration easy.

### Implement

Create:

```txt
API_DOCS.md
```

Document every endpoint:

```txt
method
path
auth required
request body
success response
error response
notes
```

### Test

Frontend developer reads docs and can call APIs without asking you.

### Expected Result

All routes are documented.

### Move to Next Phase When

API contract is clear.

---

## Phase 47: Postman Collection

### Goal

Make manual testing fast.

### Implement

Create Postman collection with:

```txt
Signup
Login
Me
Create Conversation
List Conversations
Send Chat Message
Get Messages
Get Models
Get Model Status
Admin Status
```

Use variables:

```txt
baseUrl
accessToken
conversationId
```

### Test

Run collection from top to bottom.

### Expected Result

All requests pass in order.

### Move to Next Phase When

You can test the full backend in 2 minutes.

---

## Phase 48: Frontend Integration Readiness

### Goal

Prepare backend for React.

### Implement

Confirm frontend needs:

```txt
auth token handling
chat sidebar data
message list pagination
model dropdown
loading states
AI status
error messages
```

### API Endpoints Reviewed

```txt
/api/auth/*
/api/conversations/*
/api/models
/api/models/status
```

### Test

Mock frontend calls using Postman or simple React page.

### Expected Result

Frontend can build:

```txt
login page
signup page
chat sidebar
chat window
model selector
```

### Move to Next Phase When

Backend contract is stable for React.

---

## Phase 49: Future PDF Upload Foundation

### Goal

Prepare for future file RAG without implementing it now.

### Implement Only Documentation

Create:

```txt
FUTURE_FILE_RAG_PLAN.md
```

Planned future collections:

```txt
documents
document_chunks
```

Future flow:

```txt
Upload PDF
Parse text
Chunk text
Embed chunks
Store chunks
Vector search chunks during chat
```

### API Endpoints Added

None for MVP.

### Test

None.

### Expected Result

PDF support is planned but does not distract from MVP.

### Move to Next Phase When

You have consciously postponed file upload.

---

# 11. Final MVP Completion Checklist

Your MVP backend is complete when all of these are true:

```txt
User can sign up.
User can log in.
User can refresh session.
User can log out.
User can create conversations.
User can view conversation list.
User can rename conversations.
User can delete conversations.
User can send chat messages.
Assistant replies using Ollama.
Messages are saved in MongoDB.
User messages are embedded.
Vector search retrieves relevant old messages.
RAG prompt includes retrieved memory.
AI can answer "What is my name?" from past memory.
Users cannot see each other's memory.
Frontend can fetch allowed models.
Frontend can check AI status.
Admin can see Ollama tags and running models.
Dangerous Ollama endpoints are not exposed.
All major routes are tested.
```

---

# 12. Recommended Build Order Summary

Use this exact order:

```txt
1. Project setup
2. Express app
3. MongoDB connection
4. Error handling
5. User model
6. Signup
7. Login
8. JWT auth
9. Refresh/logout
10. Admin role
11. Ollama wrapper
12. Model list/status
13. Conversation model
14. Conversation APIs
15. Message model
16. Message APIs
17. Simple chat without RAG
18. Embeddings
19. Store embeddings
20. Vector index
21. Memory retrieval
22. RAG prompt builder
23. Full RAG chat
24. One-click generate tools
25. Security hardening
26. Admin dashboard
27. Tests
28. Deployment
```

---

# 13. Most Important Design Decision

Do **not** let React call Ollama.

Your frontend should only call your Node backend:

```txt
React -> Node -> Ollama
React -> Node -> MongoDB
```

Never:

```txt
React -> Ollama
```

That one rule protects:

```txt
your VPS
your models
your admin endpoints
your database
your prompt templates
your user memory
```

Your Node backend is the gatekeeper. It decides:

```txt
who can chat
which model can be used
how much memory is retrieved
which messages are stored
which Ollama endpoints are allowed
which endpoints are admin-only
```

That is the correct architecture for your MVP.
