## Phase 22: Get Conversation Messages API

### Goal

Let frontend load old messages when user clicks a chat.

### API Endpoints Added

```txt
GET /api/conversations/:conversationId/messages
```

### Query Params

```txt
limit
before
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "...",
        "role": "user",
        "content": "Hi, I am Rahul",
        "createdAt": "..."
      },
      {
        "id": "...",
        "role": "assistant",
        "content": "Nice to meet you, Rahul!",
        "createdAt": "..."
      }
    ]
  }
}
```

### Test

Conversation with messages.

Expected:

```txt
Messages returned oldest to newest
```

Empty conversation.

Expected:

```txt
Empty array
```

Another user’s conversation.

Expected:

```txt
404 or 403
```

### Move to Next Phase When

Frontend can display chat history.

---
