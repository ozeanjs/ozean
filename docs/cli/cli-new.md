# Create Project Command

The `new` command is the starting point for creating a brand new OzeanJs project. It scaffolds a project structure with everything you need to begin developing your application.

## Usage

```bash
ozean new <project-name>
```

### Alias

You can use the shorter alias `n`:

```bash
ozean n <project-name>
```

### Arguments

- **`<project-name>`** (required): The name of the folder and the project you want to create.

---

## What the `new` command does

When you run `ozean new my-awesome-app`, the CLI automatically performs new project.

**Once everything is complete, you will have a clean OzeanJs project ready for development.**

### Real-world Example

```bash
# 1. Run the new command
bunx ozean-cli new my-api

# 2. Wait for the CLI to finish...
# > 🌊 Cloning starter repository into 'my-api'...
# > Syncing ozean version to CLI version: ^0.1.0
# > 📦 Installing dependencies...
# > ✅ Successfully created project my-api!

# 3. Enter the project and start development
cd my-api
bun run dev
```
