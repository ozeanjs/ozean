# Exception Handling

OzeanJs comes with a built-in exception handling system called **Exception Filters**, which allows you to catch exceptions that occur within your application and transform them into appropriate, standardized HTTP responses.

This principle helps you completely separate your error handling logic from the business logic in your controllers and services, leading to cleaner and more maintainable code.

## `HttpException`: Base Exception Class

OzeanJs provides a base `HttpException` class that you can use or extend to create your own custom exceptions.

**Usage:**
When you `throw` an instance of `HttpException` (or a class that inherits from it), the framework will automatically catch the exception and send a response back to the client with the HTTP status code and message you've defined.

### Throwing a Generic Exception

For any HTTP error that doesn't have a pre-built exception class, you can use the base `HttpException` class directly. The constructor takes two arguments:

1.  `response`: A string or object describing the error.
2.  `statusCode`: An HTTP status code, preferably from the `HttpStatus` enum.

```typescript
@Get('/tea')
makeTea() {
  // Throws an exception that results in a 418 I'm a teapot response
  throw new HttpException('I am a teapot', HttpStatus.I_AM_A_TEAPOT);
}

@Post('/custom-error')
createCustomError(@Body() body: any) {
  // You can also pass an object as the response body
  const errorResponse = {
    message: 'A custom error occurred',
    details: {
      reason: 'Something went wrong with the input',
      value: body.someValue
    }
  };
  throw new HttpException(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY); // 422
}
```

**Built-in Exceptions:**

- BadRequestException
- UnauthorizedException
- NotFoundException
- ForbiddenException
- NotAcceptableException
- RequestTimeoutException
- ConflictException
- GoneException
- HttpVersionNotSupportedException
- PayloadTooLargeException
- UnsupportedMediaTypeException
- UnprocessableEntityException
- InternalServerErrorException
- NotImplementedException
- ImATeapotException
- MethodNotAllowedException
- BadGatewayException
- ServiceUnavailableException
- GatewayTimeoutException
- PreconditionFailedException

**Creating Custom Exceptions:**
You can easily create your own exceptions.

```typescript
import { HttpException, HttpStatus } from 'ozean';

export class CustomErrorException extends HttpException {
  constructor() {
    super('This is a custom error message.', HttpStatus.I_AM_A_TEAPOT);
  }
}
```

## Exception Filters

For more complex scenarios, you can create your own **Exception Filter** to take full control over the response to an exception.

### Creating a Filter

An Exception Filter is a class that implements the `ExceptionFilter` interface and is decorated with `@Catch()`.

- **`@Catch(ExceptionType)`**: This decorator tells OzeanJs what type of exception this filter is responsible for catching.
- **`catch(exception, host)`**: This is the method that will be executed when the specified exception is caught.

**Example `ForbiddenExceptionFilter`:**

```typescript
// src/filters/forbidden.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from 'ozean';

// First, create our Custom Exception
export class ForbiddenException extends HttpException {
  constructor() {
    super('Forbidden', HttpStatus.FORBIDDEN);
  }
}

@Catch(ForbiddenException) // 1. Specify that this filter catches ForbiddenException
@Injectable()
export class ForbiddenExceptionFilter implements ExceptionFilter<ForbiddenException> {
  // 2. Implement the 'catch' method
  catch(exception: ForbiddenException, host: ArgumentsHost): Response {
    const request = host.getRequest<Request>();
    const statusCode = exception.statusCode;

    console.log(`[Forbidden Filter]: Custom handling for ${request.url}`);

    // 3. Create and return the Response object you want
    return new Response(
      JSON.stringify({
        statusCode: statusCode,
        message: 'Access is denied by a custom filter!',
        timestamp: new Date().toISOString(),
        path: request.url,
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

### Using a Filter

You can apply filters at three levels using the `@UseFilters()` decorator:

1.  **Route-level**: Apply to a specific handler method.

    ```typescript
    @Controller('/posts')
    export class PostsController {
      @Get(':id')
      @UseFilters(ForbiddenExceptionFilter)
      findOne(@Param('id') id: string) {
        // If this logic throws a ForbiddenException, the ForbiddenExceptionFilter will run
        throw new ForbiddenException();
      }
    }
    ```

2.  **Controller-level**: Apply to every route handler in a controller.

    ```typescript
    @Controller('/posts')
    @UseFilters(ForbiddenExceptionFilter)
    export class PostsController {
      // Every route in here will use the ForbiddenExceptionFilter
    }
    ```

3.  **Global-level**: Apply to every route in your application.

    ```typescript
    // In your main.ts file
    const app = new App(AppModule);
    app.useGlobalFilters(ForbiddenExceptionFilter); // <-- Use this method
    app.listen(3000);
    ```

Finally, don't forget to add your filter to the `providers` array of the relevant module so the DI Container can recognize it!
