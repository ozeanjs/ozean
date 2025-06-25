# CLI Overview

**OzeanJs CLI** is the official Command-Line Interface (CLI) for the OzeanJs Framework, designed to help you quickly start new projects and generate various application components.

## Installation

The easiest way to use it is by running it via `bunx`, which does not require a global installation:

```bash
bunx ozean-cli <command>
```

Alternatively, if you want to install it globally to use the `ozean` command directly from anywhere in your terminal:

```bash
bun add -g ozean-cli
```

## Basic Usage

After installation, you can check the version and view all available commands.

#### Checking the Version

Use the `-v` or `--version` flag to see the currently installed CLI version.

```bash
ozean -v
```

#### Getting Help

Use the `--help` flag to see a list of all available commands, along with their descriptions and options.

```bash
# View help for the main command
ozean --help

# View help for a subcommand (e.g., generate)
ozean <command> --help
```
