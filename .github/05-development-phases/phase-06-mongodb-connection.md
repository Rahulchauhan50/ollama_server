## Phase 6: MongoDB Connection

### Goal

Connect Express to MongoDB.

### Implement

Create:

```txt
src/config/database.js
```

Add:

```txt
connectDB()
disconnectDB()
connection event logging
graceful shutdown
```

### API Endpoints Added

Update:

```txt
GET /api/health
```

Return:

```json
{
  "database": "connected"
}
```

### Database Changes

None yet.

### Test

Use valid `MONGODB_URI`.

### Expected Result

Server logs:

```txt
MongoDB connected successfully
```

Use invalid `MONGODB_URI`.

### Expected Result

Server should fail clearly and not pretend to be healthy.

### Move to Next Phase When

MongoDB connection is reliable.

---
