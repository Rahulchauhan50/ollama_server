## Phase 11: Login API

### Goal

Allow users to log in.

### Implement

Add login logic in:

```txt
auth.controller.js
auth.service.js
```

### API Endpoints Added

```txt
POST /api/auth/login
```

### Request

```json
{
  "email": "rahul@example.com",
  "password": "Password123!"
}
```

### Expected Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "...",
    "user": {
      "id": "...",
      "name": "Rahul",
      "email": "rahul@example.com",
      "role": "user"
    }
  }
}
```

### Database Changes

Update:

```txt
users.lastLoginAt
```

### Test

Valid credentials.

Expected:

```txt
200 OK
access token returned
```

Wrong password.

Expected:

```txt
401 Unauthorized
AUTH_INVALID_CREDENTIALS
```

Unknown email.

Expected:

```txt
401 Unauthorized
AUTH_INVALID_CREDENTIALS
```

### Move to Next Phase When

Login is secure and does not reveal whether email or password was wrong.

---
