## Phase 28: Memory Retrieval Service

### Goal

Move vector search into a clean service.

### Implement

Create:

```txt
src/services/memory.service.js
```

Method:

```txt
retrieveRelevantMemories({
  userId,
  queryText,
  limit
})
```

Steps:

```txt
1. Create query embedding.
2. Run $vectorSearch on messages.
3. Filter by userIdStr.
4. Filter isMemoryEligible = true.
5. Exclude deleted messages.
6. Return content, score, messageId, createdAt.
```

### API Endpoints Updated

No public endpoint yet.

### Database Changes

None.

### Test

Unit test with mocked vector results.

Expected:

```txt
Only high-quality memory snippets returned
```

Integration test with real MongoDB Atlas.

Expected:

```txt
Relevant memories returned
```

### Move to Next Phase When

Memory retrieval is reusable and independent.

---
