## Phase 12: JWT Access Token Service

### Goal

Protect private routes.

### Implement

Create:

```txt
src/services/token.service.js
src/middlewares/auth.middleware.js
```

Methods:

```txt
signAccessToken(user)
verifyAccessToken(token)
requireAuth()
```

### API Endpoints Added

```txt
GET /api/auth/me
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Rahul",
      "email": "rahul@example.com"
    }
  }
}
```

### Database Changes

None.

### Test

Call `/api/auth/me` without token.

Expected:

```txt
401 Unauthorized
```

Call with valid token.

Expected:

```txt
200 OK
user returned
```

Call with invalid token.

Expected:

```txt
401 Unauthorized
```

### Move to Next Phase When

Private route protection works.

---
