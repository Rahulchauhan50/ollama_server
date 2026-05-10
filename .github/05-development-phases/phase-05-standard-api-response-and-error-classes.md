## Phase 5: Standard API Response and Error Classes

### Goal

Make all responses consistent.

### Implement

Create:

```txt
src/utils/apiResponse.js
src/utils/AppError.js
src/middlewares/error.middleware.js
src/utils/asyncHandler.js
```

Define reusable helpers:

```txt
sendSuccess()
sendCreated()
sendError()
AppError
asyncHandler
```

### API Endpoints Added

Update:

```txt
GET /api/health
GET /api/unknown-route
```

### Database Changes

None.

### Test

Call unknown route:

```bash
curl http://localhost:5000/api/not-found
```

### Expected Result

```json
{
  "success": false,
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Route not found"
  }
}
```

### Move to Next Phase When

All success and error responses follow one format.

---
