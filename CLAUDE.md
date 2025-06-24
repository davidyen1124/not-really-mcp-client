# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js client library for connecting to Claude Code's MCP (Model Context Protocol) listener in VS Code. The project enables programmatic interaction with VS Code through WebSocket connections using JSON-RPC protocol.

## Core Architecture

- **MCPClient** (`src/mcp-client.js`): Main client class that handles WebSocket connections, authentication, and tool interactions
- **CLI Interface** (`src/mcp-client-cli.js`): Command-line interface with interactive shell, demo mode, and single-command execution

### Key Components

**Connection Management:**
- Auto-discovery of Claude Code instances via lock files in `~/.claude/ide/`
- WebSocket connection with authentication tokens
- Automatic reconnection with exponential backoff
- Request/response handling with timeout management

**Available Tools:**
- File operations (open, save, get selection)
- Workspace management (get folders, open editors)
- Code execution (for notebooks)
- Diagnostics retrieval
- Diff operations

## Common Commands

```bash
# Install dependencies
npm install

# Run demo (auto-discovers and connects to Claude Code)
npm start
npm run demo

# Interactive shell mode
npm run shell

# Direct execution
node src/mcp-client-cli.js
node src/mcp-client-cli.js shell
node src/mcp-client-cli.js demo
```

## Development Notes

- Requires Node.js >=14.0.0
- Dependencies: ws (WebSocket), uuid (unique identifiers)
- Claude Code must be running in VS Code to establish connections
- Authentication via tokens stored in lock files
- Protocol version: 2024-11-05

## Key Classes and Methods

**MCPClient:**
- `selectWorkspace()` - Discover and connect to Claude Code instance
- `connect()` - Establish WebSocket connection
- `initialize()` - Initialize MCP protocol
- `callTool(name, params)` - Execute VS Code tools
- `openFile()`, `saveDocument()`, `executeCode()` - File operations