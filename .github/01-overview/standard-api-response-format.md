# 4. Standard API Response Format

Use one response format everywhere.

## Success Response

```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {},
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-05-09T10:00:00.000Z"
  }
}
```

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-05-09T10:00:00.000Z"
  }
}
```

## Common Status Codes

```txt
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Internal Server Error
503 AI Service Unavailable
```

---
