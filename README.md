# AI Agent Platform for Obsidian

Transform your Obsidian vault into an AI-powered workspace with specialized agents, semantic search, intelligent note operations, and the optional Mnemosyne persona.

## ✨ Features

### 🤖 Specialized AI Agents
- **10+ Expert Backend Agents** - Pre-configured specialists for different domains
- **Custom Agent Creation** - Build your own specialized agents
- **Intelligent Routing** - Automatic agent selection based on query intent
- **Agent Templates** - Quick-start templates for common use cases

### 🔍 Advanced Knowledge Retrieval (RAG)
- **Semantic Search** - Find notes by meaning, not just keywords
- **Multiple Backends** - JSON (simple) or SQLite (performance)
- **Hybrid Search** - Combines semantic and keyword approaches
- **Metadata Filtering** - Search by folders, tags, and frontmatter

### 🛠️ Model Context Protocol (MCP)
- **Note Operations** - Agents can read and write notes
- **Search Tools** - Find related notes and backlinks
- **Metadata Management** - Update frontmatter and tags
- **Safety First** - Read-only default with confirmation prompts

### 🎭 Mnemosyne Persona (Optional)
- **Toggle On/Off** - Enable the goddess of memory persona
- **Intensity Levels** - Choose from subtle, moderate, or strong presence
- **Contextual Wisdom** - Responses infused with timeless perspective
- **Configurable** - Adjust to your preference

### 🔐 Security & Privacy
- **Encrypted API Keys** - AES-256 encryption with master password
- **Local-First** - All data stays in your vault
- **No Telemetry** - Your data is private
- **Open Source** - Audit the code yourself

### 🌐 Multi-Provider Support
- **OpenAI** - GPT-4, GPT-3.5 Turbo
- **Anthropic** - Claude 3 models
- **Local LLMs** - Ollama, LM Studio
- **Custom Endpoints** - Bring your own API

## 🚀 Installation

### From Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings
2. Navigate to Community Plugins
3. Search for "AI Agent Platform"
4. Click Install, then Enable

### Manual Installation
1. Download the latest release from GitHub
2. Extract files to `.obsidian/plugins/ai-agent-platform/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

## 📖 Quick Start

### 1. Configure Your First LLM Provider

1. Open Settings → AI Agent Platform → Providers
2. Click "Add Provider"
3. Choose your provider (OpenAI, Anthropic, etc.)
4. Enter your API key
5. Test the connection

### 2. Try Your First Agent

1. Open the Command Palette (Ctrl/Cmd + P)
2. Run "AI Chat: Open Chat"
3. Select an agent (try "General Assistant")
4. Start chatting!

### 3. Enable Mnemosyne Persona (Optional)

1. Open Settings → AI Agent Platform → Persona
2. Toggle "Enable Mnemosyne Persona"
3. Choose intensity level:
    - **Subtle** - Light references to memory and wisdom
    - **Moderate** - Balanced divine presence (recommended)
    - **Strong** - Full goddess persona with timeless perspective
4. Chat with any agent to experience the persona

### 4. Index Your Vault (Optional)

1. Open Settings → AI Agent Platform → RAG
2. Click "Start Indexing"
3. Wait for completion (progress shown)
4. Agents can now search your notes semantically

## 🎯 Core Concepts

### Agents
Agents are specialized AI assistants with specific expertise:
- **Backend Agents** - Pre-configured experts (cannot be deleted)
- **Custom Agents** - Your own specialized assistants
- Each agent has a system prompt that defines its behavior
- Agents can use RAG to search your vault
- Agents can use MCP tools to modify notes (with permission)

### Orchestrator
The orchestrator automatically routes your queries to the best agent:
- Analyzes your query intent
- Matches to agent capabilities
- Provides routing confidence score
- Always allows manual override

### RAG (Retrieval Augmented Generation)
RAG enhances agents with knowledge from your vault:
- Indexes all markdown files
- Creates semantic embeddings
- Retrieves relevant context
- Injects into agent prompts

### MCP (Model Context Protocol)
MCP allows agents to interact with your vault:
- **Read Tools** - Access note content
- **Write Tools** - Create/update notes (with confirmation)
- **Search Tools** - Find related notes
- **Metadata Tools** - Manage frontmatter and tags

### Mnemosyne Persona
The optional Mnemosyne persona adds a layer of personality:
- Named after the Greek goddess of memory
- Provides responses with timeless wisdom
- Adjustable intensity to match your preference
- Can be toggled on/off anytime
- Works with any agent

## 🔧 Configuration

### LLM Providers

**OpenAI**
- API Key: Required
- Models: gpt-4, gpt-3.5-turbo, etc.
- Rate Limits: Managed automatically

**Anthropic**
- API Key: Required
- Models: claude-3-opus, claude-3-sonnet, etc.
- Context: Up to 200K tokens

**Local LLMs**
- Endpoint: http://localhost:11434 (Ollama)
- No API key needed
- Privacy: Fully offline

### Agent Configuration

Each agent can be configured with:
- **Name & Description** - For identification
- **System Prompt** - Defines behavior and expertise
- **LLM Provider** - Which model to use
- **RAG Settings** - Enable/disable, top-K, threshold
- **MCP Tools** - Which tools are allowed
- **Metadata Filters** - Restrict to folders/tags

### RAG Settings

- **Backend** - JSON (simple) or SQLite (fast)
- **Embedding Provider** - OpenAI or local
- **Indexed Folders** - Which folders to include
- **Excluded Patterns** - What to skip

### MCP Settings

- **Enabled** - Turn on/off tool usage
- **Default Read-Only** - Safer mode
- **Allowed Tools** - Whitelist specific tools
- **Require Confirmation** - Prompt before writes
- **Audit Log** - Track all tool executions

### Persona Settings

- **Enable Persona** - Toggle Mnemosyne on/off
- **Intensity** - Choose subtle, moderate, or strong
- **Custom Additions** - Add your own persona tweaks

## 📱 Mobile Support

Core features work on mobile:
- ✅ Chat interface
- ✅ Agent selection
- ✅ Settings management
- ✅ Mnemosyne persona
- ⚠️ RAG indexing (desktop recommended for large vaults)
- ⚠️ Some MCP tools (limited filesystem access)

## 🌐 Network Usage

This plugin connects to external services:

### Required for Operation
- **OpenAI API** (api.openai.com) - If using OpenAI provider
- **Anthropic API** (api.anthropic.com) - If using Anthropic provider

### Optional
- **Local LLM** (localhost) - For offline operation
- No other external connections

### Data Transmission
- Your prompts and vault content (when RAG is enabled) are sent to chosen LLM provider
- API keys are encrypted and stored locally
- No data is sent to plugin servers
- No telemetry or analytics

## 🔒 Security

### API Key Storage
- Encrypted with AES-256
- Master password required
- Keys never stored in plain text
- Separate encryption per key

### Vault Privacy
- All processing happens locally
- Only selected content sent to LLM APIs
- RAG embeddings stored locally
- No cloud synchronization

### MCP Safety
- Read-only mode by default
- Confirmation prompts for writes
- Audit log of all operations
- Folder restrictions available

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

## 🐛 Bug Reports & Feature Requests

Please use GitHub Issues:
- **Bug Report** - Describe the issue with reproduction steps
- **Feature Request** - Explain the use case and desired behavior
- **Question** - Ask for clarification or help

## 🙏 Acknowledgments

- Obsidian team for the excellent API
- OpenAI and Anthropic for their LLM APIs
- The Obsidian community for inspiration and feedback
- Greek mythology for inspiring the Mnemosyne persona

## 📚 Documentation

- [User Guide](docs/USER_GUIDE.md)
- [Agent Creation](docs/AGENTS.md)
- [MCP Tools](docs/MCP.md)
- [RAG Configuration](docs/RAG.md)
- [Mnemosyne Persona](docs/PERSONA.md)
- [API Reference](docs/API.md)

## 🔗 Links

- [GitHub Repository](https://github.com/yourusername/obsidian-ai-agent-platform)
- [Issue Tracker](https://github.com/yourusername/obsidian-ai-agent-platform/issues)
- [Discussions](https://github.com/yourusername/obsidian-ai-agent-platform/discussions)
- [Changelog](CHANGELOG.md)

---

**Version:** 2.0.0  
**Status:** Active Development  
**Last Updated:** November 2025

Made with ❤️ for the Obsidian community