## Phase 29: RAG Prompt Builder

### Goal

Build the final prompt safely.

### Implement

Create:

```txt
src/services/rag.service.js
```

Methods:

```txt
buildSystemPrompt()
formatMemoryBlock()
formatRecentMessages()
buildChatMessages()
```

Final payload shape:

```txt
system instructions
memory system block
recent conversation messages
current user message
```

### Rules

```txt
Do not inject unlimited memories.
Do not include memories from other users.
Do not include raw database IDs in prompt.
Do not say "I remember" unless memory is present.
Limit memory block size.
```

### API Endpoints Added

None.

### Database Changes

None.

### Test

Input:

```txt
current message = "What is my name?"
memory = "Hi, I am Rahul."
recent messages = []
```

Expected output:

```txt
Ollama messages include memory block before current user message
```

Input with no memory.

Expected:

```txt
No fake memory block
```

### Move to Next Phase When

Prompt builder creates clean, predictable Ollama payloads.

---
