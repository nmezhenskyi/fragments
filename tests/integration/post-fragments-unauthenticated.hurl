# Unauthenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
```This is a fragment!```

HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"
