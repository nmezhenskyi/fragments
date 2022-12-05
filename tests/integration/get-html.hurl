# 1. Upload text/html  fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/html
[BasicAuth]
user1@email.com:password1
```<h1>Some html</h1>```

HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/html"
jsonpath "$.fragment.size" == 18
[Captures]
url: header "Location"

# 2. Get as is
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "text/html; charset=utf-8"
body == ```<h1>Some html</h1>```

# 3. Convert to .txt
GET {{url}}.txt
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "text/plain; charset=utf-8"
body == ```<h1>Some html</h1>```

# 4. Convert to .html
GET {{url}}.html
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "text/html; charset=utf-8"
body == ```<h1>Some html</h1>```

# 5. Unsupported fails
GET {{url}}.abcd
[BasicAuth]
user1@email.com:password1

HTTP/1.1 415
