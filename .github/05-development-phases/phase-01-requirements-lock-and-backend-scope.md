## Phase 1: Requirements Lock and Backend Scope

### Goal

Freeze the MVP backend scope so you do not keep changing architecture mid-build.

### Implement

Create a simple `MVP_BACKEND_SCOPE.md` file.

Define:

```txt
Included:
- Auth
- JWT login
- Multi-chat conversations
- Message history
- Ollama chat
- Model selector
- MongoDB Vector Search memory
- Admin status dashboard

Excluded from MVP:
- PDF uploads
- Excel uploads
- File parsing
- Payments
- Team accounts
- Voice chat
- Image chat
```

### API Endpoints Added

None.

### Database Changes

None.

### Test

Manual review.

### Expected Result

You have one written document that says exactly what the backend will and will not do.

### Move to Next Phase When

You can explain the MVP in one sentence:

```txt
A logged-in user can chat with an Ollama model, maintain multiple conversations, and the AI can retrieve relevant past messages using MongoDB Vector Search.
```

---
