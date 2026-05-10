# Backend Design System, Flow, Architecture, and Database Design

The goal is to build a **Node.js + Express + MongoDB + Ollama VPS** MVP step by step.

You should **not build the whole backend at once**. Build one small phase, test it independently, confirm expected behavior, then move to the next phase.

One important correction before the design: in current Ollama documentation, the embeddings endpoint is **`POST /api/embed`**, not `/api/embeddings`. The old name may still appear in some examples, but your Node backend should wrap this behind an internal `ollamaService.createEmbedding()` method so the rest of your app does not care which Ollama endpoint is used. Ollama’s current API exposes `/api/chat`, `/api/generate`, `/api/embed`, `/api/tags`, `/api/ps`, and admin/model-management endpoints like pull, copy, push, and delete. ([docs.ollama.com](https://docs.ollama.com/api/introduction))

---
