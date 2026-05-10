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
