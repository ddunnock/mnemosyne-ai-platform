# Testing Framework Decision Summary

## Quick Reference

### Recommended Stack
| Layer | Tool | Use Case |
|-------|------|----------|
| **Unit Tests** | Jest + jest-environment-obsidian | 70% of tests - fast feedback |
| **Integration Tests** | Custom Embedded Harness | 20% of tests - real Obsidian API |
| **E2E Tests** | Manual in Obsidian | 10% - critical workflows |

### Key Finding
Standard testing frameworks (Jest, Vitest) have architectural constraints with Obsidian due to the single `main.js` limitation. Solutions:
1. Jest for unit tests (decoupled logic)
2. Custom embedded harness for integration tests (inside Obsidian)
3. Obsimian as lightweight alternative to embedding

---

## Installation

```bash
npm install --save-dev jest jest-environment-obsidian ts-jest @types/jest typescript
```

---

## Minimal Setup

### jest.config.js
```javascript
module.exports = {
  preset: 'jest-environment-obsidian',
  testEnvironment: 'jest-environment-obsidian',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/src/__mocks__/obsidian/index.ts'
  },
};
```

### First Test
```typescript
// src/__tests__/example.test.ts
/**
 * @jest-environment jest-environment-obsidian
 */
import { App } from 'obsidian';

jest.mock('obsidian');

describe('Example', () => {
  it('mocks Obsidian API', () => {
    const mockApp = new (App as jest.MockedClass<typeof App>)();
    expect(mockApp).toBeDefined();
  });
});
```

### package.json Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Project Structure

```
src/
├── domain/              # Pure business logic (testable)
│   └── services/
├── infrastructure/      # Obsidian-dependent
│   └── vault/
├── __mocks__/          # Obsidian API mocks
│   └── obsidian/
│       ├── App.ts
│       ├── Vault.ts
│       └── index.ts
├── __tests__/
│   ├── services.test.ts (70% of tests)
│   └── vault.test.ts    (20% integration tests)
└── main.ts
```

---

## API Mocking Essentials

### Core APIs to Mock
```typescript
// Most important to mock
- Vault (file operations)
- MetadataCache (metadata retrieval)
- Workspace (state)
- App (root instance)
- Plugin (base class)
```

### Mock Factory Pattern (Recommended)
```typescript
// src/__mocks__/obsidian/index.ts
export function createMockApp() {
  return {
    vault: createVault(),
    metadataCache: createMetadataCache(),
    workspace: {},
  };
}
```

---

## Best Practices

### 1. Dependency Injection for Testability
```typescript
// Good - testable
class FileProcessor {
  constructor(private vault: Vault) {}
}

// Can inject mock vault in tests
```

### 2. Separate Business Logic from Obsidian
```typescript
// src/domain/FileParser.ts (pure logic, testable)
export function parseMarkdown(content: string) { }

// src/infrastructure/ObsidianVault.ts (Obsidian-dependent, integration tested)
export class ObsidianVault {
  async getFiles() { }
}
```

### 3. Keep Plugin Class Thin
```typescript
// src/main.ts
export default class MyPlugin extends Plugin {
  onload() {
    this.processor = new FileProcessor(this.app);
  }
  // Minimal logic here - everything delegated to services
}
```

---

## Testing Pyramid

```
       Manual E2E (5%)
         /    \
   Integration (20%)
     /           \
Unit Tests (70%)
```

**Targets:**
- Unit tests: Run in < 1 second, on every code change
- Integration: Run in < 30 seconds, in CI/CD only
- E2E: Run manually before release

---

## When to Choose Each Approach

### Jest Unit Testing
Use when:
- Testing pure functions and business logic
- Can mock all Obsidian dependencies
- Need fast feedback (ms per test)

### Custom Embedded Harness
Use when:
- Need real Obsidian API behavior
- Testing Vault operations, events
- Testing MetadataCache interactions
- Requires setup/teardown with actual files

### Obsimian
Use when:
- Want middle ground between Jest mocks and real Obsidian
- Don't want to set up custom harness
- Testing simulated vault behavior

---

## Common Patterns

### Unit Test with Mocks
```typescript
describe('FileProcessor', () => {
  it('processes files', () => {
    const mockVault = { getMarkdownFiles: jest.fn() };
    const processor = new FileProcessor(mockVault as any);

    mockVault.getMarkdownFiles.mockReturnValue([]);
    const result = processor.process();

    expect(mockVault.getMarkdownFiles).toHaveBeenCalled();
  });
});
```

### Integration with Embedded Harness
```typescript
// integration/main.ts - embedded in plugin
describe('Vault Integration', () => {
  it('creates files', async () => {
    const file = await this.app.vault.create('test.md', 'content');
    expect(file.name).toBe('test.md');
  });
});
```

---

## Alternatives (Not Recommended for Now)

| Framework | Why Not |
|-----------|---------|
| Vitest | Same constraints as Jest; future-friendly but setup unchanged today |
| Mocha | Smaller Obsidian ecosystem; no jest-environment-obsidian |
| Pure TypeScript/ts-jest | Requires full manual Obsidian mocking |

---

## Resources

- Jest Environment: https://github.com/obsidian-community/jest-environment-obsidian
- Embedded Framework: https://github.com/b-camphart/embedded-test-framework
- Obsimian: https://github.com/motif-software/obsimian
- Obsidian Docs: https://docs.obsidian.md/

---

## Next Steps

1. Install jest-environment-obsidian
2. Create mock structure
3. Write 5-10 example unit tests
4. Set up CI/CD to run tests
5. Add integration tests as needed

See `research.md` for comprehensive details.