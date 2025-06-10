---
title: Modules
description: In OzeanJs, a Module is the primary component for organizing the application's structure. Similar to `NgModule` in Angular, a Module acts as a "container" that groups related components, such as Controllers, Providers (Services), and even other Modules, together.
---

In OzeanJs, a **Module** is the primary component for organizing the application's structure. Similar to `NgModule` in Angular, a Module acts as a "container" that groups related components, such as Controllers, Providers (Services), and even other Modules, together.

Every OzeanJs application has at least one module, the **Root Module** (typically named `AppModule`), which is the starting point OzeanJs uses to build the dependency graph and all components of the application.

## Creating a Module

We can easily create a module by creating a TypeScript class and attaching the `@Module()` decorator.

The `@Module()` decorator takes a metadata object that tells OzeanJs what the module consists of:

- **`providers`**: An array of services or other providers that will be managed by the DI Container and can be injected within this module.

- **`controllers`**: An array of controllers that will be managed by this module.

- **`imports`**: An array of other Modules that this module needs to import to use their `export`ed providers.

- **`exports`**: An array of providers that this module makes available for other modules that `import` this one.

- **`global`**: (Optional) Set to `true` if you want the providers of this module to be injectable throughout the entire application without needing to be imported.

## Usage Example: Creating Feature and Shared Modules

Let's assume we are building an application with a Users system and need a central service for managing configuration.

### 1. Create `ConfigModule` (Shared Module)

We will create a module to manage `ConfigService` and make it **Global** so that all parts of the app can easily use it.

```typescript
// src/config/config.service.ts
import { Injectable } from 'ozean';

@Injectable()
export class ConfigService {
  get(key: string): string {
    return Bun.env[key] || '';
  }
}

// src/config/config.module.ts
import { Module } from 'ozean';
import { ConfigService } from './config.service';

@Module({
  global: true, // <-- Makes this module Global
  providers: [ConfigService],
  exports: [ConfigService], // <-- Must be exported for other modules to use
})
export class ConfigModule {}
```

### 2. Create `UsersModule` (Feature Module)

This module will be responsible for everything related to "Users".

```typescript
// src/users/users.service.ts
import { Injectable } from 'ozean';
import { ConfigService } from '../config/config.service';

@Injectable()
export class UsersService {
  // ConfigService can be injected directly because it's Global
  constructor(private readonly configService: ConfigService) {
    console.log('API Version from Config:', this.configService.get('API_VERSION'));
  }

  findAll() {
    return [{ id: 1, name: 'John Doe' }];
  }
}

// src/users/users.controller.ts
import { Controller, Get } from 'ozean';
import { UsersService } from './users.service';

@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllUsers() {
    return this.usersService.findAll();
  }
}

// src/users/users.module.ts
import { Module } from 'ozean';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  // No need for `imports: [ConfigModule]` because it's Global
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

### 3. Assemble in `AppModule` (Root Module)

Finally, we will assemble all the modules we've created in our `AppModule`.

```typescript
// src/app.module.ts
import { Module } from 'ozean';
import { ConfigModule } from './config/config.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule, // Import ConfigModule just once in the Root Module
    UsersModule,
  ],
})
export class AppModule {}
```

With this structure, your application is clearly divided into sections: `UsersModule` handles user-related matters, `ConfigModule` handles configuration, and `AppModule` brings everything together, making future development, testing, and scaling much easier.
