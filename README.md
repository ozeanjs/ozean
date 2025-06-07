# Ozean.js 🌊

Welcome to **Ozean.js**!

Ozean.js is a modern, simple, and high-performance web framework built on the Bun runtime. It aims to provide a fast development experience with a clear structure, similar to the architecture many are familiar with in **Angular**.

## Key Features

- **🚀 High Performance**: Built on Bun, the fastest JavaScript runtime, ensuring your applications are highly responsive.
- **🏗️ Modular Architecture**: Organize your code with the `@Module` decorator, making it easy to manage, reuse, and scale complex applications.
- **💉 Dependency Injection**: A built-in DI system that reduces boilerplate code, making your code cleaner, more modular, and easier to test.
- **✨ Decorator-based**: Effortlessly create Controllers and Routes with intuitive and readable decorators.
- **⛓️ Middleware Support**: Flexible middleware support at the Global, Controller, and Route levels.

---

## Getting Started

### Step 1: Project Setup

1.  **Create a new Bun project:**

    ```bash
    bun init
    ```

2.  **Install necessary dependencies:**

    - **Install Ozean.js**:
      ```bash
      bun add ozean
      ```
    - **Install `reflect-metadata`**: Ozean.js uses `reflect-metadata` for its Dependency Injection system. You need to install and import it into your project.
      ```bash
      bun add reflect-metadata
      ```

3.  **Configure TypeScript (`tsconfig.json`):**
    Ensure you have enabled `experimentalDecorators` and `emitDecoratorMetadata` in your `tsconfig.json` file.
    ```json
    {
      "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
        // ... other options
      }
    }
    ```

### Step 2: Create Your First Application

1.  **Create a Service (`cat.service.ts`):**
    Services handle business logic and are marked as `@Injectable` so they can be used elsewhere.

    ```typescript
    // src/cat.service.ts
    import { Injectable } from 'ozean';

    @Injectable()
    export class CatService {
      getCats() {
        return ['Muffin', 'Leo', 'Bella'];
      }
    }
    ```

2.  **Create a Controller (`cat.controller.ts`):**
    Controllers handle incoming requests and return responses. They inject the `CatService` to use its functionality.

    ```typescript
    // src/cat.controller.ts
    import { Controller, Get } from 'ozean';
    import { CatService } from './cat.service';

    @Controller('/cats')
    export class CatController {
      constructor(private readonly catService: CatService) {}

      @Get()
      findAll() {
        return this.catService.getCats();
      }
    }
    ```

3.  **Create the Root Module (`app.module.ts`):**
    Modules organize and group related components (controllers, providers) together.

    ```typescript
    // src/app.module.ts
    import { Module } from 'ozean';
    import { CatController } from './cat.controller';
    import { CatService } from './cat.service';

    @Module({
      controllers: [CatController],
      providers: [CatService],
    })
    export class AppModule {}
    ```

4.  **Bootstrap the Application (`main.ts`):**
    This is the entry point of your application.

    ```typescript
    // src/main.ts
    import 'reflect-metadata'; // <-- IMPORTANT: Must be imported first at the entry point.
    import { App } from 'ozean';
    import { AppModule } from './app.module';

    const app = new App(AppModule);
    const port = 3000;

    app.listen(port);

    console.log(`🌊 Ozean.js application is running on http://localhost:${port}`);
    ```

### Step 3: Run the Application

```bash
bun run src/main.ts
```

When you open your browser or use `curl` to access `http://localhost:3000/cats`, you will receive a JSON response:

```json
["Muffin", "Leo", "Bella"]
```

---

## Core Concepts

### Modules

Similar to `NgModule` in Angular, Modules in Ozean.js help you organize related features. The `@Module` decorator accepts a metadata object with the following properties:

- `imports`: An array of other modules to import, allowing access to their exported providers.
- `controllers`: An array of controllers to be handled by this module.
- `providers`: An array of services or other providers.
- `exports`: An array of providers that can be used by other modules that import this module.

### Dependency Injection

Simply add the `@Injectable()` decorator to your Provider class and specify its type in the constructor of the class where it's needed (like a Controller). The Ozean.js DI system will automatically create and inject the correct instance.

### Controllers and Routing

Use intuitive decorators to define your routes:

- `@Controller('/prefix')`: Sets a URL prefix for all routes within the class.
- `@Get('/path')`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`: Binds a method to an HTTP verb and path.
- `@Param('id')`, `@Query('search')`, `@Body()`: Easily extract data from the request.

Happy coding with Ozean.js!

Test
