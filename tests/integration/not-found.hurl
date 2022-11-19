# Non-existing route test
GET http://localhost:8080/no-such-route

# Should get back an HTTP 1.1 404 response
HTTP/1.1 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "Not found"
