# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Mnemosyne AI Platform** is an Obsidian plugin that transforms vaults into AI-powered workspaces with specialized agents, semantic search (RAG), and the unique **Mnemosyne Persona** feature - a configurable AI personality inspired by the Greek goddess of memory.

**Current Status:** Early development phase - foundational structure established, but most core implementations pending.

## Common Commands

### Development
```bash
# Watch mode build (for active development)
npm run dev

# Production build
npm run build

# Run tests
npm test

# Lint source code
npm run lint

# Format code with Prettier
npm run format
```

### Testing in Obsidian
After building, copy the plugin to your test vault:
```bash
# Copy plugin to test vault (replace path with your vault)
cp -r . /path/to/test-vault/.obsidian/plugins/ai-agent-platform/

# Then in Obsidian:
# 1. Settings → Community Plugins
# 2. Reload plugins
# 3. Enable "AI Agent Platform"
# 4. Open console (Cmd+Shift+I) to check for errors
```

### Type Checking
```bash
# Check for TypeScript errors without building
npx tsc --noEmit
```

### Troubleshooting
```bash
# Reset dependencies and rebuild
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Architecture Overview

### Core System Design

The plugin follows a **layered architecture** with clear separation of concerns:

**1. Core Layer** (`src/core/`)
- **Persona System** (`persona/`) - The MnemosynePersona feature that adds configurable personality to all agents (4 intensity levels: none, subtle, moderate, strong)
- **Agents** (`agents/`) - Agent lifecycle management and 10+ pre-built specialized agents (research, code, writing, etc.)
- **LLM Providers** (`llm/`) - Abstraction layer for OpenAI, Anthropic, and local LLMs
- **Orchestrator** (`orchestrator/`) - Intelligent routing to automatically select best agent for user queries
- **RAG System** (`rag/`) - Retrieval Augmented Generation with vector stores (JSON/SQLite), embeddings, and semantic search
- **MCP Tools** (`mcp/`) - Model Context Protocol for safe agent interactions with vault (read/write notes, search, metadata)
- **Memory** (`memory/`) - Conversation history and context management

**2. UI Layer** (`src/ui/`)
- **Chat Interface** (`chat/`) - React-based chat view with streaming support
- **Settings** (`settings/`) - Tabbed configuration interface (Providers, Agents, RAG, MCP, Persona, Advanced)
- **Inline Features** (`inline/`) - Text suggestions, selection toolbar, context menus
- **Modals** (`modals/`) - Agent creation wizard, connection tests, confirmations

**3. Utilities** (`src/utils/`)
- **Logger** - Structured logging with levels
- **Errors** - Custom error classes for better error handling
- **Validation** - Input validation functions
- **Security** - AES-256 encryption for API keys

### Key Integration Points

**Persona Integration:**
The Mnemosyne persona modifies agent system prompts to add personality. Integration flow:
```
AgentManager → persona.applyToSystemPrompt() → Modified system prompt → LLM Provider
```
All agents automatically gain persona characteristics when enabled in settings.

**Agent Execution Flow:**
```
User Query → Orchestrator (route to agent) → AgentExecutor → 
  1. Apply Persona (if enabled)
  2. RAG retrieval (if enabled)
  3. LLM Provider → Response
  4. MCP Tools (if needed)
```

**RAG Integration:**
When enabled, relevant vault content is retrieved and injected into agent context before LLM calls.

**MCP Safety:**
All write operations require user confirmation by default. Audit log tracks all tool executions.

## Implementation Status

### ✅ Completed (Phase 1)
- Project configuration (manifest.json, package.json, tsconfig.json, esbuild.config.mjs)
- Core types and settings structure
- Utilities (logger, errors, validation, security)
- **Mnemosyne Persona system** (complete implementation)
- Agent Manager with persona integration
- Backend Agents (10 pre-configured specialists)
- Main plugin entry point (src/index.ts is minimal placeholder)

### 🔨 To Be Implemented (Phases 2-10)
Refer to `docs/build-instructions.md` for detailed implementation plan:
- **Phase 2:** LLM Providers (OpenAI, Anthropic, Local)
- **Phase 3:** Agent Execution & Orchestrator
- **Phase 4:** RAG System (embeddings, vector stores, retrieval)
- **Phase 5:** MCP Tools (note operations, search, metadata)
- **Phase 6:** UI Components (chat, settings, modals)
- **Phase 7:** Commands
- **Phase 8-10:** Testing, documentation, submission

## File Organization

```
src/
├── index.ts              # Minimal entry point (placeholder)
├── types.ts              # Global type definitions
├── settings.ts           # Settings interface with persona config
├── core/
│   ├── persona/          # Mnemosyne persona system (UNIQUE FEATURE)
│   ├── agents/           # Agent management and pre-built agents
│   ├── llm/              # LLM provider abstraction
│   ├── orchestrator/     # Query routing and agent selection
│   ├── rag/              # Semantic search and retrieval
│   ├── mcp/              # Model Context Protocol tools
│   └── memory/           # Conversation history
├── ui/                   # React-based UI components
│   ├── chat/             # Chat interface
│   ├── settings/         # Settings tabs (including Persona tab)
│   ├── inline/           # Inline AI features
│   └── modals/           # Modal dialogs
├── utils/                # Shared utilities
└── commands/             # Command palette actions

docs/                     # Comprehensive documentation
├── start-here.md         # Quick orientation guide
├── build-instructions.md # Phase-by-phase implementation guide
├── implementation-summary.md # Persona feature details
└── master-index.md       # Complete file inventory
```

## Development Workflow

### Building
The project uses **esbuild** (referenced in package.json, though esbuild.config.mjs is missing). Run `npm run dev` for watch mode or `npm run build` for production.

### Testing Strategy
- **Unit tests:** Test modules independently with Jest
- **Integration tests:** Test full agent workflows
- **Manual testing:** Test in actual Obsidian vault
- **Persona testing:** Test all 4 intensity levels with multiple agents

### Type Safety
Project uses TypeScript with strict mode enabled. All code must pass `npx tsc --noEmit` before committing.

## Important Constraints

### Obsidian Plugin Requirements
- **CRITICAL:** Use `this.app` instead of global `app` variable (global `app` is for debugging only)
- **CRITICAL:** Implement proper cleanup in `onunload()` - use `registerEvent()`, `addCommand()` for auto-cleanup
- **CRITICAL:** No obfuscated code
- **CRITICAL:** Declare network usage in README (must disclose OpenAI/Anthropic API connections)
- **CRITICAL:** No telemetry or analytics
- **CRITICAL:** This plugin uses Node.js APIs (`better-sqlite3`) - must set `isDesktopOnly: true` in manifest.json
- Remove all sample code before submission
- Use sentence case in all UI text (not Title Case)
- Avoid "settings" in settings headings
- No default hotkeys for commands (causes conflicts)
- Use `normalizePath()` for all user-defined file paths

### Security
- API keys must be encrypted with AES-256 (utility provided in `src/utils/security.ts`)
- MCP write operations require user confirmation by default
- All vault operations must be safe and reversible where possible

### Dependencies
Core dependencies:
- `@anthropic-ai/sdk` - Anthropic API client
- `openai` - OpenAI API client  
- `react` & `react-dom` - UI framework
- `better-sqlite3` - SQLite vector store backend
- `obsidian` - Plugin API (dev dependency)

## Unique Features

### The Mnemosyne Persona
This is the plugin's **key differentiator**. The persona system adds personality inspired by the Greek goddess of memory:

- **Configurable intensity:** None, Subtle, Moderate (recommended), Strong
- **System prompt modification:** Seamlessly integrates with any agent
- **Optional:** Users can toggle on/off anytime
- **Appropriate metaphor:** Memory goddess for a memory/note-taking tool

When implementing features, ensure the persona integration remains intact. The AgentManager must always apply persona via `persona.applyToSystemPrompt()` when retrieving agent system prompts.

## Documentation

The `docs/` directory contains extensive implementation guidance:
- **start-here.md** - Begin here for project orientation
- **build-instructions.md** - Complete phase-by-phase build guide (15 weeks)
- **implementation-summary.md** - Persona architecture and design rationale
- **master-index.md** - Inventory of all files and their purpose

Always consult these docs when implementing new features to maintain consistency with the planned architecture.

## Testing the Persona

Manual test procedure:
1. Enable persona in settings
2. Select intensity level (subtle/moderate/strong)
3. Send query to any agent
4. Verify response has appropriate personality level
5. Disable persona and verify normal responses
6. Test with all backend agents to ensure compatibility

## Project Goals

1. **Transform Obsidian vaults** into AI-powered workspaces
2. **Provide specialized agents** for different domains (research, code, writing, etc.)
3. **Enable semantic search** across vault content (RAG)
4. **Safe AI interactions** with vault through MCP tools
5. **Unique personality** through optional Mnemosyne persona
6. **Multi-provider support** (OpenAI, Anthropic, local LLMs)
7. **Privacy-first** with encrypted keys and local-first design

## Network Usage Disclosure

This plugin connects to external services when configured:
- **OpenAI API** (api.openai.com) - If using OpenAI provider
- **Anthropic API** (api.anthropic.com) - If using Anthropic provider
- **Local LLM** (localhost) - Optional, for offline operation

User prompts and vault content (when RAG enabled) are sent to chosen LLM provider. API keys are encrypted locally. No data sent to plugin servers. No telemetry.

## Obsidian Plugin Compliance Guidelines

### Code Quality Rules

**Workspace & Views:**
- Use `getActiveViewOfType()` instead of `workspace.activeLeaf`
- Don't manage references to custom views (causes memory leaks)
- Use `Workspace.getActiveLeavesOfType()` to access custom views

**Vault Operations:**
- Prefer `Editor` API over `Vault.modify()` for active files
- Use `Vault.process()` instead of `Vault.modify()` for background edits
- Use `FileManager.processFrontMatter()` for frontmatter modifications
- Use Vault API over Adapter API (better performance and safety)
- Use `getFileByPath()` / `getFolderByPath()` - never iterate all files
- Always use `normalizePath()` for user-defined paths

**Commands:**
- Use `callback` for unconditional commands
- Use `checkCallback` for conditional commands
- Use `editorCallback` for commands requiring active editor
- Never set default hotkeys (causes conflicts)

**Resource Management:**
- Clean up all resources in `onunload()`
- Use `registerEvent()` and `addCommand()` for auto-cleanup
- Don't detach leaves in `onunload()` (prevents proper reinitialization)

**Security:**
- Never use `innerHTML`, `outerHTML`, or `insertAdjacentHTML` with user input
- Use `createEl()`, `createDiv()`, `createSpan()` instead
- Use `el.empty()` to clear element contents

**Styling:**
- No hardcoded styles - use CSS classes
- Use Obsidian CSS variables (e.g., `--text-normal`, `--background-modifier-error`)
- Use `new Setting().setHeading()` instead of `<h1>`, `<h2>` tags

**TypeScript Best Practices:**
- Use `const` and `let` - never use `var`
- Use `async`/`await` over Promise chains
- Enable TypeScript strict mode

**Editor Extensions:**
- Use `updateOptions()` to reconfigure registered editor extensions
- Keep same array reference when modifying extensions

### UI Text Guidelines

- Use sentence case ("Template folder location" not "Template Folder Location")
- Avoid "settings" in settings headings ("Advanced" not "Advanced settings")
- Only use section headings if you have multiple sections
- Plugin description must:
  - Start with action statement ("Transform your vault...", "Generate notes from...")
  - Be 250 characters max
  - End with a period
  - No emoji or special characters
  - Proper capitalization for "Obsidian", "Markdown", etc.

### Submission Requirements

**Required Files:**
- `README.md` - Clear description and usage instructions
- `LICENSE` - MIT or compatible license
- `manifest.json` - Complete and accurate
- `main.js` - Production build
- `styles.css` - (optional) Styling

**Manifest Requirements:**
- `minAppVersion` - Set to minimum compatible version (or latest stable)
- `isDesktopOnly` - **MUST be true** (plugin uses `better-sqlite3` Node.js module)
- `fundingUrl` - Only for donation services (or remove if not accepting donations)
- `description` - Follow description guidelines above
- `id` - Cannot contain "obsidian"

**Before Submission:**
- Remove ALL sample code from template
- Test on real Obsidian vault
- Verify no console errors
- Check network disclosure in README
- Ensure all resources cleaned up on unload
- Follow semantic versioning (x.y.z format)

### Current Compliance Issues

⚠️ **MUST FIX before submission:**

1. ✅ **FIXED:** `isDesktopOnly` now set to `true` in manifest.json
2. ✅ **FIXED:** Description typo corrected in manifest.json
3. **src/index.ts:** Contains only sample code - needs complete implementation (Phases 2-10)

✅ **Already compliant:**
- README.md exists with network disclosure
- LICENSE file present
- esbuild.config.mjs exists
- Using `this.app` pattern (documented in architecture)
- No telemetry
- No deprecated dependencies
- Proper description format (action-oriented)

**See COMPLIANCE_REPORT.md for detailed compliance status and checklist**
