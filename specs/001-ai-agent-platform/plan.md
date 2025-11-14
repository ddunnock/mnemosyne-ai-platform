# Implementation Plan: AI Agent Platform for Obsidian

**Branch**: `001-speckit-setup` | **Date**: 2025-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-agent-platform/spec.md`

**Note**: This plan has been updated based on clarifications from `/speckit.clarify` sessions on 2025-11-13 and 2025-11-14.

## Summary

Build an Obsidian plugin that provides AI-powered chat agents with vault knowledge integration (RAG), tool capabilities (MCP), and intelligent routing. The platform enables users to chat with specialized AI agents (10+ pre-configured, unlimited custom) that can access vault notes, perform operations with permission, and maintain conversation memory across sessions. The plugin uses Preact for UI, automatic platform detection for RAG backends (SQLite/IndexedDB/JSON), and AES-256 encryption for API keys.

**MVP Scope** (User Story 1): Basic AI chat with backend agents using encrypted provider credentials - delivers immediate value within 3 minutes of installation.

## Technical Context

**Language/Version**: TypeScript (strict mode, ESNext target)
**Primary Dependencies**:
- Obsidian API (desktop + mobile support)
- **UI Framework**: Preact 10.x with Obsidian CSS variables for theme compatibility
- **LLM SDKs**: OpenAI SDK, Anthropic SDK (Claude)
- **RAG/Vector Storage**:
  - Desktop: better-sqlite3 + sqlite-vec
  - Mobile: IndexedDB + hnswlib-wasm
  - Fallback: JSON + hnswlib-wasm
- **Embeddings**: OpenAI text-embedding-3-small (primary), Transformers.js (fallback)
- **Security**: SubtleCrypto (Web API) for AES-256 encryption

**Storage**:
- Plugin data API for settings and conversation history
- Platform-detected RAG backend (SQLite/IndexedDB/JSON) for vector index
- Encrypted API keys in vault plugin data (never plain text)

**Testing**: Not specified in initial requirements - implement for quality assurance

**Target Platform**: Obsidian Desktop (Windows, macOS, Linux) and Obsidian Mobile (iOS, Android)
  - Mobile compatibility: mandatory for P1 (chat), graceful degradation for desktop-only features
  - Platform detection via `Platform.isDesktopApp`

**Project Type**: Single Obsidian plugin with feature-based modules

**Performance Goals**:
- Plugin load time: <1 second (SC-005)
- RAG indexing: ≥100 notes/second (SC-006)
- RAG retrieval: <50ms for top-10 from 10k notes (FR-060)
- Chat response start: <2 seconds excluding LLM API latency (SC-007)
- Bundle size: <50KB for chat UI including Preact runtime (FR-073)

**Constraints**:
- Must use Obsidian Vault API (no direct fs access) - constitution requirement
- Must use Platform.normalizePath() for all file paths - constitution requirement
- Must use Obsidian's registerEvent() for vault listeners - constitution requirement
- Mobile: no Node.js/Electron APIs unless gated behind platform detection
- Security: API keys encrypted with user master password, AES-256, SubtleCrypto only
- UI: Must use Obsidian CSS variables for theme compatibility, sentence case text

**Scale/Scope**:
- 10+ pre-configured backend agents (cannot be deleted)
- Unlimited custom agents
- Support for 10,000+ note vaults without UI blocking
- RAG index: <50MB storage for 1,000 notes (SC-008)
- Conversation memory: RAG-indexed history with context compression indicator

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Obsidian API Compliance

✅ **PASS** - All vault operations use Obsidian Vault API:
- FR-020, FR-023: RAG indexing uses Vault API for file reads
- FR-029, FR-076: MCP write tools use `Vault.process()` and `FileManager.processFrontMatter()`
- FR-078: Platform detection via `Platform.isDesktopApp`
- All file paths wrapped with `normalizePath()` (FR implementation requirement)
- Vault event handlers use `registerEvent()` (FR-023, FR-045)

✅ **PASS** - Resource cleanup in `onunload()`:
- All event listeners registered via `registerEvent()` auto-cleaned
- MCPManager cleanup for audit logs and tool state
- Conversation memory compression state cleared

### II. Security & Privacy First

✅ **PASS** - API key encryption mandatory:
- FR-041: AES-256 encryption required
- FR-042: User master password required
- FR-043, FR-044, FR-045: No plain text storage, in-memory decryption only, clear after use
- FR-046: SubtleCrypto (Web API) for mobile compatibility
- US6 dedicated to security implementation (P6)

✅ **PASS** - Network disclosure:
- Plugin makes network calls to LLM providers (OpenAI, Anthropic, local endpoints)
- README must document network usage and data sent to providers
- User controls which providers are configured

✅ **PASS** - No innerHTML with user input:
- Preact components use JSX (virtual DOM)
- Markdown rendering via Obsidian's MarkdownRenderer API
- All DOM creation via Preact or Obsidian helpers (createEl, createDiv, createSpan)

✅ **PASS** - Use requestUrl() for network calls:
- LLM provider integrations use Obsidian's `requestUrl()` instead of fetch
- Ensures Obsidian handles CORS, certificates, and mobile networking correctly

### III. Mobile-First Compatibility

✅ **PASS** - Dual backend strategy with platform detection:
- FR-019, FR-077, FR-078: Automatic backend selection (SQLite/IndexedDB/JSON)
- FR-055, FR-056, FR-057: Core chat works on mobile, graceful degradation for desktop features
- FR-004: Set `isDesktopOnly: false` in manifest.json
- SC-015, SC-016: Mobile testing required, clear notifications for desktop-only features

✅ **PASS** - Security compatible with mobile:
- FR-046: SubtleCrypto (Web API) works on iOS/Android
- No Node.js crypto dependencies

### IV. Code Quality & Standards

✅ **PASS** - TypeScript strict mode:
- tsconfig.json configured with strict: true, ESNext target
- ESLint configured for TypeScript and Obsidian plugins

✅ **PASS** - Minimal console logging:
- Production mode: errors only
- Development mode: info/debug acceptable with feature flags

### V. Performance & Resource Management

✅ **PASS** - Deferred initialization:
- FR-058: Non-critical operations deferred using `workspace.onLayoutReady()`
- RAG indexing runs in background without blocking UI (FR-059)
- Progressive loading of agents and settings

✅ **PASS** - Bundle optimization:
- FR-073: Chat UI bundle <50KB including Preact
- esbuild configuration for minification and tree-shaking
- Production builds exclude dev dependencies

### VI. User Experience Consistency

✅ **PASS** - Sentence case for all UI text:
- Settings headings use `setHeading()` API
- All buttons, labels, messages in sentence case

✅ **PASS** - Obsidian CSS variables:
- FR-072: All chat components styled with Obsidian CSS variables
- Automatic theme compatibility (light/dark/custom themes)

✅ **PASS** - No default hotkeys:
- All commands registered without default keybindings
- Users assign hotkeys manually

**Constitution Gate Result**: ✅ ALL CHECKS PASS - Ready for Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-agent-platform/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (updated with clarifications)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
└── tasks.md             # Phase 2 output (already generated, needs update)
```

### Source Code (repository root)

```text
src/
├── main.ts                   # Plugin entry point (extends Plugin)
├── types/                    # TypeScript interfaces
│   ├── Settings.ts           # Plugin settings interface
│   ├── Provider.ts           # LLM provider interfaces
│   ├── Agent.ts              # Agent interfaces with skill tags
│   └── Conversation.ts       # Conversation and message types
├── ui/                       # Preact components + Obsidian views
│   ├── ChatView.ts           # Main chat sidebar (ItemView)
│   ├── components/           # Preact components
│   │   ├── ChatBubble.tsx    # Message display
│   │   ├── AgentSelector.tsx # Dropdown for agent selection
│   │   ├── OrchestratorPreview.tsx  # Real-time suggestions
│   │   ├── ConversationList.tsx     # Recent conversations
│   │   └── CompressionIndicator.tsx # Context window status
│   ├── SettingsTab.ts        # Plugin settings UI
│   └── ConfirmationModal.ts  # MCP write confirmations
├── providers/                # LLM provider implementations
│   ├── ProviderManager.ts    # Provider registry
│   ├── OpenAIProvider.ts     # OpenAI integration
│   ├── AnthropicProvider.ts  # Anthropic integration
│   └── LocalProvider.ts      # Local LLM endpoint
├── agents/                   # Agent system
│   ├── AgentManager.ts       # Agent lifecycle and registry
│   ├── BackendAgents.ts      # 10+ backend agents
│   ├── CustomAgent.ts        # User-created agents
│   └── Orchestrator.ts       # Intelligent routing with skill matching
├── rag/                      # Retrieval Augmented Generation
│   ├── VectorStore.ts        # Platform-agnostic interface + factory
│   ├── SQLiteBackend.ts      # Desktop (better-sqlite3 + sqlite-vec)
│   ├── IndexedDBBackend.ts   # Mobile (IndexedDB + hnswlib-wasm)
│   ├── JSONBackend.ts        # Fallback (JSON + hnswlib-wasm)
│   ├── Embeddings.ts         # OpenAI + Transformers.js fallback
│   ├── RAGManager.ts         # Indexing orchestration
│   └── Retriever.ts          # Semantic + hybrid search
├── mcp/                      # Model Context Protocol tools
│   ├── MCPManager.ts         # Tool registry and execution
│   ├── ReadTools.ts          # Note reading tools
│   ├── WriteTools.ts         # Note creation/modification tools
│   ├── SearchTools.ts        # Search tools (keywords, tags, backlinks)
│   └── AuditLog.ts           # Operation logging
├── security/                 # Encryption and key management
│   ├── EncryptionService.ts  # AES-256 via SubtleCrypto
│   └── KeyManager.ts         # Master password + encrypted storage
├── persona/                  # Mnemosyne personality layer
│   ├── PersonaManager.ts     # Persona application logic
│   └── PersonaPrompts.ts     # Intensity levels (subtle/moderate/strong)
├── utils/                    # Shared utilities
│   ├── PathUtils.ts          # normalizePath wrappers
│   ├── ErrorHandling.ts      # Standardized error formatting
│   └── MarkdownUtils.ts      # Markdown rendering helpers
└── styles.css                # Plugin styles (Obsidian CSS variables)

tests/
├── unit/                     # Unit tests per module
├── integration/              # Cross-module integration tests
└── e2e/                      # End-to-end user scenarios

manifest.json                 # Plugin metadata (isDesktopOnly: false)
versions.json                 # Obsidian version compatibility
package.json                  # Dependencies and build scripts
tsconfig.json                 # TypeScript config (strict mode)
esbuild.config.mjs            # Bundle configuration
.eslintrc.json                # Linting rules
```

**Structure Decision**: Single Obsidian plugin project. Feature-based module organization (agents/, rag/, mcp/, etc.) for clear separation of concerns. Each user story maps to one or more modules enabling independent development and testing. Mobile compatibility achieved through platform detection in relevant modules (security/ uses SubtleCrypto, rag/ gates heavy operations).

## Orchestrator Algorithm Specification

**Purpose**: Defines the intelligent agent routing algorithm for User Story 4 (FR-036 to FR-040, FR-061 to FR-070)

### Confidence Scoring Formula

The orchestrator calculates a confidence score for each agent using weighted factors:

```
confidence_score = (skill_match_score × 0.5) + (tool_availability_score × 0.3) + (context_score × 0.2)
```

**Component Definitions**:

1. **Skill Match Score** (weight: 0.5)
   - Cosine similarity between query embedding and agent skill tag embeddings
   - Each agent declares 3-10 skill tags (e.g., "code-review", "note-summarization", "research")
   - Query is embedded using same model as skill tags (OpenAI text-embedding-3-small)
   - Range: 0.0 to 1.0

2. **Tool Availability Score** (weight: 0.3)
   - Binary score for whether required tools are available to the agent
   - Check: Does agent have MCP tools if query requires vault access?
   - Check: Does agent have RAG access to relevant note scope?
   - Calculation: 1.0 if all required tools available, 0.5 if partial, 0.0 if none
   - Range: 0.0 to 1.0

3. **Context Score** (weight: 0.2)
   - Recency of agent in current conversation history
   - If agent used in last 3 messages: score = 1.0
   - If agent used 4-10 messages ago: score = 0.5
   - If agent never used in conversation: score = 0.3 (slight penalty)
   - Range: 0.0 to 1.0

### Routing Decision Logic

- **Auto-route** (confidence ≥ 0.7): Automatically select top agent and notify user
- **Suggest** (0.4 ≤ confidence < 0.7): Show top 3 agents with scores, let user choose
- **Manual** (confidence < 0.4): Prompt user to select agent manually
- **No match**: If all agents score < 0.2, display error and suggest general assistant

### Adaptive Learning Algorithm

The orchestrator adjusts agent confidence scores over time based on routing success metrics (FR-064):

**Metrics Tracked**:
- `routing_success_rate`: percentage of times user accepts orchestrator suggestion (vs manual override)
- `routing_attempts`: total number of times agent was suggested

**Adjustment Formula**:
- Use exponential moving average (EMA) with alpha = 0.1
- `adjusted_confidence = base_confidence × (0.7 + 0.3 × ema_success_rate)`
- `ema_success_rate = alpha × current_success + (1 - alpha) × previous_ema`
- Minimum confidence floor: 0.3 (prevents complete exclusion of agents)
- Decay half-life: 50 routing attempts (recent performance weighted more heavily)

**Example**: Agent with 60% historical success rate gets 0.88× multiplier (0.7 + 0.3 × 0.6), while agent with 90% success gets 0.97× multiplier

### Loop Prevention

**Maximum Delegation Depth** (FR-066, FR-070):
- Default limit: 3 hops (configurable in settings)
- Counter increments each time orchestrator delegates to another agent
- When limit reached: Return error to user with delegation chain displayed

**Visited Agent Tracking** (FR-067, FR-068):
- Maintain call stack: `[Agent A → Agent B → Agent C]`
- Before routing: Check if target agent already in stack
- If duplicate detected: Skip that agent, try next ranked agent
- If no unvisited agents remain: Terminate and show error

**Error Message Format**:
```
"Maximum delegation depth reached (3 agents).
Routing chain: General Assistant → Code Reviewer → Research Assistant
Please select an agent manually to continue."
```

## Complexity Tracking

> **No violations to justify** - All requirements align with Obsidian plugin best practices and constitution principles.

The plugin follows standard Obsidian architecture patterns:
- Single plugin entry point extending `Plugin` class
- Feature modules for clean separation
- Settings tab via `PluginSettingTab`
- Chat view via `ItemView`
- All Obsidian API requirements met

**Justification for Multi-Module Structure**:
- **NOT a violation**: Feature-based modules (agents/, rag/, mcp/) are organizational units within a single plugin, not separate projects
- Improves maintainability and testability for complex feature set (7 user stories)
- Each module maps to independent user story for parallel development
- Complexity justified by rich feature scope (RAG + MCP + Orchestrator + Security + Persona)

## Phase Breakdown

### Phase 0: Research (Next Step)

**Output**: `research.md`

**Research Tasks**:

1. **Preact Integration with Obsidian**
   - Decision: How to integrate Preact with Obsidian's ItemView
   - Research: Preact rendering in Obsidian container elements
   - Research: Obsidian CSS variable usage in Preact components
   - Outcome: Integration pattern for ChatView.ts + Preact components

2. **Platform Detection for RAG Backends**
   - Decision: Exactly which Obsidian API for platform detection
   - Research: `Platform.isDesktopApp` vs `Platform.isMobile` vs `Platform.isMobileApp`
   - Research: Feature detection for IndexedDB, better-sqlite3 availability
   - Outcome: Platform detection logic + backend selection algorithm

3. **Vector Search Libraries**
   - Decision: sqlite-vec for SQLite backend
   - Decision: hnswlib-wasm for IndexedDB and JSON backends
   - Research: Bundle size implications (must stay <50KB total for chat UI)
   - Outcome: Vector library choices and integration patterns

4. **Conversation Context Compression**
   - Decision: Compression/summarization strategy when approaching context limit
   - Research: Token counting per LLM provider
   - Research: Summarization techniques (extractive vs abstractive)
   - Outcome: Compression algorithm preserving critical info (preferences, decisions, tasks)

5. **RAG-based Conversation Memory**
   - Decision: How to index conversation history separately from vault notes
   - Research: Metadata strategy to distinguish conversations from notes in RAG index
   - Outcome: Conversation indexing architecture

6. **Obsidian API Best Practices**
   - Research: Vault.process() vs Vault.modify() for write operations
   - Research: FileManager.processFrontMatter() for metadata updates
   - Research: workspace.onLayoutReady() for deferred initialization
   - Outcome: Obsidian API usage patterns

7. **Real-time Orchestrator Preview**
   - Decision: Debouncing strategy for query-as-you-type suggestions
   - Research: Embedding query latency (OpenAI API)
   - Research: Local caching of skill tag embeddings
   - Outcome: Real-time UX implementation pattern

**Gate**: All NEEDS CLARIFICATION resolved before Phase 1

### Phase 1: Design & Contracts (After Phase 0)

**Output**: `data-model.md`, `contracts/`, `quickstart.md`

**Design Artifacts**:

1. **Data Model** (`data-model.md`):
   - LLM Provider entity (name, type, encrypted key, models, rate limits)
   - Agent entity (ID, name, system prompt, provider, RAG settings, MCP permissions, skills, metrics)
   - Conversation entity (ID, agent ID, messages, timestamps, state)
   - Message entity (sender, content, timestamp, metadata)
   - RAG Index entity (files, embeddings, metadata, backend type)
   - MCP Tool Execution entity (tool, agent, operation, path, timestamp, result)
   - Persona Configuration entity (enabled, intensity, additions)
   - Encryption Context entity (password hash, key derivation params)

2. **Contracts** (`contracts/`):
   - Provider API contracts (OpenAI, Anthropic interfaces)
   - Agent interfaces (backend vs custom agents)
   - RAG interfaces (VectorStore, Embeddings, Retriever)
   - MCP tool interfaces (ReadTools, WriteTools, SearchTools)
   - Orchestrator interfaces (skill matching, routing decisions)

3. **Quickstart** (`quickstart.md`):
   - Installation steps
   - First-time setup (API key configuration with master password)
   - Opening chat interface and selecting agent
   - Testing RAG retrieval (ask question about vault content)
   - Creating custom agent
   - Enabling orchestrator

**Gate**: Constitution re-check passes, all design artifacts complete

### Phase 2: Task Generation (Final Step - Already Complete)

**Output**: `tasks.md` (already exists, may need updates based on new clarifications)

**Task Breakdown**: 121 tasks across 7 user stories + setup + foundational + polish phases

**Updates Needed**:
- Add tasks for Preact component implementation (ChatBubble, AgentSelector, etc.)
- Add tasks for real-time orchestrator preview UI
- Add tasks for conversation list view with auto-archiving
- Add tasks for RAG-based conversation memory indexing
- Add tasks for context compression indicator and automatic summarization
- Update RAG backend tasks to reflect platform detection logic
- Ensure all new FRs (FR-071 to FR-085) have task coverage

**Next Command**: `/speckit.tasks` to regenerate with latest requirements

## Dependencies

**npm packages**:
```json
{
  "dependencies": {
    "obsidian": "latest",
    "preact": "^10.19.0",
    "openai": "^4.20.0",
    "@anthropic-ai/sdk": "^0.9.0",
    "better-sqlite3": "^9.2.0",
    "hnswlib-wasm": "^0.8.0",
    "@xenova/transformers": "^2.10.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "esbuild": "^0.19.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0"
  }
}
```

**Platform-specific**:
- Desktop only: better-sqlite3 (native module, gated behind Platform.isDesktopApp)
- Mobile only: IndexedDB (browser API)
- Universal: hnswlib-wasm, SubtleCrypto

## Risk Assessment

**High Risk**:
1. **Mobile RAG performance**: IndexedDB + hnswlib-wasm may be slower than desktop SQLite
   - Mitigation: Progressive indexing, configurable index size limits
   - Fallback: JSON backend if IndexedDB unavailable

2. **Context compression quality**: Automated summarization may lose important info
   - Mitigation: Preserve user preferences, key decisions, ongoing tasks explicitly
   - User control: Manual archive before compression, review compression summary

**Medium Risk**:
1. **Bundle size**: Preact + hnswlib-wasm + Transformers.js could exceed 50KB target
   - Mitigation: Code splitting, lazy loading of heavy modules (Transformers.js only if needed)
   - Monitoring: Track bundle size in CI/CD

2. **Real-time orchestrator latency**: Embedding query on every keystroke may feel slow
   - Mitigation: Debouncing (300ms), local caching of skill embeddings
   - Fallback: Show last suggestion until new one ready

**Low Risk**:
1. **Master password UX**: Users may forget password, lose all encrypted keys
   - Mitigation: Clear warnings, password strength requirements
   - Documentation: Emphasize no recovery mechanism

## Success Metrics (from spec.md)

**User Productivity**:
- SC-001: First conversation in <3 minutes ✓
- SC-002: Vault question answered in <5 seconds ✓
- SC-003: 90% RAG retrieval relevance ✓
- SC-004: Custom agent created in <2 minutes ✓

**Performance**:
- SC-005: Plugin load <1 second ✓
- SC-006: RAG indexing ≥100 notes/second ✓
- SC-007: Chat response start <2 seconds ✓
- SC-008: RAG storage <50MB for 1k notes ✓

**Reliability**:
- SC-009: Graceful network/API error handling ✓
- SC-010: 100% MCP write confirmation ✓
- SC-011: Encrypted keys secure across reloads ✓

**UX**:
- SC-012: Complete workflow without leaving Obsidian ✓
- SC-013: RAG-enhanced responses ✓
- SC-014: 80% orchestrator accuracy ✓

**Mobile**:
- SC-015: P1 works on iOS/Android ✓
- SC-016: Clear desktop-only notifications ✓

**Security**:
- SC-017: Zero plain-text API keys ✓
- SC-018: 100% MCP audit log coverage ✓

## Next Steps

1. **Generate research.md** via Phase 0 research tasks (7 research items identified above)
2. **Create design artifacts** via Phase 1 (data-model.md, contracts/, quickstart.md)
3. **Update agent context** via `.specify/scripts/bash/update-agent-context.sh claude`
4. **Regenerate tasks.md** via `/speckit.tasks` to incorporate all clarifications and new FRs
5. **Proceed to implementation** via `/speckit.implement`

**Estimated Complexity**: High (7 user stories, 85 FRs, mobile compatibility, security-first design)
**Estimated Timeline**: 4-6 weeks for MVP (US1 only), 12-16 weeks for full feature set (US1-US7)