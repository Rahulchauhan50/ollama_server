## Phase 10: Signup API

### Goal

Allow new users to register.

### Implement

Create:

```txt
src/routes/auth.routes.js
src/controllers/auth.controller.js
src/services/auth.service.js
src/validators/auth.validators.js
```

Validation:

```txt
name required
email valid
password minimum length
password must not be empty
```

### API Endpoints Added

```txt
POST /api/auth/signup
```

### Request

```json
{
  "name": "Rahul",
  "email": "rahul@example.com",
  "password": "Password123!"
}
```

### Expected Response

```json
{
  "success": true,
  "message": "Signup successful",
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

New document in `users`.

### Test

Test valid signup.

Expected:

```txt
201 Created
user saved
passwordHash exists
password not returned
```

Test duplicate signup.

Expected:

```txt
409 Conflict
EMAIL_ALREADY_EXISTS
```

Test bad email.

Expected:

```txt
422 Validation Error
```

### Move to Next Phase When

Signup works and password is never leaked.

---
