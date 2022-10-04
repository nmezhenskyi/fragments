/**
 * Represents an API error.
 * Contains status code `status` and `message` fields.
 */
class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }

  static BadRequest(message = 'Bad Request') {
    return new ApiError(400, message)
  }

  static Unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message)
  }

  static Forbidden(message = 'Forbidden') {
    return new ApiError(403, message)
  }

  static NotFound(message = 'Not Found') {
    return new ApiError(404, message)
  }

  static UnsupportedMediaType(message = 'Unsupported Media Type') {
    return new ApiError(415, message)
  }

  static InternalError(message = 'Unexpected Internal Error') {
    return new ApiError(500, message)
  }
}

module.exports.ApiError = ApiError
