# Mnemosyne AI Agent Platform for Obsidian

**Version:** 0.1.0 Beta
**Status:** Early Access

Transform your Obsidian vault into an AI-powered workspace with specialized agents and intelligent conversation management.

> **⚠️ Beta Notice:** This is an early access release. Core chat features are stable, but advanced features (RAG, custom agents, orchestrator) are coming in future versions. Please report issues on GitHub.

## ✨ Features (v0.1.0 Beta)

### 🤖 Specialized AI Agents
- **12 Pre-configured Backend Agents** - Expert specialists for different domains:
  - General Assistant - Versatile help for everyday tasks
  - Writing Coach - Improve your writing with expert feedback
  - Research Assistant - Deep research and analysis
  - Code Expert - Programming help and debugging
  - Creative Writer - Fiction, poetry, and creative projects
  - Technical Writer - Documentation and technical content
  - Data Analyst - Data interpretation and insights
  - Learning Tutor - Educational support and explanations
  - Project Manager - Task planning and organization
  - Brainstorming Partner - Creative ideation and problem-solving
  - Editor - Proofreading and editing assistance
  - Summarizer - Concise summaries of complex content

### 💬 Advanced Chat Interface
- **Right Sidebar View** - Dedicated chat panel in Obsidian
- **Conversation Management** - Create, switch, archive conversations
- **Context Compression** - Automatic conversation summarization when approaching context limits
- **Markdown Support** - Rich formatting in messages (code blocks, lists, etc.)
- **Persistent History** - Conversations saved between sessions
- **Auto-archiving** - Inactive conversations (30+ days) automatically archived
- **Visual Indicators** - Clear distinction between user and agent messages
- **Token Tracking** - Monitor context usage and compression status

### 🌐 Multi-Provider Support
- **OpenAI** - GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku
- **Local LLMs** - Ollama, LM Studio, or any OpenAI-compatible endpoint
- **Multiple Providers** - Configure several providers, use different ones per agent

### 🔐 Security & Privacy
- **Encrypted API Keys** - AES-256-GCM encryption with PBKDF2 key derivation
- **Master Password Protection** - Keys encrypted with your master password (100,000 iterations)
- **Local-First** - All data stays in your vault
- **No Telemetry** - Your data remains private
- **Open Source** - Audit the code yourself

### 📱 Mobile Compatible
- ✅ Full chat functionality on iOS and Android
- ✅ All agent features work on mobile
- ✅ Settings management
- ✅ Conversation history syncing

## 🚀 Quick Start

### 1. Installation

#### From Obsidian Community Plugins (Coming Soon)
1. Open Obsidian Settings → Community Plugins
2. Browse and search for "Mnemosyne AI Agent Platform"
3. Click Install, then Enable

#### Manual Installation (Current Method)
1. Download the latest release from [GitHub Releases](https://github.com/yourusername/mnemosyne-ai-platform/releases)
2. Extract `main.js`, `manifest.json`, and `styles.css` to `.obsidian/plugins/mnemosyne-ai-platform/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### 2. First Time Setup

#### Step 1: Set Master Password
When you first open the plugin settings, you'll be prompted to create a master password. This password encrypts your API keys.

> **⚠️ Important:** Store this password securely! If you lose it, you'll need to re-enter all API keys.

#### Step 2: Configure Your First Provider

1. Open **Settings → Mnemosyne AI Platform → Providers**
2. Click **"Add provider"**
3. Choose your provider:
   - **OpenAI:** Get API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - **Anthropic:** Get API key from [console.anthropic.com](https://console.anthropic.com)
   - **Local LLM:** Use endpoint like `http://localhost:11434/v1` (Ollama)
4. Enter your configuration:
   - **Name:** Friendly name (e.g., "My OpenAI")
   - **API Key:** Your provider's API key (will be encrypted)
   - **Model:** Optional, defaults to provider's recommended model
5. Click **"Test"** to verify connection
6. Click **"Save"**

#### Step 3: Start Chatting

1. Open Command Palette (`Ctrl/Cmd + P`)
2. Run **"Mnemosyne: Open AI chat"**
3. Select an agent from the dropdown (try "General assistant")
4. Start chatting!

### 3. Managing Conversations

- **New Conversation:** Click "New conversation" in the conversation list
- **Switch Conversations:** Click any conversation in the list to load it
- **Archive Conversation:** Select conversation → Archive button
- **Delete Conversation:** Select conversation → Delete button (permanent!)

Conversations older than 30 days are automatically archived but remain searchable.

## 🎯 How It Works

### Agents
Each agent is a specialized AI assistant with:
- **System Prompt** - Defines expertise and behavior
- **Provider** - Which LLM model to use
- **Context** - Maintains conversation history

**Backend agents** (the 12 pre-configured ones) cannot be deleted or modified - they provide stable, reliable expertise.

### Context Compression
As conversations grow, the plugin automatically manages context:
- **Tracks tokens** - Shows how much context is used
- **Automatic summarization** - When nearing limits, old messages are summarized while preserving key information
- **Preserves important info** - User preferences, decisions, ongoing tasks are retained
- **Visual indicators** - Shows messages until compression

### Conversation Management
- **Active conversations** - Last used in past 30 days, shown in main list
- **Archived conversations** - Older than 30 days, moved to archive
- **Manual archiving** - Archive any conversation anytime
- **Persistent storage** - All conversations saved in Obsidian plugin data

## 🔧 Configuration Guide

### Provider Settings

Each provider can be configured with:
- **Name:** Display name in settings
- **Type:** OpenAI, Anthropic, or Local
- **API Key:** Encrypted with master password
- **Endpoint:** Custom URL (mainly for local LLMs)
- **Model:** Specific model to use (optional)
- **Enabled:** Toggle provider on/off

### Provider-Specific Notes

**OpenAI:**
- Default model: `gpt-4-turbo-preview`
- Supports: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- Rate limits: Managed by OpenAI (429 errors handled gracefully)
- Documentation: [platform.openai.com/docs](https://platform.openai.com/docs)

**Anthropic:**
- Default model: `claude-3-5-sonnet-20241022`
- Supports: Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku
- Context: Up to 200K tokens
- Documentation: [docs.anthropic.com](https://docs.anthropic.com)

**Local LLMs:**
- Requires OpenAI-compatible endpoint
- Works with: Ollama, LM Studio, LocalAI, etc.
- No API key needed (leave blank)
- Fully offline and private
- Example Ollama setup:
  ```bash
  ollama serve  # Start Ollama server
  # Use endpoint: http://localhost:11434/v1
  # Model: llama2, mistral, etc.
  ```

### Conversation Settings

- **Max Context Tokens:** When to trigger compression (default: varies by model)
- **Compression Strategy:** How to compress (default: summarize)
- **Archive After Days:** Auto-archive threshold (default: 30)

## 🌐 Network Usage & Privacy

### Required Network Connections

This plugin connects to external services for LLM functionality:

- **OpenAI API** (`api.openai.com`) - When using OpenAI provider
- **Anthropic API** (`api.anthropic.com`) - When using Anthropic provider
- **Local LLM** (`localhost` or custom endpoint) - When using local provider

### Data Transmission

**What is sent to LLM providers:**
- Your chat messages
- Conversation history (for context)
- Agent system prompts

**What is NOT sent:**
- Your API keys (never transmitted, stored encrypted locally)
- Other vault files or notes (not implemented in v0.1.0)
- Usage statistics or telemetry
- Personal information beyond your explicit messages

**Local Storage:**
- API keys: Encrypted with AES-256-GCM, stored in Obsidian plugin data
- Conversations: Plain text, stored in Obsidian plugin data
- Settings: Plain text, stored in Obsidian plugin data

### Privacy Considerations

- ⚠️ **Your messages are sent to your chosen LLM provider** (OpenAI, Anthropic, or local)
- ⚠️ **OpenAI and Anthropic may use data per their terms** (check their policies)
- ✅ **Local LLMs keep everything on your machine** (fully private)
- ✅ **No plugin telemetry** - We don't collect any usage data
- ✅ **Open source** - Audit the code at any time

## 📱 Mobile Support

Full feature parity on mobile devices:

**iOS & Android:**
- ✅ Chat interface
- ✅ All 12 backend agents
- ✅ Conversation management
- ✅ Provider configuration
- ✅ Settings management
- ✅ Context compression

**Tested on:**
- iOS 15+ (iPad and iPhone)
- Android 10+

## 🔒 Security

### API Key Encryption

Your API keys are protected with industry-standard encryption:

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Salt:** Unique random salt per key
- **Storage:** Only encrypted ciphertext stored, never plaintext
- **Memory:** Keys decrypted only during API calls, cleared after use (5-minute timeout)

### Master Password

- Required on first use
- Used to encrypt/decrypt all API keys
- Not stored anywhere (must be remembered)
- Can be reset (but loses all encrypted keys)

### Best Practices

1. **Use a strong master password** - At least 12 characters, mix of letters/numbers/symbols
2. **Don't share API keys** - Each user should have their own
3. **Use read-only API keys if possible** - Check your LLM provider's options
4. **Monitor usage** - Check your LLM provider's dashboard for unexpected usage
5. **Local LLMs for sensitive content** - Use Ollama for maximum privacy

## 🚧 Coming Soon (Roadmap)

### v0.2.0 - RAG Integration (Semantic Search)
- Index your vault notes
- Agents can retrieve relevant notes
- Source citations in responses
- Conversation history search via RAG

### v0.3.0 - Custom Agents
- Create your own specialized agents
- Custom system prompts
- Per-agent provider selection
- Per-agent RAG configuration

### v0.4.0 - Intelligent Orchestrator
- Real-time agent suggestions as you type
- Confidence scores
- "Auto" mode for automatic routing
- Performance-based learning

### v0.5.0 - MCP Tools (Vault Operations)
- Agents can read notes
- Agents can create/update notes (with confirmation)
- Search tools for backlinks and tags
- Frontmatter management
- Audit logging

### v0.6.0 - Enhanced Security
- Master password prompt modal
- Password reset flow
- Key rotation
- Security audit

### v1.0.0 - Mnemosyne Persona (Optional)
- Goddess of memory personality layer
- Adjustable intensity (subtle/moderate/strong)
- Toggle on/off anytime
- Custom persona additions

## 🐛 Troubleshooting

### "Invalid API key" error
- Verify key is correct at your provider's dashboard
- Check key hasn't expired or been revoked
- Try deleting and re-adding the provider
- Ensure master password is correct

### "Network error" or "Failed to fetch"
- Check internet connection
- Verify provider endpoint is correct (especially for local LLMs)
- Check firewall isn't blocking Obsidian
- For local LLMs: Ensure server is running (`ollama serve`, LM Studio started, etc.)

### "Rate limit exceeded"
- OpenAI/Anthropic enforces rate limits
- Wait a few minutes and try again
- Check your usage tier at provider's dashboard
- Consider upgrading your plan

### Conversations not saving
- Check Obsidian settings → Files & Links → "Confirm file deletion" is disabled
- Verify plugin data folder exists: `.obsidian/plugins/mnemosyne-ai-platform/`
- Try disabling and re-enabling the plugin
- Check Obsidian console for errors (Ctrl/Cmd + Shift + I)

### Context compression issues
- Normal behavior when conversations get long (50+ messages)
- Compression preserves important information
- Start a new conversation for fresh context
- Check conversation settings to adjust thresholds

### Mobile issues
- Ensure plugin is enabled on mobile device
- Check mobile settings allow plugin data sync
- Verify API keys are synced (re-enter if needed)
- Some mobile keyboards may have input quirks - try external keyboard

### Master password forgotten
- No recovery possible (encryption is secure!)
- Settings → Mnemosyne → Advanced → "Reset master password"
- ⚠️ This will clear all API keys - you'll need to re-enter them

## 🤝 Contributing

Contributions are welcome! This is an open-source project.

### How to Contribute

1. **Report bugs:** [GitHub Issues](https://github.com/yourusername/mnemosyne-ai-platform/issues)
2. **Suggest features:** [GitHub Discussions](https://github.com/yourusername/mnemosyne-ai-platform/discussions)
3. **Submit code:**
   - Fork the repository
   - Create a feature branch
   - Make your changes
   - Submit a pull request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/mnemosyne-ai-platform.git
cd mnemosyne-ai-platform

# Install dependencies
npm install

# Build the plugin
npm run build

# Watch for changes during development
npm run dev
```

### Code Standards

- TypeScript strict mode
- ESLint compliance
- Obsidian API best practices (see constitution in `/specs`)
- No hardcoded styles (use Obsidian CSS variables)
- All paths through `normalizePath()`
- Network calls through `requestUrl()`

## 📝 License

MIT License

Copyright (c) 2025 Mnemosyne AI Platform Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🙏 Acknowledgments

- **Obsidian Team** - For the excellent plugin API
- **OpenAI & Anthropic** - For their powerful LLM APIs
- **Obsidian Community** - For inspiration and feedback
- **Greek Mythology** - For the Mnemosyne inspiration (goddess of memory)
- **Contributors** - Everyone who reports issues, suggests features, or contributes code

## 🔗 Links

- **GitHub Repository:** [github.com/yourusername/mnemosyne-ai-platform](https://github.com/yourusername/mnemosyne-ai-platform)
- **Issue Tracker:** [GitHub Issues](https://github.com/yourusername/mnemosyne-ai-platform/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/mnemosyne-ai-platform/discussions)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **OpenAI API Docs:** [platform.openai.com/docs](https://platform.openai.com/docs)
- **Anthropic API Docs:** [docs.anthropic.com](https://docs.anthropic.com)

---

**Made with ❤️ for the Obsidian community**

*Transform your vault into an AI-powered knowledge workspace*
