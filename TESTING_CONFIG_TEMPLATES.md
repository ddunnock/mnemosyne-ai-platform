# Testing Framework Configuration Templates

## Decision Matrix: Framework Selection

### Unit Testing - Which Framework?

| Criteria | Jest + jest-environment-obsidian | Vitest | Mocha |
|----------|-----------------------------------|--------|-------|
| Obsidian-specific setup | Yes (pre-built shimming) | No (requires custom setup) | No |
| TypeScript support | Excellent (ts-jest) | Excellent (native) | Good |
| Speed | Good | Excellent | Good |
| Ecosystem size | Largest | Growing | Smaller |
| Obsidian plugins using it | Most common | Emerging | Rare |
| Recommendation for Obsidian | **PRIMARY** | Secondary | Not recommended |
| Learning curve | Moderate | Easy | Moderate |

### Integration Testing - Which Approach?

| Criteria | Custom Embedded | Obsimian | E2E (Playwright) |
|----------|-----------------|----------|-----------------|
| Runs inside Obsidian | Yes | No | Via UI automation |
| Real API testing | Yes | Simulated | Yes |
| Setup complexity | High | Low | Very High |
| Test execution speed | Slow (5-30s) | Fast (< 1s) | Very Slow (30-120s) |
| Coverage depth | Deep (real behavior) | Moderate | Complete (full app) |
| Recommended for | Core vault operations | Quick integration checks | Critical user workflows only |
| Obsidian plugin adoption | Growing | Few projects | Very few |

---

## Configuration Templates

### Template 1: jest.config.js (Standard)

```javascript
module.exports = {
  preset: 'jest-environment-obsidian',
  testEnvironment: 'jest-environment-obsidian',

  // File patterns
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.spec.ts'
  ],

  // Coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],

  // Module mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^obsidian$': '<rootDir>/src/__mocks__/obsidian/index.ts'
  },

  // Transform
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true
      }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Environment
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },

  // Performance
  maxWorkers: '50%',
  bail: 1,
  verbose: true,
};
```

### Template 2: jest.config.js (Lightweight)

```javascript
module.exports = {
  preset: 'jest-environment-obsidian',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};
```

### Template 3: tsconfig.json for Testing

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "outDir": "./build",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["jest", "node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

### Template 4: package.json Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:unit": "jest --testPathPattern='__tests__'",
    "test:integration": "npm run build:integration && obsidian-test",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.5.0",
    "jest-environment-obsidian": "^0.1.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "obsidian": "latest"
  }
}
```

---

## Mock Template: Complete Obsidian API Mock

### Directory Structure
```
src/__mocks__/obsidian/
├── App.ts
├── Vault.ts
├── MetadataCache.ts
├── Workspace.ts
├── Plugin.ts
└── index.ts
```

### Template: src/__mocks__/obsidian/index.ts

```typescript
import { App } from 'obsidian';

// Re-export all mocked types
export * from 'obsidian';

// Mock implementations
export const mockApp: Partial<App> = {
  vault: {
    create: jest.fn(),
    read: jest.fn(),
    modify: jest.fn(),
    delete: jest.fn(),
    getMarkdownFiles: jest.fn(() => []),
    getAbstractFileByPath: jest.fn(() => null),
    getFileByPath: jest.fn(() => null),
    getFolder: jest.fn(() => null),
    on: jest.fn(),
    off: jest.fn(),
    all: [],
    config: {},
    adapter: {},
  } as any,
  metadataCache: {
    getFileCache: jest.fn(() => null),
    getBacklinksForFile: jest.fn(() => ({})),
    getBacklinks: jest.fn(() => ({})),
    getLinks: jest.fn(() => ({})),
    on: jest.fn(),
    off: jest.fn(),
    trigger: jest.fn(),
  } as any,
  workspace: {
    activeLeaf: null,
    leftSplit: {},
    rightSplit: {},
    rootSplit: {},
    on: jest.fn(),
    off: jest.fn(),
    trigger: jest.fn(),
    getActiveFile: jest.fn(() => null),
    getActiveViewOfType: jest.fn(() => null),
  } as any,
  commands: {
    commands: {},
    editorCommands: {},
    addCommand: jest.fn(),
    executeCommandById: jest.fn(),
  } as any,
  plugins: {
    plugins: {},
    getPlugin: jest.fn(() => null),
    enablePluginAndSave: jest.fn(),
    disablePluginAndSave: jest.fn(),
  } as any,
};

export function createMockApp(): Partial<App> {
  return JSON.parse(JSON.stringify(mockApp));
}
```

### Template: src/__mocks__/obsidian/Vault.ts

```typescript
import { Vault, TFile, TAbstractFile, TFolder } from 'obsidian';

export const mockVault: Partial<Vault> = {
  create: jest.fn(async (path: string, data: string) => ({
    path,
    name: path.split('/').pop(),
    parent: null,
    vault: null,
    extension: path.split('.').pop(),
  } as TFile)),

  read: jest.fn(async (file: TFile) => ''),

  modify: jest.fn(async (file: TFile, data: string) => {}),

  delete: jest.fn(async (file: TAbstractFile, force?: boolean) => {}),

  getMarkdownFiles: jest.fn(() => [] as TFile[]),

  getAbstractFileByPath: jest.fn((path: string) => null as TAbstractFile | null),

  getFileByPath: jest.fn((path: string) => null as TFile | null),

  getFolder: jest.fn((path: string) => null as TFolder | null),

  on: jest.fn((event: string, callback: Function) => ''),

  off: jest.fn((event: string, callback: Function) => {}),

  adapter: {
    read: jest.fn(),
    write: jest.fn(),
    readdir: jest.fn(),
    mkdir: jest.fn(),
  } as any,
};

export function createMockVault(): Partial<Vault> {
  return JSON.parse(JSON.stringify(mockVault));
}
```

### Template: src/__mocks__/obsidian/MetadataCache.ts

```typescript
import { MetadataCache, CachedMetadata, TFile } from 'obsidian';

const fileMetadataMap = new Map<string, CachedMetadata>();

export const mockMetadataCache: Partial<MetadataCache> = {
  getFileCache: jest.fn((file: TFile) => {
    return fileMetadataMap.get(file.path) || null;
  }),

  getBacklinksForFile: jest.fn((file: TFile) => ({})),

  getBacklinks: jest.fn((path: string) => ({})),

  getLinks: jest.fn(() => ({})),

  on: jest.fn((event: string, callback: Function) => ''),

  off: jest.fn((event: string, callback: Function) => {}),

  trigger: jest.fn((event: string, ...args: any[]) => {}),

  // Test utility
  _setFileCache: jest.fn((path: string, metadata: Partial<CachedMetadata>) => {
    fileMetadataMap.set(path, {
      headings: [],
      headings: [],
      links: [],
      embeds: [],
      tags: [],
      sections: [],
      codeblocks: [],
      ...metadata
    } as CachedMetadata);
  }),
};

export function createMockMetadataCache(): Partial<MetadataCache> {
  return JSON.parse(JSON.stringify(mockMetadataCache));
}
```

---

## Unit Test Template

### Basic Unit Test

```typescript
// src/__tests__/services.test.ts
/**
 * @jest-environment jest-environment-obsidian
 */
import { MyService } from '../services/MyService';
import { App } from 'obsidian';

jest.mock('obsidian');

describe('MyService', () => {
  let service: MyService;
  let mockApp: jest.Mocked<App>;

  beforeEach(() => {
    mockApp = new (App as jest.MockedClass<typeof App>)();
    service = new MyService(mockApp);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with app', () => {
      expect(service).toBeDefined();
      expect(service['app']).toBe(mockApp);
    });
  });

  describe('business logic', () => {
    it('should process items', () => {
      const result = service.process([]);
      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', () => {
      expect(() => service.validate(null)).toThrow();
    });
  });

  describe('vault integration', () => {
    it('should get files from vault', () => {
      mockApp.vault.getMarkdownFiles.mockReturnValue([]);
      const files = service.getFiles();

      expect(files).toEqual([]);
      expect(mockApp.vault.getMarkdownFiles).toHaveBeenCalled();
    });
  });
});
```

### Advanced Unit Test with Spy

```typescript
// src/__tests__/advanced.test.ts
/**
 * @jest-environment jest-environment-obsidian
 */
import { ComplexService } from '../services/ComplexService';

describe('ComplexService', () => {
  let service: ComplexService;

  beforeEach(() => {
    service = new ComplexService();
  });

  it('should call vault methods in correct order', async () => {
    const createSpy = jest.spyOn(service['vault'], 'create');
    const readSpy = jest.spyOn(service['vault'], 'read');

    await service.processFile();

    expect(createSpy).toHaveBeenCalledBefore(readSpy as any);
  });

  it('should retry on failure', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('Network'))
      .mockResolvedValueOnce({ success: true });

    const result = await service.retryOperation(operation, 3);

    expect(operation).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });
});
```

---

## CI/CD Integration Template

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          fail_ci_if_error: true

      - name: Comment PR with coverage
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
```

---

## Performance Optimization Tips

### 1. Jest Configuration for Speed
```javascript
{
  maxWorkers: '50%',          // Parallel workers
  bail: 1,                     // Stop on first failure
  testTimeout: 5000,           // Fail slow tests
  clearMocks: true,            // Auto-clear mocks
  restoreMocks: true,          // Auto-restore mocks
}
```

### 2. Test Grouping Strategy
```typescript
// Fast tests first
describe('Utils (fast)', () => { /* < 100ms */ });

// Slower tests grouped
describe('VaultOps (slow)', () => { /* < 1s */ });

// Skip in watch mode if needed
(process.env.WATCH ? describe.skip : describe)('Heavy', () => {});
```

### 3. Shared Test Setup
```typescript
// src/__tests__/setup.ts
export function setupTestFixtures() {
  const mockApp = createMockApp();
  const mockVault = createMockVault();
  return { mockApp, mockVault };
}

// In test file
describe('Suite', () => {
  const { mockApp, mockVault } = setupTestFixtures();
  // Reuse across tests
});
```

---

## Troubleshooting Guide

### Issue: "Cannot find module 'obsidian'"

```javascript
// Fix: Ensure jest.config.js has moduleNameMapper
moduleNameMapper: {
  '^obsidian$': '<rootDir>/src/__mocks__/obsidian/index.ts'
}
```

### Issue: "TypeError: Cannot read property 'x' of undefined"

```typescript
// Fix: Ensure mock is defined in __mocks__/obsidian/index.ts
export const mockApp = {
  vault: { /* define all methods */ },
  metadataCache: { /* define all methods */ },
};
```

### Issue: Tests pass locally but fail in CI

```yaml
# Fix: Use consistent Node version in CI
- uses: actions/setup-node@v3
  with:
    node-version: 20.x    # Match local development
    cache: 'npm'           # Cache dependencies
```

### Issue: Coverage threshold not met

```javascript
// Reduce threshold or improve coverage
coverageThreshold: {
  global: {
    branches: 60,          // Reduced from 70
    functions: 75,
    lines: 75,
    statements: 75,
  }
}
```

---

## Resources

- Jest Config: https://jestjs.io/docs/configuration
- jest-environment-obsidian: https://github.com/obsidian-community/jest-environment-obsidian
- TypeScript + Jest: https://github.com/kulshekhar/ts-jest
- Coverage Setup: https://jestjs.io/docs/code-coverage