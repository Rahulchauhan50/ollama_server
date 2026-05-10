## Phase 18: Model Status API

### Goal

Show whether the selected model is currently loaded.

### Implement

Use:

```txt
ollamaService.listRunningModels()
```

### API Endpoints Added

```txt
GET /api/models/status
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "runningModels": [
      {
        "name": "qwen2.5-coder:1.5b",
        "loaded": true
      }
    ]
  }
}
```

### Database Changes

None.

### Test

Call endpoint before chat.

Expected:

```txt
Maybe empty list
```

Call after using model.

Expected:

```txt
Model may appear as running
```

### Move to Next Phase When

Frontend can show “AI Ready” or “Waking up AI”.

---
