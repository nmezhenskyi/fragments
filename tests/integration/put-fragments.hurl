# 1. Create json fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
```{ "key": "value" }```

HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 18
[Captures]
url: header "Location"

# 2. Update json fragment
PUT {{url}}
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
```{ "key": "new value" }```

HTTP/1.1 200
[Asserts]
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 22

# 3. Retrieve the value
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
body == ```{ "key": "new value" }```

# 4. Try updating to different content type
PUT {{url}}
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
```# Some markdown```

# 5. Should receive HTTP 400
HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 400
jsonpath "$.error.message" == "Content-Type does not match existing fragment's content type"

# 6.  Try updating non-existent fragment
PUT http://localhost:8080/v1/fragments/abcd
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
```# Some markdown```

# 7. Should receive HTTP 404
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "Fragment abcd not found"
