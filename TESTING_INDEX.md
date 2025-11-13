# Testing Framework Research - Complete Index

## Overview

This folder contains comprehensive research on testing frameworks suitable for Obsidian plugins written in TypeScript. The research covers Jest, Vitest, integration testing strategies, mocking approaches, and complete setup guides.

**Total Size:** 56.6 KB of documentation
**Research Date:** November 13, 2025
**Target:** Mnemosyne AI Platform Obsidian Plugin

---

## Documents at a Glance

### 1. research.md (26 KB) - COMPREHENSIVE GUIDE
**Purpose:** Complete research document with all findings

**Contents:**
- Executive summary of testing frameworks
- 5 framework options evaluated (Jest, Vitest, Obsimian, Embedded, Mocha)
- Primary recommendation: Jest + jest-environment-obsidian
- Testing strategy framework (unit/integration/E2E)
- Obsidian API mocking strategy (Vault, MetadataCache, etc.)
- Complete setup guide with examples
- Best practices from community plugins
- 7-8 week implementation roadmap
- Resource links

**When to Read:** For deep understanding of testing architecture and decisions

**Key Sections:**
- 1.1: PRIMARY RECOMMENDATION (Jest with jest-environment-obsidian)
- 1.2: SECONDARY RECOMMENDATION (Custom Embedded Harness)
- 1.3: ALTERNATIVE (Obsimian)
- 2: Testing Strategy Framework (pyramid, unit vs integration vs E2E)
- 3: Obsidian API Mocking Strategy
- 4: Setup Guide (complete example with code)
- 8: Implementation Roadmap

---

### 2. TESTING_SUMMARY.md (5.6 KB) - QUICK REFERENCE
**Purpose:** One-page executive summary

**Contents:**
- Quick reference table (Jest vs Vitest vs embedded)
- Minimal installation instructions
- Quick setup for jest.config.js
- First test example
- Project structure template
- Best practices checklist
- Common patterns
- Alternatives and why not
- Resources

**When to Read:** For quick setup and refresher during implementation

**Best For:** 5-minute orientation, copy-paste setup

---

### 3. TESTING_CONFIG_TEMPLATES.md (14 KB) - COPY-PASTE CONFIGS
**Purpose:** Ready-to-use configuration files and mocks

**Contents:**
- Decision matrix (framework selection by criteria)
- 4 jest.config.js variations (standard, lightweight, etc.)
- tsconfig.json for testing
- package.json test scripts
- Complete Obsidian mock templates:
  - App mock
  - Vault mock
  - MetadataCache mock
  - Mock factory patterns
- Unit test templates (basic and advanced)
- GitHub Actions CI/CD workflow
- Performance optimization tips
- Troubleshooting guide

**When to Read:** When setting up your project

**Best For:** Copy-paste implementation, troubleshooting

**Files Provided:**
1. jest.config.js (standard version)
2. jest.config.js (lightweight version)
3. tsconfig.json
4. package.json (scripts section)
5. Mock templates (5 files)
6. GitHub Actions workflow
7. Example tests

---

### 4. TESTING_DECISION_TREE.md (11 KB) - DECISION FLOWCHARTS
**Purpose:** Decision-making guide and quick reference flowcharts

**Contents:**
- Decision tree by scenario:
  - Testing FileProcessor service
  - Testing Vault.read()
  - Testing MetadataCache
  - Testing plugin initialization
  - Testing event handlers
- Framework selection matrix by test type
- Project phase guidance (startup/growth/mature)
- Decision rules (if unsure, start with Jest)
- Minimal setup path (3-week roadmap)
- Recommended stack summary
- FAQ (10 common questions)
- Next actions checklist

**When to Read:** To decide what to do next or resolve ambiguity

**Best For:** Making decisions quickly, phase planning

---

## Quick Start Path

### For someone starting NOW (30 minutes):

1. Read: **TESTING_SUMMARY.md** (5 min)
   - Understand the recommendation

2. Read: **TESTING_DECISION_TREE.md** - "Quick Decision Guide" section (5 min)
   - Understand what you'll test

3. Copy: **TESTING_CONFIG_TEMPLATES.md** - jest.config.js (Standard) (5 min)
   - Set up basic configuration

4. Copy: Mocks from **TESTING_CONFIG_TEMPLATES.md** (10 min)
   - Create __mocks__ directory structure

5. Run: `npm install && npm test`
   - Start testing

### For detailed understanding (2-3 hours):

1. Read: **research.md** - Sections 1-2 (45 min)
   - Understand frameworks and strategy

2. Skim: **research.md** - Sections 3-4 (30 min)
   - Understand mocking and setup

3. Review: **TESTING_CONFIG_TEMPLATES.md** (30 min)
   - Understand configuration options

4. Skim: **TESTING_DECISION_TREE.md** (15 min)
   - Understand decision making

---

## Key Findings Summary

### Framework Recommendation
**Jest + jest-environment-obsidian** for unit testing
- Specifically designed for Obsidian plugins
- Community-maintained by obsidian-community
- Mature ecosystem
- Best TypeScript support

### Integration Testing Approach
**Custom Embedded Harness** for integration testing (20% of suite)
- When you need real Obsidian API
- Runs inside Obsidian environment
- Alternative: Obsimian for lightweight integration

### Why Not Vitest (Yet)
- Same architectural constraints as Jest for Obsidian plugins
- Future-friendly but no advantages today
- Consider for migration in 2026+

### Testing Strategy
```
Unit Tests (70%)  ──→ Jest + jest-environment-obsidian  ──→ < 1 second
Integration (20%) ──→ Embedded Harness or Obsimian      ──→ 5-30 seconds
Manual E2E (10%)  ──→ Manual in Obsidian               ──→ varies
```

### Mocking Strategy
- Dependency Injection pattern (better than jest.mock())
- Modular mock structure (separate files per API)
- Mock factory pattern (reusable test fixtures)
- Contract pattern (test reusability across frameworks)

### Setup Timeline
- Minimal Jest setup: 1 hour
- First 10 tests: 2-3 hours
- Full infrastructure: 7-8 weeks

---

## Document Relationships

```
research.md
├─ Comprehensive research
├─ All options evaluated
└─ Everything documented

    ↓ (reference for)

TESTING_SUMMARY.md
├─ Quick reference
└─ For quick lookup

TESTING_DECISION_TREE.md
├─ Decision making
├─ Scenario-based
└─ Quick answers to "what should I do?"

TESTING_CONFIG_TEMPLATES.md
├─ Practical templates
├─ Copy-paste configs
└─ Ready-to-use mocks
```

---

## Usage Scenarios

### Scenario: "I have 30 minutes and need to start testing"
→ Read **TESTING_SUMMARY.md** + Copy config from **TESTING_CONFIG_TEMPLATES.md**

### Scenario: "I need to understand the testing architecture"
→ Read **research.md** sections 1-4

### Scenario: "I'm unsure if I should use Jest or Vitest"
→ Read **TESTING_DECISION_TREE.md** - Decision Matrix

### Scenario: "I need to set up GitHub Actions testing"
→ Copy workflow from **TESTING_CONFIG_TEMPLATES.md** - CI/CD section

### Scenario: "My test is failing and I don't know why"
→ Check **TESTING_CONFIG_TEMPLATES.md** - Troubleshooting Guide

### Scenario: "I need to know what mock methods are needed"
→ See **TESTING_CONFIG_TEMPLATES.md** - Mock Templates

### Scenario: "I'm testing Vault operations and don't know the approach"
→ See **TESTING_DECISION_TREE.md** - Scenario 2

---

## Key Tables & Matrices

### Framework Comparison (from research.md)
| Framework | Speed | Setup | TypeScript | Obsidian |
|-----------|-------|-------|-----------|----------|
| Jest | Good | Medium | Excellent | PRIMARY |
| Vitest | Excellent | Easy | Excellent | Secondary |
| Obsimian | Fast | Easy | Good | Integration |
| Embedded | Slow | Hard | Good | Real API |

### Test Type Recommendations (from TESTING_CONFIG_TEMPLATES.md)
- Unit tests: Jest (5 stars)
- API contracts: Jest (5 stars)
- Vault ops: Embedded Harness (5 stars)
- Event handlers: Jest (4 stars) or Embedded (5 stars)
- Speed: Jest or Obsimian (5 stars)

### Decision Matrix (from TESTING_DECISION_TREE.md)
```
Pure business logic → Jest
Vault operations → Embedded/Obsimian
Workspace integration → Embedded
Event testing → Jest with mocks
Complete workflows → Manual
```

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Read TESTING_SUMMARY.md
- [ ] Copy jest.config.js from TESTING_CONFIG_TEMPLATES.md
- [ ] Create __mocks__/obsidian directory
- [ ] Copy mock templates
- [ ] Install: `npm install jest jest-environment-obsidian ts-jest`
- [ ] Write 3-5 example tests
- [ ] Run: `npm test` successfully

### Phase 2: Coverage (Week 2)
- [ ] Write 15-20 unit tests
- [ ] Target 50%+ coverage
- [ ] Set up GitHub Actions from TESTING_CONFIG_TEMPLATES.md
- [ ] Configure branch protection

### Phase 3: Integration (Week 3+)
- [ ] Evaluate integration testing needs
- [ ] If needed: Set up embedded harness or Obsimian
- [ ] Write 5-10 integration tests
- [ ] Target 80%+ overall coverage

---

## Important Links

### External Resources
- **jest-environment-obsidian**: https://github.com/obsidian-community/jest-environment-obsidian
- **Obsidian Docs**: https://docs.obsidian.md/
- **Jest Docs**: https://jestjs.io/
- **Embedded Framework**: https://github.com/b-camphart/embedded-test-framework
- **Obsimian**: https://github.com/motif-software/obsimian

### Community Examples
- **Obsidian Hub**: https://publish.obsidian.md/hub
- **Integration Testing Guide**: https://dev.to/bcamphart/integration-testing-in-obsidian-1gm5
- **Mocking Guide**: https://devinhedge.com/2024/08/27/creating-modular-mocks-for-the-obsidian-api-in-jest/

---

## Notes

- **Last Updated:** November 13, 2025
- **Research Scope:** TypeScript testing for Obsidian plugins
- **Status:** Ready for implementation
- **Maintenance:** Review when Obsidian API changes or Vitest adoption increases
- **Coverage Target:** 70% statements, 70% branches, 80% functions, 80% lines

---

## For Contributors

When updating this research:

1. Update **research.md** with new findings
2. Reflect major changes in **TESTING_SUMMARY.md**
3. Add new templates to **TESTING_CONFIG_TEMPLATES.md**
4. Update decision trees in **TESTING_DECISION_TREE.md**
5. Verify links still work
6. Update "Last Updated" date
7. Consider if Vitest recommendation should change (for future Obsidian versions)

---

## Quick Navigation

**Need help with:**
- ✓ Installation → TESTING_SUMMARY.md + TESTING_CONFIG_TEMPLATES.md
- ✓ Configuration → TESTING_CONFIG_TEMPLATES.md
- ✓ Decisions → TESTING_DECISION_TREE.md
- ✓ Understanding → research.md
- ✓ Troubleshooting → TESTING_CONFIG_TEMPLATES.md (Troubleshooting section)
- ✓ Examples → research.md (Section 6-7) + TESTING_CONFIG_TEMPLATES.md
- ✓ Best practices → research.md (Section 7)
- ✓ Next steps → TESTING_DECISION_TREE.md (Next Actions)

---

**Happy testing! Start with TESTING_SUMMARY.md if you're in a hurry.**