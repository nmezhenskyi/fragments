# Unsupported media type POST to /v1/fragments
POST http://localhost:8080/v1/fragments
Content-Type: application/unsupported
[BasicAuth]
user1@email.com:password1
```Some arbitrary data...```

HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415
jsonpath "$.error.message" == "Unsupported Media Type"
