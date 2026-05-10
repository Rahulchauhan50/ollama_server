## Phase 27: MongoDB Vector Search Index

### Goal

Enable semantic memory search.

### Implement

Create Atlas Vector Search index on `messages`.

Example:

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
      "path": "role"
    },
    {
      "type": "filter",
      "path": "isMemoryEligible"
    }
  ]
}
```

### API Endpoints Added

Development only:

```txt
POST /api/dev/memory/search
```

### Request

```json
{
  "query": "What is my name and what technology do I like?"
}
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "content": "Hi, I am Rahul. I love MERN stack.",
        "score": 0.89
      }
    ]
  }
}
```

### Database Changes

Atlas Vector Search index created.

### Test

Insert message:

```txt
Hi, I am Rahul. I love MERN stack.
```

Search:

```txt
What is my name?
```

Expected:

```txt
Rahul message appears in top results
```

Search from another user.

Expected:

```txt
Other user's messages do not appear
```

### Move to Next Phase When

Vector search returns relevant private user memories.

---
