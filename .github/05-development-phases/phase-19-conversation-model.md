## Phase 19: Conversation Model

### Goal

Create chat sidebar backend storage.

### Implement

Create:

```txt
src/models/Conversation.model.js
src/repositories/conversation.repository.js
src/services/conversation.service.js
```

Fields:

```txt
userId
userIdStr
title
selectedModel
status
messageCount
lastMessageAt
createdAt
updatedAt
deletedAt
```

### API Endpoints Added

None yet.

### Database Changes

Create `conversations`.

### Test

Create conversation from test script.

Expected:

```txt
conversation saved
belongs to user
default title exists
status active
```

### Move to Next Phase When

Conversation model works.

---
