# Embedding Generation Strategy Research for Mnemosyne AI Platform

**Research Date:** 2025-11-13
**Context:** RAG system for Obsidian plugin with mobile (iOS 16.4+, Android) and desktop support
**Constraint:** Cannot rely on Node.js-only libraries (e.g., better-sqlite3 on mobile)

---

## Executive Summary

### Recommended Approach: Hybrid Cloud + Local Fallback

**Primary Strategy:** OpenAI text-embedding-3-small API with local Transformers.js fallback
**Rationale:** Balances performance, cost, and mobile compatibility while providing offline functionality

**Key Components:**
- **Cloud (Primary):** OpenAI text-embedding-3-small for main indexing operations
- **Local (Fallback):** Transformers.js with all-MiniLM-L6-v2 for offline/incremental updates
- **Storage:** IndexedDB-based vector store (cross-platform, no native binaries)
- **Processing:** Web Workers for non-blocking UI during indexing

---

## 1. Cloud API Approaches

### Option 1A: OpenAI text-embedding-3-small (RECOMMENDED)

**Decision:** Primary embedding provider for cloud-based operations

**Rationale:**
- **Mobile Compatibility:** 100% - Pure HTTP API, works on all platforms
- **Performance:** Superior quality (44.0% MIRACL vs 31.4% for ada-002)
- **Cost-Effective:** $0.02 per 1M tokens (5x cheaper than ada-002)
  - Example: 500,000 documents (500 tokens each) = ~$5
  - New user $5 credit = ~250M tokens
- **Dimensions:** 1536 (adjustable via API parameter)
- **Batch Processing:** 50% discount available ($0.01 per 1M tokens)

**Implementation Notes:**
```typescript
// Example integration
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: settings.apiKey });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 768, // Optional: reduce for faster similarity search
  });
  return response.data[0].embedding;
}
```

**Performance Expectations:**
- Initial vault indexing: ~1-2 seconds per 100 notes (network dependent)
- Incremental updates: <500ms per note
- Batch processing recommended for initial index

**Limitations:**
- Requires internet connection
- API rate limits apply (tier-based)
- Privacy consideration: content sent to OpenAI servers

---

### Option 1B: OpenAI text-embedding-ada-002 (Legacy)

**Decision:** NOT RECOMMENDED - Superseded by text-embedding-3-small

**Rationale:**
- Higher cost ($0.10 per 1M tokens)
- Lower performance (61.0% vs 62.3% MTEB)
- Same mobile compatibility as 3-small
- No technical advantage over newer model

---

### Option 1C: Anthropic Claude Embeddings

**Decision:** NOT AVAILABLE

**Finding:** Anthropic does not offer its own embedding API. Official documentation recommends:
- **Voyage AI** as preferred partner (voyage-3.5, voyage-2, voyage-large-2)
- Contextual Retrieval technique (49% fewer failed retrievals)
- Integration examples available in Anthropic documentation

**Consideration for Future:** Could integrate Voyage AI as alternative provider if needed

---

## 2. Local Embedding Approaches

### Option 2A: Transformers.js + all-MiniLM-L6-v2 (RECOMMENDED FOR FALLBACK)

**Decision:** Primary local/offline embedding solution

**Rationale:**
- **Mobile Compatibility:** 95% - Runs via ONNX Runtime Web (WebAssembly)
- **Model Size:** 22-46MB (quantized versions available)
  - F32: 22MB
  - F16: 46MB
- **Dimensions:** 384 (smaller than OpenAI, faster similarity search)
- **Performance:** 14k sentences/second (desktop), 1-2s on mobile
- **Zero Cost:** Runs entirely client-side
- **Privacy:** No data leaves device

**Implementation Notes:**
```typescript
import { pipeline, env } from '@xenova/transformers';

// Configure for Obsidian plugin
env.allowLocalModels = false;
env.useBrowserCache = true;

let embedder: any = null;

async function initializeEmbedder() {
  embedder = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );
}

async function generateLocalEmbedding(text: string): Promise<number[]> {
  if (!embedder) await initializeEmbedder();

  const output = await embedder(text, {
    pooling: 'mean',
    normalize: true
  });

  return Array.from(output.data);
}
```

**WebGPU Acceleration (2025+):**
- **iOS:** Safari 26 (iOS 26) - Full WebGPU support
- **Android:** Chrome 121+ on Android 12+
- **Performance Boost:** 2-3x speedup with FP16 and DP4a optimizations

**Storage Strategy:**
- Cache model in IndexedDB after first download
- ~22-46MB one-time download per device
- Persists across app sessions

**Performance Expectations:**
- **Desktop:** 100-200 notes/second
- **Mobile (2024 devices):** 10-20 notes/second
- **Mobile (2025+ with WebGPU):** 30-50 notes/second

**Limitations:**
- Lower quality than OpenAI models (acceptable for most use cases)
- Initial model download required (~30-60s on mobile)
- Requires ~50-100MB memory during operation
- Different embedding space than OpenAI (can't mix embeddings)

---

### Option 2B: TensorFlow.js Universal Sentence Encoder

**Decision:** NOT RECOMMENDED - Inferior to Transformers.js

**Comparison:**
| Factor | Transformers.js | TensorFlow.js |
|--------|----------------|---------------|
| Model Size | 22-46MB | ~100MB |
| Mobile Performance | Better | Acceptable |
| Ecosystem | Growing rapidly | Mature but heavier |
| Obsidian Integration | Simpler | More complex |
| WebGPU Support | Yes (2025) | Yes |

**Rationale for Rejection:**
- Larger model size impacts mobile UX
- TensorFlow.js runtime adds overhead
- Transformers.js has better HuggingFace model ecosystem
- USE model quality comparable, not superior

---

### Option 2C: ONNX Runtime Web (Direct)

**Decision:** NOT RECOMMENDED - Transformers.js already uses ONNX Runtime

**Finding:** Transformers.js is built on ONNX Runtime Web, providing a higher-level API. Using ONNX Runtime directly offers no advantages for this use case and requires manual model conversion/loading.

---

## 3. Hybrid Approach (RECOMMENDED IMPLEMENTATION)

### Strategy: Intelligent Cloud/Local Routing

**Architecture:**
```
┌─────────────────────────────────────────┐
│         Embedding Manager                │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Strategy    │    │   Fallback   │  │
│  │   Detector    │───▶│    Logic     │  │
│  └──────────────┘    └──────────────┘  │
│         │                    │          │
│         ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   OpenAI     │    │Transformers.js│ │
│  │ text-embed-3 │    │ all-MiniLM   │  │
│  └──────────────┘    └──────────────┘  │
│         │                    │          │
└─────────┼────────────────────┼──────────┘
          │                    │
          ▼                    ▼
    ┌─────────────────────────────┐
    │   IndexedDB Vector Store    │
    │   (RxDB or EntityDB)        │
    └─────────────────────────────┘
```

**Decision Logic:**
1. **Initial Vault Indexing (1000+ notes):**
   - Use OpenAI batch API (50% discount)
   - Fallback to local if API unavailable

2. **Incremental Updates (1-10 notes):**
   - Check online status
   - If online: Use OpenAI (faster, better quality)
   - If offline: Use local Transformers.js

3. **User Preference:**
   - Privacy mode: Always use local
   - Performance mode: Always use OpenAI (if available)
   - Balanced mode: Auto-select based on conditions

**Implementation Example:**
```typescript
interface EmbeddingStrategy {
  type: 'cloud' | 'local';
  reason: string;
}

class HybridEmbeddingManager {
  private openaiClient?: OpenAI;
  private localEmbedder?: any;

  async selectStrategy(
    noteCount: number,
    isOnline: boolean,
    userPreference: 'privacy' | 'performance' | 'balanced'
  ): Promise<EmbeddingStrategy> {

    // Privacy mode always uses local
    if (userPreference === 'privacy') {
      return { type: 'local', reason: 'Privacy mode enabled' };
    }

    // Performance mode prefers cloud when available
    if (userPreference === 'performance' && isOnline && this.openaiClient) {
      return { type: 'cloud', reason: 'Best performance' };
    }

    // Balanced mode logic
    if (!isOnline) {
      return { type: 'local', reason: 'Offline' };
    }

    // Large batch? Use cloud for speed
    if (noteCount > 100 && this.openaiClient) {
      return { type: 'cloud', reason: 'Batch indexing' };
    }

    // Default to local for small updates
    return { type: 'local', reason: 'Small update, keeping it local' };
  }

  async embed(text: string, strategy: EmbeddingStrategy): Promise<number[]> {
    if (strategy.type === 'cloud') {
      return this.embedWithOpenAI(text);
    } else {
      return this.embedWithTransformers(text);
    }
  }
}
```

**Advantages:**
- Best of both worlds: quality + availability
- Graceful degradation when offline
- Cost optimization (use local for small updates)
- User control over privacy/performance tradeoffs

**Challenges:**
- **Embedding Space Mismatch:** OpenAI (1536d) vs all-MiniLM (384d)
  - Solution: Store embedding source metadata, rebuild when switching
- **Complexity:** More code to maintain
  - Mitigation: Clear abstractions, comprehensive testing

---

## 4. Storage Solutions

### Option 4A: IndexedDB-based Vector Store (RECOMMENDED)

**Decision:** Use IndexedDB with specialized vector library

**Recommended Libraries:**
1. **RxDB + Transformers.js** (Primary recommendation)
   - Mature NoSQL database for browser
   - Built-in IndexedDB support
   - Cross-platform (mobile + desktop)
   - Local-first architecture

2. **EntityDB** (Lightweight alternative)
   - Purpose-built for vector embeddings
   - Wraps IndexedDB + Transformers.js
   - Simpler API for RAG use cases

3. **Web Vector Storage** (WVS)
   - Lightweight vector database
   - Native similarity search
   - Good for smaller vaults (<10k notes)

**Implementation Approach:**
```typescript
import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

const db = await createRxDatabase({
  name: 'mnemosyne_vectors',
  storage: getRxStorageDexie()
});

await db.addCollections({
  embeddings: {
    schema: {
      version: 0,
      primaryKey: 'noteId',
      type: 'object',
      properties: {
        noteId: { type: 'string', maxLength: 100 },
        notePath: { type: 'string' },
        content: { type: 'string' },
        embedding: { type: 'array', items: { type: 'number' } },
        embeddingSource: { type: 'string', enum: ['openai', 'local'] },
        dimensions: { type: 'number' },
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' }
      }
    }
  }
});
```

**Storage Limits by Platform:**

| Platform | IndexedDB Limit | Notes |
|----------|----------------|-------|
| **Desktop Chrome** | ~60% of free disk space | Generous limits |
| **Desktop Firefox** | Prompts at 50MB, ~10GB max | User approval needed |
| **Desktop Safari** | ~1GB | More restrictive |
| **iOS Safari** | ~1GB | Can be cleared by OS under storage pressure |
| **Android Chrome** | ~20% of shared pool | Shared pool = 1/3 of available space |

**Capacity Estimates:**
- **OpenAI embeddings (1536d):** ~6KB per note (with metadata)
- **Local embeddings (384d):** ~1.5KB per note (with metadata)

| Vault Size | Storage (OpenAI) | Storage (Local) |
|------------|------------------|-----------------|
| 1,000 notes | ~6MB | ~1.5MB |
| 10,000 notes | ~60MB | ~15MB |
| 100,000 notes | ~600MB | ~150MB |

**Mobile Considerations:**
- iOS can clear IndexedDB when storage is low (warn users)
- Android more predictable but still subject to cleanup
- Implement periodic backup to vault folder (JSON export)
- Show storage usage in plugin settings

---

### Option 4B: SQLite (better-sqlite3)

**Decision:** NOT COMPATIBLE WITH MOBILE

**Findings:**
- Requires platform-specific native binaries
- Possible on desktop (Windows, macOS, Linux)
- NOT AVAILABLE on iOS/Android without significant workarounds
- WASM alternatives exist but add complexity

**Conclusion:** IndexedDB is the only practical cross-platform storage solution for Obsidian plugins.

---

## 5. UI Performance Strategy

### Non-Blocking Indexing with Web Workers

**Decision:** Mandatory for mobile UX

**Rationale:**
- Obsidian runs in WebView on mobile (performance-sensitive)
- Embedding generation is CPU-intensive
- UI must remain responsive during indexing

**Implementation:**
```typescript
// embedding-worker.ts (Web Worker)
import { pipeline } from '@xenova/transformers';

let embedder: any = null;

self.onmessage = async (e) => {
  const { action, text, model } = e.data;

  if (action === 'init') {
    embedder = await pipeline('feature-extraction', model);
    self.postMessage({ type: 'ready' });
  }

  if (action === 'embed') {
    const embedding = await embedder(text, {
      pooling: 'mean',
      normalize: true
    });
    self.postMessage({
      type: 'result',
      embedding: Array.from(embedding.data)
    });
  }
};

// main.ts (Plugin)
class EmbeddingService {
  private worker: Worker;

  async initialize() {
    this.worker = new Worker(
      new URL('./embedding-worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Wait for worker ready
    await new Promise(resolve => {
      this.worker.onmessage = (e) => {
        if (e.data.type === 'ready') resolve(null);
      };
    });

    this.worker.postMessage({
      action: 'init',
      model: 'Xenova/all-MiniLM-L6-v2'
    });
  }

  async embed(text: string): Promise<number[]> {
    return new Promise((resolve) => {
      this.worker.onmessage = (e) => {
        if (e.data.type === 'result') {
          resolve(e.data.embedding);
        }
      };

      this.worker.postMessage({ action: 'embed', text });
    });
  }
}
```

**Performance Characteristics:**
- Worker initialization: ~40ms overhead
- Message passing: 0-1ms (negligible)
- Transferable objects: Zero-copy for large arrays
- Main thread stays responsive: UI at 60fps during indexing

**Progress Indication:**
```typescript
async function indexVault(notes: TFile[], onProgress: (progress: number) => void) {
  const batchSize = 10; // Process 10 notes at a time

  for (let i = 0; i < notes.length; i += batchSize) {
    const batch = notes.slice(i, i + batchSize);

    await Promise.all(
      batch.map(note => this.embedNote(note))
    );

    const progress = Math.min(100, ((i + batchSize) / notes.length) * 100);
    onProgress(progress);

    // Yield to UI thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

---

## 6. Markdown-Specific Considerations

### Chunking Strategy

**Recommended Approach:** Markdown-aware recursive chunking

**Parameters:**
- **Chunk Size:** 400-512 tokens (with 10-20% overlap)
- **Splitters:** Prioritize markdown structure
  1. `##` Headers (primary split point)
  2. Paragraph breaks (`\n\n`)
  3. Sentence boundaries (`.`, `!`, `?`)
  4. Hard limit at 512 tokens

**Rationale:**
- Markdown has natural semantic boundaries (headers)
- 400-512 tokens balances context vs. precision
- Overlap ensures continuity across chunks

**Implementation Example:**
```typescript
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 50,
  separators: [
    '\n## ',      // H2 headers
    '\n### ',     // H3 headers
    '\n#### ',    // H4 headers
    '\n\n',       // Paragraphs
    '\n',         // Lines
    '. ',         // Sentences
    '',           // Characters
  ]
});

async function chunkNote(content: string, notePath: string): Promise<Chunk[]> {
  const chunks = await splitter.createDocuments([content], [{
    source: notePath
  }]);

  return chunks.map((chunk, i) => ({
    id: `${notePath}#chunk-${i}`,
    content: chunk.pageContent,
    metadata: {
      ...chunk.metadata,
      chunkIndex: i,
      totalChunks: chunks.length
    }
  }));
}
```

**Edge Cases:**
- **Very long notes (>10k tokens):** Split into multiple chunks
- **Short notes (<100 tokens):** Embed as-is, no chunking
- **Code blocks:** Preserve intact (don't split mid-code)
- **Lists:** Keep list items together when possible

---

## 7. Cost Analysis

### Scenario: 10,000-note vault, initial indexing + 6 months maintenance

| Approach | Initial Cost | Monthly Cost | 6-Month Total | Notes |
|----------|-------------|--------------|---------------|-------|
| **OpenAI Only** | $2.50 | $0.50 | $5.50 | Assumes 500 tokens/note, 100 updates/month |
| **Local Only** | $0 | $0 | $0 | Free, but slower initial index |
| **Hybrid (Recommended)** | $2.50 | $0.10 | $3.10 | Batch initial with OpenAI, local for updates |

**Hybrid Optimization:**
- Use OpenAI batch API (50% discount) for initial index: $1.25
- Use local embeddings for incremental updates: $0
- Occasional re-indexing with OpenAI: $0.10/month

**Conclusion:** Hybrid approach saves ~$2.40 over 6 months while maintaining quality.

---

## 8. Offline & Fallback Strategies

### Comprehensive Fallback Chain

**Scenario 1: Internet Available, API Key Present**
→ Use OpenAI text-embedding-3-small

**Scenario 2: Internet Available, No API Key**
→ Prompt user for API key, fallback to local if declined

**Scenario 3: Internet Unavailable, Local Model Cached**
→ Use Transformers.js (seamless offline operation)

**Scenario 4: Internet Unavailable, Local Model NOT Cached**
→ Show error: "Download required. Please connect to internet to initialize local embeddings."

**Scenario 5: Mobile, Low Storage (<100MB free)**
→ Warn user, offer cloud-only mode (no local model download)

**Scenario 6: API Rate Limited**
→ Exponential backoff, queue requests, switch to local temporarily

**User Experience:**
```typescript
interface EmbeddingStatus {
  mode: 'cloud' | 'local' | 'unavailable';
  reason: string;
  canIndex: boolean;
  needsSetup: boolean;
}

async function getEmbeddingStatus(): Promise<EmbeddingStatus> {
  const isOnline = navigator.onLine;
  const hasApiKey = !!settings.openaiApiKey;
  const hasLocalModel = await checkLocalModelCached();
  const hasStorage = await checkStorageAvailable(100 * 1024 * 1024); // 100MB

  if (isOnline && hasApiKey) {
    return {
      mode: 'cloud',
      reason: 'Using OpenAI for best quality',
      canIndex: true,
      needsSetup: false
    };
  }

  if (hasLocalModel) {
    return {
      mode: 'local',
      reason: isOnline ? 'Offline mode' : 'Using local model (no API key)',
      canIndex: true,
      needsSetup: false
    };
  }

  if (!isOnline) {
    return {
      mode: 'unavailable',
      reason: 'Local model not cached. Connect to internet to download.',
      canIndex: false,
      needsSetup: true
    };
  }

  if (!hasStorage) {
    return {
      mode: 'cloud',
      reason: 'Low storage. Using cloud-only mode.',
      canIndex: hasApiKey,
      needsSetup: !hasApiKey
    };
  }

  // Default: offer to download local model
  return {
    mode: 'unavailable',
    reason: 'Setup required',
    canIndex: false,
    needsSetup: true
  };
}
```

---

## 9. Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Set up IndexedDB vector store (RxDB)
- [ ] Implement Web Worker for embeddings
- [ ] Create embedding manager interface
- [ ] Add chunking logic for markdown

### Phase 2: OpenAI Integration (Week 2-3)
- [ ] OpenAI API client setup
- [ ] Batch processing for initial indexing
- [ ] Rate limiting and retry logic
- [ ] Cost tracking and budgets

### Phase 3: Local Embeddings (Week 3-4)
- [ ] Integrate Transformers.js
- [ ] Model download and caching
- [ ] Web Worker implementation
- [ ] Performance optimization for mobile

### Phase 4: Hybrid Logic (Week 4-5)
- [ ] Strategy selection algorithm
- [ ] Fallback handling
- [ ] Online/offline detection
- [ ] User preference system

### Phase 5: UI & UX (Week 5-6)
- [ ] Settings panel for embedding config
- [ ] Progress indicators during indexing
- [ ] Status display (cloud/local mode)
- [ ] Error messages and troubleshooting

### Phase 6: Testing & Optimization (Week 6-8)
- [ ] Mobile testing (iOS 16.4+, Android 12+)
- [ ] Performance benchmarking
- [ ] Storage limit testing
- [ ] Offline mode validation
- [ ] Large vault testing (10k+ notes)

---

## 10. Risk Assessment & Mitigation

### Risk 1: iOS Storage Eviction
**Impact:** High - Users lose entire vector index
**Probability:** Medium - Happens under storage pressure
**Mitigation:**
- Periodic auto-backup to vault folder (`.mnemosyne/embeddings-backup.json`)
- Detect missing embeddings on startup, offer re-indexing
- Show storage usage warnings in settings

### Risk 2: OpenAI API Costs Runaway
**Impact:** Medium - Unexpected user charges
**Probability:** Low - Small vault updates are cheap
**Mitigation:**
- Set monthly cost budgets in settings
- Warn when approaching budget limit
- Automatically switch to local mode when exceeded
- Show cost estimate before batch operations

### Risk 3: Local Model Performance on Low-End Devices
**Impact:** Medium - Slow/poor UX
**Probability:** Medium - Budget phones still common
**Mitigation:**
- Performance benchmarking on load
- Recommend cloud mode for slower devices
- Adjustable batch sizes based on device performance
- Skip indexing during active editing

### Risk 4: Embedding Space Mismatch (Hybrid Mode)
**Impact:** High - Incorrect search results
**Probability:** Medium - Users switch modes
**Mitigation:**
- Store embedding source metadata with each vector
- Detect mismatch, offer full re-indexing
- Warn user when switching embedding providers
- Clear UI indication of current mode

### Risk 5: WebGPU Not Available (Older Devices)
**Impact:** Low - Slower performance, not broken
**Probability:** High - iOS 26, Android 12+ adoption not universal
**Mitigation:**
- Fallback to WebAssembly (WASM)
- Already supported by Transformers.js
- Performance still acceptable (10-20 notes/sec)

---

## 11. Testing Strategy

### Unit Tests
- [ ] Embedding generation (cloud + local)
- [ ] Chunking logic (various markdown structures)
- [ ] Vector storage CRUD operations
- [ ] Similarity search accuracy

### Integration Tests
- [ ] End-to-end indexing workflow
- [ ] Cloud/local fallback switching
- [ ] Offline mode functionality
- [ ] Web Worker communication

### Mobile Tests (Critical)
- [ ] **iOS 16.4:** Safari WebView, IndexedDB limits, storage eviction
- [ ] **Android 12+:** Chrome WebView, performance on budget devices
- [ ] **iOS 26+:** WebGPU acceleration validation
- [ ] **Android 13+:** WebGPU acceleration validation

### Performance Benchmarks
| Metric | Target (Desktop) | Target (Mobile) | Measurement |
|--------|------------------|-----------------|-------------|
| Initial indexing (1000 notes) | <60s | <180s | Time to complete |
| Incremental update (1 note) | <500ms | <2s | Embedding + storage |
| Similarity search (10k vectors) | <100ms | <500ms | Query to results |
| UI responsiveness during indexing | 60fps | 30fps | Frame rate |

### Stress Tests
- [ ] 50,000-note vault indexing
- [ ] 100 concurrent embedding requests
- [ ] Storage limit scenarios (99% disk full)
- [ ] 24-hour offline operation

---

## 12. Alternative Approaches Considered

### A. Local-Only with Ollama
**Why Rejected:** Requires separate Ollama server installation, not truly "mobile-first"

### B. Edge Functions (Cloudflare Workers, etc.)
**Why Rejected:** Adds deployment complexity, cost, latency - defeats purpose of local-first Obsidian

### C. WebLLM (Browser-based LLMs)
**Why Rejected:** Too large for practical mobile deployment (multi-GB models)

### D. Custom BERT Fine-Tuning
**Why Rejected:** Requires ML expertise, model hosting, no advantage over existing solutions

### E. BM25 (Keyword-based)
**Why Rejected:** Not semantic search, outdated for RAG applications (though could complement as hybrid)

---

## 13. References & Resources

### Documentation
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Transformers.js GitHub](https://github.com/xenova/transformers.js)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [RxDB Documentation](https://rxdb.info/)
- [Obsidian Mobile Development](https://docs.obsidian.md/Plugins/Getting+started/Mobile+development)

### Academic Papers
- "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks" (2019)
- "Text and Code Embeddings by Contrastive Pre-Training" (OpenAI, 2022)

### Tools & Libraries
- `@xenova/transformers` (npm)
- `openai` (npm)
- `rxdb` (npm)
- `langchain/text_splitter` (npm)

### Community Examples
- [EntityDB: In-browser vector database](https://github.com/babycommando/entity-db)
- [Web Vector Storage](https://github.com/lestan/web-vector-storage)
- [Smart2Brain Obsidian Plugin](https://github.com/your-papa/obsidian-Smart2Brain)

---

## 14. Open Questions for Product Decision

1. **Default Mode:** Should plugin default to cloud (OpenAI) or local (Transformers.js)?
   - **Recommendation:** Wizard on first launch, ask user preference

2. **API Key Requirement:** Require OpenAI API key or make optional?
   - **Recommendation:** Optional, offer local-only mode for privacy-conscious users

3. **Storage Limits:** Warn users proactively about IndexedDB limits?
   - **Recommendation:** Yes, show storage usage in settings, warn at 80% capacity

4. **Re-indexing Frequency:** Auto re-index entire vault periodically?
   - **Recommendation:** No auto full re-index. Incremental only. User-triggered for full.

5. **Embedding Dimensions:** Offer adjustable dimensions for OpenAI (512/768/1536)?
   - **Recommendation:** Yes, advanced setting. Default to 768 (balance quality/performance)

---

## Conclusion

The **hybrid approach using OpenAI text-embedding-3-small (primary) + Transformers.js with all-MiniLM-L6-v2 (fallback)** provides the optimal balance of:

- **Quality:** OpenAI's superior embeddings when available
- **Availability:** Offline functionality via local embeddings
- **Performance:** Web Workers prevent UI blocking
- **Cost:** Optimized with batch processing and local incremental updates
- **Compatibility:** 100% mobile support (iOS 16.4+, Android 12+)
- **Privacy:** User choice between cloud and local-only modes
- **Storage:** IndexedDB works universally without native dependencies

This architecture supports the Mnemosyne AI Platform's goal of providing a powerful RAG system that works seamlessly across all Obsidian platforms while respecting user preferences for privacy, cost, and performance.

---

**Next Steps:**
1. Review this research with stakeholders
2. Finalize embedding strategy configuration
3. Begin Phase 1 implementation (Core Infrastructure)
4. Set up mobile testing environment (iOS 16.4, Android 12 devices)