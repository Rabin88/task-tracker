// Throw this from anywhere (services, controllers) for expected errors.
// The error handler turns it into a clean JSON response with the right status.
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new AppError(400, message, details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, message);
  }
  static notFound(message = 'Not found') {
    return new AppError(404, message);
  }
  static conflict(message = 'Conflict') {
    return new AppError(409, message);
  }
}
