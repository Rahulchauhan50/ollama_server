# 7. RAG Prompt Structure

Use this structure when calling Ollama `/api/chat`:

```json
{
  "model": "qwen2.5-coder:1.5b",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful AI assistant. Use the provided memory only when relevant. Do not claim memory if it is not in the context."
    },
    {
      "role": "system",
      "content": "Relevant long-term memory:\n1. User said: Hi, I am Rahul. I love MERN stack."
    },
    {
      "role": "user",
      "content": "What is my name and what do I do?"
    }
  ],
  "stream": false
}
```

For the MVP, keep it simple:

```txt
recentMessagesLimit = 6 to 10
memoryTopK = 3 to 5
numCandidates = 50 to 100
embed only user messages first
```

Later, you can add extracted factual memories.

---
