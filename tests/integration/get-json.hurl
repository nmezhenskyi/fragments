# 1. Upload application/json  fragment
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

# 2. Get as is
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
body == ```{ "key": "value" }```

# 3. Convert to .txt
GET {{url}}.txt
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "text/plain; charset=utf-8"
body == ```{ "key": "value" }```

# 4. Convert to .json
GET {{url}}.json
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
body == ```{ "key": "value" }```

# 5. Unsupported fails
GET {{url}}.abcd
[BasicAuth]
user1@email.com:password1

HTTP/1.1 415
