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
