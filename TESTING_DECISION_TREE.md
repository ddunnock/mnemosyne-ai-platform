# Testing Framework Decision Tree

## Quick Decision Guide

### Step 1: What are you testing?

```
Am I testing...
├─ Pure business logic (no Obsidian imports)?
│  └─→ Use Jest + jest-environment-obsidian (UNIT TEST)
│
├─ Vault operations, MetadataCache, workspace state?
│  └─→ Use Custom Embedded Harness or Obsimian (INTEGRATION TEST)
│
└─ Complete user workflows in the app?
   └─→ Manual testing in Obsidian (E2E)
```

---

## Decision Tree by Scenario

### Scenario 1: Testing FileProcessor service

```
FileProcessor.ts has NO Obsidian imports
       ↓
Can mock dependencies? YES
       ↓
Use JEST UNIT TEST
       ↓
Setup:
- jest.config.js with jest-environment-obsidian
- Mock the Vault dependency
- Run: npm test
```

**Example Code:**
```typescript
// src/services/FileProcessor.ts
export class FileProcessor {
  constructor(private vault: Vault) {}
  process() { return this.vault.getMarkdownFiles(); }
}

// src/__tests__/fileProcessor.test.ts
jest.mock('obsidian');
const mockVault = { getMarkdownFiles: jest.fn() };
const processor = new FileProcessor(mockVault as any);
```

---

### Scenario 2: Testing Vault.read() behavior

```
Testing vault.read() returns file content
       ↓
Needs REAL Obsidian API? YES
       ↓
Use EMBEDDED HARNESS or OBSIMIAN
       ↓
Setup:
- Custom embedded test runner OR
- Install: npm install obsimian
- Run: npm test:integration
```

**With Embedded Harness:**
```typescript
// integration/main.ts
it('reads file content', async () => {
  const file = await this.app.vault.create('test.md', '# Test');
  const content = await this.app.vault.read(file);
  expect(content).toBe('# Test');
});
```

**With Obsimian:**
```typescript
import { createApp } from 'obsimian';

it('reads file content', async () => {
  const app = createApp();
  const file = await app.vault.create('test.md', '# Test');
  const content = await app.vault.read(file);
  expect(content).toBe('# Test');
});
```

---

### Scenario 3: Testing MetadataCache integration

```
Testing MetadataCache.getFileCache()
       ↓
Real API needed? YES
Real Obsidian environment? Optional
       ↓
Choose:
A) Need real Obsidian: Use EMBEDDED HARNESS
B) Simulated OK: Use OBSIMIAN
C) Want both: Use CONTRACT PATTERN
```

**Contract Pattern (Test with both):**
```typescript
// contracts/metadataContract.ts
export function testMetadataCache(app: App) {
  describe('MetadataCache', () => {
    it('retrieves file metadata', () => {
      const cache = app.metadataCache.getFileCache(file);
      expect(cache?.headings).toBeDefined();
    });
  });
}

// Use in Jest (with mock)
testMetadataCache(mockApp);

// Use in integration (with real app)
testMetadataCache(this.app);
```

---

### Scenario 4: Testing plugin initialization

```
Testing Plugin.onload() and UI setup
       ↓
Can test with mocks? PARTIALLY
       ↓
Split testing:
- Unit: Test settings, ribbon icons (mock Obsidian)
- Integration: Test event listeners (real environment)
```

**Split Approach:**
```typescript
// __tests__/plugin.unit.test.ts
// Mock-based unit test
it('registers commands', () => {
  const addCommandSpy = jest.spyOn(mockApp.commands, 'addCommand');
  const plugin = new MyPlugin(mockApp);
  plugin.onload();
  expect(addCommandSpy).toHaveBeenCalled();
});

// integration/main.ts
// Real environment test
it('command executes in workspace', async () => {
  // Run actual command in Obsidian
  this.app.commands.executeCommandById('my-plugin:process');
});
```

---

### Scenario 5: Testing event handlers

```
Testing Vault 'create' event listener
       ↓
Emit event from mock? YES
       ↓
Use JEST with EventEmitter mock
```

**Event Handling Test:**
```typescript
// Mock EventEmitter pattern
it('handles file creation', () => {
  const callback = jest.fn();
  mockApp.vault.on('create', callback);

  // Emit event
  mockApp.vault.emit('create', mockFile);

  expect(callback).toHaveBeenCalledWith(mockFile);
});
```

---

## Framework Selection Matrix

### By Test Type

```
┌─────────────────────────┬────────────┬──────────────┬────────────┐
│ Test Type               │ Jest       │ Obsimian     │ Embedded   │
├─────────────────────────┼────────────┼──────────────┼────────────┤
│ Unit (pure functions)   │ ★★★★★     │ ★★☆☆☆      │ ★☆☆☆☆     │
│ Unit (with mocks)       │ ★★★★☆     │ ★★★☆☆      │ ★★☆☆☆     │
│ API contract            │ ★★★★★     │ ★★★★☆      │ ★★★☆☆     │
│ Vault operations        │ ★★☆☆☆     │ ★★★☆☆      │ ★★★★★     │
│ MetadataCache           │ ★★☆☆☆     │ ★★★☆☆      │ ★★★★★     │
│ Events/listeners        │ ★★★★☆     │ ★★★★☆      │ ★★★★★     │
│ Speed                   │ ★★★★★     │ ★★★★★      │ ★★☆☆☆     │
│ Setup complexity        │ ★★★☆☆     │ ★★☆☆☆      │ ★☆☆☆☆     │
└─────────────────────────┴────────────┴──────────────┴────────────┘
```

### By Project Phase

```
Startup Phase (MVP):
├─ Jest only
├─ Basic mocks
└─ No integration tests

Growth Phase (Feature-rich):
├─ Jest for unit tests (70%)
├─ Advanced mocks
├─ Obsimian for some integration
└─ Target 80%+ coverage

Mature Phase (Production-ready):
├─ Jest for unit tests (70%)
├─ Embedded harness for integration (20%)
├─ Manual E2E (5%)
├─ Full test suite with contracts
└─ CI/CD automated testing
```

---

## Decision Rules (If Unsure)

### Rule 1: Start with Jest
```
If new to testing Obsidian plugins:
└─→ Use Jest + jest-environment-obsidian
    └─ Lowest barrier to entry
    └─ Most documentation available
    └─ Can expand later
```

### Rule 2: Add Integration When Needed
```
If Jest mocks don't catch issues:
└─→ Add custom embedded harness OR Obsimian
    └─ For specific APIs (Vault, MetadataCache)
    └─ Not for everything
    └─ Keep integrated tests minimal
```

### Rule 3: Use Contract Pattern for Complex Cases
```
If testing both mocked and real implementations:
└─→ Write tests as reusable contracts
    └─ Run same test against mocks (fast)
    └─ Run same test against real (thorough)
    └─ Ensures mock fidelity
```

### Rule 4: Prioritize Test ROI
```
If unsure what to test:
1. Test critical business logic first
2. Test Vault operations second
3. Test UI last (manual testing OK)
4. Test events when complex
```

---

## Minimal Setup Path

### Week 1: Get Started
```
1. npm install jest jest-environment-obsidian ts-jest
2. Copy jest.config.js template
3. Create one __tests__ directory
4. Write 3-5 example tests
5. Run: npm test
```

### Week 2: Expand Coverage
```
1. Create mock directory structure
2. Write 15-20 unit tests
3. Target 50%+ code coverage
4. Set up CI/CD
```

### Week 3: Add Integration
```
1. Evaluate need for integration tests
2. If needed: Install Obsimian or set up embedded harness
3. Write 5-10 integration tests
4. Target 80%+ overall coverage
```

---

## Recommended Stack Summary

```
FOR: mnemosyne-ai-platform's Obsidian plugin

PRIMARY TESTING:
├─ Jest + jest-environment-obsidian
├─ 70% unit tests
├─ Configuration: jest.config.js preset
└─ npm install: jest jest-environment-obsidian ts-jest

SECONDARY (if needed):
├─ Custom embedded harness
├─ 20% integration tests
└─ For Vault, MetadataCache, events

OPTIONAL (consider later):
├─ Obsimian for lightweight integration
└─ Playwright for critical E2E workflows

TOOLING:
├─ TypeScript + ts-jest
├─ GitHub Actions for CI/CD
├─ Coverage reports (lcov)
└─ ESLint for code quality

TARGET COVERAGE:
├─ Statements: 80%
├─ Branches: 70%
├─ Functions: 80%
└─ Lines: 80%
```

---

## Next Actions

### Immediate (Today)
- [ ] Read research.md for comprehensive details
- [ ] Review TESTING_SUMMARY.md for quick reference
- [ ] Check TESTING_CONFIG_TEMPLATES.md for setup code

### Short-term (This Week)
- [ ] Install jest-environment-obsidian
- [ ] Copy jest.config.js template
- [ ] Create mock structure
- [ ] Write 5 example unit tests
- [ ] Set up npm test script

### Medium-term (Next 2-3 Weeks)
- [ ] Expand unit test coverage to 50%+
- [ ] Set up GitHub Actions workflow
- [ ] Evaluate integration test needs
- [ ] Establish code review standards

### Long-term (Monthly)
- [ ] Achieve 80%+ coverage
- [ ] Add integration tests as needed
- [ ] Monitor and optimize test performance
- [ ] Keep mocks in sync with Obsidian API updates

---

## FAQ

**Q: Do I need integration tests?**
A: Not initially. Start with Jest unit tests. Add integration tests only for critical Vault/MetadataCache operations (20% of suite).

**Q: Why not just test in Obsidian?**
A: Manual testing is slow and hard to automate. Jest gives fast feedback during development. Integration tests run in CI/CD only.

**Q: What about E2E testing?**
A: Do manual E2E for critical workflows before release. Full E2E automation is complex for Electron apps.

**Q: Should I use Vitest instead of Jest?**
A: Jest is better for Obsidian plugins today (jest-environment-obsidian). Vitest could be future-proof but requires same mocking setup.

**Q: How long does this take to set up?**
A: Minimal Jest setup: 1 hour. Full testing infrastructure: 1-2 weeks. Ongoing maintenance: minimal.

**Q: Can I test the main.ts Plugin class?**
A: Yes, but it's often better to delegate logic to services. Keep Plugin class thin; test the delegated services instead.

---

## Resources

1. **Main Documentation:** research.md (comprehensive, 26KB)
2. **Quick Reference:** TESTING_SUMMARY.md (brief, 5.6KB)
3. **Configuration Templates:** TESTING_CONFIG_TEMPLATES.md (setup code, 14KB)
4. **This Guide:** TESTING_DECISION_TREE.md (flowcharts)

**External Resources:**
- jest-environment-obsidian: https://github.com/obsidian-community/jest-environment-obsidian
- Jest Documentation: https://jestjs.io/
- Obsidian Docs: https://docs.obsidian.md/
- Embedded Framework Reference: https://github.com/b-camphart/embedded-test-framework

---

**Last Updated:** November 13, 2025
**For:** Mnemosyne AI Platform - Obsidian Plugin Testing
**Status:** Ready for implementation