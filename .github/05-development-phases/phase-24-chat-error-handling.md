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
