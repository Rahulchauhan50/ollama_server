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
