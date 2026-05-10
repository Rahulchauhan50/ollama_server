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
