# Testing Frameworks for Obsidian TypeScript Plugins - Research

## Executive Summary

This research evaluates testing frameworks suitable for Obsidian plugins written in TypeScript. The key finding is that **standard testing frameworks (Jest, Vitest) have fundamental constraints** when used with Obsidian plugins due to the plugin architecture's single `main.js` file limitation. Multiple strategic approaches exist, each with trade-offs between setup complexity, execution speed, and test coverage.

---

## 1. Framework Recommendations

### 1.1 PRIMARY RECOMMENDATION: Jest with jest-environment-obsidian

**Decision:** Jest + jest-environment-obsidian (Community Tool) for unit testing

**Rationale:**
- Jest-environment-obsidian is specifically designed for Obsidian plugin testing
- Actively maintained by the Obsidian community (obsidian-community organization)
- Provides pre-configured environment shimming the Obsidian module
- Jest remains the most mature testing ecosystem for Node.js/TypeScript
- Strong TypeScript support via ts-jest
- Large ecosystem of complementary tools and documentation

**When to Use:**
- Unit testing business logic and utility functions
- Testing code that can be decoupled from Obsidian API
- Fast feedback loops during development
- Majority of test suite (70-80%)

**Setup Notes:**

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-environment-obsidian',
  // Optional: customize on top of preset
};

// Alternative: Per-file configuration
/**
 * @jest-environment jest-environment-obsidian
 */
describe('My Plugin Tests', () => {
  // tests
});
```

**npm Installation:**
```bash
npm install --save-dev jest jest-environment-obsidian ts-jest @types/jest
npm install --save-dev typescript
```

**Minimum Requirements:**
- NodeJS >= 15.0.0
- Jest >= 29.0.0

**Configuration Options:**
| Option | Purpose | Default |
|--------|---------|---------|
| `conformance` | API strictness ("lax" or "strict") | "lax" |
| `version` | Obsidian API version | "1.1.16" |
| `ignoreWarnings` | Suppress specific warnings | [] |
| `missingExports` | Handle missing exports ("warning", "error", "undef") | "warning" |

**Advantages:**
- Pre-configured Obsidian API shimming
- Jest's mature ecosystem
- Good TypeScript out-of-the-box via ts-jest
- Manual mock support for complex API scenarios

**Disadvantages:**
- Jest is slower than Vitest (though acceptable for Obsidian plugin size)
- Limited to unit testing; doesn't run inside Obsidian environment
- Doesn't catch runtime integration issues

---

### 1.2 SECONDARY RECOMMENDATION: Custom Embedded Test Harness for Integration Testing

**Decision:** Custom embedded test framework for integration tests (tests running inside Obsidian)

**Rationale:**
- Standard test runners (Jest, Vitest, Mocha) fail in Obsidian because:
  - They load tests dynamically at runtime
  - Obsidian constrains plugins to single `main.js`
  - Test runner dependencies can't be resolved at runtime
- Custom frameworks embed tests at build time, avoiding these limitations
- Provides genuine validation against real Obsidian API

**When to Use:**
- Testing Vault operations, file I/O, metadata cache interactions
- Validating workspace integration
- Testing event listeners and Obsidian callbacks
- Critical user workflows (15-20% of test suite)
- CI/CD integration verification

**Available Options:**

**Option A: Custom Embedded Framework (Recommended for Full Control)**
- Reference: bcamphart/embedded-test-framework (GitHub)
- Provides minimal Test Suite interface: `describe()`, `it()`, `beforeAll()`, etc.
- Uses contract pattern: tests as reusable contracts
- Separate build entry point for integration mode

**Option B: obsidian-testing Framework**
- GitHub: MohrJonas/obsidian-testing
- Dedicated Obsidian testing library
- Lighter weight than custom solutions

**Setup Pattern for Custom Harness:**

```typescript
// src/integration/main.ts (separate entry point)
import { describe, it, beforeAll, afterEach, afterAll } from './test-framework';

describe('Vault Integration', () => {
  let app: App;

  beforeAll(() => {
    // Initialize real Obsidian app
    app = this.app;
  });

  it('should create file in vault', async () => {
    const file = await app.vault.create('test.md', '# Test');
    expect(file.name).toBe('test.md');
  });

  afterEach(() => {
    // Cleanup after each test
  });

  afterAll(() => {
    // Final cleanup
  });
});
```

**Build Configuration:**
```javascript
// esbuild config for integration mode
if (process.env.BUILD_MODE === 'integration') {
  entry: 'src/integration/main.ts'
} else {
  entry: 'src/main.ts'
}
```

**Advantages:**
- Runs actual Obsidian APIs without mocking
- Catches real integration issues
- Validates plugin behavior in actual environment

**Disadvantages:**
- More complex build setup
- Slower execution (must run in Obsidian)
- Requires separate test infrastructure
- Test code must be bundled with plugin in development

---

### 1.3 ALTERNATIVE: Obsimian (Obsidian Simulation Framework)

**Decision:** Obsimian for lightweight unit/integration hybrid testing

**Rationale:**
- Pure TypeScript library simulating Obsidian components
- Fake Obsidian components without full Obsidian installation
- Jest/Vitest compatible
- Modern alternative to full embedding

**When to Use:**
- Testing business logic with simulated Obsidian environment
- Faster feedback than embedded harness
- Testing without full Obsidian overhead
- When embedding is overkill for test scope

**Setup:**
```bash
npm install --save-dev obsimian
```

```typescript
import { createApp } from 'obsimian';

describe('Vault Operations', () => {
  let app: App;

  beforeEach(() => {
    app = createApp();
  });

  it('should read vault files', async () => {
    const files = app.vault.getMarkdownFiles();
    expect(files).toBeDefined();
  });
});
```

**Advantages:**
- Easier setup than custom harness
- Faster than actual Obsidian execution
- Works with Jest/Vitest test runners
- TypeScript support built-in

**Disadvantages:**
- Limited to simulated behavior (may diverge from real Obsidian)
- Last release: July 2021 (potential staleness)
- Smaller ecosystem than jest-environment-obsidian

---

### 1.4 NOT RECOMMENDED: Pure Vitest (Current Context)

**Status:** While Vitest is modern and fast, it has same architectural constraints as Jest for Obsidian plugins

**Future Consideration (2025+):**
- Vitest 3+ released January 2025 with improvements
- Modern ESM-first approach aligns with plugin ecosystem
- May become recommended if Obsidian plugin architecture evolves
- Consider for future migration as Obsidian plugin constraints relax

**If Using Vitest Today:**
- Same limitations as Jest (unit testing only)
- Setup mirrors Jest with ts-jest replaced by Vitest's native TypeScript support
- Would require custom embedded harness for integration testing anyway

---

## 2. Testing Strategy Framework

### 2.1 Recommended Testing Pyramid for Obsidian Plugins

```
       E2E Tests (5%)
      /             \
     Integration     Manual Testing
     Tests (20%)     (5%)
    /           \
Unit Tests (70%)
```

**Breakdown:**

| Test Type | % of Suite | Framework | Execution | Focus |
|-----------|-----------|-----------|-----------|-------|
| **Unit Tests** | 70% | Jest + jest-environment-obsidian | < 1s | Pure functions, utilities, business logic |
| **Integration Tests** | 20% | Custom Embedded Harness or Obsimian | 5-30s | Vault operations, API interactions, events |
| **Manual E2E** | 5% | Manual in Obsidian | Varies | Critical user workflows, plugin UI |
| **Contract Tests** | (subset) | Jest + Mock Strategy | < 1s | API contracts between modules |

### 2.2 Unit Testing Strategy

**Best Practices:**
- Maximize unit test coverage (70-80% of suite)
- Test business logic in isolation
- Mock all Obsidian dependencies
- Fast execution (< 1ms per test)
- Run on every commit

**Mocking Strategy for Unit Tests:**

```typescript
// jest.mock('obsidian');
import { App, Vault, MetadataCache } from 'obsidian';

// Manual mock approach
const mockVault = {
  create: jest.fn(),
  read: jest.fn(),
  getAbstractFileByPath: jest.fn(),
  on: jest.fn(),
} as unknown as Vault;

const mockApp = {
  vault: mockVault,
  metadataCache: jest.fn(),
  workspace: jest.fn(),
} as unknown as App;

describe('FileProcessor', () => {
  it('should process files from vault', () => {
    mockVault.getAbstractFileByPath.mockReturnValue({
      path: 'test.md',
      name: 'test.md',
    });

    const processor = new FileProcessor(mockApp);
    const result = processor.getFilePath('test.md');

    expect(result).toBe('test.md');
    expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith('test.md');
  });
});
```

**API Components to Mock:**
- Vault (filesystem operations)
- MetadataCache (metadata retrieval)
- Workspace (workspace state)
- App (main application instance)
- Plugin (base plugin class)
- Modal, Setting, StatusBarItem (UI components)

### 2.3 Integration Testing Strategy

**Best Practices:**
- Test component interactions with real Obsidian API
- Run in Obsidian environment (via embedded harness)
- Test event chains and callbacks
- Validate file I/O operations
- Smaller test suite (15-20%)

**Contract Pattern for Reusable Tests:**

```typescript
// contracts/fileOperationContract.ts
export function fileOperationContract(testSuite: TestSuite) {
  testSuite.describe('File Operations', () => {
    testSuite.it('creates and reads files', async () => {
      const vault = this.app.vault;
      const file = await vault.create('test.md', '# Content');
      const content = await vault.read(file);

      testSuite.expect(content).toContain('# Content');
    });
  });
}

// Run in unit tests with mocks
import { describe, it } from 'vitest';
fileOperationContract({ describe, it, expect });

// Run in integration with real API
import { Plugin } from 'obsidian';
fileOperationContract(this.testFramework);
```

### 2.4 Contract Testing Strategy

**Purpose:** Validate interface agreements between modules

**Approach:**
```typescript
// Test that mocks adhere to real API shape
describe('Mock Obsidian API Contracts', () => {
  it('Vault mock has correct methods', () => {
    const mockVault = createMockVault();

    expect(mockVault).toHaveProperty('create');
    expect(mockVault).toHaveProperty('read');
    expect(mockVault).toHaveProperty('modify');
    expect(mockVault).toHaveProperty('delete');
    expect(mockVault).toHaveProperty('getMarkdownFiles');
    expect(mockVault).toHaveProperty('on');
  });

  it('MetadataCache mock has correct event signatures', () => {
    const mockCache = createMockMetadataCache();

    expect(mockCache).toHaveProperty('on');
    expect(mockCache).toHaveProperty('getFileCache');
    expect(mockCache).toHaveProperty('getBacklinksForFile');
  });
});
```

---

## 3. Obsidian API Mocking Strategy

### 3.1 Core APIs to Mock

**Tier 1 (Essential):**
```typescript
interface MockApp {
  vault: Vault;
  workspace: Workspace;
  metadataCache: MetadataCache;
  plugins: PluginManager;
  commands: CommandManager;
}

interface MockVault {
  create(path: string, data: string): Promise<TFile>;
  read(file: TFile): Promise<string>;
  modify(file: TFile, data: string): Promise<void>;
  delete(file: TAbstractFile, force?: boolean): Promise<void>;
  getMarkdownFiles(): TFile[];
  getAbstractFileByPath(path: string): TAbstractFile | null;
  on(event: 'create' | 'modify' | 'delete', callback: Function): void;
}

interface MockMetadataCache {
  getFileCache(file: TFile): CachedMetadata | null;
  getBacklinksForFile(file: TFile): Record<string, Link[]>;
  on(event: string, callback: Function): void;
}
```

**Tier 2 (Conditional):**
- Workspace (active file, leaf management)
- Platform (device detection)
- Adapter (file system operations)

### 3.2 Mocking Best Practices

**Modular Mock Structure:**
```
src/
  __mocks__/
    obsidian.ts
    obsidian/
      App.ts
      Vault.ts
      MetadataCache.ts
      Workspace.ts
      Plugin.ts
      index.ts (exports all mocks)
  services/
    FileProcessor.ts
  __tests__/
    fileProcessor.test.ts
```

**Module Resolution:**
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-environment-obsidian',
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/src/__mocks__/obsidian.ts'
  }
};
```

**Mock Factory Pattern (Recommended):**
```typescript
// src/__mocks__/obsidian/index.ts
import { createApp } from './App';
import { createVault } from './Vault';
import { createMetadataCache } from './MetadataCache';

export function createMockApp() {
  return {
    vault: createVault(),
    metadataCache: createMetadataCache(),
    workspace: {},
    commands: {},
  };
}

export { createVault, createMetadataCache };
```

### 3.3 Complex API Mocking: MetadataCache

**Challenge:** MetadataCache includes location information (line/column/offset)

**Solution:**
```typescript
// src/__mocks__/obsidian/MetadataCache.ts
export function createMockMetadataCache() {
  const fileCache = new Map<string, CachedMetadata>();

  return {
    getFileCache: (file: TFile) => {
      return fileCache.get(file.path) || null;
    },

    getBacklinksForFile: (file: TFile) => {
      return {};
    },

    // Utility for tests to populate cache
    _setFileCache: (path: string, metadata: Partial<CachedMetadata>) => {
      fileCache.set(path, {
        headings: [],
        links: [],
        embeds: [],
        tags: [],
        sections: [],
        ...metadata
      });
    },

    on: jest.fn(),
    off: jest.fn(),
  };
}
```

---

## 4. Setup Guide: Complete Example

### 4.1 Project Structure

```
my-obsidian-plugin/
├── src/
│   ├── main.ts              # Plugin entry point
│   ├── settings.ts          # Settings UI
│   ├── services/
│   │   └── FileProcessor.ts # Business logic
│   ├── __mocks__/
│   │   └── obsidian/
│   │       ├── App.ts
│   │       ├── Vault.ts
│   │       ├── MetadataCache.ts
│   │       └── index.ts
│   └── __tests__/
│       ├── fileProcessor.unit.test.ts
│       └── vault.integration.test.ts
├── integration/
│   └── main.ts              # Integration test harness
├── jest.config.js
├── vitest.config.js         # If using Vitest
├── esbuild.config.js
├── tsconfig.json
├── manifest.json
└── package.json
```

### 4.2 Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-environment-obsidian',
  testEnvironment: 'jest-environment-obsidian',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts', // Entry point often requires manual testing
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    }
  },
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/src/__mocks__/obsidian/index.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
```

### 4.3 TypeScript Configuration

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "build/",
    "sourceMap": true,
    "target": "ES6",
    "allowJs": true,
    "noImplicitAny": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "isolatedModules": true,
    "lib": ["DOM", "ES5", "ES6", "ES7"],
    "types": ["jest", "node"]
  },
  "include": ["src/**/*.ts"]
}
```

### 4.4 package.json Scripts

```json
{
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "node esbuild.config.mjs production",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "BUILD_MODE=integration npm run build && obsidian-test",
    "lint": "eslint src/ --ext .ts,.tsx"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "latest",
    "@typescript-eslint/eslint-plugin": "latest",
    "@typescript-eslint/parser": "latest",
    "esbuild": "0.13.12",
    "jest": "^29.5.0",
    "jest-environment-obsidian": "^0.1.0",
    "ts-jest": "^29.1.0",
    "obsidian": "latest",
    "typescript": "4.7.4"
  }
}
```

### 4.5 Example Unit Test

```typescript
// src/__tests__/fileProcessor.unit.test.ts
/**
 * @jest-environment jest-environment-obsidian
 */
import { FileProcessor } from '../services/FileProcessor';
import { App, TFile } from 'obsidian';

// Mock obsidian
jest.mock('obsidian');

describe('FileProcessor', () => {
  let mockApp: jest.Mocked<App>;
  let fileProcessor: FileProcessor;

  beforeEach(() => {
    mockApp = new (App as jest.MockedClass<typeof App>)();
    mockApp.vault.getMarkdownFiles.mockReturnValue([]);
    fileProcessor = new FileProcessor(mockApp);
  });

  describe('processFiles', () => {
    it('should return empty array when vault is empty', () => {
      const result = fileProcessor.getFileCount();
      expect(result).toBe(0);
    });

    it('should process multiple files', () => {
      const mockFile = {
        path: 'test.md',
        name: 'test.md',
        extension: 'md'
      } as TFile;

      mockApp.vault.getMarkdownFiles.mockReturnValue([mockFile]);

      const result = fileProcessor.getFileCount();
      expect(result).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle vault errors gracefully', async () => {
      mockApp.vault.read.mockRejectedValue(new Error('Vault error'));

      const result = await fileProcessor.readFile(
        { path: 'test.md' } as TFile
      );

      expect(result).toBeNull();
    });
  });
});
```

### 4.6 Example Integration Test (Embedded Harness)

```typescript
// integration/main.ts
import { Plugin } from 'obsidian';
import { describe, it, beforeAll, afterEach } from './test-framework';

const plugin = this; // Plugin instance passed by Obsidian

describe('Vault Integration', () => {
  let testFile: TFile;

  beforeAll(async () => {
    console.log('Starting integration tests');
  });

  it('creates files in vault', async () => {
    testFile = await plugin.app.vault.create('integration-test.md', '# Test');
    expect(testFile.name).toBe('integration-test.md');
  });

  it('reads file content', async () => {
    const content = await plugin.app.vault.read(testFile);
    expect(content).toContain('# Test');
  });

  it('updates files', async () => {
    await plugin.app.vault.modify(testFile, '# Updated');
    const content = await plugin.app.vault.read(testFile);
    expect(content).toBe('# Updated');
  });

  afterEach(async () => {
    if (testFile) {
      await plugin.app.vault.delete(testFile);
    }
  });
});
```

---

## 5. Alternatives Considered

### 5.1 Rejected: Pure Mocha + Chai

**Why Not:**
- Same architectural constraints as Jest/Vitest
- Smaller Obsidian ecosystem support
- No jest-environment-obsidian equivalent

### 5.2 Rejected: Playwright/Cypress

**Why Not:**
- Designed for browser E2E testing
- Overkill for plugin testing
- Difficult to automate Obsidian's Electron app
- wdio-obsidian-service exists but requires complex setup

### 5.3 Considered but Not Primary: ts-jest Standalone

**Status:**
- Viable but requires manual mocking of entire Obsidian module
- jest-environment-obsidian superior as it includes pre-built shimming
- Only choose ts-jest if need fine-grained control over transforms

### 5.4 Considered: React Testing Library (if UI heavy)

**When Applicable:**
- For testing modal/setting UI components
- Use alongside Jest + jest-environment-obsidian
- Test UI logic in isolation before Obsidian integration

---

## 6. Common Plugin Mocking Examples

### 6.1 mocking Example 1: Dependency Injection Pattern

**Better than jest.mock() for complex scenarios:**

```typescript
// src/services/FileProcessor.ts
export class FileProcessor {
  constructor(private app: App, private vault: Vault = app.vault) {}

  async process() {
    return this.vault.getMarkdownFiles();
  }
}

// Test with mock injected
import { FileProcessor } from '../services/FileProcessor';

describe('FileProcessor with DI', () => {
  it('processes vault files', () => {
    const mockVault = {
      getMarkdownFiles: jest.fn().mockReturnValue([])
    };

    const processor = new FileProcessor(
      mockApp,
      mockVault as any
    );
    const result = processor.process();

    expect(mockVault.getMarkdownFiles).toHaveBeenCalled();
  });
});
```

### 6.2 Example 2: MetadataCache Testing

```typescript
describe('MetadataCache Integration', () => {
  it('retrieves backlinks for file', () => {
    const mockFile: TFile = {
      path: 'note.md',
      name: 'note.md',
      extension: 'md'
    } as TFile;

    const mockMetadata: CachedMetadata = {
      headings: [
        { heading: 'Title', level: 1, position: { start: { line: 0, col: 0, offset: 0 }, end: { line: 0, col: 7, offset: 7 } } }
      ],
      links: [
        { link: 'other.md', position: { start: { line: 1, col: 1, offset: 9 }, end: { line: 1, col: 20, offset: 28 } } }
      ]
    };

    mockApp.metadataCache.getFileCache.mockReturnValue(mockMetadata);

    const cache = mockApp.metadataCache.getFileCache(mockFile);
    expect(cache?.headings).toHaveLength(1);
    expect(cache?.links).toHaveLength(1);
  });
});
```

---

## 7. Best Practices from Community Plugins

### 7.1 Code Organization

Recommended by obsidian-full-calendar and other established plugins:

```
src/
  domain/           # Pure business logic (no Obsidian imports)
    models/
    services/
  infrastructure/   # Obsidian-dependent code
    vault/
    workspace/
  ui/               # UI components
    modals/
    settings/
  __tests__/
    domain/         # 70% of tests here
    integration/    # 20% of tests here
  main.ts           # Minimal plugin class
```

**Benefit:** Maximizes testability by separating Obsidian concerns

### 7.2 Plugin Class Pattern

Keep plugin class thin, delegate to services:

```typescript
// BAD: Hard to test
export default class MyPlugin extends Plugin {
  async onload() {
    const files = this.app.vault.getMarkdownFiles();
    this.processAllFiles(files);
  }
}

// GOOD: Testable
export default class MyPlugin extends Plugin {
  private processor: FileProcessor;

  async onload() {
    this.processor = new FileProcessor(this.app);
    await this.processor.processAllFiles();
  }
}

// Easy to test in isolation
describe('FileProcessor', () => {
  it('processes files', () => {
    const processor = new FileProcessor(mockApp);
    // Test without plugin ceremony
  });
});
```

### 7.3 Event Testing Pattern

```typescript
describe('Event Handlers', () => {
  it('handles file create events', () => {
    const callback = jest.fn();

    mockApp.vault.on('create', callback);

    // Trigger event
    mockApp.vault.emit('create', mockFile);

    expect(callback).toHaveBeenCalledWith(mockFile);
  });
});
```

---

## 8. Implementation Roadmap

### Phase 1: Setup Unit Testing (Weeks 1-2)
1. Install jest-environment-obsidian and dependencies
2. Create Jest configuration
3. Create mock directory structure
4. Write 3-5 example unit tests
5. Set up CI/CD to run tests

### Phase 2: Expand Unit Test Coverage (Weeks 3-4)
1. Identify untestable code patterns
2. Refactor business logic for testability
3. Achieve 70%+ code coverage
4. Establish code review standards

### Phase 3: Add Integration Testing (Weeks 5-6)
1. Set up embedded test harness
2. Write contract tests
3. Validate Vault, MetadataCache, events
4. Document integration test patterns

### Phase 4: CI/CD Integration (Week 7)
1. Configure GitHub Actions/GitLab CI
2. Run tests on PR
3. Generate coverage reports
4. Enforce coverage thresholds

---

## 9. Resource Links

**Official Tools:**
- jest-environment-obsidian: https://github.com/obsidian-community/jest-environment-obsidian
- Obsidian Plugin Docs: https://docs.obsidian.md/
- Obsidian Sample Plugin: https://github.com/obsidianmd/obsidian-sample-plugin

**Community Resources:**
- Integration Testing Pattern: https://dev.to/bcamphart/integration-testing-in-obsidian-1gm5
- Embedded Test Framework: https://github.com/b-camphart/embedded-test-framework
- Obsimian: https://github.com/motif-software/obsimian
- Obsidian Testing Framework: https://github.com/MohrJonas/obsidian-testing
- Mocking API Guide: https://devinhedge.com/2024/08/27/creating-modular-mocks-for-the-obsidian-api-in-jest/

**Learning Resources:**
- Obsidian Hub Testing Guides: https://publish.obsidian.md/hub
- Kent C. Dodds Testing Guide: https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests
- Jest Documentation: https://jestjs.io/docs/getting-started
- TypeScript Testing: https://www.typescriptlang.org/docs/handbook/testing.html

---

## 10. Conclusion

For mnemosyne-ai-platform's Obsidian plugin:

1. **Primary Strategy:** Jest + jest-environment-obsidian for unit testing
2. **Supplementary:** Custom embedded harness for integration testing
3. **Architecture:** Dependency injection pattern to maximize testability
4. **Coverage:** Target 70% unit tests, 20% integration tests, 10% manual E2E
5. **Timeline:** 7-8 weeks to full testing infrastructure

This balanced approach provides fast feedback loops during development (unit tests) while maintaining confidence in Obsidian API interactions (integration tests) without over-engineering the solution.

---

**Last Updated:** November 13, 2025
**Research Scope:** TypeScript Testing for Obsidian Plugins
**Next Review:** When Obsidian plugin architecture changes or Vitest 3+ adoption increases