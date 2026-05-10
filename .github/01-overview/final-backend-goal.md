# 1. Final Backend Goal

You are building a backend for a MERN AI chatbot with:

1. User authentication.
2. Multi-chat conversation history.
3. Model selector.
4. Ollama-powered chat.
5. MongoDB-based long-term memory using vector search.
6. Safe hidden backend wrappers around Ollama.
7. No PDF upload in MVP.
8. RAG used only for conversational memory.
9. Admin-only monitoring routes.
10. Strict blocking of dangerous Ollama endpoints.

The final flow should look like this:

```txt
React Frontend
   |
   | HTTPS request
   v
Node.js / Express Backend
   |
   |-- Auth / JWT / sessions
   |
   |-- MongoDB Atlas
   |      |-- users
   |      |-- conversations
   |      |-- messages with embeddings
   |
   |-- Ollama VPS
          |-- /api/chat
          |-- /api/generate
          |-- /api/embed
          |-- /api/tags
          |-- /api/ps
```

MongoDB Vector Search is suitable for this because it lets you store embeddings with normal operational data and perform semantic search for RAG-style retrieval. MongoDB’s `$vectorSearch` stage performs semantic search on indexed vector fields, can use pre-filters, and vector fields must be no more than 4096 dimensions wide. ([mongodb.com](https://www.mongodb.com/docs/manual/reference/operator/aggregation/vectorsearch/))

---
