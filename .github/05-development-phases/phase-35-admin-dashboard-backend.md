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
