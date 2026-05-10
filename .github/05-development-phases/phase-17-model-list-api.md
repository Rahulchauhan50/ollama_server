## Phase 17: Model List API

### Goal

Build the model selector backend.

### Implement

Use:

```txt
ollamaService.listModels()
```

Filter returned models using:

```txt
ALLOWED_CHAT_MODELS
```

Never show every installed model unless you want users to access all of them.

### API Endpoints Added

```txt
GET /api/models
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "name": "qwen2.5-coder:1.5b",
        "isDefault": true
      },
      {
        "name": "llama3.2:1b",
        "isDefault": false
      }
    ]
  }
}
```

### Database Changes

None.

### Test

With allowed models configured.

Expected:

```txt
Only allowed models are returned
```

With Ollama returning extra models.

Expected:

```txt
Extra models are hidden
```

### Move to Next Phase When

Frontend can safely populate model dropdown.

---
