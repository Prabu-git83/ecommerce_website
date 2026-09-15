export class ApiError extends Error {
  statusCode: number;
  code: string;
  fields?: Record<string, string>;

  constructor(statusCode: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }

  static badRequest(message: string, code = "bad_request", fields?: Record<string, string>) {
    return new ApiError(400, code, message, fields);
  }
  static unauthorized(message = "Authentication required", code = "unauthorized") {
    return new ApiError(401, code, message);
  }
  static forbidden(message = "You do not have access to this resource", code = "forbidden") {
    return new ApiError(403, code, message);
  }
  static notFound(message = "Resource not found", code = "not_found") {
    return new ApiError(404, code, message);
  }
  static conflict(message: string, code = "conflict") {
    return new ApiError(409, code, message);
  }
}
