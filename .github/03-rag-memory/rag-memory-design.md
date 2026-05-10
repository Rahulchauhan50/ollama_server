# 6. RAG Memory Design

Your MVP memory system should work like this:

```txt
User sends message
   |
   v
Save user message without embedding first
   |
   v
Create embedding for user message
   |
   v
Update message with embedding
   |
   v
Create embedding for current question
   |
   v
Run MongoDB Vector Search against past messages
   |
   v
Fetch recent messages from current conversation
   |
   v
Build prompt:
   - system instructions
   - relevant long-term memories
   - recent conversation window
   - current user message
   |
   v
Call Ollama /api/chat
   |
   v
Save assistant response
   |
   v
Return answer to React
```

Use `$vectorSearch` as the first stage in the aggregation pipeline, because MongoDB documents that `$vectorSearch` must be the first stage wherever it appears. MongoDB also returns vector similarity scores in a 0-to-1 range. ([mongodb.com](https://www.mongodb.com/docs/vector-search/query/aggregation-stages/vector-search-stage/))

---
