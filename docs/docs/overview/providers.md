# Providers and Dependency Injection (DI)

Providers are a fundamental concept in OzeanJs. They are classes that can be "injected" as dependencies into other classes. Most of the time, they are services that encapsulate business logic, but they can also be repositories, factories, or helpers.

## Injectable Services

The `@Injectable()` decorator marks a class as a provider that can be managed by the OzeanJs Dependency Injection container. This allows the framework to create an instance of this class and inject it where needed.

## Dependency Injection

Dependency Injection is a design pattern where the framework takes control of creating and delivering dependencies (like services) to classes that need them (like controllers). In OzeanJs, this is done through constructor injection: you simply declare the dependency you need as a constructor parameter, along with its type. The framework handles the rest.

---

## Complete Example: `Users` Feature

Here is a complete example that demonstrates how Controllers, Providers, and Modules work together.

### 1. The Service (`users.service.ts`)

The service is marked as `@Injectable()` and handles the business logic for fetching and creating users.

```typescript
// src/users/users.service.ts
import { Injectable } from 'ozean';

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
```

### 2. The Controller (`users.controller.ts`)

The controller handles incoming requests. It **injects** the `UsersService` through its constructor to delegate the business logic.

```typescript
// src/users/users.controller.ts
import { Controller, Get, Post, Param, Body } from 'ozean';
import { UsersService } from './users.service';

@Controller('/users') // All routes in here will be prefixed with /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Get('/:id')
  getUserById(@Param('id') id: string) {
    const user = this.usersService.findOne(parseInt(id, 10));
    if (!user) {
      return new Response('User not found', { status: 404 });
    }
    return user;
  }

  @Post()
  createUser(@Body() userData: { name: string }) {
    return this.usersService.create(userData);
  }
}
```

### 3. The Module (`users.module.ts`)

Finally, the module bundles everything together. It registers the `UsersController` and makes the `UsersService` available for injection within this module.

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
