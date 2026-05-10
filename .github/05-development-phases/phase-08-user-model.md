## Phase 8: User Model

### Goal

Create the user database model.

### Implement

Create:

```txt
src/models/User.model.js
src/repositories/user.repository.js
```

Fields:

```txt
name
email
passwordHash
role
plan
isActive
isEmailVerified
lastLoginAt
createdAt
updatedAt
```

### API Endpoints Added

None.

### Database Changes

Create `users` collection.

### Indexes

```txt
email unique
role
createdAt
```

### Test

Use a temporary script or unit test to create a user.

### Expected Result

User is saved with:

```txt
email lowercased
password not stored as plain text
timestamps present
```

### Move to Next Phase When

User model saves and unique email index works.

---
