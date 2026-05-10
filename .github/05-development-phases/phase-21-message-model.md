## Phase 21: Message Model

### Goal

Create storage for chat messages.

### Implement

Create:

```txt
src/models/Message.model.js
src/repositories/message.repository.js
src/services/message.service.js
```

Fields:

```txt
userId
userIdStr
conversationId
conversationIdStr
role
content
contentPreview
model
embedding
embeddingModel
embeddingDim
isMemoryEligible
tokenUsage
metadata
createdAt
updatedAt
deletedAt
```

### API Endpoints Added

None yet.

### Database Changes

Create `messages`.

### Test

Create user message.

Expected:

```txt
role = user
content saved
userId saved
conversationId saved
isMemoryEligible = true
```

Create assistant message.

Expected:

```txt
role = assistant
isMemoryEligible can be false for MVP
```

### Move to Next Phase When

Messages can be saved and queried by conversation.

---
