## Phase 26: Save Embeddings on User Messages

### Goal

Store vector memory in MongoDB.

### Implement

Update chat message flow:

```txt
1. Save user message.
2. Generate embedding for user message.
3. Update user message with embedding, embeddingModel, embeddingDim.
```

For MVP:

```txt
Embed only role = user messages.
Do not embed assistant responses yet.
```

### API Endpoints Updated

```txt
POST /api/conversations/:conversationId/messages
```

### Database Changes

`messages.embedding` now populated.

### Test

Send:

```txt
Hi, I am Rahul. I love MERN stack.
```

Expected in DB:

```txt
content saved
embedding exists
embedding.length matches expected dimension
embeddingModel saved
isMemoryEligible = true
```

If embedding fails.

Expected:

```txt
message still saved
metadata.embeddingFailed = true
chat can still continue
```

### Move to Next Phase When

User messages are stored with embeddings.

---
