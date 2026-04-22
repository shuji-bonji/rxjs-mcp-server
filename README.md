# RxJS MCP Server

**[日本語版 README はこちら](README.ja.md)**

<!-- Package meta -->

[![npm version](https://img.shields.io/npm/v/@shuji-bonji/rxjs-mcp.svg?logo=npm)](https://www.npmjs.com/package/@shuji-bonji/rxjs-mcp)
[![npm downloads](https://img.shields.io/npm/dw/@shuji-bonji/rxjs-mcp.svg?logo=npm)](https://www.npmjs.com/package/@shuji-bonji/rxjs-mcp)
[![license](https://img.shields.io/npm/l/@shuji-bonji/rxjs-mcp.svg)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@shuji-bonji/rxjs-mcp.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

<!-- Build / trust -->

[![CI](https://github.com/shuji-bonji/rxjs-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/shuji-bonji/rxjs-mcp-server/actions/workflows/ci.yml)
[![Release](https://github.com/shuji-bonji/rxjs-mcp-server/actions/workflows/release.yml/badge.svg)](https://github.com/shuji-bonji/rxjs-mcp-server/actions/workflows/release.yml)
[![Provenance](https://img.shields.io/badge/npm-provenance-blue?logo=npm)](https://docs.npmjs.com/generating-provenance-statements)
[![Trusted Publisher](https://img.shields.io/badge/npm-Trusted%20Publisher-cb3837?logo=npm)](https://docs.npmjs.com/trusted-publishers)

<!-- Tech stack -->

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![RxJS](https://img.shields.io/badge/RxJS-7.x-B7178C.svg?logo=reactivex&logoColor=white)](https://rxjs.dev)
[![MCP](https://img.shields.io/badge/MCP-compatible-6C4BFF.svg)](https://modelcontextprotocol.io)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./README.md#contributing)

> ⚠️ This is an unofficial community project, not affiliated with RxJS team.

Execute, debug, and visualize RxJS streams directly from AI assistants like Claude.

## Features

### 🚀 Stream Execution

- Execute RxJS code and capture emissions
- Timeline visualization with timestamps
- Memory usage tracking
- Support for all major RxJS operators

### 📊 Marble Diagrams

- Generate ASCII marble diagrams
- Visualize stream behavior over time
- Automatic pattern detection
- Clear legend and explanations

### 🔍 Operator Analysis

- Analyze operator chains for performance
- Detect potential issues and bottlenecks
- Suggest alternative approaches
- Categorize operators by function

### 🛡️ Memory Leak Detection

- Identify unsubscribed subscriptions
- Detect missing cleanup patterns
- Framework-specific recommendations (Angular, React, Vue)
- Provide proper cleanup examples

### 💡 Pattern Suggestions

- Get battle-tested RxJS patterns
- Framework-specific implementations
- Common use cases covered:
  - HTTP retry with backoff
  - Search typeahead
  - WebSocket reconnection
  - Form validation
  - State management
  - And more...

## Installation

```bash
# Install globally
npm install -g @shuji-bonji/rxjs-mcp

# Or use with npx
npx @shuji-bonji/rxjs-mcp
```

## Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rxjs": {
      "command": "npx",
      "args": ["@shuji-bonji/rxjs-mcp"]
    }
  }
}
```

### VS Code with Continue/Copilot

Add to `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "rxjs": {
      "command": "npx",
      "args": ["@shuji-bonji/rxjs-mcp"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "rxjs": {
      "command": "npx",
      "args": ["@shuji-bonji/rxjs-mcp"]
    }
  }
}
```

## Available Tools

### execute_stream

Execute RxJS code and capture stream emissions with timeline.

The tool accepts either an expression that evaluates to an Observable, or a
snippet ending in such an expression — `return` is optional.

```typescript
// ✅ Trailing expression (v0.2.0+): the last expression is returned implicitly
interval(100).pipe(
  take(5),
  map((x) => x * 2),
);

// ✅ Declaration + trailing reference
const stream$ = interval(100).pipe(
  take(5),
  map((x) => x * 2),
);
stream$;

// ✅ Explicit return (always works)
return interval(100).pipe(
  take(5),
  map((x) => x * 2),
);
```

### generate_marble

Generate ASCII marble diagrams from event data.

```typescript
// Input: array of timed events
[
  { time: 0, value: 'A' },
  { time: 50, value: 'B' },
  { time: 100, value: 'C' },
];

// Output: A----B----C--|
```

### analyze_operators

Analyze RxJS operator chains for performance and best practices.

```typescript
// Analyzes chains like:
source$.pipe(
  map((x) => x * 2),
  filter((x) => x > 10),
  switchMap((x) => fetchData(x)),
  retry(3),
);
```

### detect_memory_leak

Detect potential memory leaks and missing cleanup.

```typescript
// Detects issues like:
- Missing unsubscribe
- No takeUntil operator
- Uncompleted Subjects
- Infinite intervals
```

### suggest_pattern

Get production-ready patterns for common use cases.

Available patterns:

- `http-retry` - Resilient HTTP with retry
- `search-typeahead` - Debounced search
- `polling` - Smart polling with backoff
- `websocket-reconnect` - Auto-reconnecting WebSocket
- `form-validation` - Reactive form validation
- `state-management` - Simple state store
- `cache-refresh` - Cache with refresh strategy
- And more...

## Usage Examples

### With Claude

```
User: "Execute this RxJS stream and show me the output"

Claude: I'll execute that RxJS stream for you.

[Uses execute_stream tool]

## Stream Execution Result
✅ Completed
Execution Time: 523ms
Values Emitted: 5

### Emitted Values
[0, 2, 4, 6, 8]
```

### Debugging Memory Leaks

```
User: "Check this Angular component for memory leaks"

Claude: I'll analyze your component for potential memory leaks.

[Uses detect_memory_leak tool]

## Memory Leak Analysis
⚠️ Potential leaks detected

1. 🔴 subscription (high severity)
   - Found 3 subscribe() calls but only 1 unsubscribe()
   - Fix: Use takeUntil pattern with destroy$ subject
```

### Getting Patterns

```
User: "Show me how to implement search with RxJS"

Claude: I'll show you the search typeahead pattern.

[Uses suggest_pattern tool with useCase: 'search-typeahead']

## Search Typeahead with Debounce
[Full implementation with explanation]
```

## Security

The `execute_stream` tool runs user-provided code in an **isolated Worker thread** to prevent:

- Main process pollution
- Resource leaks from infinite loops or timers
- Access to sensitive Node.js APIs (process, fs, etc.)

Execution is forcefully terminated if it exceeds the configured timeout.

## Development

```bash
# Clone the repository
git clone https://github.com/shuji-bonji/rxjs-mcp-server
cd rxjs-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test              # Unit tests (vitest)
npm run test:mcp      # MCP integration test
npm run test:inspector # MCP Inspector (GUI)

# Run in development
npm run dev
```

## Release

Releases are automated via GitHub Actions and published to npm using
**Trusted Publisher (OIDC)** — no static tokens are used, and every release
carries an npm provenance attestation. See [RELEASING.md](./RELEASING.md)
for the full workflow (and initial npm setup).

## Integration with Other MCP Servers

RxJS MCP Server works great alongside:

- **Angular MCP** - For Angular project scaffolding
- **TypeScript MCP** - For type checking
- **ESLint MCP** - For code quality

Future Meta-MCP integration will allow seamless coordination between these tools.

## Architecture

```
┌─────────────────┐
│   AI Assistant  │
│   (Claude, etc) │
└────────┬────────┘
         │
    MCP Protocol
         │
┌────────┴────────┐
│  RxJS MCP Server│
├─────────────────┤
│ • execute_stream│
│ • generate_marble│
│ • analyze_operators│
│ • detect_memory_leak│
│ • suggest_pattern│
└─────────────────┘
```

## Contributing

Contributions are welcome! Please feel free to submit a PR.

## License

MIT

## Author

Shuji Bonji

## Links

- [GitHub Repository](https://github.com/shuji-bonji/rxjs-mcp-server)
- [RxJS Documentation](https://rxjs.dev)
- [Model Context Protocol](https://modelcontextprotocol.io)
