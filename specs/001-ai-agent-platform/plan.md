# Implementation Plan: AI Agent Platform for Obsidian

**Branch**: `001-ai-agent-platform` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-agent-platform/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a comprehensive AI agent platform as an Obsidian community plugin that enables users to interact with specialized AI assistants, perform semantic search over their vault using RAG (Retrieval Augmented Generation), create custom agents, and leverage MCP (Model Context Protocol) tools for automated vault operations. The platform supports multiple LLM providers (OpenAI, Anthropic, local), features an optional Mnemosyne persona for engaging interactions, and prioritizes security with AES-256 encrypted API key storage. The implementation follows Obsidian plugin best practices with mobile compatibility, efficient performance, and a modular architecture supporting seven independently testable user stories.

## Technical Context

**Language/Version**: TypeScript 5.x (ESNext target, strict mode enabled)
**Primary Dependencies**: Obsidian API (latest stable), OpenAI SDK (^4.77.3), Anthropic SDK (latest), @xenova/transformers (^2.x), hnswlib-wasm (^0.x), langchain (^0.x)
**Storage**: Obsidian plugin data API for settings/conversations, SQLite + sqlite-vec (desktop), IndexedDB + hnswlib-wasm (mobile)
**Testing**: Jest + jest-environment-obsidian (unit tests 70%), Custom Embedded Harness (integration 20%), Manual E2E (10%)
**Target Platform**: Obsidian Desktop (Windows/macOS/Linux) + Obsidian Mobile (iOS 16.4+, Android)
**Project Type**: Single Obsidian plugin project
**Performance Goals**: Plugin load <1s, RAG indexing 100-500 notes/sec (desktop) / 50-100 (mobile), chat response streaming <2s, vault storage <50MB per 1k notes
**Constraints**: Must use Web APIs only (no Node.js at top level for mobile), SubtleCrypto for encryption, Obsidian Vault API (not Adapter), requestUrl() for network, sentence case UI text
**Scale/Scope**: Support vaults up to 10k notes (mobile) / 100k+ (desktop), unlimited custom agents, multiple concurrent LLM providers, maintain <100MB memory footprint

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Obsidian API Compliance ✅

- ✅ Will use `this.app` plugin instance (no global `window.app`)
- ✅ Will use Vault API over Adapter API for all file operations
- ✅ Will use `normalizePath()` for all path handling
- ✅ Will use Editor API for active file edits, `Vault.process()` for background
- ✅ Will use `FileManager.processFrontMatter()` for frontmatter operations
- ✅ Will use path-specific methods (`getFileByPath`, etc.) not iteration
- ✅ Will implement proper resource cleanup in `onunload()`
- ✅ Will use `registerEvent()`, `addCommand()` for automatic cleanup

### II. Security & Privacy First ✅

- ✅ Will use Obsidian DOM helpers (`createEl()`, etc.) - no `innerHTML` with user input
- ✅ Will use `requestUrl()` instead of `fetch`/`axios`
- ✅ Will implement AES-256 encryption for API keys with master password (FR-041, FR-042)
- ✅ Will disclose network usage in README (OpenAI, Anthropic APIs)
- ✅ No client-side telemetry planned
- ✅ Will commit lock file (package-lock.json)
- ✅ Will minimize dependencies and audit for security
- ✅ MCP tools default read-only with confirmation prompts (FR-031, FR-032)
- ✅ Will maintain audit log for vault operations (FR-033)

### III. Mobile-First Compatibility ✅

- ✅ Will set `isDesktopOnly: false` to support mobile
- ✅ Will use `Platform.isDesktopApp` checks for any Node.js APIs
- ✅ Will dynamically `require()` any desktop-only modules
- ✅ Will use `Platform` API instead of `process.platform`
- ✅ Will check `instanceof FileSystemAdapter` before casting
- ✅ **RESOLVED**: SQLite (desktop) + IndexedDB + hnswlib-wasm (mobile) dual-backend
- ✅ **RESOLVED**: OpenAI text-embedding-3-small (cloud) + Transformers.js (local fallback)
- ✅ No regex lookbehinds planned (iOS 16.4+ target)

**Phase 0 research complete**: All mobile compatibility questions resolved

### IV. Code Quality & Standards ✅

- ✅ Will use TypeScript strict mode (NO `as any` without justification)
- ✅ Will use `const`/`let`, never `var`
- ✅ Will use `async`/`await` over raw Promises
- ✅ Will test with `instanceof` before type casting
- ✅ Will organize code into feature-based modules (src/agents/, src/rag/, etc.)
- ✅ Will rename all placeholder names (no `MyPlugin`, etc.)
- ✅ Will remove all sample code from template
- ✅ Will minimize console logging (errors only)
- ✅ No global variables planned
- ✅ Will use appropriate command callback types

### V. Performance & Resource Management ✅

- ✅ Will defer non-critical init to `workspace.onLayoutReady()` (FR-058)
- ✅ Will minimize bundle size for releases
- ✅ Will import `moment` from `'obsidian'` if needed
- ✅ Will avoid file iteration - use path-specific lookups
- ✅ RAG indexing designed for 100+ notes/sec (SC-006)
- ✅ Efficient vector search algorithms planned
- ✅ Will use `el.empty()` for DOM cleanup

### VI. User Experience Consistency ✅

- ✅ Will use sentence case for all UI text
- ✅ Settings headings without "settings" suffix
- ✅ Will use `setHeading()` for setting headings
- ✅ Will use CSS classes with Obsidian CSS variables
- ✅ No hardcoded inline styles
- ✅ Will follow Obsidian Style Guide
- ✅ No default hotkeys for commands
- ✅ Command names without plugin name prefix
- ✅ Multiple settings sections planned (Providers, Agents, RAG, MCP, Persona)
- ✅ Action-oriented descriptions

### Gate Status: ✅ PASS

**Phase 0 Complete**: All technical unknowns resolved (see research.md for details)

**Post-Research Validation**:
1. ✅ Vector storage: Dual-backend (SQLite desktop, IndexedDB mobile) meets FR-019, SC-006
2. ✅ Embeddings: Hybrid strategy (OpenAI + Transformers.js fallback) supports online/offline
3. ✅ Testing: Jest + jest-environment-obsidian provides comprehensive coverage strategy

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── agents/                    # Agent management and backend agents
│   ├── AgentManager.ts       # Agent registry and lifecycle
│   ├── BackendAgents.ts      # 10+ pre-configured agents
│   ├── CustomAgent.ts        # User-created agent support
│   └── Orchestrator.ts       # Intelligent agent routing (P4)
├── providers/                 # LLM provider integrations
│   ├── ProviderManager.ts    # Provider registry and selection
│   ├── OpenAIProvider.ts     # OpenAI integration
│   ├── AnthropicProvider.ts  # Anthropic integration
│   └── LocalProvider.ts      # Local LLM support
├── rag/                       # RAG indexing and retrieval
│   ├── RAGManager.ts         # Indexing orchestration
│   ├── VectorStore.ts        # Vector storage abstraction
│   ├── JSONBackend.ts        # Simple JSON storage
│   ├── SQLiteBackend.ts      # Performance SQLite storage
│   ├── Embeddings.ts         # Embedding generation
│   └── Retriever.ts          # Semantic + hybrid search
├── mcp/                       # Model Context Protocol tools
│   ├── MCPManager.ts         # Tool registry and execution
│   ├── ReadTools.ts          # Note reading tools
│   ├── WriteTools.ts         # Note creation/modification
│   ├── SearchTools.ts        # Vault search tools
│   └── AuditLog.ts           # Operation logging
├── persona/                   # Mnemosyne persona system
│   ├── PersonaManager.ts     # Persona application logic
│   └── PersonaPrompts.ts     # Intensity-level prompts
├── security/                  # Encryption and key management
│   ├── EncryptionService.ts  # AES-256 encryption (SubtleCrypto)
│   └── KeyManager.ts         # API key storage/retrieval
├── ui/                        # User interface components
│   ├── ChatView.ts           # Main chat interface
│   ├── SettingsTab.ts        # Plugin settings
│   ├── AgentSelector.ts      # Agent selection UI
│   └── ConfirmationModal.ts  # MCP write confirmations
├── types/                     # TypeScript type definitions
│   ├── Agent.ts              # Agent interfaces
│   ├── Conversation.ts       # Conversation/message types
│   ├── Provider.ts           # Provider interfaces
│   └── Settings.ts           # Plugin settings types
├── utils/                     # Shared utilities
│   ├── PathUtils.ts          # Path normalization helpers
│   ├── MarkdownUtils.ts      # Markdown rendering
│   └── ErrorHandling.ts      # Error formatting
└── main.ts                    # Plugin entry point

styles.css                     # Plugin-specific styles (Obsidian CSS vars)
manifest.json                  # Plugin metadata (isDesktopOnly: false)
versions.json                  # Obsidian version compatibility
```

**Structure Decision**: Single Obsidian plugin project. Feature-based module organization (agents/, rag/, mcp/, etc.) for clear separation of concerns. Each user story maps to one or more modules enabling independent development and testing. Mobile compatibility achieved through platform detection in relevant modules (security/ uses SubtleCrypto, rag/ gates heavy operations).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations. All requirements align with Obsidian plugin best practices.
