# OpenClaw Memory Integration

**Integration of Code-Voyager and SimpleMem into OpenClaw**

This spec document outlines the integration of two powerful memory systems into OpenClaw:

- **Code-Voyager**: Session Brain, Curriculum Planner, Skill Factory, Skill Retrieval
- **SimpleMem**: Semantic compression, multi-view indexing, adaptive retrieval

## Documents

- [planning/requirements.md](./planning/requirements.md) - User stories and requirements
- [spec.md](./spec.md) - Technical specification
- [tasks.md](./tasks.md) - Implementation breakdown (13 iterations)

## Status

**Phase**: Ready for Implementation  
**Estimated Effort**: 13 iterations (~4-6 weeks)  
**Priority**: High (enhances core memory/compaction)

## Key Insight: Extend, Don't Replace

OpenClaw already has extensive memory infrastructure:

- ✅ Vector search via embeddings (`src/agents/memory-search.ts`)
- ✅ Full CLI (`openclaw memory status/index/search`)
- ✅ SQLite storage with vector index
- ✅ Config schema (`agents.defaults.memorySearch`)

**This integration extends existing systems**, not builds parallel ones.

## Key Features

| Feature         | Extends         | Description                                |
| --------------- | --------------- | ------------------------------------------ |
| Session Brain   | New             | Persistent goals/decisions across sessions |
| Atomic Facts    | Existing memory | Structured facts instead of flat summaries |
| Semantic Recall | Existing search | Natural language search over history       |
| Skill Factory   | Existing skills | Auto-generate skills from workflows        |
| Curriculum      | New             | Generate onboarding roadmaps               |

## Implementation Strategy

1. **Phase 1**: Session Brain (3 iter) - New brain store + hooks into existing CLI
2. **Phase 2**: Atomic Facts (4 iter) - Extend existing memory search + SQLite
3. **Phase 3**: Skill Intelligence (3 iter) - Build on existing skills platform
4. **Phase 4**: Curriculum + Polish (3 iter) - Wizard integration

## Source Projects

- `/Users/rna/Desktop/openclaw-main/code-voyager/` - Code-Voyager
- `/Users/rna/Desktop/openclaw-main/code-voyager/SimpleMem-main/` - SimpleMem
