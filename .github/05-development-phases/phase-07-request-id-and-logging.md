## Phase 7: Request ID and Logging

### Goal

Every request should have a trace ID.

### Implement

Create:

```txt
src/middlewares/requestId.middleware.js
src/utils/logger.js
```

Every request gets:

```txt
req.requestId
```

Every response includes:

```json
{
  "meta": {
    "requestId": "req_xxx"
  }
}
```

### API Endpoints Added

No new endpoint.

### Database Changes

None.

### Test

Call:

```bash
curl http://localhost:5000/api/health
```

### Expected Result

Response includes `requestId`.

### Move to Next Phase When

Every response includes a request ID.

---
