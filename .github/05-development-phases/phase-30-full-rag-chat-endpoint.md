## Phase 30: Full RAG Chat Endpoint

### Goal

Upgrade chat from simple recent-history chat to long-term memory chat.

### Implement

Update:

```txt
POST /api/conversations/:conversationId/messages
```

Final flow:

```txt
1. Auth user.
2. Validate request.
3. Validate conversation ownership.
4. Save user message.
5. Embed user message.
6. Retrieve relevant memories using current message.
7. Fetch recent messages from current conversation.
8. Build RAG prompt.
9. Call Ollama /api/chat.
10. Save assistant response.
11. Save metadata:
    - ragUsed
    - retrievedMemoryIds
    - selectedModel
    - timing
12. Return response.
```

### Test

Step 1:

Send:

```txt
Hi, I am Rahul. I love MERN stack.
```

Expected:

```txt
Message saved with embedding.
Assistant replies normally.
```

Step 2, after new chat or later:

Send:

```txt
What is my name and what tech stack do I like?
```

Expected:

```txt
Assistant answers:
Your name is Rahul and you like the MERN stack.
```

Step 3:

Create another user.

Ask:

```txt
What is Rahul's name?
```

Expected:

```txt
No access to Rahul's memory.
```

### Move to Next Phase When

Long-term memory works across time and does not leak between users.

---
