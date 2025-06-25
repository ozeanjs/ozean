# Core Concepts

OceanJs is built on a **Modular Architecture**, inspired by Angular, which gives your code a clear, scalable, and easy-to-extend structure.

The main components of an OceanJs application consist of three key parts:

- **Modules**: The containers for organizing various components.
- **Providers**: Classes that handle Business Logic (mostly Services).
- **Controllers**: Classes that receive HTTP Requests and send back Responses.

---

## 1. Modules: The Foundation of an Application

Modules are the core of code organization in OceanJs. Every application has at least one module, the Root Module (e.g., `AppModule`). We use the `@Module()` decorator to define a module.

- **`providers`**: Registers Services or other Providers that will be managed by the DI Container and can be injected within this module.
- **`controllers`**: Registers the Controllers that will be managed by this module.
- **`imports`**: Imports other modules to use the Providers they have `export`ed.
- **`exports`**: Allows Providers from this module to be used by other modules that `import` this one.

**Example:**

```typescript
// users.module.ts
import { Module } from 'OceanJs';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

---

## 2. Providers and Dependency Injection (DI)

Providers are classes designed to "provide" various logic and can be "injected" (passed) into other parts of the application, such as Services, Repositories, Factories, or Helpers. We use the `@Injectable()` decorator to mark a class as a Provider.

**Dependency Injection (DI)** is the mechanism where the framework automatically creates and injects instances of the Providers (dependencies) you need, simply by requesting them in a `constructor`.

**Example:**

```typescript
// users.service.ts
@Injectable()
export class UsersService {
  findUserById(id: number) {
    return { id, name: 'John Doe' };
  }
}

// users.controller.ts
@Controller('/users')
export class UsersController {
  // 1. Request UsersService here.
  // 2. OceanJs will automatically create and inject an instance of UsersService.
  constructor(private readonly usersService: UsersService) {}

  @Get('/:id')
  getUser(@Param('id') id: string) {
    // 3. Use the usersService instance.
    return this.usersService.findUserById(parseInt(id, 10));
  }
}
```

---

## 3. Controllers and Request Lifecycle

Controllers are responsible for receiving incoming HTTP requests, processing them, and returning a response. We use Decorators to define routes and extract data from the request.

- **`@Controller('/prefix')`**: Defines a URL prefix for all routes within the class.
- **`@Get()`, `@Post()`, `@Put()` etc.**: Binds a method to an HTTP verb and path.
- **`@Param()`, `@Query()`, `@Body()`**: Decorators for easily extracting data from various parts of the request.

**Example:**

```typescript
@Controller('/posts')
export class PostsController {
  @Post()
  createPost(@Body() createPostDto: { title: string; content: string }) {
    // ... logic to create a post using data from the request body
    return { success: true, data: createPostDto };
  }

  @Get('/:id')
  getPost(@Param('id') postId: string) {
    // ... logic to fetch a post from the database using the id from the URL
    return { id: postId, title: 'My First Post' };
  }
}
```
