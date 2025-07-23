# Quick Start

This guide shows the fastest way to create and run your first OzeanJs project using the **Ozean CLI**.

### Prerequisites

Ensure you have **Bun** installed on your machine.

### Step 1: Create a New Project with the CLI

You don't need to install our CLI beforehand. You can use the `bunx` command to download and run it immediately.

Open your terminal and run the command:

```bash
bunx ozean-cli new my-awesome-app
```

**What does this command do?**

- **`bunx`**: Downloads and runs `ozean-cli` temporarily without a global installation.
- **`new my-awesome-app`**: Instructs the CLI to create a new project in a folder named `my-awesome-app` and automatically install all necessary dependencies.

Once the command is finished, navigate into your project folder:

```bash
cd my-awesome-app
```

### Step 2: Run the Development Server

Run your application in development mode with the command:

```bash
bun run index
```

(This script is already defined in the `package.json` of the generated project.)

You should see a message in your terminal indicating that your application is running on `http://localhost:3000`.

### Step 3: Test the Application

Open another terminal and use `curl` to test if the server is working correctly:

```bash
curl http://localhost:3000/cats
```

**Expected Result:**

```
Hello cat.
```

That's it! In just 3 simple steps, your first OzeanJs project is ready to go. Try opening the project in your favorite editor and start modifying the code in the `src` folder!
