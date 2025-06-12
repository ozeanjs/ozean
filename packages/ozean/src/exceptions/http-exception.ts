import { HttpStatus } from 'common/http-status.enum';

export class HttpException extends Error {
  constructor(
    public readonly response: string | object,
    public readonly statusCode: HttpStatus
  ) {
    super();
    this.message = typeof response === 'string' ? response : JSON.stringify(response);
  }
}

const createErrorResponse = (
  message: string | object,
  statusCode: HttpStatus,
  defaultError: string
) => {
  return typeof message === 'string'
    ? { statusCode, message, error: defaultError }
    : { statusCode, error: defaultError, ...message };
};

export class BadRequestException extends HttpException {
  constructor(message: string | object = 'Bad Request') {
    super(
      createErrorResponse(message, HttpStatus.BAD_REQUEST, 'Bad Request'),
      HttpStatus.BAD_REQUEST
    );
  }
}
export class UnauthorizedException extends HttpException {
  constructor(message: string | object = 'Unauthorized') {
    super(
      createErrorResponse(message, HttpStatus.UNAUTHORIZED, 'Unauthorized'),
      HttpStatus.UNAUTHORIZED
    );
  }
}
export class NotFoundException extends HttpException {
  constructor(message: string | object = 'Not Found') {
    super(createErrorResponse(message, HttpStatus.NOT_FOUND, 'Not Found'), HttpStatus.NOT_FOUND);
  }
}
export class ForbiddenException extends HttpException {
  constructor(message: string | object = 'Forbidden') {
    super(createErrorResponse(message, HttpStatus.FORBIDDEN, 'Forbidden'), HttpStatus.FORBIDDEN);
  }
}
export class NotAcceptableException extends HttpException {
  constructor(message: string | object = 'Not Acceptable') {
    super(
      createErrorResponse(message, HttpStatus.NOT_ACCEPTABLE, 'Not Acceptable'),
      HttpStatus.NOT_ACCEPTABLE
    );
  }
}
export class RequestTimeoutException extends HttpException {
  constructor(message: string | object = 'Request Timeout') {
    super(
      createErrorResponse(message, HttpStatus.REQUEST_TIMEOUT, 'Request Timeout'),
      HttpStatus.REQUEST_TIMEOUT
    );
  }
}
export class ConflictException extends HttpException {
  constructor(message: string | object = 'Conflict') {
    super(createErrorResponse(message, HttpStatus.CONFLICT, 'Conflict'), HttpStatus.CONFLICT);
  }
}
export class GoneException extends HttpException {
  constructor(message: string | object = 'Gone') {
    super(createErrorResponse(message, HttpStatus.GONE, 'Gone'), HttpStatus.GONE);
  }
}
export class PayloadTooLargeException extends HttpException {
  constructor(message: string | object = 'Payload Too Large') {
    super(
      createErrorResponse(message, HttpStatus.PAYLOAD_TOO_LARGE, 'Payload Too Large'),
      HttpStatus.PAYLOAD_TOO_LARGE
    );
  }
}
export class UnsupportedMediaTypeException extends HttpException {
  constructor(message: string | object = 'Unsupported Media Type') {
    super(
      createErrorResponse(message, HttpStatus.UNSUPPORTED_MEDIA_TYPE, 'Unsupported Media Type'),
      HttpStatus.UNSUPPORTED_MEDIA_TYPE
    );
  }
}
export class UnprocessableEntityException extends HttpException {
  constructor(message: string | object = 'Unprocessable Entity') {
    super(
      createErrorResponse(message, HttpStatus.UNPROCESSABLE_ENTITY, 'Unprocessable Entity'),
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }
}
export class InternalServerErrorException extends HttpException {
  constructor(message: string | object = 'Internal Server Error') {
    super(
      createErrorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'),
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
export class NotImplementedException extends HttpException {
  constructor(message: string | object = 'Not Implemented') {
    super(
      createErrorResponse(message, HttpStatus.NOT_IMPLEMENTED, 'Not Implemented'),
      HttpStatus.NOT_IMPLEMENTED
    );
  }
}
export class ImATeapotException extends HttpException {
  constructor(message: string | object = "I'm a teapot") {
    super(
      createErrorResponse(message, HttpStatus.I_AM_A_TEAPOT, "I'm a teapot"),
      HttpStatus.I_AM_A_TEAPOT
    );
  }
}
export class MethodNotAllowedException extends HttpException {
  constructor(message: string | object = 'Method Not Allowed') {
    super(
      createErrorResponse(message, HttpStatus.METHOD_NOT_ALLOWED, 'Method Not Allowed'),
      HttpStatus.METHOD_NOT_ALLOWED
    );
  }
}
export class BadGatewayException extends HttpException {
  constructor(message: string | object = 'Bad Gateway') {
    super(
      createErrorResponse(message, HttpStatus.BAD_GATEWAY, 'Bad Gateway'),
      HttpStatus.BAD_GATEWAY
    );
  }
}
export class ServiceUnavailableException extends HttpException {
  constructor(message: string | object = 'Service Unavailable') {
    super(
      createErrorResponse(message, HttpStatus.SERVICE_UNAVAILABLE, 'Service Unavailable'),
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}
export class GatewayTimeoutException extends HttpException {
  constructor(message: string | object = 'Gateway Timeout') {
    super(
      createErrorResponse(message, HttpStatus.GATEWAY_TIMEOUT, 'Gateway Timeout'),
      HttpStatus.GATEWAY_TIMEOUT
    );
  }
}
export class PreconditionFailedException extends HttpException {
  constructor(message: string | object = 'Precondition Failed') {
    super(
      createErrorResponse(message, HttpStatus.PRECONDITION_FAILED, 'Precondition Failed'),
      HttpStatus.PRECONDITION_FAILED
    );
  }
}
export class HttpVersionNotSupportedException extends HttpException {
  constructor(message: string | object = 'HTTP Version Not Supported') {
    super(
      createErrorResponse(
        message,
        HttpStatus.HTTP_VERSION_NOT_SUPPORTED,
        'HTTP Version Not Supported'
      ),
      HttpStatus.HTTP_VERSION_NOT_SUPPORTED
    );
  }
}
