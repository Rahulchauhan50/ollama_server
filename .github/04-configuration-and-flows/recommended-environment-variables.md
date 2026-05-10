# 8. Recommended Environment Variables

```env
NODE_ENV=development
PORT=5000

CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://...

JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

OLLAMA_BASE_URL=http://your-vps-ip:11434/api
OLLAMA_CHAT_MODEL_DEFAULT=qwen2.5-coder:1.5b
OLLAMA_EMBEDDING_MODEL=embeddinggemma

ALLOWED_CHAT_MODELS=qwen2.5-coder:1.5b,llama3.2:1b
ADMIN_EMAILS=your-email@example.com

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
```

Express 5 requires Node.js 18 or higher, so your backend deployment should use at least that runtime. ([expressjs.com](https://expressjs.com/en/5x/api.html))

---
