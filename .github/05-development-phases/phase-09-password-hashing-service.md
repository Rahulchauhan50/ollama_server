## Phase 9: Password Hashing Service

### Goal

Create secure password hashing utilities.

### Implement

Create:

```txt
src/services/password.service.js
```

Methods:

```txt
hashPassword(password)
comparePassword(password, passwordHash)
```

Use bcrypt.

### API Endpoints Added

None.

### Database Changes

None.

### Test

Unit test:

```txt
hashPassword("Password123!")
comparePassword("Password123!", hash) => true
comparePassword("wrong", hash) => false
```

### Expected Result

Plain password is never equal to hash.

### Move to Next Phase When

Password hashing and comparison pass tests.

---
