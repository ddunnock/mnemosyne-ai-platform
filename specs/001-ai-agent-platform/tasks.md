# Tasks: AI Agent Platform for Obsidian

**Input**: Design documents from `/specs/001-ai-agent-platform/`
**Prerequisites**: plan.md, spec.md (data-model.md, contracts/, research.md, quickstart.md to be generated)
**Tests**: Not requested in specification - implementation only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Updated**: 2025-11-14 - Incorporates clarifications from `/speckit.clarify` sessions (Preact UI, platform detection, conversation management, RAG memory, real-time orchestrator)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic Obsidian plugin structure

- [ ] T001 Create TypeScript project structure with src/ directory as specified in plan.md
- [ ] T002 Initialize package.json with Obsidian API, Preact, OpenAI SDK, Anthropic SDK, better-sqlite3, hnswlib-wasm, and @xenova/transformers dependencies
- [ ] T003 [P] Configure tsconfig.json with strict mode and ESNext target per constitution IV
- [ ] T004 [P] Create manifest.json with isDesktopOnly: false for mobile compatibility
- [ ] T005 [P] Create versions.json for Obsidian version compatibility tracking
- [ ] T006 [P] Configure esbuild in esbuild.config.mjs for bundle optimization with Preact support and code splitting for heavy optional modules (Transformers.js, hnswlib-wasm) while keeping core chat UI bundle under 50KB
- [ ] T007 [P] Setup ESLint with TypeScript and Obsidian plugin rules in .eslintrc.json
- [ ] T008 [P] Create .gitignore excluding node_modules, main.js, and build artifacts
- [ ] T009 Create main.ts plugin entry point extending Obsidian's Plugin class
- [ ] T010 [P] Create styles.css with Obsidian CSS variables for consistent theming

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T011 [P] Create src/types/Settings.ts with plugin settings interface for all features (providers, agents, RAG, MCP, persona, conversation limits)
- [ ] T012 [P] Create src/types/Provider.ts with LLM provider interfaces (OpenAI, Anthropic, Local)
- [ ] T013 [P] Create src/types/Agent.ts with agent interfaces including skill tags and routing metrics
- [ ] T014 [P] Create src/types/Conversation.ts with conversation, message, and compression state types
- [ ] T015 [P] Create src/utils/PathUtils.ts with normalizePath wrappers per constitution I
- [ ] T016 [P] Create src/utils/ErrorHandling.ts with standardized error formatting
- [ ] T017 [P] Create src/utils/MarkdownUtils.ts for markdown rendering helpers using Obsidian's MarkdownRenderer API
- [ ] T018 Implement SettingsTab in src/ui/SettingsTab.ts with sections for Providers, Agents, RAG, MCP, Persona, and Conversation Settings
- [ ] T019 Register settings tab and load/save settings in main.ts using Obsidian plugin data API
- [ ] T020 Implement workspace.onLayoutReady() for deferred initialization per constitution V

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic AI Chat with Backend Agents (Priority: P1) 🎯 MVP

**Goal**: Enable users to chat with specialized AI agents using configured LLM providers

**Independent Test**: Configure an LLM provider API key, open chat interface in right sidebar, select a backend agent from dropdown, send a message, and receive a relevant response. Delivers standalone value without RAG or MCP features.

### Implementation for User Story 1

- [ ] T021 [P] [US1] Implement EncryptionService in src/security/EncryptionService.ts using SubtleCrypto with AES-256 and PBKDF2 key derivation (FR-041, FR-042, FR-046)
- [ ] T022 [P] [US1] Implement KeyManager in src/security/KeyManager.ts for encrypted API key storage and master password management (FR-043, FR-044, FR-045)
- [ ] T023 [P] [US1] Implement ProviderManager in src/providers/ProviderManager.ts for provider registry and selection (FR-002, FR-005)
- [ ] T024 [P] [US1] Implement OpenAIProvider in src/providers/OpenAIProvider.ts with OpenAI SDK integration using requestUrl() per constitution II (FR-001)
- [ ] T025 [P] [US1] Implement AnthropicProvider in src/providers/AnthropicProvider.ts with Anthropic SDK integration using requestUrl() (FR-001)
- [ ] T026 [P] [US1] Implement LocalProvider in src/providers/LocalProvider.ts for local LLM endpoint support (FR-001)
- [ ] T027 [US1] Add provider configuration UI to SettingsTab with API key validation and master password setup (FR-003, FR-004)
- [ ] T028 [P] [US1] Create BackendAgents.ts in src/agents/ with 10+ backend agent definitions including skill tags (FR-006, FR-007, FR-061)
- [ ] T029 [P] [US1] Implement AgentManager in src/agents/AgentManager.ts for agent registry and lifecycle (FR-010, FR-011)
- [ ] T030 [P] [US1] Setup Preact build integration in esbuild.config.mjs with JSX transform and bundle size monitoring (<50KB target per FR-073)
- [ ] T031 [P] [US1] Create Preact component ChatBubble.tsx in src/ui/components/ for message display with user/agent distinction and markdown rendering
- [ ] T032 [P] [US1] Create Preact component AgentSelector.tsx in src/ui/components/ for agent dropdown with "Auto (Orchestrator)" option (FR-015)
- [ ] T033 [P] [US1] Create Preact component ConversationList.tsx in src/ui/components/ showing recent conversations (active in last 30 days) with timestamps (FR-017, FR-079)
- [ ] T034 [P] [US1] Create Preact component CompressionIndicator.tsx in src/ui/components/ showing messages remaining before context compression (FR-083)
- [ ] T035 [US1] Implement ChatView in src/ui/ChatView.ts as Obsidian ItemView with Preact rendering in right sidebar (FR-012, FR-071, FR-072)
- [ ] T036 [US1] Integrate Preact components (ChatBubble, AgentSelector, ConversationList, CompressionIndicator) into ChatView with Obsidian CSS variables
- [ ] T037 [US1] Implement conversation state management in AgentManager with token/message counting (FR-082)
- [ ] T038 [US1] Integrate AgentManager with ProviderManager for LLM API calls with streaming support
- [ ] T039 [US1] Implement conversation persistence in AgentManager using Obsidian plugin data API (FR-017, FR-018)
- [ ] T040 [US1] Implement automatic conversation archiving (30+ days inactive) with searchable archive (FR-079, FR-080)
- [ ] T041 [US1] Implement manual archive/delete conversation functionality in ConversationList component (FR-080)
- [ ] T042 [US1] Register "Open AI chat" command in main.ts to open ChatView in right sidebar (FR-012)
- [ ] T043 [US1] Add error handling for API failures (invalid keys, rate limits, network errors) with user-friendly messages per FR-004
- [ ] T044 [US1] Implement context window tracking and compression trigger logic (FR-084, FR-085)
- [ ] T045 [US1] Implement conversation summarization preserving critical info (user preferences, key decisions, ongoing tasks) when approaching context limit (FR-084, FR-085)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can chat with backend agents in a styled sidebar with conversation management

---

## Phase 4: User Story 2 - Semantic Search (RAG) Integration (Priority: P2)

**Goal**: Enable AI agents to access knowledge from the vault through RAG retrieval and index conversation history for long-term memory

**Independent Test**: Index a vault with known content, ask an agent a question whose answer exists in notes, verify the agent retrieves and uses that content in its response. Also verify agents can reference past conversations via RAG memory. Works standalone without MCP tools.

### Implementation for User Story 2

- [ ] T046 [P] [US2] Create VectorStore interface in src/rag/VectorStore.ts with platform-agnostic methods (add, search, delete, rebuild)
- [ ] T047 [P] [US2] Implement SQLiteBackend in src/rag/SQLiteBackend.ts using better-sqlite3 + sqlite-vec with Platform.isDesktopApp check (FR-019, FR-078, constitution III)
- [ ] T048 [P] [US2] Implement IndexedDBBackend in src/rag/IndexedDBBackend.ts using IndexedDB + hnswlib-wasm for mobile (FR-019, FR-078, constitution III)
- [ ] T049 [P] [US2] Implement JSONBackend in src/rag/JSONBackend.ts using JSON + hnswlib-wasm as universal fallback (FR-019)
- [ ] T050 [P] [US2] Implement Embeddings in src/rag/Embeddings.ts with OpenAI text-embedding-3-small and @xenova/transformers fallback using all-MiniLM-L6-v2 model
- [ ] T051 [US2] Implement VectorStoreFactory in src/rag/VectorStore.ts to automatically select backend based on Platform.isDesktopApp detection (FR-077, FR-078)
- [ ] T052 [US2] Implement RAGManager in src/rag/RAGManager.ts for indexing orchestration with Vault API using registerEvent() (FR-020, FR-021, FR-023, constitution I)
- [ ] T053 [US2] Implement Retriever in src/rag/Retriever.ts with semantic + hybrid search capabilities (FR-024, FR-027)
- [ ] T054 [US2] Add RAG configuration UI to SettingsTab with folder/tag filters and automatic backend selection display (FR-022, FR-026)
- [ ] T055 [US2] Register vault event handlers in RAGManager for automatic index updates (create, modify, delete) using registerEvent() (FR-023, constitution I)
- [ ] T056 [US2] Add per-agent RAG settings (enable/disable, top-K, threshold, metadata filters) to agent configuration (FR-025)
- [ ] T057 [US2] Integrate Retriever with AgentManager to inject retrieved context from vault notes into agent prompts (FR-024)
- [ ] T058 [US2] Add source note citations to agent responses in ChatBubble component when RAG is used (FR-026)
- [ ] T059 [US2] Implement progress indicator for indexing in SettingsTab RAG section (FR-021)
- [ ] T060 [US2] Implement conversation history indexing in RAGManager with metadata to distinguish conversations from vault notes (FR-081)
- [ ] T061 [US2] Enable Retriever to search conversation history separately or together with vault notes based on agent query context (FR-081)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - agents can chat, access vault knowledge, and remember past conversations

---

## Phase 5: User Story 3 - Custom Agent Creation (Priority: P3)

**Goal**: Enable power users to create their own specialized AI agents with custom configurations

**Independent Test**: Create a new custom agent with a specific system prompt, select an LLM provider, configure RAG settings, and verify the agent behaves according to the custom configuration. Works independently of other stories.

### Implementation for User Story 3

- [ ] T062 [P] [US3] Implement CustomAgent class in src/agents/CustomAgent.ts extending base agent interface (FR-008)
- [ ] T063 [US3] Add custom agent management to AgentManager (create, update, delete operations) (FR-008)
- [ ] T064 [US3] Create agent creation/edit form UI in SettingsTab Agents section (FR-056: name, description, system prompt)
- [ ] T065 [US3] Add LLM provider and model selection to custom agent form (FR-009)
- [ ] T066 [US3] Add RAG configuration options to custom agent form (enable/disable, top-K, threshold, metadata filters) (FR-058)
- [ ] T067 [US3] Add skill tag editor to custom agent form for orchestrator integration (FR-061)
- [ ] T068 [US3] Update AgentSelector component to display both backend and custom agents with visual distinction (FR-059)
- [ ] T069 [US3] Implement agent deletion with validation preventing backend agent deletion (FR-007, FR-060)
- [ ] T070 [US3] Add custom agent persistence to plugin data storage

**Checkpoint**: All three stories should now work independently - users can chat, use RAG, and create custom agents

---

## Phase 6: User Story 4 - Intelligent Agent Routing (Priority: P4)

**Goal**: Automatically suggest the most appropriate agent for user queries with real-time preview

**Independent Test**: Enable the orchestrator via "Auto (Orchestrator)" dropdown option, type various queries and verify real-time agent suggestions appear above input box with confidence scores, allowing user to click suggestion to lock it in or override manually.

### Implementation for User Story 4

- [ ] T071 [P] [US4] Extend Agent interface in src/types/Agent.ts to include skill tags array and routing metrics (success rate, override rate) (FR-061, FR-063)
- [ ] T072 [P] [US4] Add skill tag declarations to all backend agents in BackendAgents.ts (3-10 tags per agent) (FR-061)
- [ ] T073 [P] [US4] Implement Orchestrator in src/agents/Orchestrator.ts with query-to-skill embedding matching using Embeddings service (FR-036, FR-037)
- [ ] T074 [US4] Implement confidence scoring algorithm in Orchestrator: skill_match (0.5) + tool_availability (0.3) + context_score (0.2) per plan.md specification
- [ ] T075 [US4] Implement routing decision logic in Orchestrator (auto-route ≥0.7, suggest 0.4-0.7, manual <0.4) (FR-037, FR-040)
- [ ] T076 [US4] Implement tool availability consideration in routing (MCP tools, RAG scope) (FR-062)
- [ ] T077 [P] [US4] Create Preact component OrchestratorPreview.tsx in src/ui/components/ for real-time agent suggestion display with confidence score (FR-074)
- [ ] T078 [US4] Integrate OrchestratorPreview into ChatView with debouncing (300ms) for query-as-you-type analysis (FR-074)
- [ ] T079 [US4] Implement click-to-lock functionality in OrchestratorPreview allowing user to lock in suggested agent (FR-075)
- [ ] T080 [US4] Implement "view alternatives" feature in OrchestratorPreview showing top 3 agent suggestions (FR-076)
- [ ] T081 [US4] Implement manual override tracking in Orchestrator (user accepts vs selects different agent) (FR-038, FR-063)
- [ ] T082 [US4] Add conversation context consideration to Orchestrator routing logic (recency of agent in conversation) (FR-039)
- [ ] T083 [US4] Implement routing performance metrics tracking (success rate, override rate) per agent (FR-063)
- [ ] T084 [US4] Implement adaptive confidence score adjustment using exponential moving average (alpha=0.1) based on historical performance (FR-064)
- [ ] T085 [US4] Add delegation depth limit tracking with configurable maximum (default 3 hops) (FR-066, FR-070)
- [ ] T086 [US4] Implement visited agent tracking in routing call stack to prevent loops (FR-067, FR-068)
- [ ] T087 [US4] Add error handling for maximum delegation depth reached with delegation chain display (FR-069)
- [ ] T088 [US4] Add orchestrator configuration to SettingsTab (enable/disable, max delegation depth, skill taxonomy editor) (FR-065, FR-070)
- [ ] T089 [US4] Implement skill tag embedding caching in Orchestrator for improved real-time performance

**Checkpoint**: Intelligent routing should suggest appropriate agents in real-time while preserving manual control

---

## Phase 7: User Story 5 - MCP Tools for Vault Operations (Priority: P5)

**Goal**: Enable AI agents to read, search, and modify notes with user permission

**Independent Test**: Enable MCP tools, grant permissions to an agent, ask it to perform vault operations (search notes, read specific notes, update frontmatter), verify operations execute correctly with appropriate confirmations.

### Implementation for User Story 5

- [ ] T090 [P] [US5] Create MCPManager in src/mcp/MCPManager.ts for tool registry and execution orchestration (FR-034, FR-035)
- [ ] T091 [P] [US5] Implement ReadTools in src/mcp/ReadTools.ts with note content access using Vault API (FR-028, constitution I)
- [ ] T092 [P] [US5] Implement SearchTools in src/mcp/SearchTools.ts for keyword, tag, and backlink search (FR-030)
- [ ] T093 [P] [US5] Implement WriteTools in src/mcp/WriteTools.ts for note creation, updates, and frontmatter modification using Vault.process() and FileManager.processFrontMatter() (FR-029, constitution I)
- [ ] T094 [P] [US5] Implement AuditLog in src/mcp/AuditLog.ts for operation logging with timestamp, agent, and action details (FR-033)
- [ ] T095 [US5] Implement ConfirmationModal in src/ui/ConfirmationModal.ts for write operation confirmations (FR-031)
- [ ] T096 [US5] Integrate MCPManager with WriteTools to require user confirmation before execution (FR-031)
- [ ] T097 [US5] Add read-only mode toggle to MCP settings with write operation blocking (FR-032)
- [ ] T098 [US5] Add per-agent MCP tool permissions configuration to agent settings (FR-034)
- [ ] T099 [US5] Implement folder restriction enforcement in all MCP tools using normalizePath() (FR-035, constitution I)
- [ ] T100 [US5] Integrate MCPManager with AgentManager to make tools available during agent responses
- [ ] T101 [US5] Add MCP configuration UI to SettingsTab (enable/disable, read-only mode, audit log viewer) (FR-033)
- [ ] T102 [US5] Register cleanup for MCP resources in main.ts onunload() per constitution I

**Checkpoint**: Agents can now perform vault operations with appropriate safety guardrails

---

## Phase 8: User Story 6 - API Key Security Management (Priority: P6)

**Goal**: Ensure API keys are stored securely with encryption

**Independent Test**: Add an API key with master password, verify it's encrypted in plugin data storage, confirm the key can be decrypted for use, and test that keys aren't accessible without the password.

### Implementation for User Story 6

- [ ] T103 [US6] Enhance EncryptionService to derive key from master password using PBKDF2 with salt (100,000 iterations) (FR-042)
- [ ] T104 [US6] Implement master password prompt modal in src/ui/ for plugin load and initial setup
- [ ] T105 [US6] Add master password validation and re-entry flow to KeyManager (FR-114)
- [ ] T106 [US6] Ensure API keys are decrypted in memory only during API calls and cleared after use with explicit memory cleanup (FR-044, FR-045)
- [ ] T107 [US6] Add master password reset flow in SettingsTab with warning about losing all keys (FR-114)
- [ ] T108 [US6] Validate encrypted storage format in plugin data (only ciphertext, no plaintext) (FR-115)
- [ ] T109 [US6] Update provider configuration UI to integrate with encrypted key storage and master password requirements

**Checkpoint**: API keys are now fully encrypted with AES-256 and protected by master password

---

## Phase 9: User Story 7 - Mnemosyne Persona (Optional Enhancement) (Priority: P7)

**Goal**: Add optional personality layer with timeless wisdom theming

**Independent Test**: Enable the Mnemosyne persona with a chosen intensity level in settings, chat with any agent, verify responses include appropriate persona elements (subtle, moderate, or strong) while still answering questions accurately.

### Implementation for User Story 7

- [ ] T110 [P] [US7] Create PersonaPrompts in src/persona/PersonaPrompts.ts with three intensity levels (subtle, moderate, strong) (FR-048)
- [ ] T111 [US7] Implement PersonaManager in src/persona/PersonaManager.ts for persona application logic (FR-047, FR-049)
- [ ] T112 [US7] Integrate PersonaManager with AgentManager to wrap agent responses when enabled (FR-049)
- [ ] T113 [US7] Add persona configuration UI to SettingsTab (enable/disable toggle, intensity selector) (FR-047, FR-048)
- [ ] T114 [US7] Add custom persona additions field to SettingsTab for user customization (FR-050)
- [ ] T115 [US7] Implement immediate persona toggle effect (no reload required) (FR-135)

**Checkpoint**: All seven user stories are now complete and independently functional

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and prepare for release

- [ ] T116 [P] Create comprehensive README.md with feature description, installation, usage guide, network disclosure (LLM API calls), and mobile compatibility notes per constitution submission requirements
- [ ] T117 [P] Add LICENSE file (open source license required for community plugins)
- [ ] T118 [P] Document LLM provider setup in README with links to OpenAI and Anthropic documentation
- [ ] T119 [P] Document mobile compatibility and feature differences (desktop SQLite vs mobile IndexedDB) in README
- [ ] T120 [P] Add troubleshooting section to README for common issues (API key errors, indexing failures, platform detection)
- [ ] T121 [P] Implement and validate edge case handling per spec.md lines 140-153 (API errors, rate limits, large vaults, provider switching, network failures, missing notes, conflicting info, credit limits, special characters, mobile limitations, encrypted files, query mismatches, learning degradation, delegation loops)
- [ ] T122 Optimize plugin load time by profiling and deferring heavy operations per constitution V
- [ ] T123 [P] Review and minimize console logging (errors only) per constitution IV
- [ ] T124 [P] Audit all dependencies for security risks per constitution II
- [ ] T125 [P] Validate all file paths use normalizePath() per constitution I
- [ ] T126 [P] Verify no innerHTML usage with user input per constitution II
- [ ] T127 [P] Verify all DOM creation uses Preact components or Obsidian helpers (createEl, createDiv, createSpan) per constitution II
- [ ] T128 [P] Verify all network requests use requestUrl() instead of fetch per constitution II
- [ ] T129 Test plugin on iOS and Android devices or simulators per constitution III
- [ ] T130 [P] Verify bundle size is minimized for releases per constitution V (target: <50KB for chat UI)
- [ ] T131 [P] Review all UI text for sentence case per constitution VI
- [ ] T132 [P] Ensure settings headings use setHeading() per constitution VI
- [ ] T133 [P] Verify CSS uses Obsidian variables, not hardcoded styles per constitution VI
- [ ] T134 [P] Verify no default hotkeys are set for commands per constitution VI
- [ ] T135 Implement proper resource cleanup in main.ts onunload() for all event listeners, intervals, and DOM elements per constitution I
- [ ] T136 Create versions.json mapping plugin versions to minimum Obsidian versions
- [ ] T137 [P] Update manifest.json with final version, description, and author information per constitution submission requirements
- [ ] T138 [P] Verify manifest.json description is ≤250 characters, action-oriented, sentence case, ends with period

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5 → P6 → P7)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Builds on US1 but independently testable
- **User Story 4 (P4)**: Requires US1 and US3 complete (needs multiple agents to route between) - Also benefits from US2 for tool availability scoring
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 6 (P6)**: Enhances US1 security - can be implemented alongside or after US1
- **User Story 7 (P7)**: Requires US1 complete (wraps agent responses)

### Within Each User Story

- Tasks marked [P] can run in parallel within the same story
- Security components (T021-T022) should complete before providers (T023-T026)
- Preact setup (T030) should complete before component creation (T031-T034)
- Provider system must complete before chat interface can function
- RAG components can be built in parallel, then integrated with existing chat
- MCP tools can be built in parallel, then integrated with agent system

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T008, T010)
- All Foundational type definitions marked [P] can run in parallel (T011-T017)
- Within US1: Security (T021-T022), Providers (T024-T026), Backend agents (T028-T029), Preact components (T031-T034) can all be built in parallel
- Within US2: All backend implementations (T047-T049), Embeddings (T050) can be built in parallel
- Within US4: Skill tag additions (T071-T072), Orchestrator core (T073-T076), UI component (T077) can be built in parallel
- Within US5: All tool implementations (T091-T093), AuditLog (T094), Modal (T095) can be built in parallel
- Within US7: PersonaPrompts (T110) and UI (T113-T114) can be built in parallel
- All Polish documentation tasks (T116-T120) can run in parallel
- All Polish validation tasks (T123-T134, T137-T138) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch security components together:
Task T021: "Implement EncryptionService in src/security/EncryptionService.ts"
Task T022: "Implement KeyManager in src/security/KeyManager.ts"

# Launch provider implementations together:
Task T024: "Implement OpenAIProvider in src/providers/OpenAIProvider.ts"
Task T025: "Implement AnthropicProvider in src/providers/AnthropicProvider.ts"
Task T026: "Implement LocalProvider in src/providers/LocalProvider.ts"

# Launch agent and Preact setup together:
Task T028: "Create BackendAgents.ts with 10+ backend agents"
Task T029: "Implement AgentManager in src/agents/AgentManager.ts"
Task T030: "Setup Preact build integration in esbuild.config.mjs"

# Launch Preact component creation together (after T030):
Task T031: "Create ChatBubble.tsx component"
Task T032: "Create AgentSelector.tsx component"
Task T033: "Create ConversationList.tsx component"
Task T034: "Create CompressionIndicator.tsx component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo basic chat functionality with backend agents, Preact UI, conversation management

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (RAG capability + conversation memory)
4. Add User Story 3 → Test independently → Deploy/Demo (Custom agents)
5. Add User Story 4 → Test independently → Deploy/Demo (Smart routing with real-time preview)
6. Add User Story 5 → Test independently → Deploy/Demo (Vault operations)
7. Add User Story 6 → Test independently → Deploy/Demo (Enhanced security)
8. Add User Story 7 → Test independently → Deploy/Demo (Persona layer)
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (P1) - Chat foundation with Preact UI
   - Developer B: User Story 2 (P2) - RAG system with platform detection
   - Developer C: User Story 3 (P3) - Custom agents
3. After P1-P3 complete:
   - Developer A: User Story 4 (P4) - Orchestrator with real-time preview
   - Developer B: User Story 5 (P5) - MCP tools
   - Developer C: User Story 6 (P6) - Security enhancements
4. Final polish by entire team

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution compliance is verified in Phase 10 Polish tasks
- Mobile compatibility achieved through dual-backend RAG and platform detection
- Security is built into US1 foundation with enhancement in US6
- All Obsidian API usage must follow constitution requirements (Vault API, normalizePath, registerEvent, etc.)
- Preact components styled with Obsidian CSS variables for automatic theme compatibility
- Real-time orchestrator uses debouncing and caching for optimal performance

---

## Summary

**Total Tasks**: 138
**MVP Tasks (Setup + Foundational + US1)**: 45 tasks
**Full Feature Set**: All 138 tasks across 7 user stories

**Task Breakdown by Story**:
- Setup: 10 tasks
- Foundational: 10 tasks
- User Story 1 (Chat): 25 tasks (includes Preact UI, conversation management, compression)
- User Story 2 (RAG): 16 tasks (includes platform detection, conversation memory)
- User Story 3 (Custom Agents): 9 tasks
- User Story 4 (Routing): 19 tasks (includes real-time preview UI)
- User Story 5 (MCP): 13 tasks
- User Story 6 (Security): 7 tasks
- User Story 7 (Persona): 6 tasks
- Polish: 23 tasks (includes edge case handling)

**Parallel Opportunities**: 60+ tasks marked [P] can run in parallel with their peers

**Recommended MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 45 tasks

**Constitution Alignment**: All tasks designed to comply with constitution requirements, validated in Phase 10

**New Features Incorporated**:
- Preact UI framework with component-based architecture
- Platform detection for automatic RAG backend selection (SQLite/IndexedDB/JSON)
- Conversation list with 30-day auto-archiving
- RAG-based conversation memory indexing
- Context compression with indicator and automatic summarization
- Real-time orchestrator preview with debouncing
- Click-to-lock agent suggestions
- Master password-protected API key encryption