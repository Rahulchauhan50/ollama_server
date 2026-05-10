## Phase 23: Simple Chat Without RAG

### Goal

First prove Ollama chat works before adding memory.

### Implement

When user sends message:

```txt
1. Validate conversation ownership.
2. Save user message.
3. Fetch last 6 messages from same conversation.
4. Send them to Ollama /api/chat.
5. Save assistant response.
6. Return assistant response.
```

### API Endpoints Added

```txt
POST /api/conversations/:conversationId/messages
```

### Request

```json
{
  "content": "Hello, who are you?",
  "model": "qwen2.5-coder:1.5b"
}
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "userMessage": {},
    "assistantMessage": {}
  }
}
```

### Database Changes

Two messages saved:

```txt
user message
assistant message
```

### Test

Send first message.

Expected:

```txt
User message saved
Assistant response saved
Conversation messageCount increases
lastMessageAt updated
```

Send second message.

Expected:

```txt
Ollama receives recent context
```

### Move to Next Phase When

Basic chat works without vector memory.

---
