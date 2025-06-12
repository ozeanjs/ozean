import { describe, test, expect, beforeEach } from 'bun:test';
import { BaseExceptionFilter } from '../../src/filters/base-exception-filter';
import {
  HttpException,
  BadRequestException,
  NotFoundException,
} from '../../src/exceptions/http-exception';
import { HttpStatus } from '../../src/common/http-status.enum';
import type { ArgumentsHost } from '../../src/interfaces/exception-filter.interface';

describe('BaseExceptionFilter', () => {
  let filter: BaseExceptionFilter;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    // Create a new instance of the filter before each test
    filter = new BaseExceptionFilter();

    // Create a mock ArgumentsHost object
    mockHost = {
      getRequest: <Request>() => new Request('http://localhost/test') as Request,
    };
  });

  // Test Case 1: Handling known HttpException
  describe('when catching HttpException', () => {
    test("should return a response with the exception's status code and payload", async () => {
      const exception = new NotFoundException('The requested resource was not found.');
      const response = filter.catch(exception, mockHost);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(HttpStatus.NOT_FOUND);

      const body = await response.json();
      expect(body).toEqual({
        statusCode: 404,
        message: 'The requested resource was not found.',
        error: 'Not Found',
      });
    });

    test('should handle HttpException with an object as response', async () => {
      const errorObject = { message: 'Invalid input provided.', fields: ['email'] };
      const exception = new BadRequestException(errorObject);
      const response = filter.catch(exception, mockHost);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);

      const body = await response.json();
      expect(body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid input provided.',
        fields: ['email'],
      });
    });

    test('should handle a generic HttpException with a string message', async () => {
      const exception = new HttpException("I'm a teapot", HttpStatus.I_AM_A_TEAPOT);
      const response = filter.catch(exception, mockHost);

      expect(response.status).toBe(HttpStatus.I_AM_A_TEAPOT);
      // Since the response in a generic HttpException is just the string, the body is not JSON
      expect(await response.text()).toBe("I'm a teapot");
    });
  });

  // Test Case 2: Handling standard JavaScript Errors
  describe('when catching a standard Error', () => {
    test('should return a 500 Internal Server Error response', async () => {
      const exception = new Error('A critical database error occurred.');
      const response = filter.catch(exception, mockHost);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);

      const body = await response.json();
      expect(body).toEqual({
        statusCode: 500,
        message: 'Internal Server Error',
        error: 'A critical database error occurred.', // Includes the original error message
      });
    });
  });

  // Test Case 3: Handling unknown or non-Error exceptions
  describe('when catching an unknown exception type', () => {
    test('should return a 500 Internal Server Error for a thrown string', async () => {
      const exception = 'Something bad happened';
      const response = filter.catch(exception, mockHost);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);

      const body = await response.json();
      expect(body).toEqual({
        statusCode: 500,
        message: 'Internal Server Error',
        // When a non-Error is thrown, its message property might be undefined
        error: undefined,
      });
    });

    test('should return a 500 Internal Server Error for a thrown object', async () => {
      const exception = { reason: 'System overload' };
      const response = filter.catch(exception, mockHost);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);

      const body = await response.json();
      expect(body).toEqual({
        statusCode: 500,
        message: 'Internal Server Error',
        error: undefined,
      });
    });
  });
});
