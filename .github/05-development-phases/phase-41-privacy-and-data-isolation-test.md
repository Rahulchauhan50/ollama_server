## Phase 41: Privacy and Data Isolation Test

### Goal

Ensure user memories never leak.

### Implement

Manual or automated test:

```txt
User A says: My secret code is mango123.
User B asks: What is my secret code?
```

### Expected Result

User B should not receive User A’s memory.

### Database Check

Vector search must filter by:

```txt
userIdStr
```

### Move to Next Phase When

Cross-user memory leakage is impossible in tests.

---
