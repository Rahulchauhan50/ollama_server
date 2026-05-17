# Backend Design System Documentation Index

This index links to every split Markdown file created from the original backend design document.

## Folder Map

```txt
backend-docs/
  index.md
  README.md
  01-overview/
  02-database/
  03-rag-memory/
  04-configuration-and-flows/
  05-development-phases/
  06-checklists-and-summary/
  source/
```

## Start Here

- [Introduction](01-overview/introduction.md)

## Overview

- [1. Final Backend Goal](01-overview/final-backend-goal.md)
- [2. Backend Architecture](01-overview/backend-architecture.md)
- [3. Core Backend API Design](01-overview/core-backend-api-design.md)
- [4. Standard API Response Format](01-overview/standard-api-response-format.md)

## Database

- [5. Database Design](02-database/database-design.md)

## RAG and Memory

- [6. RAG Memory Design](03-rag-memory/rag-memory-design.md)
- [7. RAG Prompt Structure](03-rag-memory/rag-prompt-structure.md)

## Configuration and Flows

- [8. Recommended Environment Variables](04-configuration-and-flows/recommended-environment-variables.md)
- [9. Final Request Flow](04-configuration-and-flows/final-request-flow.md)

## Development Phases

- [Phase Plan Overview](05-development-phases/README.md)
- [Phase 1: Requirements Lock and Backend Scope](05-development-phases/phase-01-requirements-lock-and-backend-scope.md)
- [Phase 2: Git Repository and Project Structure](05-development-phases/phase-02-git-repository-and-project-structure.md)
- [Phase 3: Environment Configuration System](05-development-phases/phase-03-environment-configuration-system.md)
- [Phase 4: Basic Express App](05-development-phases/phase-04-basic-express-app.md)
- [Phase 5: Standard API Response and Error Classes](05-development-phases/phase-05-standard-api-response-and-error-classes.md)
- [Phase 6: MongoDB Connection](05-development-phases/phase-06-mongodb-connection.md)
- [Phase 7: Request ID and Logging](05-development-phases/phase-07-request-id-and-logging.md)
- [Phase 8: User Model](05-development-phases/phase-08-user-model.md)
- [Phase 9: Password Hashing Service](05-development-phases/phase-09-password-hashing-service.md)
- [Phase 10: Signup API](05-development-phases/phase-10-signup-api.md)
- [Phase 11: Login API](05-development-phases/phase-11-login-api.md)
- [Phase 12: JWT Access Token Service](05-development-phases/phase-12-jwt-access-token-service.md)
- [Phase 13: Refresh Token and Logout](05-development-phases/phase-13-refresh-token-and-logout.md)
- [Phase 14: Authorization Roles](05-development-phases/phase-14-authorization-roles.md)
- [Phase 15: AI Service Wrappers](05-development-phases/phase-15-ollama-service-wrapper.md)
- [Phase 16: AI Health Check](05-development-phases/phase-16-ollama-health-check.md)
- [Phase 17: Model List API](05-development-phases/phase-17-model-list-api.md)
- [Phase 18: Model Status API](05-development-phases/phase-18-model-status-api.md)
- [Phase 19: Conversation Model](05-development-phases/phase-19-conversation-model.md)
- [Phase 20: Conversation CRUD APIs](05-development-phases/phase-20-conversation-crud-apis.md)
- [Phase 21: Message Model](05-development-phases/phase-21-message-model.md)
- [Phase 22: Get Conversation Messages API](05-development-phases/phase-22-get-conversation-messages-api.md)
- [Phase 23: Simple Chat Without RAG](05-development-phases/phase-23-simple-chat-without-rag.md)
- [Phase 24: Chat Error Handling](05-development-phases/phase-24-chat-error-handling.md)
- [Phase 25: Embedding Service](05-development-phases/phase-25-embedding-service.md)
- [Phase 26: Save Embeddings on User Messages](05-development-phases/phase-26-save-embeddings-on-user-messages.md)
- [Phase 27: MongoDB Vector Search Index](05-development-phases/phase-27-mongodb-vector-search-index.md)
- [Phase 28: Memory Retrieval Service](05-development-phases/phase-28-memory-retrieval-service.md)
- [Phase 29: RAG Prompt Builder](05-development-phases/phase-29-rag-prompt-builder.md)
- [Phase 30: Full RAG Chat Endpoint](05-development-phases/phase-30-full-rag-chat-endpoint.md)
- [Phase 31: Conversation Auto-Title](05-development-phases/phase-31-conversation-auto-title.md)
- [Phase 32: One-Click Generate Tools](05-development-phases/phase-32-one-click-generate-tools.md)
- [Phase 33: Rate Limiting](05-development-phases/phase-33-rate-limiting.md)
- [Phase 34: Security Hardening](05-development-phases/phase-34-security-hardening.md)
- [Phase 35: Admin Dashboard Backend](05-development-phases/phase-35-admin-dashboard-backend.md)
- [Phase 36: System Logs](05-development-phases/phase-36-system-logs.md)
- [Phase 37: Usage Tracking](05-development-phases/phase-37-usage-tracking.md)
- [Phase 38: Automated Unit Tests](05-development-phases/phase-38-automated-unit-tests.md)
- [Phase 39: Integration Tests](05-development-phases/phase-39-integration-tests.md)
- [Phase 40: Manual RAG Test Script](05-development-phases/phase-40-manual-rag-test-script.md)
- [Phase 41: Privacy and Data Isolation Test](05-development-phases/phase-41-privacy-and-data-isolation-test.md)
- [Phase 42: Performance Tuning for Small VPS](05-development-phases/phase-42-performance-tuning-for-small-vps.md)
- [Phase 43: Streaming Chat](05-development-phases/phase-43-streaming-chat.md)
- [Phase 44: Production Config](05-development-phases/phase-44-production-config.md)
- [Phase 45: Backup and Recovery](05-development-phases/phase-45-backup-and-recovery.md)
- [Phase 46: API Documentation](05-development-phases/phase-46-api-documentation.md)
- [Phase 47: Postman Collection](05-development-phases/phase-47-postman-collection.md)
- [Phase 48: Frontend Integration Readiness](05-development-phases/phase-48-frontend-integration-readiness.md)
- [Phase 49: Future PDF Upload Foundation](05-development-phases/phase-49-future-pdf-upload-foundation.md)

## Checklists and Summary

- [11. Final MVP Completion Checklist](06-checklists-and-summary/final-mvp-completion-checklist.md)
- [12. Recommended Build Order Summary](06-checklists-and-summary/recommended-build-order-summary.md)
- [13. Most Important Design Decision](06-checklists-and-summary/most-important-design-decision.md)

## Source

- [Original single Markdown source](source/backend_design_system_flow_architecture.md)
