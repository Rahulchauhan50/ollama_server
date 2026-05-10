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
