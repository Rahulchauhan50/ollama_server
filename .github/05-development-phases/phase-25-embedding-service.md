## Phase 25: Embedding Service

### Goal

Create embeddings for text.

### Implement

Create:

```txt
src/services/embedding.service.js
```

Method:

```txt
createTextEmbedding(text)
```

Internally calls:

```txt
ollamaService.createEmbedding({
  model: OLLAMA_EMBEDDING_MODEL,
  input: text
})
```

### API Endpoints Added

For development only:

```txt
POST /api/dev/embeddings/test
```

Protect this route or remove it before production.

### Request

```json
{
  "text": "Hi, I am Rahul. I love MERN stack."
}
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "dimension": 768,
    "embeddingPreview": [0.012, -0.453, 0.881]
  }
}
```

### Database Changes

None yet.

### Test

Send normal text.

Expected:

```txt
embedding array returned
dimension is stable
```

Send same text twice.

Expected:

```txt
same dimension both times
```

### Move to Next Phase When

Embedding generation works reliably.

---
