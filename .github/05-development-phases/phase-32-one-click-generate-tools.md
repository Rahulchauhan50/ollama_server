## Phase 32: One-Click Generate Tools

### Goal

Add `/api/generate` style backend features without exposing raw prompts.

### Implement

Create tool registry:

```txt
src/utils/toolRegistry.js
```

Example tools:

```txt
summarize_text
rewrite_text
extract_action_items
draft_reply
explain_code
```

### API Endpoints Added

```txt
POST /api/tools/:toolId/run
```

### Request

```json
{
  "input": "Long text here...",
  "model": "qwen2.5-coder:1.5b"
}
```

### Backend Behavior

```txt
1. Validate toolId.
2. Load hidden prompt template.
3. Insert user input safely.
4. Call ollamaService.generate().
5. Return output.
```

### Test

Valid tool.

Expected:

```txt
200 OK
generated result returned
```

Invalid tool.

Expected:

```txt
404 TOOL_NOT_FOUND
```

User tries to pass custom system prompt.

Expected:

```txt
Ignored or rejected
```

### Move to Next Phase When

One-click tools work without exposing raw prompt engineering.

---
