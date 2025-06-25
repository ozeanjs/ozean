# First steps

This document will guide you through installing and starting an OceanJs project. There are two convenient methods to choose from.

### Prerequisites

Ensure you have **Bun** installed on your machine.

---

## Method 1: Installation via Ozean CLI (Recommended)

This is the **fastest and easiest** way to start your OceanJs project, as the CLI handles all the necessary basic setup automatically.

### Step 1: Create a New Project

Open your terminal and run this single command:

```bash
bunx ozean-cli new my-app
```

- **`bunx`** will download and run the Ozean CLI temporarily without requiring a global installation.
- **`new my-app`** will create a new folder named `my-app`, clone the starter template, and install all dependencies for you.

### Step 2: Enter the Project and Start Working

Once the command is finished:

```bash
# 1. Enter the project folder
cd my-app

# 2. Run the development server
bun run index
```

Your application will start running at `http://localhost:3000` immediately!

---

## Method 2: Manual Installation

This method is suitable for those who want to control every aspect of the setup themselves from the beginning.

### Step 1: Create Project and Install Dependencies

1.  **Create a new Bun project:**
    ```bash
    bun init
    ```
2.  **Install OceanJs**:
    ```bash
    bun add ozean
    ```
3.  **Install `reflect-metadata`**:
    This is an important dependency for the Dependency Injection system.
    ```bash
    bun add reflect-metadata
    ```

### Step 2: Configure TypeScript

Open your `tsconfig.json` file and ensure these 2 options are enabled:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
    // ... other options
  }
}
```

### Step 3: Write Initial Code

Create an entry file (e.g., `src/main.ts`) and add this basic "Hello World" code:

```typescript
// src/main.ts
import 'reflect-metadata'; // <-- IMPORTANT: Must be imported first at the entry point.
import { App, Module, Controller, Get } from 'ozean';

// Create a Controller
@Controller()
class AppController {
  @Get()
  getHello() {
    return 'Hello from OceanJs! 🌊';
  }
}

// Create a Root Module
@Module({
  controllers: [AppController],
})
class AppModule {}

// Bootstrap the application
const app = new App(AppModule);
const port = 3000;

app.listen(port);

console.log(`🌊 OceanJs application is running on http://localhost:${port}`);
```

### Step 4: Run the Application

Run your application with the command:

```bash
bun run src/main.ts
```

You can open `http://localhost:3000` in your browser to see the result.
