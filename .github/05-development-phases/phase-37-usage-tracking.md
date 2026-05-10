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
