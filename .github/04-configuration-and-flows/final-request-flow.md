# 9. Final Request Flow

## 9.1 Signup Flow

```txt
React signup form
   |
POST /api/auth/signup
   |
Validate email/password/name
   |
Hash password
   |
Create user
   |
Return access token + refresh token
```

## 9.2 Login Flow

```txt
React login form
   |
POST /api/auth/login
   |
Find user by email
   |
Compare password
   |
Create refresh session
   |
Return tokens
```

## 9.3 Chat Flow

```txt
React sends message
   |
POST /api/conversations/:id/messages
   |
Auth middleware confirms user
   |
Validate conversation ownership
   |
Save user message
   |
Create embedding
   |
Search memory
   |
Fetch recent conversation messages
   |
Build Ollama chat payload
   |
Call Ollama /api/chat
   |
Save assistant message
   |
Return assistant message
```

## 9.4 Model Selector Flow

```txt
React loads chat page
   |
GET /api/models
   |
Node calls Ollama /api/tags
   |
Node filters by ALLOWED_CHAT_MODELS
   |
React displays dropdown
```

## 9.5 Admin Status Flow

```txt
Admin opens hidden dashboard
   |
GET /api/admin/ollama/ps
   |
Node calls Ollama /api/ps
   |
Admin sees currently loaded models
```

---
