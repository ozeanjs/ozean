# Guards

In OzeanJs, a **Guard** is a class with a single responsibility: **Authorization**. It determines whether a given request has the necessary permissions to access a specific route handler.

### Difference Between Middleware and Guards

- **Middleware**: Typically used for tasks that run before routing logic, such as authentication ("Who are you?"), logging, or parsing the request body.
- **Guard**: Runs **after** Middleware and has access to the `ExecutionContext`, which means it knows which handler will be executed. This makes it ideal for **Authorization** ("Do you have permission to do this?").

**Execution Order:** `Request` → `Middleware` → **`Guard`** → `Pipe` → `Controller Handler`

## Creating a Guard

A Guard is a simple class that implements the `CanActivate` interface, which has a single method: `canActivate()`.

- **`canActivate(context: ExecutionContext)`**: This method contains the authorization logic.
  - If it returns `true` (or a Promise that resolves to `true`): The request is allowed to proceed.
  - If it returns `false` (or a Promise that resolves to `false`, or throws a `ForbiddenException`): OzeanJs will immediately stop processing the request and send back a `403 Forbidden` response.

### `ExecutionContext`

The `ExecutionContext` is a useful object passed to the `canActivate` method, providing details about the current request:

- **`getHandler()`**: Returns a reference to the handler method that is about to be executed.
- **`getClass()`**: Returns the class constructor of the Controller to which the handler belongs.
- **`getRequest()`**: Returns the underlying native `Request` object.

## Usage Example: `RolesGuard` for Role-based Authorization

Here is a complete example of creating a role-based authorization system.

### Step 1: Create the `Roles` Decorator

We'll create a `@Roles` decorator to "tag" our routes with the required roles, using the built-in `Reflector` service from OzeanJs.

```typescript
// src/auth/roles.decorator.ts
import { Reflector } from 'ozean';

export const Roles = Reflector.createDecorator<string[]>();
```

### Step 2: Create the `RolesGuard`

This guard will read the "tags" set by the `@Roles` decorator and compare them against the user's roles from the request.

```typescript
// src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, Reflector } from 'ozean';
import { Roles } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  // 1. Inject the Reflector service
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 2. Use the reflector to read metadata from the @Roles decorator
    const requiredRoles = this.reflector.get<string[]>(Roles, context.getHandler());

    // If no roles are specified for this route, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Get the user data from the request (should be attached by an AuthMiddleware)
    const request = context.getRequest<Request>();
    const user = (request as any).state?.user;

    // 4. Check if the user has the required role
    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}
```

### Step 3: Apply the Guard in a Controller

Use the `@UseGuards()` decorator to enable the `RolesGuard` and the `@Roles()` decorator to specify permissions for each route.

```typescript
// src/admin/admin.controller.ts
import { Controller, Get, UseGuards } from 'ozean';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('/admin')
@UseGuards(RolesGuard) // <-- Apply RolesGuard to all routes in this Controller
export class AdminController {
  @Get('/dashboard')
  @Roles(['admin']) // <-- Specify that this route requires the 'admin' role
  getDashboard() {
    return { message: 'Welcome to the admin dashboard!' };
  }

  @Get('/reports')
  @Roles(['admin', 'auditor']) // <-- This route requires 'admin' OR 'auditor' role
  getReports() {
    return { message: 'Here are the monthly reports.' };
  }
}
```

### Step 4: Register in a Module

Finally, don't forget to add `RolesGuard` and `Reflector` to the `providers` array of the relevant module so the DI Container recognizes them.

```typescript
// src/admin/admin.module.ts
import { Module } from 'ozean';
import { AdminController } from './admin.controller';
import { RolesGuard } from '../auth/roles.guard';
import { Reflector } from 'ozean';

@Module({
  controllers: [AdminController],
  providers: [
    RolesGuard, // <-- Add the Guard
    Reflector, // <-- Add the Reflector
  ],
})
export class AdminModule {}
```
