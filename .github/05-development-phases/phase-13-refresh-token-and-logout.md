## Phase 13: Refresh Token and Logout

### Goal

Make authentication production-friendly.

### Implement

Create:

```txt
src/models/RefreshSession.model.js
src/repositories/refreshSession.repository.js
```

Add:

```txt
createRefreshSession()
rotateRefreshToken()
revokeRefreshToken()
logout()
```

### API Endpoints Added

```txt
POST /api/auth/refresh
POST /api/auth/logout
```

### Database Changes

Create `refresh_sessions`.

### Test

Login.

Expected:

```txt
refresh session created
```

Refresh token.

Expected:

```txt
new access token returned
```

Logout.

Expected:

```txt
refresh session revoked
```

Use old refresh token after logout.

Expected:

```txt
401 Unauthorized
```

### Move to Next Phase When

Session lifecycle works.

---
