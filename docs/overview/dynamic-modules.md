# Dynamic Modules

Dynamic Modules are an advanced and powerful feature of OzeanJs that allow you to create modules that can be configured upon import. This pattern is often called the `.forRoot()` pattern and is highly popular in frameworks like Angular and NestJS.

### What are Dynamic Modules?

Normally, when we `import` a module, we do it like this:
`imports: [DatabaseModule]`

However, a **Dynamic Module** allows us to pass configuration options directly during the import, like this:
`imports: [DatabaseModule.forRoot({ url: '...' })]`

**The primary goal is:**
To allow users to create and configure reusable modules, such as a `DatabaseModule` or `ConfigModule`, by passing in options to alter the module's behavior.

## How to Create and Use a Dynamic Module

Here is a complete example of creating a `DatabaseModule` that can accept a `connectionString` from the user.

### Step 1: Create a Service that Accepts Options

First, we will create a `DatabaseService` that doesn't hardcode config values but receives them through its `constructor`. We will use the `@Inject()` decorator to inject a plain configuration object, not just a class.

1. **Create a Custom Injection Token**: We will create a string or symbol token to use as a "key" for injecting the configuration.

   ```typescript
   // src/database/constants.ts
   export const DB_OPTIONS_TOKEN = 'DATABASE_OPTIONS';
   ```

2. **Create the `DatabaseService`**:

   ```typescript
   // src/database/database.service.ts
   import { Injectable, Inject } from 'ozeanjs';
   import { DB_OPTIONS_TOKEN } from './constants';

   // Create an interface for the options
   export interface DatabaseOptions {
     connectionString: string;
     maxPoolSize?: number;
   }

   @Injectable()
   export class DatabaseService {
     // Use @Inject() to tell the DI Container to find the Provider
     // with the token 'DATABASE_OPTIONS' and inject it into this parameter.
     constructor(@Inject(DB_OPTIONS_TOKEN) private options: DatabaseOptions) {
       console.log(`[DatabaseService] Initializing with connection: ${options.connectionString}`);
       // The actual connection pool logic would go here.
     }

     query(sql: string) {
       console.log(`Executing query: ${sql}`);
       return { result: `Data for ${sql}` };
     }
   }
   ```

### Step 2: Create the Dynamic Module with `.forRoot()`

Next, we'll create the `DatabaseModule`, which will have a static method named `forRoot`. This method will accept `options` from the user and return a `DynamicModule` object with the configured `providers`.

```typescript
// src/database/database.module.ts
import { Module, DynamicModule } from 'ozeanjs';
import { DatabaseService, DatabaseOptions } from './database.service';
import { DB_OPTIONS_TOKEN } from './constants';

@Module({}) // This decorator can be empty
export class DatabaseModule {
  // This static method is the core of the Dynamic Module
  static forRoot(options: DatabaseOptions): DynamicModule {
    // 1. Create a Value Provider for the incoming options
    const optionsProvider = {
      provide: DB_OPTIONS_TOKEN, // Use the token we created
      useValue: options, // Use the options object passed by the user
    };

    // 2. Return a complete DynamicModule object
    return {
      module: DatabaseModule,
      providers: [
        optionsProvider, // Provider for the options
        DatabaseService, // The main service provider
      ],
      exports: [
        DatabaseService, // Export DatabaseService so other modules can inject it
      ],
    };
  }
}
```

### Step 3: Use the Dynamic Module

Finally, users of your library can easily import and use the `DatabaseModule` in their `AppModule`.

```typescript
// src/app.module.ts
import { Module } from 'ozeanjs';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module'; // Assuming a UsersModule exists

@Module({
  imports: [
    // Call .forRoot() and pass in the configuration object
    DatabaseModule.forRoot({
      connectionString: 'postgres://user:pass@host:port/db',
      maxPoolSize: 20,
    }),
    UsersModule,
  ],
})
export class AppModule {}
```

**How it works:**

1. When `AppModule` imports `DatabaseModule.forRoot(...)`, OzeanJs receives a `DynamicModule` object.

2. OzeanJs then takes the `providers` (`optionsProvider` and `DatabaseService`) and `exports` (`DatabaseService`) from that object and merges them with the `AppModule`.

3. This makes it possible for a `UsersService` (in `UsersModule`) that needs to inject `DatabaseService` to be created. When the DI Container creates `DatabaseService`, it can find the `DATABASE_OPTIONS` provider and inject it into the `DatabaseService` constructor.

This method allows you to create highly flexible and reusable modules.
