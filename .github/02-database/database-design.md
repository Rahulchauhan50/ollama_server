# 5. Database Design

You can start with four core collections:

```txt
users
refresh_sessions
conversations
messages
```

Later, add:

```txt
system_logs
model_cache
memory_facts
usage_events
```

---

## 5.1 Users Collection

```js
{
  _id: ObjectId,

  name: String,
  email: String,
  passwordHash: String,

  role: "user" | "admin",
  plan: "free" | "pro",

  isEmailVerified: Boolean,
  isActive: Boolean,

  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

### Indexes

```js
email: unique
role
createdAt
```

### Purpose

Stores the user account, login identity, and authorization role.

---

## 5.2 Refresh Sessions Collection

```js
{
  _id: ObjectId,

  userId: ObjectId,
  refreshTokenHash: String,

  userAgent: String,
  ipAddress: String,

  isRevoked: Boolean,
  revokedAt: Date,

  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```js
userId
refreshTokenHash
expiresAt TTL
```

### Purpose

Lets you support secure refresh tokens and logout.

---

## 5.3 Conversations Collection

```js
{
  _id: ObjectId,

  userId: ObjectId,
  userIdStr: String,

  title: String,
  selectedModel: String,

  status: "active" | "archived" | "deleted",

  messageCount: Number,

  lastMessageAt: Date,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}
```

### Indexes

```js
userId + updatedAt
userId + status
userId + lastMessageAt
```

### Purpose

Represents a single chat thread in the sidebar.

---

## 5.4 Messages Collection

This is the most important collection for your MVP.

```js
{
  _id: ObjectId,

  userId: ObjectId,
  userIdStr: String,

  conversationId: ObjectId,
  conversationIdStr: String,

  role: "user" | "assistant" | "system",

  content: String,
  contentPreview: String,

  model: String,

  embedding: [Number],
  embeddingModel: String,
  embeddingDim: Number,

  isMemoryEligible: Boolean,

  tokenUsage: {
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number
  },

  metadata: {
    source: "chat" | "tool" | "system",
    ragUsed: Boolean,
    retrievedMemoryIds: [ObjectId],
    ollamaDurationMs: Number
  },

  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}
```

### Normal Indexes

```js
userId + conversationId + createdAt
conversationId + createdAt
userId + createdAt
userId + role
isMemoryEligible
```

### Vector Search Index

Example MongoDB Atlas Vector Search index:

```js
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userIdStr"
    },
    {
      "type": "filter",
      "path": "conversationIdStr"
    },
    {
      "type": "filter",
      "path": "role"
    },
    {
      "type": "filter",
      "path": "isMemoryEligible"
    }
  ]
}
```

Use the actual `numDimensions` returned by your chosen embedding model. Ollama’s current embed endpoint accepts `model`, `input`, optional `dimensions`, and returns an `embeddings` array. ([docs.ollama.com](https://docs.ollama.com/api/embed))

MongoDB Vector Search must have a vector search index before querying, and the Node.js driver can run vector search through an aggregation pipeline using `$vectorSearch`. ([mongodb.com](https://www.mongodb.com/docs/drivers/node/current/atlas-vector-search/))

---
