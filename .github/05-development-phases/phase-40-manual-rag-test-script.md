## Phase 40: Manual RAG Test Script

### Goal

Prove memory works end-to-end.

### Implement

Create:

```txt
scripts/test-rag-memory.js
```

Script flow:

```txt
1. Create test user.
2. Login.
3. Create conversation.
4. Send: "Hi, I am Rahul. I love MERN stack."
5. Create second conversation.
6. Send: "What is my name and what stack do I like?"
7. Print assistant response.
```

### Expected Result

Assistant should answer:

```txt
Your name is Rahul and you like the MERN stack.
```

### Move to Next Phase When

Memory works across conversations for the same user.

---
