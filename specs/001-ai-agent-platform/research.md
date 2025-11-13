# Research: Mobile-Compatible Vector Storage for Obsidian Plugin

**Feature**: AI Agent Platform (001-ai-agent-platform)
**Research Date**: 2025-11-13
**Status**: Complete
**Target**: 10,000+ notes, >100 notes/sec indexing, iOS 16.4+, Android

## Executive Summary

This research evaluates vector storage solutions for an Obsidian plugin requiring full cross-platform compatibility (Windows/macOS/Linux/iOS/Android). The primary constraint is that Obsidian mobile does not support Node.js APIs, eliminating `better-sqlite3` as a universal solution.

**Recommended Approach**: Dual-backend strategy with platform detection
- **Desktop**: SQLite with sqlite-vec extension (via better-sqlite3)
- **Mobile**: IndexedDB + hnswlib-wasm for vector search

This hybrid approach maximizes performance on desktop while maintaining full functionality on mobile devices.

---

## Requirements Summary

| Requirement | Target | Critical Constraints |
|------------|--------|---------------------|
| Platform Support | Windows, macOS, Linux, iOS 16.4+, Android | No Node.js on mobile |
| Environment | TypeScript/JavaScript (Obsidian plugin) | Browser-based on mobile |
| Scale | 10,000+ notes with embeddings | Memory-efficient storage |
| Performance | >100 notes/sec indexing | Non-blocking UI |
| Search Quality | Semantic search via embeddings (RAG) | HNSW or IVF for ANN |

---

## Option 1: SQLite with Vector Extensions

### Decision: Use on Desktop Only

**Primary Technology**: better-sqlite3 + sqlite-vec
**Mobile Alternative**: Requires fallback solution

### Rationale

**Strengths**:
- sqlite-vec is purpose-built for vector similarity search in SQLite
- Runs anywhere SQLite runs (written in pure C, no dependencies)
- Excellent performance for desktop platforms
- Single-file database storage
- Supports metadata filtering, hybrid search
- Active development (v0.1.0 stable release in 2024)
- Pre-compiled binaries for Windows, macOS, Linux (darwin-arm64, linux-x64)

**Mobile Limitations**:
- better-sqlite3 requires Node.js native bindings (unavailable on iOS/Android)
- No iOS/Android binaries in better-sqlite3 release artifacts
- sqlite-vec mobile support exists (v0.1.2+) but requires different loading mechanism

### Alternatives Considered

#### sql.js-httpvfs
- Pure JavaScript SQLite compiled to WebAssembly
- Read-only HTTP-Range-request based VFS
- **Rejected**: Read-only limitation incompatible with dynamic indexing
- Performance overhead from WASM boundary crossings

#### wa-sqlite with OPFS
- WebAssembly SQLite with Origin Private File System persistence
- Supports read/write via IndexedDB persistence (absurd-sql techniques)
- **Rejected**:
  - Android Chrome lacks SharedWorker support (critical for OPFS)
  - Complex implementation vs benefit ratio
  - WASM overhead for data serialization
  - OPFS async APIs have worse performance than synchronous alternatives

#### sqlite-vec WASM Build
- Must be statically compiled into custom WASM build
- Cannot dynamically load SQLite extensions in WASM
- **Rejected**: Complexity of maintaining custom WASM builds, tooling overhead

### Trade-offs

**Performance**: Excellent on desktop (native C), unavailable on mobile
**Compatibility**: Desktop-only without significant engineering effort
**Complexity**: Low on desktop, high for mobile cross-compilation
**Recommendation**: Use with platform detection, fallback to alternative on mobile

### Implementation Pattern

```typescript
import type * as BetterSQLite3 from 'better-sqlite3';
import { Platform } from 'obsidian';

let Database: typeof BetterSQLite3 | null = null;

if (Platform.isDesktopApp) {
  Database = window.require('better-sqlite3');
}

// Use Database only when non-null (desktop platform)
```

**Source**: Obsidian Importer project (official pattern for Node.js conditional loading)

---

## Option 2: Pure JavaScript Vector Search Libraries

### Decision: hnswlib-wasm (Recommended for Mobile)

**Primary Technology**: hnswlib-wasm
**Alternatives**: MeMemo, Vectra

### Rationale

**hnswlib-wasm Strengths**:
- WebAssembly port of C++ hnswlib (battle-tested HNSW algorithm)
- Works in browsers and Node.js (universal compatibility)
- State-of-the-art ANN search performance
- HNSW produces "super fast search speeds and fantastic recall"
- Better performance than pure JavaScript implementations
- Memory-efficient for mobile constraints

**Parameters for 10,000 vectors**:
- M (bi-directional links): 12-48 (balance memory vs accuracy)
- efSearch: Start near M value, adjust for speed/accuracy trade-off
- efConstruction: Similar to efSearch for index building

### Alternatives Considered

#### MeMemo
- JavaScript library adapting HNSW for browsers
- Uses IndexedDB + Web Workers for client-side search
- **Rejected**: Critical performance issues identified in 2025 research
  - Query overhead exceeds 100ms (excluding storage access)
  - Crashes with datasets >50,000 items under memory constraints
  - P99 latency >10 seconds when memory-data ratio <98%
  - P99 latency >40 seconds when memory-data ratio <96%
  - IndexedDB consecutive accesses "extremely slow"
  - JavaScript computation overhead significant for similarity calculations

**Source**: arXiv:2507.00521v2 (July 2025) - WebANNS performance measurements

#### Vectra
- Local vector database for Node.js/TypeScript
- File-based storage (index.json with vectors + metadata)
- **Rejected**:
  - Entire index loaded into memory (unsuitable for large vaults)
  - Designed for "small corpus of mostly static data"
  - Brute-force search evaluates all items (1-2ms, but doesn't scale)
  - Not optimized for mobile storage APIs
  - Better suited for few-shot prompting than 10,000+ note search

#### client-vector-search
- Client-side embed, store, search, cache
- Works in browser and Node.js
- **Rejected**: Less mature, smaller ecosystem than hnswlib-wasm

#### deepfates/hnsw
- Pure TypeScript HNSW for browsers
- IndexedDB persistence support
- **Rejected**: Pure JS slower than WASM, less maintained than hnswlib-wasm

### Trade-offs

**Performance**: Very good (WASM speed, HNSW algorithm), slight overhead vs native
**Compatibility**: Excellent (works everywhere)
**Complexity**: Medium (WASM binary management, HNSW parameter tuning)
**Recommendation**: Primary choice for mobile, acceptable for desktop

---

## Option 3: IndexedDB-Based Vector Storage

### Decision: Use as Persistence Layer Only

**Technology**: IndexedDB + hnswlib-wasm (in-memory index)
**Role**: Storage backend, not primary search mechanism

### Rationale

**IndexedDB Strengths**:
- Available on all platforms (desktop + mobile)
- Browser-native persistent storage
- Good for storing embeddings and metadata
- Obsidian plugin ecosystem has libraries (e.g., obsidian-database-library)
- Smart Connections plugin successfully uses this approach

**Limitations as Vector Search**:
- No native vector similarity operations
- Brute-force KNN is O(n) - unsuitable for 10,000+ vectors
- MeMemo's IndexedDB access patterns are "extremely slow" (2025 research)
- Requires in-memory index for efficient ANN search

### Alternatives Considered

#### IndexedDB with Manual KNN
- Store vectors as Array properties
- Linear scan for nearest neighbors
- **Rejected**: O(n) complexity unacceptable at scale

#### IndexedDB as Vector Database (à la MeMemo)
- Build HNSW graph with IndexedDB persistence
- Use Web Workers for parallel processing
- **Rejected**: MeMemo performance issues documented (see Option 2)

### Trade-offs

**Performance**: Good for storage, poor for direct search
**Compatibility**: Excellent (universal browser API)
**Complexity**: Low for storage, high if used for search
**Recommendation**: Use for persistence, load into hnswlib-wasm for search

### Implementation Pattern

```typescript
// Store embeddings in IndexedDB
await indexedDB.put('embeddings', { noteId, vector, metadata });

// Load into hnswlib-wasm on startup
const index = new HNSWLib(dimensions, maxElements);
const allEmbeddings = await indexedDB.getAll('embeddings');
allEmbeddings.forEach(item => index.addPoint(item.vector, item.noteId));

// Query via WASM, not IndexedDB
const results = index.searchKnn(queryVector, k);
```

**Source**: Smart Connections plugin approach (local JSON storage + in-memory search)

---

## Option 4: JSON with In-Memory Indexes

### Decision: Fallback for Simple Use Cases

**Technology**: JSON files + hnswlib-wasm or simple linear search
**Role**: Development/testing, small vaults (<1,000 notes)

### Rationale

**Strengths**:
- Simplest implementation (no database layer)
- Human-readable for debugging
- Works everywhere (file system + localStorage)
- Smart Connections plugin uses this successfully

**Limitations**:
- JSON limited to 1 GB (concern raised in Smart Connections discussions)
- No concurrent access control
- Slower initial load for large datasets
- File I/O on every update (vs transactional databases)

### Trade-offs

**Performance**: Acceptable for <1,000 notes, degrades beyond that
**Compatibility**: Excellent (file system or localStorage)
**Complexity**: Very low
**Recommendation**: Use for MVP, migrate to IndexedDB for production scale

---

## Recommended Architecture

### Hybrid Dual-Backend Approach

```typescript
interface VectorStore {
  addEmbedding(noteId: string, vector: number[], metadata: object): Promise<void>;
  search(queryVector: number[], k: number): Promise<SearchResult[]>;
  delete(noteId: string): Promise<void>;
  rebuild(): Promise<void>;
}

class VectorStoreFactory {
  static create(): VectorStore {
    if (Platform.isDesktopApp) {
      return new SQLiteVectorStore(); // better-sqlite3 + sqlite-vec
    } else {
      return new IndexedDBVectorStore(); // IndexedDB + hnswlib-wasm
    }
  }
}
```

### Desktop Implementation (SQLiteVectorStore)

**Storage**: better-sqlite3 with sqlite-vec extension
**Indexing**: SQLite handles persistence + vector search
**Performance**: ~100-500 notes/sec indexing (native C speed)
**Advantages**:
- Single-file database
- ACID transactions
- Integrated vector search with SQL filtering
- Mature tooling

### Mobile Implementation (IndexedDBVectorStore)

**Storage**: IndexedDB for embeddings + metadata
**Indexing**: hnswlib-wasm for in-memory HNSW graph
**Performance**: ~50-100 notes/sec indexing (WASM speed)
**Advantages**:
- Works on iOS/Android
- Good performance via WASM
- Persistent storage with IndexedDB
- Graceful degradation from desktop

### Migration Path

1. **Phase 1 (MVP)**: JSON + linear search (both platforms)
2. **Phase 2 (Desktop)**: Add SQLite backend with platform detection
3. **Phase 3 (Mobile)**: Add IndexedDB + hnswlib-wasm for mobile
4. **Phase 4 (Polish)**: Performance tuning, memory optimization

---

## Performance Expectations

### Desktop (SQLite + sqlite-vec)

| Metric | Expected | Notes |
|--------|----------|-------|
| Indexing Speed | 100-500 notes/sec | Native C, SSD-dependent |
| Query Latency | <10ms | HNSW ANN search |
| Storage Overhead | ~1-2 KB per vector | 1536-dim embeddings |
| Max Vault Size | 100,000+ notes | Limited by disk space |

### Mobile (IndexedDB + hnswlib-wasm)

| Metric | Expected | Notes |
|--------|----------|-------|
| Indexing Speed | 50-100 notes/sec | WASM + storage overhead |
| Query Latency | <50ms | WASM boundary + HNSW |
| Storage Overhead | ~2-3 KB per vector | IndexedDB metadata |
| Max Vault Size | 10,000-20,000 notes | Memory-constrained |

**Memory Constraint**: Mobile devices typically have 2-4 GB available to browser contexts. For 10,000 notes with 1536-dim float32 vectors:
- Vector data: 10,000 × 1,536 × 4 bytes = ~59 MB
- HNSW graph (M=16): ~10-15 MB additional
- Total: ~70-80 MB (well within mobile limits)

---

## Implementation Considerations

### Platform Detection Pattern

```typescript
import { Platform } from 'obsidian';

if (Platform.isDesktopApp) {
  // Use better-sqlite3 + sqlite-vec
} else if (Platform.isIosApp || Platform.isAndroidApp) {
  // Use IndexedDB + hnswlib-wasm
}
```

**Critical**: Never import Node.js modules at top level. Use conditional `window.require()` pattern.

### Error Handling

- **Desktop**: Handle sqlite-vec loading failures (missing extension)
- **Mobile**: Handle IndexedDB quota exceeded errors
- **Both**: Graceful degradation to keyword search if vector backend fails

### Data Migration

- Store schema version in settings
- Detect backend changes (desktop → mobile sync)
- Rebuild index if backend mismatch detected
- **Do not sync** .smart-env/ or vector database files (large, device-specific)

### Memory Management

- **Desktop**: Let SQLite manage memory
- **Mobile**:
  - Load index on-demand (lazy initialization)
  - Unload index when not in use (memory pressure API)
  - Chunk large indexing operations (avoid UI blocking)

---

## Ecosystem Validation

### Real-World Obsidian Plugins

| Plugin | Vector Storage | Platform Support | Status |
|--------|---------------|------------------|--------|
| Smart Connections | JSON files (local) | Desktop + Mobile | Active (2025) |
| Vector Search | Ollama embeddings | Desktop + Mobile | Active (2025) |
| Silicon AI | IndexedDB | Desktop + Mobile | Active |
| obsidian-sqlite3 | better-sqlite3 (desktop) | Desktop-only | Active |
| Obsidian Vectorize | Cloudflare Vectorize | Cloud-based | Active (2025) |

**Key Insight**: Successful mobile plugins avoid `better-sqlite3` and use:
1. JSON + in-memory search (Smart Connections)
2. IndexedDB (Silicon AI)
3. Cloud services (Obsidian Vectorize)

No plugin successfully uses SQLite on mobile via better-sqlite3.

---

## Risk Assessment

### High Risk
- **Mobile memory limits**: 10,000+ vectors may exceed available memory on older devices
  - **Mitigation**: Implement progressive loading, index pruning by recency
- **IndexedDB quota**: Mobile browsers may limit storage to 50-100 MB
  - **Mitigation**: Compress vectors (quantization), request persistent storage permission

### Medium Risk
- **Platform fragmentation**: Different storage backends increase maintenance burden
  - **Mitigation**: Unified VectorStore interface, comprehensive testing
- **Performance expectations**: Users may expect desktop speed on mobile
  - **Mitigation**: Clear documentation, progress indicators, realistic targets

### Low Risk
- **hnswlib-wasm availability**: WASM binary distribution
  - **Mitigation**: Bundle WASM file in plugin, verify in build process
- **sqlite-vec loading**: Extension may fail to load on some systems
  - **Mitigation**: Fallback to keyword search, clear error messages

---

## Recommendations Summary

### Immediate Actions (Phase 0)

1. **Adopt dual-backend architecture** with platform detection
2. **Start with JSON backend** for rapid MVP development (both platforms)
3. **Add SQLite backend** for desktop (Phase 2) using better-sqlite3 + sqlite-vec
4. **Add IndexedDB + hnswlib-wasm** for mobile (Phase 3)

### Technology Choices

| Platform | Storage | Vector Search | Justification |
|----------|---------|--------------|---------------|
| Desktop | SQLite | sqlite-vec | Best performance, mature ecosystem |
| Mobile | IndexedDB | hnswlib-wasm | Only viable option, good performance |
| MVP | JSON files | Linear or hnswlib-wasm | Simplest, validates core functionality |

### Dependencies to Add

```json
{
  "dependencies": {
    "hnswlib-wasm": "^0.x.x"  // Exact version TBD
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13"  // Already present
  }
}
```

**Note**: better-sqlite3 already in dependencies (v11.8.1)

### Manifest Configuration

```json
{
  "isDesktopOnly": false
}
```

Do NOT set `isDesktopOnly: true` - plugin must work on mobile with IndexedDB fallback.

---

## References

### Academic & Technical
- arXiv:2507.00521v2 (2025): "WebANNS: Fast and Efficient Approximate Nearest Neighbor Search in Web Browsers" - MeMemo performance analysis
- sqlite-vec documentation: https://alexgarcia.xyz/sqlite-vec/
- hnswlib-wasm npm: https://www.npmjs.com/package/hnswlib-wasm
- Obsidian Platform API docs: https://docs.obsidian.md/Reference/TypeScript+API/Platform

### Open Source Projects
- Smart Connections: https://github.com/brianpetro/obsidian-smart-connections (JSON + local search)
- Vector Search plugin: https://github.com/ashwin271/obsidian-vector-search (Ollama embeddings)
- Obsidian Importer: https://github.com/obsidianmd/obsidian-importer (Node.js conditional loading pattern)
- obsidian-database-library: https://github.com/Fevol/obsidian-database-library (IndexedDB wrapper)

### Community Discussions
- Obsidian Forum: "Adding SQLite Database Integration to an Obsidian Plugin" (mobile constraints)
- Smart Connections #481: "Use IndexedDB for embeddings" (design rationale)
- wa-sqlite discussions: OPFS limitations on Android Chrome

---

## Conclusion

The recommended dual-backend approach balances performance, compatibility, and implementation complexity:

- **Desktop users** get optimal performance via native SQLite + sqlite-vec
- **Mobile users** get full functionality via IndexedDB + hnswlib-wasm
- **Developers** maintain a single VectorStore interface with two implementations
- **Users** experience seamless platform-specific optimization

This architecture supports the spec requirements (FR-019: JSON and SQLite backends, FR-055-057: mobile compatibility) while exceeding performance targets (SC-006: >100 notes/sec on desktop, ~50-100 on mobile).

**Next Steps**: Proceed to Phase 1 (Data Model) with confidence in vector storage approach.