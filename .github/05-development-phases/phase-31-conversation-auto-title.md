## Phase 31: Conversation Auto-Title

### Goal

Generate sidebar titles automatically.

### Implement

After first user message, call:

```txt
ollamaService.generate()
```

Use hidden prompt:

```txt
Generate a short chat title under 6 words.
Return only the title.
```

Ollama’s `/api/generate` accepts a `model` and `prompt`, with options such as `system`, `stream`, and `format`. ([docs.ollama.com](https://docs.ollama.com/api/generate))

### API Endpoints Updated

```txt
POST /api/conversations/:conversationId/messages
```

### Database Changes

Update:

```txt
conversations.title
```

### Test

First message:

```txt
Can you help me learn Express middleware?
```

Expected title:

```txt
Learning Express Middleware
```

If title generation fails.

Expected:

```txt
Chat still works
title remains New Chat
```

### Move to Next Phase When

Titles generate without breaking chat.

---
