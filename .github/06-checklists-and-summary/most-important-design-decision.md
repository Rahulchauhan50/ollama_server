# 13. Most Important Design Decision

Do **not** let React call Ollama.

Your frontend should only call your Node backend:

```txt
React -> Node -> Ollama
React -> Node -> MongoDB
```

Never:

```txt
React -> Ollama
```

That one rule protects:

```txt
your VPS
your models
your admin endpoints
your database
your prompt templates
your user memory
```

Your Node backend is the gatekeeper. It decides:

```txt
who can chat
which model can be used
how much memory is retrieved
which messages are stored
which Ollama endpoints are allowed
which endpoints are admin-only
```

That is the correct architecture for your MVP.
