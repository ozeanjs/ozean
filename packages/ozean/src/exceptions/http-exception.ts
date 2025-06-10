export class HttpException extends Error {
  constructor(
    public readonly response: string | object,
    public readonly statusCode: number
  ) {
    super();
    this.message = typeof response === 'string' ? response : JSON.stringify(response);
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string | object = 'Bad Request') {
    const responsePayload =
      typeof message === 'string'
        ? { statusCode: 400, message, error: 'Bad Request' }
        : { statusCode: 400, error: 'Bad Request', ...message };
    super(responsePayload, 400);
  }
}
