# Controllers

In OzeanJs, a **Controller**'s main responsibility is to receive incoming HTTP requests from the client, process them, and send back an HTTP response. A Controller acts as the "front line" that connects the outside world to your application's business logic.

The structure of a Controller is designed to be clear and modular, using Decorators to define routing and handle data.

## Creating a Controller

We create a Controller by creating a TypeScript class and attaching the `@Controller()` decorator.

- **`@Controller('/prefix')`**: This decorator defines a "base path" or URL prefix for all routes defined within this class. For example, if you define `@Controller('/users')`, all routes in this controller will start with `/users`.

### Defining Route Handlers

Inside a Controller, we create various methods that act as "Route Handlers". They are bound to specific HTTP Methods and sub-paths using Decorators:

- **`@Get('/path')`**: For handling `GET` requests.
- **`@Post('/path')`**: For handling `POST` requests.
- **`@Put('/path')`**: For handling `PUT` requests.
- **`@Delete('/path')`**: For handling `DELETE` requests.
- **`@Patch('/path')`**: For handling `PATCH` requests.

## Accessing Request Data (Parameter Decorators)

OzeanJs provides Parameter Decorators that help you easily extract data from various parts of the request into your handler methods:

- **`@Param('key')`**: Extracts a value from the URL parameter (e.g., from the route `/users/:id`).
- **`@Query('key')`**: Extracts a value from the URL's query string (e.g., from `/users?role=admin`).
- **`@Body()`**: Extracts the entire request body (typically used with `POST`, `PUT`, `PATCH`).

## Usage Example: `UsersController`

Here is a complete example of a `UsersController` that demonstrates all these concepts working together.

```typescript
// src/users/users.service.ts
import { Injectable } from 'ozean';

// Assume we have a UsersService that handles user-related logic
@Injectable()
export class UsersService {
  private users = [{ id: 1, name: 'John Doe' }];

  findAll() {
    return this.users;
  }

  findOne(id: number) {
    return this.users.find((user) => user.id === id);
  }

  create(userData: { name: string }) {
    const newUser = { id: this.users.length + 1, ...userData };
    this.users.push(newUser);
    return newUser;
  }
}

// src/users/users.controller.ts
import { Controller, Get, Post, Param, Body } from 'ozean';
import { UsersService } from './users.service';

@Controller('/users') // All routes in here will be prefixed with /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Handles GET requests to /users
  @Get()
  getAllUsers() {
    return this.usersService.findAll();
  }

  // Handles GET requests to /users/:id (e.g., /users/1)
  @Get('/:id')
  getUserById(@Param('id') id: string) {
    const user = this.usersService.findOne(parseInt(id, 10));
    if (!user) {
      // You can return a Response object directly to set a custom status code
      return new Response('User not found', { status: 404 });
    }
    return user; // Will be automatically converted to a JSON response
  }

  // Handles POST requests to /users
  @Post()
  createUser(@Body() userData: { name: string }) {
    return this.usersService.create(userData);
  }
}
```

### Registering the Controller in a Module

Finally, don't forget to register the `UsersController` you created in the `controllers` array of the relevant module (e.g., `UsersModule`) so that OzeanJs recognizes it and creates the routes automatically.

```typescript
// src/users/users.module.ts
import { Module } from 'ozean';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

With this structure, the logic for handling HTTP requests is clearly separated within the Controller, making your code cleaner and easier to maintain.
