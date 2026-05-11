# MVP Backend Scope

**Date Locked:** 2026-05-09

## MVP Summary (One Sentence)
A logged-in user can chat with an Ollama model, maintain multiple conversations, and the AI can retrieve relevant past messages using MongoDB Vector Search.

---

## Included in MVP

### Authentication & Authorization
- User signup with email/password
- User login with JWT access and refresh tokens
- JWT token validation on protected endpoints
- Role-based access control (user, admin)
- Logout / token revocation

### Chat & Conversations
- Create multiple conversations per user
- Maintain conversation metadata (title, created_at, updated_at)
- Send user messages to conversations
- Receive AI responses from Ollama
- Store full message history (user + assistant)

### AI / Ollama Integration
- Service wrapper for Ollama API
- Model selector (allow users to pick from available Ollama models)
- Health check endpoint for Ollama connection
- List available models
- Send prompts to Ollama with streaming support
- Basic error handling and timeouts

### Memory / RAG System
- Generate embeddings for user messages (via Ollama embedding model)
- Store embeddings in MongoDB with vector indexing
- MongoDB Vector Search index for semantic similarity
- Memory retrieval service (fetch top-K similar past messages)
- RAG prompt builder (augment current prompt with relevant context)
- Full RAG chat endpoint

### Admin Dashboard Backend
- System logs API (track errors, requests, events)
- Usage tracking API (messages per user, tokens used, etc.)
- Admin status view (server health, model status, user stats)

### Data Persistence
- MongoDB connection with connection pooling
- User model (email, password hash, role, created_at)
- Conversation model (user_id, title, created_at, updated_at)
- Message model (conversation_id, role, content, embeddings, created_at)

### Development & Operations
- Environment configuration system (.env)
- Request ID and structured logging
- Standard API response format (success, data, errors)
- Standard error classes (ValidationError, AuthError, etc.)
- Rate limiting on API endpoints
- Security hardening (CORS, headers, input validation)

### Testing & Documentation
- Unit tests for core services
- Integration tests for API endpoints
- Manual RAG test script
- Privacy and data isolation tests
- API documentation (OpenAPI / Postman collection)

---

## Excluded from MVP

### File Uploads & Processing
- PDF uploads
- Excel uploads / CSV imports
- File parsing and extraction
- Document chunking
- OCR

### Payments & Billing
- Payment processing
- Subscription management
- Usage quotas / rate limiting by tier
- Invoice generation

### Multi-User & Teams
- Team accounts
- Shared conversations
- Collaborative features
- User invitations

### Media & Rich Input
- Voice chat
- Audio transcription
- Image uploads
- Image recognition
- Video chat

### Advanced Features
- Custom model fine-tuning
- Batch processing
- Webhooks
- Real-time collaboration
- Plugin system

---

## Success Criteria

✅ **Phase 1 Complete When:**
1. This document is written and agreed upon
2. Backend team can explain the MVP scope in one sentence (see summary above)
3. No scope creep is added during development without explicit re-lock

---

## Notes for Development

- Focus on user authentication and conversation management first
- Ollama integration is critical; ensure reliable health checks
- Vector search must be performant (index on embeddings collection)
- Admin dashboard is secondary but helps with monitoring
- Each phase must deliver working, testable code
- Reference `backend_design_system_flow_architecture.md` for detailed architecture
