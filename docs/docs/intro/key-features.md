# Key Features

OzeanJs is designed to be a modern framework with a clear structure and high performance. Its key features are as follows:

### 🚀 **High Performance**

**Built on Bun** OzeanJs runs on Bun, the fastest JavaScript runtime, ensuring your applications have rapid response times, low memory usage, and an excellent developer experience (e.g., extremely fast dependency installation).

### 🏗️ **Modular Architecture**

- **`@Module` Decorator**: Organize your code into distinct modules that work together systematically, similar to Angular's architecture, making it easy to manage large-scale applications.

- **`imports` and `exports`**: Clearly control the visibility of your providers, allowing each module to be self-contained and easily reusable.

- **Global Modules**: Supports the creation of global modules, allowing frequently used services (like a `ConfigService`) to be injected throughout the application without repeated imports.

### 💉 **Powerful Dependency Injection (DI)**

- **`@Injectable()` Decorator**: Marks classes (like Services, Middlewares, Pipes) to be managed by the DI container, allowing them to be automatically injected elsewhere.

- **Constructor Injection**: Simply declare a dependency in the `constructor`, and the OzeanJs DI system will create and provide the correct instance, leading to cleaner, loosely coupled, and easily testable code.

### ✨ **Excellent Developer Experience**

- **Decorator-based API**: Effortlessly create Controllers, Routes, and extract request data (`@Param`, `@Query`, `@Body`) with an intuitive and readable decorator-based API.

- **Ozean CLI**: A Command-Line Interface (`@ozean/cli`) that helps you scaffold new projects (`ozean new`) and generate various code files (`ozean generate`) from templates, reducing boilerplate and accelerating project startup.

### ⛓️ **Flexible Middleware and Pipes System**

- **Middleware**: Supports flexible middleware usage at the Global (for every request), Controller-level, and Route-level, enabling systematic handling of cross-cutting concerns (e.g., logging, authentication).

- **Validation Pipes**: Includes a built-in `ValidationPipe` that integrates with `class-validator` and `class-transformer` to automatically validate and transform incoming request body data (DTOs), keeping your controller's business logic clean and secure.

### 🛡️ **Systematic Exception Handling**

- Provides a base `HttpException` class, allowing you to throw errors with specific HTTP status codes. This makes error handling in your application standardized and predictable.

Overall, OzeanJs is a framework that aims to combine the advantages of a robust and established architecture with the speed and performance of the Bun runtime.
