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
