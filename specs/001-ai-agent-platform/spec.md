pec Feature Specification: AI Agent Platform for Obsidian

**Feature Branch**: `001-ai-agent-platform`
**Created**: 2025-11-13
**Status**: Draft
**Input**: User description: "Create a spec that is compliant with the constitution and is in line with the objectives defined in the README.md."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic AI Chat with Pre-configured Agents (Priority: P1)

A user wants to interact with specialized AI agents directly within their Obsidian vault to get help with different types of tasks without leaving their note-taking environment.

**Why this priority**: This is the MVP - it delivers immediate value by enabling users to chat with AI without any complex setup. Users can start benefiting from the plugin with just an API key configuration.

**Independent Test**: Can be fully tested by configuring an LLM provider API key, opening the chat interface, selecting a pre-configured agent (e.g., "General Assistant"), and receiving relevant responses. Delivers standalone value without RAG or MCP features.

**Acceptance Scenarios**:

1. **Given** the plugin is installed and enabled, **When** the user opens Settings → AI Agent Platform → Providers, **Then** they can add an LLM provider (OpenAI, Anthropic, or local) with API credentials
2. **Given** at least one LLM provider is configured, **When** the user runs "AI Chat: Open Chat" from the command palette, **Then** a chat interface opens with a list of available agents
3. **Given** the chat interface is open, **When** the user selects an agent and sends a message, **Then** the agent responds appropriately based on its specialized system prompt
4. **Given** multiple backend agents exist, **When** the user views the agent list, **Then** they see at least 10 pre-configured expert agents (cannot be deleted)
5. **Given** a conversation is in progress, **When** the user sends follow-up messages, **Then** the conversation context is maintained across messages

---

### User Story 2 - Semantic Search (RAG) Integration (Priority: P2)

A user wants their AI agents to have access to knowledge from their vault so that responses incorporate their personal notes, research, and accumulated knowledge.

**Why this priority**: RAG transforms the plugin from a generic chatbot into a personalized knowledge assistant. This is the key differentiator that makes it vault-aware.

**Independent Test**: Can be tested independently by indexing a vault with known content, asking an agent a question whose answer exists in the notes, and verifying the agent retrieves and uses that content in its response. Works standalone even if MCP tools aren't enabled.

**Acceptance Scenarios**:

1. **Given** the user has configured a RAG backend, **When** they click "Start Indexing" in Settings → RAG, **Then** the system indexes all markdown files in the vault with progress indication
2. **Given** the vault is indexed, **When** the user asks an agent a question related to note content, **Then** the agent retrieves relevant note excerpts and incorporates them into the response
3. **Given** RAG is enabled for an agent, **When** the user chats with that agent, **Then** responses include references or citations to the source notes used
4. **Given** the vault content changes, **When** files are created, modified, or deleted, **Then** the index updates to reflect the changes
5. **Given** the user has folder/tag filters configured, **When** RAG performs retrieval, **Then** only notes matching the filters are considered

---

### User Story 3 - Custom Agent Creation (Priority: P3)

A user wants to create their own specialized AI agents with custom system prompts, specific LLM providers, and tailored RAG configurations for their unique workflows.

**Why this priority**: Enables power users to customize the platform for their specific needs. Builds on P1 foundation but isn't required for core value delivery.

**Independent Test**: Can be tested by creating a new custom agent with a specific system prompt, selecting an LLM provider, configuring RAG settings, and verifying the agent behaves according to the custom configuration. Works independently of other stories.

**Acceptance Scenarios**:

1. **Given** the user is in Settings → Agents, **When** they click "Create Custom Agent", **Then** a form appears to define name, description, and system prompt
2. **Given** the user is creating a custom agent, **When** they select an LLM provider and model, **Then** that specific model is used for this agent's responses
3. **Given** the user is configuring a custom agent, **When** they enable RAG with specific settings (top-K, threshold, metadata filters), **Then** these settings apply only to this agent
4. **Given** custom agents exist, **When** the user opens the chat interface, **Then** custom agents appear alongside backend agents in the agent list
5. **Given** a custom agent exists, **When** the user modifies or deletes it, **Then** the changes take effect immediately (backend agents cannot be deleted)

---

### User Story 4 - Intelligent Agent Routing (Priority: P4)

A user wants the system to automatically suggest the most appropriate agent for their query so they don't have to manually choose every time.

**Why this priority**: Improves user experience by reducing cognitive load, but requires the foundation of multiple agents (P1, P3) to be valuable.

**Independent Test**: Can be tested by enabling the orchestrator, sending various types of queries, and verifying the system suggests appropriate agents with confidence scores while still allowing manual override.

**Acceptance Scenarios**:

1. **Given** the orchestrator is enabled, **When** the user types a query without selecting an agent, **Then** the system matches query intent to agent skill tags and suggests the most relevant agent with a confidence score
2. **Given** an agent suggestion is made, **When** the user accepts the suggestion, **Then** the query is routed to that agent and the routing success is recorded
3. **Given** an agent suggestion is made, **When** the user manually selects a different agent, **Then** the manually selected agent handles the query and the override is tracked as a failed routing
4. **Given** multiple agents could handle a query, **When** the orchestrator analyzes it, **Then** it ranks agents by skill-to-query match and tool availability, showing top 3 suggestions
5. **Given** the user has a conversation history, **When** they send a new query, **Then** the orchestrator considers conversation context in its routing decision
6. **Given** an agent has low routing success over time, **When** the orchestrator evaluates it for future queries, **Then** its confidence scores are automatically adjusted downward based on performance metrics

---

### User Story 5 - MCP Tools for Vault Operations (Priority: P5)

A user wants AI agents to be able to read, search, and (with permission) modify notes in their vault to automate knowledge management tasks.

**Why this priority**: Powerful automation capability, but requires careful security implementation. Builds on P1-P2 foundation and is higher risk, so deprioritized to ensure core features work well first.

**Independent Test**: Can be tested by enabling MCP tools, granting permissions to an agent, asking it to perform vault operations (search notes, read specific notes, update frontmatter), and verifying operations execute correctly with appropriate confirmations.

**Acceptance Scenarios**:

1. **Given** MCP is enabled in settings, **When** an agent is configured with read tools, **Then** the agent can retrieve note content when asked
2. **Given** MCP write tools are enabled, **When** an agent attempts to create or modify a note, **Then** the user receives a confirmation prompt before the action executes
3. **Given** an agent has search tools, **When** asked to find related notes, **Then** the agent can search by keywords, tags, or backlinks
4. **Given** an agent has metadata tools, **When** asked to update note properties, **Then** frontmatter can be modified with user confirmation
5. **Given** MCP audit logging is enabled, **When** any tool executes, **Then** the operation is logged with timestamp, agent, and action details
6. **Given** read-only mode is enabled, **When** an agent attempts a write operation, **Then** the operation is blocked and the user is informed

---

### User Story 6 - API Key Security Management (Priority: P6)

A user wants their API keys to be stored securely with encryption so that sensitive credentials aren't exposed in plain text configuration files.

**Why this priority**: Security is critical but can be implemented alongside P1. Positioned here to emphasize it must be completed before public release, though it's foundational.

**Independent Test**: Can be tested by adding an API key, verifying it's encrypted in storage, setting a master password, confirming the key can be decrypted for use, and testing that keys aren't accessible without the password.

**Acceptance Scenarios**:

1. **Given** the user adds a new API key, **When** they provide the key and set a master password, **Then** the key is encrypted with AES-256 before storage
2. **Given** encrypted keys exist, **When** the plugin loads, **Then** the user is prompted for their master password to decrypt keys
3. **Given** the master password is entered, **When** keys are needed for API calls, **Then** they are decrypted in memory and never written to disk in plain text
4. **Given** the user forgets their master password, **When** they attempt to access providers, **Then** they must re-enter all API keys with a new password
5. **Given** keys are stored, **When** examining vault configuration files, **Then** only encrypted ciphertext is visible, not plain text keys

---

### User Story 7 - Mnemosyne Persona (Optional Enhancement) (Priority: P7)

A user wants to optionally enable a personality layer that adds timeless wisdom and goddess-of-memory theming to agent responses for a more engaging experience.

**Why this priority**: This is a creative enhancement that differentiates the plugin but isn't core functionality. Should be implemented after all fundamental features work.

**Independent Test**: Can be tested by enabling the Mnemosyne persona with a chosen intensity level, chatting with any agent, and verifying responses include appropriate persona elements (subtle, moderate, or strong) while still answering the user's questions accurately.

**Acceptance Scenarios**:

1. **Given** the user is in Settings → Persona, **When** they toggle "Enable Mnemosyne Persona", **Then** all agent responses incorporate the persona layer
2. **Given** the persona is enabled, **When** the user selects "Subtle" intensity, **Then** responses include light references to memory and wisdom
3. **Given** the persona is enabled, **When** the user selects "Moderate" intensity, **Then** responses have a balanced divine presence with timeless perspective
4. **Given** the persona is enabled, **When** the user selects "Strong" intensity, **Then** responses fully embody the goddess persona with extensive thematic language
5. **Given** the persona is enabled, **When** the user disables it, **Then** all agents immediately return to standard response style without persona elements

---

### Edge Cases

- What happens when a user's API key is invalid or rate-limited during a conversation?
- How does the system handle extremely large vaults (10,000+ notes) during RAG indexing?
- What happens when a user switches LLM providers mid-conversation?
- How does the system handle network failures during agent responses?
- What happens when MCP operations are requested on notes that don't exist or were deleted?
- How does RAG handle notes with duplicate or conflicting information?
- What happens when the user runs out of API credits during a conversation?
- How does the system handle special characters, code blocks, and markdown formatting in agent responses?
- What happens when multiple agents are configured to use the same LLM provider but different models?
- How does the plugin behave on mobile vs desktop when Node.js APIs are unavailable?
- What happens when a user tries to index encrypted or binary files?
- How does the orchestrator handle queries that don't match any agent's expertise?
- How does adaptive learning prevent degradation when an agent's low performance is due to ambiguous queries rather than poor capability matching?
- What happens when the orchestrator delegation depth limit is reached? How is the user informed and what fallback behavior occurs?

## Requirements *(mandatory)*

### Functional Requirements

**LLM Provider Management**

- **FR-001**: System MUST support multiple LLM provider types (OpenAI, Anthropic, local LLMs)
- **FR-002**: System MUST allow users to add, edit, and remove LLM provider configurations
- **FR-003**: System MUST validate API keys by testing connectivity before saving provider configurations
- **FR-004**: System MUST display clear error messages when API calls fail (invalid keys, rate limits, network errors)
- **FR-005**: System MUST allow users to configure multiple providers simultaneously and switch between them per agent

**Agent System**

- **FR-006**: System MUST include at least 10 pre-configured backend agents with specialized expertise
- **FR-007**: System MUST prevent users from deleting or modifying backend agents
- **FR-008**: System MUST allow users to create unlimited custom agents with user-defined system prompts
- **FR-009**: System MUST allow each agent to be configured with a specific LLM provider and model
- **FR-010**: System MUST display agent name, description, and capabilities in the agent selection interface
- **FR-011**: System MUST maintain separate conversation contexts for each agent

**Chat Interface**

- **FR-012**: System MUST provide a chat interface accessible via command palette
- **FR-013**: System MUST display conversation history with clear visual distinction between user messages and agent responses
- **FR-014**: System MUST support markdown rendering in agent responses (code blocks, lists, formatting)
- **FR-015**: System MUST allow users to select an agent before or during a conversation
- **FR-016**: System MUST indicate when an agent is processing (loading/thinking state)
- **FR-017**: System MUST allow users to start new conversations and switch between existing conversations
- **FR-018**: System MUST preserve conversation history between plugin sessions

**RAG (Retrieval Augmented Generation)**

- **FR-019**: System MUST support two RAG backend types: JSON (simple) and SQLite (performance)
- **FR-020**: System MUST index all markdown files in the vault when RAG indexing is initiated
- **FR-021**: System MUST show indexing progress (percentage complete, files processed)
- **FR-022**: System MUST allow users to configure which folders to include/exclude from indexing
- **FR-023**: System MUST update the index automatically when vault files are created, modified, or deleted
- **FR-024**: System MUST retrieve semantically relevant note excerpts when agents need context
- **FR-025**: System MUST allow per-agent RAG configuration (enable/disable, top-K results, relevance threshold)
- **FR-026**: System MUST support metadata filtering (folder restrictions, tag filtering) for RAG queries
- **FR-027**: System MUST support both semantic search (embeddings) and keyword search (hybrid approach)

**MCP (Model Context Protocol) Tools**

- **FR-028**: System MUST provide read tools (access note content, read specific notes)
- **FR-029**: System MUST provide write tools (create notes, update notes, modify frontmatter)
- **FR-030**: System MUST provide search tools (find by keywords, tags, backlinks)
- **FR-031**: System MUST require user confirmation before executing any write operation
- **FR-032**: System MUST support read-only mode where write operations are disabled
- **FR-033**: System MUST maintain an audit log of all tool executions with timestamp, agent, and action
- **FR-034**: System MUST allow users to configure which tools are available per agent
- **FR-035**: System MUST respect folder restrictions when tools access vault content

**Orchestrator (Agent Routing)**

- **FR-036**: System MUST analyze user queries to determine intent and match to agent capabilities based on declared skill tags
- **FR-037**: System MUST provide agent recommendations with confidence scores
- **FR-038**: System MUST allow users to override orchestrator suggestions and manually select agents
- **FR-039**: System MUST consider conversation context when routing follow-up queries
- **FR-040**: System MUST rank multiple matching agents by relevance based on skill-to-query matching
- **FR-061**: System MUST allow agents (both backend and custom) to declare skill tags that describe their capabilities
- **FR-062**: System MUST match tool availability (MCP tools, RAG scope) with agent skill declarations during routing
- **FR-063**: System MUST track routing success metrics (user accepts suggestion vs manual override) per agent
- **FR-064**: System MUST adapt agent confidence scores based on historical routing performance over time
- **FR-065**: System MUST allow manual adjustment of skill taxonomy and agent-skill associations by power users
- **FR-066**: System MUST enforce a maximum delegation depth limit (configurable, default 3 hops) to prevent infinite loops
- **FR-067**: System MUST track visited agents in the current query's routing call stack
- **FR-068**: System MUST prevent re-routing to any agent already visited in the same query chain
- **FR-069**: System MUST terminate routing and return an error message when maximum delegation depth is reached
- **FR-070**: System MUST allow users to configure the maximum delegation depth in advanced orchestrator settings

**Security & Privacy**

- **FR-041**: System MUST encrypt all API keys using AES-256 encryption
- **FR-042**: System MUST require a user-provided master password for key encryption/decryption
- **FR-043**: System MUST never store API keys in plain text on disk
- **FR-044**: System MUST decrypt keys in memory only when needed for API calls
- **FR-045**: System MUST clear sensitive data from memory after use
- **FR-046**: System MUST support SubtleCrypto (Web API) for encryption to ensure mobile compatibility

**Mnemosyne Persona**

- **FR-047**: System MUST allow users to enable/disable the Mnemosyne persona independently of other features
- **FR-048**: System MUST support three intensity levels: Subtle, Moderate, Strong
- **FR-049**: System MUST apply persona modifications to all agent responses when enabled
- **FR-050**: System MUST allow users to customize persona additions beyond the default settings

**Settings & Configuration**

- **FR-051**: System MUST provide a comprehensive settings interface organized by feature area (Providers, Agents, RAG, MCP, Persona)
- **FR-052**: System MUST validate all user inputs and provide clear error messages for invalid configurations
- **FR-053**: System MUST persist all settings and restore them when Obsidian reloads
- **FR-054**: System MUST provide sensible defaults for all optional settings

**Mobile Compatibility**

- **FR-055**: System MUST work on Obsidian mobile (iOS and Android) for core chat functionality
- **FR-056**: System MUST gracefully degrade features that require desktop-only APIs with clear user notifications
- **FR-057**: System MUST gate any Node.js/Electron API usage behind platform detection checks

**Performance**

- **FR-058**: System MUST optimize plugin load time by deferring non-critical initialization
- **FR-059**: System MUST handle large vaults (10,000+ notes) without blocking the UI during indexing
- **FR-060**: System MUST implement efficient search algorithms for RAG retrieval in large vaults

### Key Entities

- **LLM Provider**: Represents a configured connection to an AI service (OpenAI, Anthropic, local). Attributes: name, type, API key (encrypted), endpoint URL, available models, rate limits.

- **Agent**: An AI assistant with specific expertise and configuration. Attributes: unique ID, name, description, system prompt, assigned LLM provider, RAG settings (enabled/disabled, top-K, threshold, filters), MCP tool permissions, agent type (backend/custom), declared skills (array of skill tags), routing performance metrics (success rate, user override rate).

- **Conversation**: A chat session between user and agent. Attributes: unique ID, agent ID, message history, creation timestamp, last updated timestamp, conversation state (active/archived).

- **Message**: A single exchange in a conversation. Attributes: sender (user/agent), content (text/markdown), timestamp, metadata (tokens used, retrieval results if RAG).

- **RAG Index**: The searchable knowledge base built from vault notes. Attributes: indexed file paths, embeddings, metadata (tags, folders, frontmatter), last updated timestamp, backend type (JSON/SQLite).

- **MCP Tool Execution**: A record of vault operations performed by agents. Attributes: tool name, agent ID, operation type (read/write/search), target path, timestamp, result (success/failure), user confirmation status.

- **Persona Configuration**: Settings for the Mnemosyne personality layer. Attributes: enabled status, intensity level (subtle/moderate/strong), custom additions, application scope.

- **Encryption Context**: Security metadata for API key management. Attributes: master password hash, key derivation parameters, encrypted key vaults per provider.

## Success Criteria *(mandatory)*

### Measurable Outcomes

**User Productivity**

- **SC-001**: Users can start their first AI conversation within 3 minutes of installing the plugin (provider config + opening chat)
- **SC-002**: Users can ask questions about their vault content and receive responses incorporating their notes within 5 seconds
- **SC-003**: 90% of RAG retrievals return at least one relevant note excerpt for queries matching vault content
- **SC-004**: Users can create and configure a custom agent in under 2 minutes

**Performance**

- **SC-005**: Plugin loads and initializes in under 1 second on startup
- **SC-006**: RAG indexing processes at least 100 notes per second on average hardware
- **SC-007**: Chat responses begin streaming within 2 seconds of sending a message (excluding LLM API latency)
- **SC-008**: The plugin adds less than 50MB to vault storage for typical RAG indexes (up to 1,000 notes)

**Reliability**

- **SC-009**: The plugin gracefully handles network failures and API errors without crashing Obsidian
- **SC-010**: 100% of write operations via MCP tools require user confirmation (zero unauthorized modifications)
- **SC-011**: Encrypted API keys remain secure and accessible across plugin reloads with correct master password

**User Experience**

- **SC-012**: Users can complete their primary workflow (ask question → get response → use answer) without leaving Obsidian
- **SC-013**: Agent responses include appropriate context from vault notes when RAG is enabled, improving answer relevance
- **SC-014**: The orchestrator suggests the correct agent on first try for 80% of specialized queries (e.g., coding questions → code agent)

**Mobile Support**

- **SC-015**: Core chat functionality (P1) works on both iOS and Android without desktop-only dependencies
- **SC-016**: Users on mobile receive clear notifications when attempting to use desktop-only features

**Security**

- **SC-017**: Zero plain-text API keys are discoverable in vault configuration files
- **SC-018**: MCP audit log captures 100% of vault-modifying operations with complete metadata

## Clarifications

### Session 2025-11-13

- Q: How should agents declare their capabilities to the orchestrator? → A: Skills-based taxonomy with tool declarations as primary method. Each agent declares skills (e.g., "code-review", "note-summarization") + available tools (MCP tools, RAG scopes). Orchestrator matches query intent to skill tags with confidence scoring. Additionally, the orchestrator should have adaptive learning capability to adjust scores and refine the taxonomy over time based on routing success/failure patterns.

- Q: How should the orchestrator prevent infinite loops or agent recursion? → A: Maximum depth limit with explicit agent exclusion. Allow up to N delegation hops (e.g., 3), track visited agents in call stack, prevent re-routing to already-visited agents in same query chain. This allows multi-agent orchestration while providing hard safety boundaries against pathological loops.

### Assumptions

- Users have API keys for at least one supported LLM provider (OpenAI, Anthropic) or access to a local LLM endpoint
- Users understand basic Obsidian concepts (vault, notes, folders, tags, frontmatter)
- The vault is primarily composed of markdown files (binary files will be ignored during RAG indexing)
- Users will set a memorable master password for API key encryption (no password recovery mechanism)
- Network connectivity is available for cloud LLM providers (local LLMs work offline)
- Users grant necessary permissions for the plugin to read vault files and create/modify notes (with MCP)
- Standard industry expectations for LLM response quality apply (hallucinations, factual accuracy are LLM-dependent)
- Default RAG configuration will use OpenAI embeddings if available, falling back to keyword search otherwise
- The plugin will follow semantic versioning for releases and maintain backwards compatibility for settings
- Mobile device storage and performance may limit RAG index size and indexing speed compared to desktop