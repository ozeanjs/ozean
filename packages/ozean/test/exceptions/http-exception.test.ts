import { describe, test, expect } from 'bun:test';
import {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '../../src/exceptions/http-exception';
import { HttpStatus } from '../../src/common/http-status.enum';

describe('HttpException and its subclasses', () => {
  // Test the base HttpException
  describe('HttpException', () => {
    test('should correctly create an instance with a string response', () => {
      const exception = new HttpException('Custom Error', HttpStatus.I_AM_A_TEAPOT);
      expect(exception.statusCode).toBe(HttpStatus.I_AM_A_TEAPOT);
      expect(exception.response).toBe('Custom Error');
      expect(exception.message).toBe('Custom Error');
    });

    test('should correctly create an instance with an object response', () => {
      const errorObject = { message: 'Detailed Error', code: 123 };
      const exception = new HttpException(errorObject, HttpStatus.UNPROCESSABLE_ENTITY);
      expect(exception.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(exception.response).toEqual(errorObject);
      expect(exception.message).toBe(JSON.stringify(errorObject));
    });
  });

  // Test BadRequestException
  describe('BadRequestException', () => {
    test('should create with default message', () => {
      const exception = new BadRequestException();
      expect(exception.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.response).toEqual({
        statusCode: 400,
        message: 'Bad Request',
        error: 'Bad Request',
      });
    });

    test('should create with custom string message', () => {
      const exception = new BadRequestException('Invalid user ID');
      expect(exception.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.response).toEqual({
        statusCode: 400,
        message: 'Invalid user ID',
        error: 'Bad Request',
      });
    });

    test('should create with custom object message', () => {
      const errorDetails = { fields: ['username', 'password'] };
      const exception = new BadRequestException({
        message: 'Missing required fields',
        ...errorDetails,
      });
      expect(exception.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.response).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Missing required fields',
        fields: ['username', 'password'],
      });
    });
  });

  // Test NotFoundException
  describe('NotFoundException', () => {
    test('should create with default message', () => {
      const exception = new NotFoundException();
      expect(exception.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(exception.response).toEqual({
        statusCode: 404,
        message: 'Not Found',
        error: 'Not Found',
      });
    });

    test('should create with custom string message', () => {
      const exception = new NotFoundException('User with ID 123 not found');
      expect(exception.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(exception.response).toEqual({
        statusCode: 404,
        message: 'User with ID 123 not found',
        error: 'Not Found',
      });
    });
  });

  // Test ForbiddenException
  describe('ForbiddenException', () => {
    test('should create with default message', () => {
      const exception = new ForbiddenException();
      expect(exception.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(exception.response).toEqual({
        statusCode: 403,
        message: 'Forbidden',
        error: 'Forbidden',
      });
    });
  });

  // Test UnauthorizedException
  describe('UnauthorizedException', () => {
    test('should create with default message', () => {
      const exception = new UnauthorizedException();
      expect(exception.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(exception.response).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      });
    });
  });

  // Test InternalServerErrorException
  describe('InternalServerErrorException', () => {
    test('should create with default message', () => {
      const exception = new InternalServerErrorException();
      expect(exception.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(exception.response).toEqual({
        statusCode: 500,
        message: 'Internal Server Error',
        error: 'Internal Server Error',
      });
    });
  });

  // Test ConflictException
  describe('ConflictException', () => {
    test('should create with custom string message', () => {
      const exception = new ConflictException('Email already exists');
      expect(exception.statusCode).toBe(HttpStatus.CONFLICT);
      expect(exception.response).toEqual({
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict',
      });
    });
  });
});
