# 1. Create JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
```{ "service": "DynamoDB" }```

# 2. Verify POST response
HTTP/1.1 201
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# 3. GET the fragment info
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment1_id}}
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 25

# 4. Create second JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
```DynamoDB is **great**.```

# 5. Verify second POST response
HTTP/1.1 201
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 6. GET the second fragment info
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment2_id}}
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22

# 7. GET all fragments for the user & check that they include created fragments
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" isCollection
jsonpath "$.fragments[*]" includes "{{fragment1_id}}"
jsonpath "$.fragments[*]" includes "{{fragment2_id}}"

# 8. DELETE the first fragment
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 9. Confirm DELETE request success
HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.status" == "ok"

# 10. Try to GET the first fragment info, should return 404
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

# 11. Confirm 404 for the deleted fragment
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404

# 12. GET all fragments for the user & check that the deleted fragment isn't included
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" isCollection
jsonpath "$.fragments[*]" not includes "{{fragment1_id}}"
jsonpath "$.fragments[*]" includes "{{fragment2_id}}"
