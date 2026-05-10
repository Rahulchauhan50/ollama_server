## Phase 15: Ollama Service Wrapper

### Goal

Create one safe internal service for all Ollama communication.

### Implement

Create:

```txt
src/services/ollama.service.js
```

Methods:

```txt
chat({ model, messages, options })
generate({ model, prompt, system, options })
createEmbedding({ model, input })
listModels()
listRunningModels()
```

Important:

```txt
Do not expose raw Ollama URLs to controllers.
Do not let user pass arbitrary Ollama endpoint names.
Do not implement pull/delete/copy/push.
```

### API Endpoints Added

None yet.

### Database Changes

None.

### Test

Unit test with mocked HTTP client.

Expected:

```txt
ollamaService.chat() calls only /api/chat
ollamaService.createEmbedding() calls only /api/embed
ollamaService.listModels() calls only /api/tags
```

### Move to Next Phase When

Ollama is wrapped behind a safe internal interface.

---
