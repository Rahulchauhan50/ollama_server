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
