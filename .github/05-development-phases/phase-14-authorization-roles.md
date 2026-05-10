## Phase 14: Authorization Roles

### Goal

Separate normal users from admins.

### Implement

Create:

```txt
src/middlewares/admin.middleware.js
```

Add:

```txt
requireAdmin()
```

### API Endpoints Added

```txt
GET /api/admin/status
```

### Expected Response for Admin

```json
{
  "success": true,
  "message": "Admin API available"
}
```

### Test

Normal user calls admin route.

Expected:

```txt
403 Forbidden
```

Admin user calls admin route.

Expected:

```txt
200 OK
```

### Move to Next Phase When

Admin protection is working.

---
