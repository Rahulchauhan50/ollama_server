## Phase 4: Basic Express App

### Goal

Create the Express app and server entry point.

### Implement

Create:

```txt
src/app.js
src/server.js
```

Add:

```txt
express.json()
cookieParser()
cors()
helmet()
request logging placeholder
global 404 handler
global error handler placeholder
```

### API Endpoints Added

```txt
GET /api/health
```

### Expected Response

```json
{
  "success": true,
  "message": "Backend is healthy"
}
```

### Database Changes

None.

### Test

Call:

```bash
curl http://localhost:5000/api/health
```

### Expected Result

Status `200`.

### Move to Next Phase When

Health endpoint works every time.

---
