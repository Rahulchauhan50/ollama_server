# 2. Backend Architecture

## 2.1 Main Backend Layers

Use a layered backend structure:

```txt
src/
  server.js
  app.js

  config/
    env.js
    database.js
    cors.js
    security.js

  models/
    User.model.js
    Conversation.model.js
    Message.model.js
    RefreshSession.model.js
    SystemLog.model.js

  routes/
    auth.routes.js
    user.routes.js
    model.routes.js
    conversation.routes.js
    chat.routes.js
    generate.routes.js
    admin.routes.js
    health.routes.js

  controllers/
    auth.controller.js
    user.controller.js
    model.controller.js
    conversation.controller.js
    chat.controller.js
    generate.controller.js
    admin.controller.js

  services/
    auth.service.js
    token.service.js
    password.service.js
    ollama.service.js
    rag.service.js
    embedding.service.js
    memory.service.js
    conversation.service.js
    message.service.js
    model.service.js

  repositories/
    user.repository.js
    conversation.repository.js
    message.repository.js
    refreshSession.repository.js

  middlewares/
    auth.middleware.js
    admin.middleware.js
    error.middleware.js
    rateLimit.middleware.js
    validate.middleware.js
    requestId.middleware.js

  validators/
    auth.validators.js
    chat.validators.js
    conversation.validators.js
    model.validators.js

  utils/
    apiResponse.js
    AppError.js
    logger.js
    asyncHandler.js
    constants.js

  tests/
    unit/
    integration/
```

## 2.2 Backend Design Rules

Follow these rules throughout every phase:

```txt
Controller = receives HTTP request and sends HTTP response.
Service = contains business logic.
Repository = talks to MongoDB.
Middleware = handles cross-cutting concerns like auth, logging, errors.
Ollama service = the only place allowed to call Ollama.
RAG service = the only place allowed to build AI context.
Frontend = never talks directly to Ollama.
```

This separation protects you later. For example, if Ollama changes `/api/embed` again, only `ollama.service.js` changes.

---
