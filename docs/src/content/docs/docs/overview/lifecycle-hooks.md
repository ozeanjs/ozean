---
title: Lifecycle Hooks
description: OzeanJs provides a Lifecycle Hooks system, a powerful mechanism to "hook" into key moments of the application's lifecycle. This feature allows you to manage resources (like database connections) systematically and safely.
---

OzeanJs provides a **Lifecycle Hooks** system, a powerful mechanism to "hook" into key moments of the application's lifecycle. This feature allows you to manage resources (like database connections) systematically and safely.

### What Are Lifecycle Hooks?

Lifecycle Hooks are special methods that you can add to your Provider or Controller classes. OzeanJs will automatically call these methods at specific, predetermined moments.

**Key Hooks:**

- **`onModuleInit()`**: Called after a module and all of its dependencies have been created and resolved. Ideal for logic that needs to run once everything in the module is ready.

- **`onApplicationBootstrap()`**: Called after the entire application has finished bootstrapping and is ready to receive requests. Ideal for one-time setup tasks at the very beginning.

- **`onApplicationShutdown()`**: Called when the application receives a shutdown signal (e.g., from `Ctrl+C`). This is the perfect place for closing connections or cleaning up resources (Graceful Shutdown).

### Using `onModuleInit` and `onApplicationBootstrap`

Let's look at an example of creating a `DatabaseService` that establishes a connection and a `SeederService` that populates initial data.

#### Step 1: Create `DatabaseService` with `onModuleInit`

We use `onModuleInit` to ensure the database connection is established only after all dependencies (like a `ConfigService`) are available.

```typescript
// src/database/database.service.ts
import { Injectable, OnModuleInit } from 'ozean';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private isConnected = false;

  // The constructor runs first
  constructor() {
    console.log('[DatabaseService] constructor: Service is being created.');
  }

  // onModuleInit is called after the constructor and all DI is complete
  onModuleInit() {
    console.log('[DatabaseService] onModuleInit: Module is ready. Connecting to database...');
    // Place your database connection logic here
    this.isConnected = true;
    console.log('[DatabaseService] Database connection established.');
  }

  // A method for other services to use
  async seedUsers(users: any[]) {
    if (!this.isConnected) throw new Error('Database not connected.');
    console.log('[DatabaseService] Seeding users data...');
    // ... logic to insert data ...
    return { success: true, count: users.length };
  }
}
```

#### Step 2: Create `SeederService` with `onApplicationBootstrap`

We use `onApplicationBootstrap` to run the data seeding logic **only once** after the entire application has started up completely.

```typescript
// src/database/seeder.service.ts
import { Injectable, OnApplicationBootstrap } from 'ozean';
import { DatabaseService } from './database.service';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  // Inject the DatabaseService
  constructor(private readonly databaseService: DatabaseService) {}

  // This hook is called after onModuleInit has completed for all modules
  async onApplicationBootstrap() {
    console.log('[SeederService] onApplicationBootstrap: App is ready. Seeding initial data...');
    const initialUsers = [{ name: 'Admin User' }, { name: 'Editor User' }];
    await this.databaseService.seedUsers(initialUsers);
    console.log('[SeederService] Data seeding complete.');
  }
}
```

### Using `OnApplicationShutdown` (Graceful Shutdown)

This is the most common and important example: using a hook to properly close database connections when the application shuts down.

#### Step 1: Implement `OnApplicationShutdown` in a Service

We will add `OnApplicationShutdown` to our `DatabaseService`.

```typescript
// src/database/database.service.ts (Complete version)
import { Injectable, OnModuleInit, OnApplicationShutdown } from 'ozean';

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  private isConnected = false;

  constructor() {
    console.log('[DatabaseService] constructor called.');
  }

  onModuleInit() {
    console.log('[DatabaseService] onModuleInit: Connecting to database...');
    this.isConnected = true;
  }

  // This hook will be called automatically when the app shuts down
  async onApplicationShutdown(signal?: string) {
    console.log(
      `[DatabaseService] onApplicationShutdown: Received signal (${signal}). Closing connections...`
    );
    // Place your connection pool closing logic here
    // await this.pool.end();
    this.isConnected = false;
    console.log('[DatabaseService] Connections closed gracefully.');
  }

  // ... other methods ...
}
```

#### Step 2: Register and Enable

Finally, don't forget to register all services in a Module and enable the Shutdown Hooks in your `main.ts` file.

```typescript
// src/app.module.ts
@Module({
  providers: [DatabaseService, SeederService], // <-- Register both services
})
export class AppModule {}

// src/main.ts
async function bootstrap() {
  const app = new App(AppModule);

  // Enable Graceful Shutdown
  app.enableShutdownHooks();

  app.listen(3000);
}

bootstrap();
```

Using Lifecycle Hooks makes your application more robust and allows you to manage resources correctly and safely throughout all stages of its life.
