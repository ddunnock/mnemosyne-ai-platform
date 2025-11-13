<!--
==============================================================================
SYNC IMPACT REPORT
==============================================================================
Version Change: 0.0.0 → 1.0.0
Date: 2025-11-13

Modified Principles:
- NEW: I. Obsidian API Compliance
- NEW: II. Security & Privacy First
- NEW: III. Mobile-First Compatibility
- NEW: IV. Code Quality & Standards
- NEW: V. Performance & Resource Management
- NEW: VI. User Experience Consistency

Added Sections:
- Core Principles (6 principles specific to Obsidian plugin development)
- Technical Requirements (Obsidian-specific technical constraints)
- Submission Compliance (Official community plugin requirements)
- Governance (Amendment and compliance procedures)

Removed Sections: N/A (initial version)

Templates Requiring Updates:
✅ spec-template.md - Aligned with Obsidian plugin requirements
✅ plan-template.md - Updated constitution check section
✅ tasks-template.md - Reflects Obsidian plugin task categories
✅ commands/*.md - Generic guidance verified (no CLAUDE-specific references)

Follow-up TODOs: None - all placeholders filled
==============================================================================
-->

# Mnemosyne AI Platform for Obsidian - Constitution

## Core Principles

### I. Obsidian API Compliance

**Non-Negotiable Requirements:**

- MUST use plugin instance `this.app`, NEVER global `window.app`
- MUST use Obsidian's Vault API over Adapter API for all file operations
- MUST use `normalizePath()` for all user-defined or constructed file paths
- MUST use Editor API for active file modifications, NOT `Vault.modify()`
- MUST use `Vault.process()` for background file modifications, NOT `Vault.modify()`
- MUST use `FileManager.processFrontMatter()` for frontmatter changes
- MUST use path-specific Vault methods (`getFileByPath`, `getFolderByPath`) instead of iterating all files
- MUST clean up all resources (event listeners, intervals, DOM elements) in `onunload()`
- MUST NOT detach leaves in `onunload()`
- MUST register cleanup via `registerEvent()`, `addCommand()`, etc. when possible
- MUST avoid managing references to custom views (use `getActiveLeavesOfType()` instead)

**Rationale:** Obsidian's API provides caching, safety, and forward compatibility. Non-compliant code risks data loss, performance issues, and future breakage.

### II. Security & Privacy First

**Non-Negotiable Requirements:**

- MUST avoid `innerHTML`, `outerHTML`, and `insertAdjacentHTML` with user input
- MUST use Obsidian DOM helpers (`createEl()`, `createDiv()`, `createSpan()`) for dynamic content
- MUST use `requestUrl()` instead of `fetch` or `axios` for network requests
- MUST encrypt API keys using AES-256 with user-provided master password
- MUST disclose in README: network usage, external services, data transmission, account requirements, payments
- MUST NOT include client-side telemetry without explicit disclosure and opt-in
- MUST commit and use lock files (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`)
- MUST minimize dependencies following "less is safer" principle
- MUST audit all dependencies for security risks before inclusion
- MUST default to read-only mode for MCP tools with confirmation prompts for writes
- MUST maintain audit log of all vault-modifying operations

**Rationale:** Users trust plugins with their personal knowledge base. Security vulnerabilities (XSS, arbitrary code execution) and privacy violations are unacceptable and violate Obsidian's developer policies.

### III. Mobile-First Compatibility

**Non-Negotiable Requirements (if `isDesktopOnly: false`):**

- MUST gate Node.js/Electron APIs behind `Platform.isDesktopApp` checks
- MUST dynamically `require()` Node.js modules only when needed, never at top level
- MUST use `Platform` API instead of `process.platform`
- MUST check `instanceof FileSystemAdapter` before casting `Vault.adapter`
- MUST NOT use regex lookbehinds for iOS <16.4 compatibility (or document minimum iOS version)
- MUST test on mobile devices or simulators before release

**If Desktop-Only:**

- MUST set `isDesktopOnly: true` in `manifest.json`
- MUST document desktop-only requirement in README

**Rationale:** Obsidian mobile has different capabilities. Code that assumes desktop APIs will crash on mobile, providing terrible user experience.

### IV. Code Quality & Standards

**Non-Negotiable Requirements:**

- MUST use TypeScript with strict typing (NO `as any` without justification)
- MUST use `const` and `let`, NEVER `var`
- MUST use `async/await` over raw Promises for readability
- MUST test with `instanceof` before type casting (`TFile`, `TFolder`, `FileSystemAdapter`)
- MUST organize code into folders/modules for files beyond `main.ts`
- MUST rename placeholder names (`MyPlugin`, `MyPluginSettings`, `SampleSettingTab`)
- MUST remove all sample code from obsidian-sample-plugin template
- MUST minimize console logging (errors only; remove debug logs in production)
- MUST avoid global variables (use class/function scope)
- MUST use appropriate command callback types:
  - `callback` for unconditional commands
  - `checkCallback` for conditional commands
  - `editorCallback`/`editorCheckCallback` for editor-dependent commands

**Rationale:** High-quality, maintainable code is easier to review, debug, and extend. TypeScript's type system prevents entire classes of bugs.

### V. Performance & Resource Management

**Non-Negotiable Requirements:**

- MUST optimize plugin load time (defer non-critical initialization to `workspace.onLayoutReady()`)
- MUST minimize `main.js` bundle size for releases
- MUST import `moment` from `'obsidian'` package to avoid duplicate imports
- MUST avoid iterating all files when path-based lookups suffice
- MUST prefer efficient algorithms and data structures for large vaults
- MUST implement deferred views for Obsidian 1.7.2+ compatibility
- MUST clean up DOM elements using `el.empty()`, NOT `innerHTML = ''`

**Rationale:** Poorly performing plugins degrade Obsidian startup and runtime experience, especially in large vaults. Users will disable slow plugins.

### VI. User Experience Consistency

**Non-Negotiable Requirements:**

- MUST use sentence case for all UI text (NOT Title Case)
- MUST avoid "settings" in settings tab headings (redundant)
- MUST use `setHeading()` for setting headings, NOT `<h1>`/`<h2>` tags
- MUST use CSS classes with Obsidian CSS variables, NOT hardcoded inline styles
- MUST use `el.style.setProperty()` sparingly, preferring external CSS
- MUST follow Obsidian Style Guide for all user-facing text
- MUST NOT set default hotkeys for commands (avoids conflicts)
- MUST NOT include plugin name in command names (Obsidian adds this)
- MUST NOT use headings in settings unless multiple sections exist
- MUST provide clear, concise descriptions starting with action verbs

**Rationale:** Consistent UI makes Obsidian feel cohesive. Users expect settings to look and behave like core Obsidian features.

## Technical Requirements

### Language & Tooling

- **Language**: TypeScript (ESNext target, strict mode enabled)
- **Build System**: esbuild or Rollup configured in package.json
- **Linting**: ESLint with Obsidian plugin rules
- **Package Manager**: npm, pnpm, or yarn with committed lock file
- **Minimum Node Version**: 16+ (align with Obsidian's build requirements)

### Obsidian API Version

- **Minimum Obsidian Version**: Set `minAppVersion` in `manifest.json` to minimum required version
- **Target API**: Use latest stable Obsidian API types from `obsidian` npm package
- **Backwards Compatibility**: Test against stated minimum version

### Project Structure

```
obsidian-ai-agent-platform/
├── src/                      # Source code organized by feature
│   ├── agents/              # Agent management
│   ├── rag/                 # RAG indexing and retrieval
│   ├── mcp/                 # Model Context Protocol tools
│   ├── providers/           # LLM provider integrations
│   ├── persona/             # Mnemosyne persona system
│   ├── security/            # Encryption and API key management
│   ├── ui/                  # Settings, modals, views
│   └── main.ts              # Plugin entry point
├── tests/                    # Unit and integration tests (optional but recommended)
├── styles.css               # Plugin-specific styles
├── manifest.json            # Plugin metadata (required)
├── versions.json            # Version compatibility matrix (required)
├── README.md                # User documentation with required disclosures
├── LICENSE                  # Open source license (required)
├── package.json             # Dependencies and build scripts
├── tsconfig.json            # TypeScript configuration
└── .gitignore               # Exclude node_modules, main.js
```

### Dependencies

- **Obsidian API**: `obsidian` package (devDependency)
- **LLM SDKs**: OpenAI, Anthropic official SDKs (if used)
- **Encryption**: SubtleCrypto (Web API, no Node.js crypto on mobile)
- **Database**: SQLite or JSON for RAG backend (must work on mobile if not desktop-only)

### Testing (Recommended but Optional)

- **Framework**: Jest or Vitest for unit tests
- **Integration**: Test against actual Obsidian vault in development environment
- **Coverage**: Focus on security-critical paths (encryption, file operations)

## Submission Compliance

### Manifest Requirements

- **`id`**: Unique identifier (kebab-case, no "obsidian" prefix)
- **`name`**: Human-friendly name (proper capitalization, no "Obsidian" unless necessary)
- **`version`**: Semantic versioning (MAJOR.MINOR.PATCH)
- **`minAppVersion`**: Minimum Obsidian version (e.g., "1.4.0")
- **`description`**: ≤250 chars, action-oriented, sentence case, ends with period
- **`author`**: Your name or GitHub username
- **`authorUrl`**: Link to your GitHub profile
- **`isDesktopOnly`**: `true` if Node.js/Electron APIs used, else `false`
- **`fundingUrl`**: ONLY for financial support services (Buy Me A Coffee, GitHub Sponsors), else omit

### README Requirements

- **Clear Feature Description**: What the plugin does
- **Installation Instructions**: From community plugins + manual installation
- **Usage Guide**: Quick start and core workflows
- **Network Disclosure**: List all external services (OpenAI, Anthropic, etc.) and why needed
- **Payment/Account Disclosure**: If required for full access
- **Data Privacy**: Explain what data leaves local vault and where it goes
- **License**: State license clearly (MIT, GPL, etc.)
- **Attribution**: Credit dependencies and libraries as required by their licenses

### Release Process

- **Versions.json**: Map plugin versions to minimum Obsidian versions
- **GitHub Releases**: Create release with `main.js`, `manifest.json`, `styles.css`
- **Changelog**: Document changes in each release
- **Tag Format**: `vX.Y.Z` (e.g., `v1.0.0`)

### Trademark Compliance

- **Do NOT** use "Obsidian" in ways that imply first-party development
- **Acceptable**: "AI Agent Platform for Obsidian" (describes compatibility)
- **Unacceptable**: "Obsidian AI Platform" (implies official product)

## Governance

### Amendment Procedure

1. **Proposal**: Document proposed changes with rationale
2. **Review**: Assess impact on existing code and templates
3. **Update**: Modify constitution with version bump:
   - **MAJOR**: Backward-incompatible changes (principle removal/redefinition)
   - **MINOR**: New principles or materially expanded guidance
   - **PATCH**: Clarifications, typos, non-semantic fixes
4. **Propagate**: Update dependent templates (spec, plan, tasks)
5. **Commit**: Record amendment with Sync Impact Report

### Compliance Review

- **Pre-Implementation**: Check plan.md against constitution principles
- **Post-Design**: Re-validate after Phase 1 design (plan.md)
- **Pre-Release**: Verify all Non-Negotiable Requirements met
- **Code Review**: All PRs must demonstrate compliance with relevant principles
- **Automated Checks**: Use ESLint rules and pre-commit hooks where possible

### Complexity Justification

If a design violates a principle or introduces complexity:

1. Document the violation in plan.md "Complexity Tracking" section
2. Explain why simpler alternatives are insufficient
3. Propose mitigation strategies
4. Require explicit approval before proceeding

### Versioning Policy

This constitution uses semantic versioning:

- **MAJOR.MINOR.PATCH** format
- Increment MAJOR for breaking governance changes
- Increment MINOR for new principles or requirements
- Increment PATCH for clarifications and corrections

### Enforcement

- **Constitution supersedes all other practices**
- **All code must conform or justify exceptions**
- **Templates must stay synchronized with constitution**
- **Non-compliance blocks release**

### Runtime Development Guidance

For agent-specific development instructions, see:
- Spec generation: `.specify/templates/commands/specify.md`
- Planning workflow: `.specify/templates/commands/plan.md`
- Task generation: `.specify/templates/commands/tasks.md`

---

**Version**: 1.0.0 | **Ratified**: 2025-11-13 | **Last Amended**: 2025-11-13