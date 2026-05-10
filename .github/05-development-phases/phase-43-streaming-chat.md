## Phase 43: Streaming Chat

### Goal

Improve UX by streaming tokens.

### Implement

Add:

```txt
POST /api/conversations/:conversationId/messages/stream
```

Use Server-Sent Events or fetch streaming.

For first MVP, keep non-streaming chat working. Streaming should be an enhancement, not a replacement.

### Test

Send message from frontend or curl.

Expected:

```txt
Partial response chunks arrive progressively.
Final assistant message is saved after stream completes.
```

If stream disconnects.

Expected:

```txt
Partial message is either discarded or saved as interrupted.
```

### Move to Next Phase When

Streaming is stable.

---
