## Phase 3: Environment Configuration System

### Goal

Centralize all environment variables.

### Implement

Create:

```txt
src/config/env.js
```

Validate required environment variables:

```txt
NODE_ENV
PORT
MONGODB_URI
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
OLLAMA_BASE_URL
OLLAMA_CHAT_MODEL_DEFAULT
OLLAMA_EMBEDDING_MODEL
ALLOWED_CHAT_MODELS
```

Use Zod or a manual validator.

### API Endpoints Added

None.

### Database Changes

None.

### Test

Start server with missing `.env`.

### Expected Result

Server should fail clearly:

```json
{
  "error": "Missing required environment variable: MONGODB_URI"
}
```

Start server with valid `.env`.

### Expected Result

Server should boot.

### Move to Next Phase When

Bad config fails fast and good config starts cleanly.

---
