# Benchmark

## Prerequisites

Ensure you have `bombardier` installed on your machine.

## Run benchmark

At root directory of this project and run command.

```bash
bun install
```

To run server app.

```bash
bun --cwd=bench run index
```

To benchmark:

```bash
bombardier -c 120 -n 500000 http://localhost:3000/app/hello
```
