## Phase 20: Conversation CRUD APIs

### Goal

Let users create, list, rename, and delete chats.

### API Endpoints Added

```txt
POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:conversationId
PATCH  /api/conversations/:conversationId
DELETE /api/conversations/:conversationId
```

### Implement

Rules:

```txt
User can only access own conversations.
Delete should be soft delete.
Default title can be "New Chat".
selectedModel must be in allowed model list.
```

### Test

Create conversation.

Expected:

```txt
201 Created
```

List conversations.

Expected:

```txt
Only current user's conversations
```

Access another user’s conversation.

Expected:

```txt
404 Not Found or 403 Forbidden
```

Rename conversation.

Expected:

```txt
title updated
```

Delete conversation.

Expected:

```txt
status becomes deleted
deletedAt set
```

### Move to Next Phase When

Sidebar backend is complete.

---
