# Middleware

In OzeanJs, a **Middleware** is a function that executes **between** the server receiving a request and before that request is sent to the Route Handler (a method in a Controller). Middleware is a very powerful feature for tasks that need to be repeated across many requests.

### What is Middleware?

Middleware is a "checkpoint" that a request must pass through before reaching its destination. You can use Middleware to:

- Run any code.
- Modify the Request and Response objects.
- End the request-response cycle (e.g., by blocking an unauthorized request).
- Call the next middleware in the chain.

**Execution Order:** `Request` → **Middleware** → `Guard` → `Pipe` → `Controller Handler` → `Response`

## Creating Middleware

A Middleware is a class that implements the `Middleware` interface, which has a single method: `use()`.

- **`use(req: Request, next: NextFunction)`**: This method serves as the main logic of the middleware.
  - **`req`**: The incoming `Request` object.
  - **`next`**: A function that you must call to pass the request to the next "checkpoint". If you don't call `next()`, the request will stop processing at this middleware.

**Example `LoggerMiddleware`:**

```typescript
// src/middleware/logger.middleware.ts
import { Injectable, Middleware, NextFunction } from 'ozean';

@Injectable()
export class LoggerMiddleware implements Middleware {
  async use(req: Request, next: NextFunction): Promise<Response> {
    const start = Date.now();
    const { method, url } = req;

    console.log(`[Request] ==> ${method} ${new URL(url).pathname}`);

    // Call next() to pass to the next middleware/handler and wait for the response
    const response = await next();

    const duration = Date.now() - start;
    console.log(
      `[Response] <== ${method} ${new URL(url).pathname} - ${response.status} (${duration}ms)`
    );

    return response;
  }
}
```

## Using Middleware

You can apply Middleware at three levels:

### 1. Global Middleware (Application-level)

This is middleware that will run for **every request** coming into your application. It's ideal for loggers or security headers.

**Usage in `main.ts`:**

```typescript
// src/main.ts
const app = new App(AppModule);

// Use app.use() to register a Global Middleware
app.use(LoggerMiddleware);

app.listen(3000);
```

### 2. Controller-level Middleware

This is middleware that will run for **every route handler** within a specific controller.

**Usage:** Use the `@UseMiddleware()` decorator on the Controller class.

```typescript
// src/users.controller.ts
import { Controller, Get, UseMiddleware } from 'ozean';
import { LoggerMiddleware } from '../middleware/logger.middleware';

@Controller('/users')
@UseMiddleware(LoggerMiddleware) // <-- Applied to all routes in here
export class UsersController {
  @Get()
  findAll() {
    /* ... */
  }

  @Get('/:id')
  findOne() {
    /* ... */
  }
}
```

### 3. Route-level Middleware

This is middleware that will run for **only the specified route handler**.

**Usage:** Use the `@UseMiddleware()` decorator on the handler method.

```typescript
// src/users.controller.ts
import { Controller, Get, Post, UseMiddleware } from 'ozean';
import { LoggerMiddleware } from '../middleware/logger.middleware';

@Controller('/users')
export class UsersController {
  @Get()
  findAll() {
    /* ... */
  }

  @Post()
  @UseMiddleware(LoggerMiddleware) // <-- Applied only to POST /users
  create() {
    /* ... */
  }
}
```

**Execution Order**: Middleware will always execute in this order: **Global** → **Controller-level** → **Route-level**.

Finally, don't forget to add your Middleware to the `providers` array of the relevant Module so the DI Container recognizes it!
