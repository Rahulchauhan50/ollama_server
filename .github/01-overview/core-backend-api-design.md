# 3. Core Backend API Design

## 3.1 Public User APIs

These are safe for logged-in users:

```txt
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/models
GET    /api/models/status

POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:conversationId
PATCH  /api/conversations/:conversationId
DELETE /api/conversations/:conversationId

GET    /api/conversations/:conversationId/messages
POST   /api/conversations/:conversationId/messages

POST   /api/tools/:toolId/run
```

## 3.2 Internal Backend-to-Ollama Calls

These should never be exposed directly to React:

```txt
ollamaService.chat()
  -> calls Ollama POST /api/chat

ollamaService.generate()
  -> calls Ollama POST /api/generate

ollamaService.createEmbedding()
  -> calls Ollama POST /api/embed

ollamaService.listModels()
  -> calls Ollama GET /api/tags

ollamaService.listRunningModels()
  -> calls Ollama GET /api/ps
```

Ollama’s `/api/tags` returns locally available models, and `/api/ps` returns models currently loaded/running in memory. ([docs.ollama.com](https://docs.ollama.com/api/tags))

## 3.3 Admin-Only APIs

These are only for you:

```txt
GET /api/admin/status
GET /api/admin/ollama/tags
GET /api/admin/ollama/ps
GET /api/admin/system/logs
```

## 3.4 Endpoints You Should Not Build

Do **not** build backend routes that proxy these Ollama endpoints:

```txt
POST   /api/pull
DELETE /api/delete
POST   /api/copy
POST   /api/push
POST   /api/create
```

Ollama exposes model-management endpoints such as pull, copy, push, and delete; delete can remove a local model. These should not be reachable from your app users. ([docs.ollama.com](https://docs.ollama.com/api/introduction))

---
