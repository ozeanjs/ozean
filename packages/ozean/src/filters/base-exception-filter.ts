import { HttpStatus } from 'common/http-status.enum';
import { HttpException } from 'exceptions/http-exception';
import type { ArgumentsHost, ExceptionFilter } from 'interfaces/exception-filter.interface';

export class BaseExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): Response {
    if (exception instanceof HttpException) {
      console.error(
        `HTTP Exception Caught by Base Filter: ${exception.statusCode} - ${exception.message}`
      );
      return new Response(
        typeof exception.response === 'string'
          ? exception.response
          : JSON.stringify(exception.response),
        {
          status: exception.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.error('Unhandled Exception Caught by Base Filter:', exception);
    const errorResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
      error: exception.message,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
