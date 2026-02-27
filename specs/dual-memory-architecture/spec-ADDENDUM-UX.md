# Dual-Memory Architecture Spec - UX/UI Addendum

> **Purpose**: Incorporate specific UI/UX improvements from Code Voyager + SimpleMem analysis  
> **Status**: Addendum to main spec.md

---

## Additional Requirements (AR-X Series)

These requirements supplement the main SR-1 through SR-5 in `spec.md`.

---

## AR-1: Streaming Skill Activation Dashboard

**From**: UI/UX Improvement 3.1.A - Streaming Skill Activation Dashboard

### Requirement

Create WebSocket-connected skill progress UI for Code Voyager skills, replacing console-only output.

### Implementation

```typescript
// File: src/skills/skill-orchestrator.ts (lines 1-200)
interface SkillStreamEvent {
  skill: "curriculum-planner" | "skill-factory" | "skill-refinement";
  stage: "analysis" | "generation" | "validation";
  progress: number; // 0-100
  artifacts: string[]; // Generated files
  estimatedTimeMs: number;
  checkpoint: string; // Human-readable status
}

class SkillOrchestrator {
  private ws: WebSocket;

  async streamSkillExecution(
    skill: string,
    context: SkillContext,
  ): AsyncGenerator<SkillStreamEvent> {
    // Integrate with existing ProgressBridge pattern
    // from quantumreef-orchestrator.md

    for await (const event of this.executeSkill(skill, context)) {
      // Throttle to 500ms (per ProgressBridge)
      yield this.throttle(event, 500);

      // Send via WebSocket for real-time UI updates
      this.ws.send(
        JSON.stringify({
          type: "skill.progress",
          payload: event,
        }),
      );
    }
  }
}
```

### UI Component

```typescript
// File: src/ui/SkillProgressPanel.tsx (lines 1-380)
// VS Code extension side panel

interface SkillProgressPanelProps {
  activeSkills: SkillStreamEvent[];
  completedSkills: SkillStreamEvent[];
}

export const SkillProgressPanel: React.FC<SkillProgressPanelProps> = ({
  activeSkills,
  completedSkills
}) => {
  return (
    <div className="skill-progress-panel">
      <h3>Active Skills</h3>
      {activeSkills.map(skill => (
        <SkillCard
          key={skill.skill}
          name={skill.skill}
          progress={skill.progress}
          stage={skill.stage}
          estimatedTime={skill.estimatedTimeMs}
          artifacts={skill.artifacts}
        />
      ))}

      <h3>Completed</h3>
      {completedSkills.map(skill => (
        <CompletedSkillCard
          key={skill.skill}
          skill={skill}
          onViewArtifacts={() => openFiles(skill.artifacts)}
        />
      ))}
    </div>
  );
};
```

### Tasks

**Group 6: Skill Streaming** (adds 1 iteration)

- [ ] **Task 6.1**: Implement `SkillOrchestrator` with WebSocket streaming
- [ ] **Task 6.2**: Create `SkillProgressPanel` React component (< 400 lines)
- [ ] **Task 6.3**: Integrate with existing ProgressBridge throttling
- [ ] **Task 6.4**: Add VS Code extension panel registration

**Tests** (3 tests):

- [ ] Events stream correctly via WebSocket
- [ ] Throttling respects 500ms limit
- [ ] Panel renders skill progress accurately

---

## AR-2: Contextual Skill Suggestions

**From**: UI/UX Improvement 3.1.B - Contextual Skill Suggestions

### Requirement

Proactive skill suggestions based on current activity, eliminating need to remember trigger phrases.

### Implementation

```yaml
# File: ~/.clawtopus/skill-suggestions.yaml
context_triggers:
  - pattern: "refactor.*component"
    suggest: "skill-factory:extract-component"
    confidence_threshold: 0.75
    description: "Extract repeated component patterns into reusable skill"

  - pattern: "new.*feature"
    suggest: "curriculum-planner:analyze-tech-stack"
    confidence_threshold: 0.8
    description: "Analyze project tech stack for learning curriculum"

  - pattern: "auth|login|password|jwt"
    suggest: "skill-factory:extract-auth-patterns"
    confidence_threshold: 0.7
    description: "Extract authentication patterns as reusable skill"

  - pattern: "test.*suite|e2e|integration"
    suggest: "curriculum-planner:test-strategy"
    confidence_threshold: 0.75
    description: "Create testing strategy curriculum"
```

```typescript
// File: src/skills/skill-suggestion-engine.ts (lines 1-250)
interface SkillSuggestion {
  skill: string;
  confidence: number;
  trigger: string;
  description: string;
}

export class SkillSuggestionEngine {
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  async analyzeContext(
    conversationHistory: string[],
    currentFile?: string,
  ): Promise<SkillSuggestion[]> {
    // 1. Load context triggers
    const triggers = await this.loadTriggers();

    // 2. Analyze conversation + current file
    const context = conversationHistory.join("\n");
    if (currentFile) {
      context += `\n${await this.readFile(currentFile)}`;
    }

    // 3. Match patterns
    const matches: SkillSuggestion[] = [];
    for (const trigger of triggers) {
      const regex = new RegExp(trigger.pattern, "i");
      if (regex.test(context)) {
        const confidence = this.calculateConfidence(context, trigger);
        if (confidence >= trigger.confidence_threshold) {
          matches.push({
            skill: trigger.suggest,
            confidence,
            trigger: trigger.pattern,
            description: trigger.description,
          });
        }
      }
    }

    // 4. Sort by confidence
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  async notifyUser(suggestions: SkillSuggestion[]): Promise<void> {
    // Show notification in VS Code
    const topSuggestion = suggestions[0];
    const action = await vscode.window.showInformationMessage(
      `💡 Suggested: ${topSuggestion.description}`,
      "Activate Skill",
      "View All Suggestions",
      "Dismiss",
    );

    if (action === "Activate Skill") {
      await this.activateSkill(topSuggestion.skill);
    } else if (action === "View All Suggestions") {
      await this.showSuggestionsPanel(suggestions);
    }
  }
}
```

### Tasks

**Group 7: Skill Suggestions** (adds 1 iteration)

- [ ] **Task 7.1**: Create `skill-suggestions.yaml` template
- [ ] **Task 7.2**: Implement `SkillSuggestionEngine`
- [ ] **Task 7.3**: Add VS Code notification integration
- [ ] **Task 7.4**: Create suggestions panel UI

**Tests** (3 tests):

- [ ] Pattern matching works for all trigger types
- [ ] Confidence calculation respects thresholds
- [ ] Notifications show correctly in VS Code

---

## AR-3: Glass Box Memory Explorer

**From**: UI/UX Improvement 3.1.C - Glass Box Memory Explorer

### Requirement

Visible skill decision tree in `memory_bank/SKILL_DECISIONS.md` for full transparency.

### Implementation

```markdown
<!-- Auto-generated: memory_bank/SKILL_DECISIONS.md -->

# Skill Factory Decisions

> **Glass Box Transparency**: All skill extractions, acceptances, and rejections are logged here.
> **Last Updated**: 2026-02-27T12:00:00Z

---

## Accepted Skills

### 2025-02-27: "react-form-validation" Skill

- **Status**: ✅ ACCEPTED (auto-applied)
- **Trigger**: Repeated form validation patterns detected
- **Source Files**:
  - `src/auth/login-form.tsx` (lines 45-78)
  - `src/profile/edit-form.tsx` (lines 23-56)
  - `src/checkout/payment-form.tsx` (lines 12-45)
- **Pattern Confidence**: 0.89
- **Generated Skill**: `.clawtopus/skills/react-form-validation.yaml`
- **User Action**: Accepted suggestion on 2025-02-27T10:30:00Z

### 2025-02-25: "api-error-handler" Skill

- **Status**: ✅ ACCEPTED (manual)
- **Trigger**: Consistent error handling in API layer
- **Source Files**:
  - `src/api/client.ts` (lines 89-112)
  - `src/api/interceptors.ts` (lines 23-45)
- **Pattern Confidence**: 0.82
- **User Action**: User manually invoked extract-skill

---

## Declined Skills

### 2025-02-26: "axios-retry" Skill

- **Status**: ❌ DECLINED
- **Trigger**: Similar error handling in API calls
- **Source Files**:
  - `src/api/client.ts` (error handler only)
- **Pattern Confidence**: 0.45
- **Decline Reason**: Pattern too generic (applied to <50% of cases)
- **User Action**: Declined suggestion on 2025-02-26T14:20:00Z
- **Archive Location**: `.clawtopus/skills/archive/axios-retry.yaml`

---

## Pending Review

### 2025-02-27: "typescript-utility-types" Skill

- **Status**: ⏳ PENDING
- **Trigger**: Repeated utility type patterns
- **Pattern Confidence**: 0.76
- **Waiting for**: User approval (notification sent)
```

```typescript
// File: src/skills/skill-decision-logger.ts (lines 1-200)
interface SkillDecision {
  timestamp: Date;
  skillName: string;
  status: "accepted" | "declined" | "pending";
  trigger: string;
  sourceFiles: string[];
  confidence: number;
  userAction?: string;
  declineReason?: string;
}

export class SkillDecisionLogger {
  async logDecision(decision: SkillDecision): Promise<void> {
    // Update SKILL_DECISIONS.md
    const decisionsPath = path.join(this.memoryBankPath, "SKILL_DECISIONS.md");

    const entry = this.formatDecisionEntry(decision);
    await this.prependToFile(decisionsPath, entry);

    // Also log to pm-ledger for audit trail
    await this.logToPMLedger(decision);
  }

  private formatDecisionEntry(d: SkillDecision): string {
    return `
### ${d.timestamp.toISOString().split("T")[0]}: "${d.skillName}" Skill
- **Status**: ${this.getStatusEmoji(d.status)} ${d.status.toUpperCase()}
- **Trigger**: ${d.trigger}
- **Source Files**:
${d.sourceFiles.map((f) => `  - \`${f}\``).join("\n")}
- **Pattern Confidence**: ${d.confidence.toFixed(2)}
${d.userAction ? `- **User Action**: ${d.userAction}` : ""}
${d.declineReason ? `- **Decline Reason**: ${d.declineReason}` : ""}
`;
  }
}
```

### Tasks

**Group 8: Glass Box Logging** (adds 0.5 iteration)

- [ ] **Task 8.1**: Create `SKILL_DECISIONS.md` template
- [ ] **Task 8.2**: Implement `SkillDecisionLogger`
- [ ] **Task 8.3**: Integrate with Skill Factory accept/decline flow

**Tests** (2 tests):

- [ ] Decisions logged in correct format
- [ ] Prepend maintains reverse-chronological order

---

## AR-4: Memory Health Dashboard

**From**: UI/UX Improvement 3.2.A - Memory Health Dashboard

### Requirement

Real-time memory statistics panel for Glass Box visibility into SimpleMem operations.

### Implementation

```typescript
// File: src/ui/MemoryHealthPanel.tsx (lines 1-380)
interface MemoryMetrics {
  // Storage
  atomicEntries: number;
  compressedRatio: number;  // e.g., 0.43 = 43% compression
  storageUsedBytes: number;

  // Retrieval Performance
  avgRetrievalTimeMs: number;
  cacheHitRate: number;

  // Quality
  duplicateDetectionRate: number;
  semanticDriftScore: number;  // How much memory diverges from current context
}

export const MemoryHealthPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<MemoryMetrics | null>(null);

  useEffect(() => {
    // Poll metrics every 5 seconds
    const interval = setInterval(async () => {
      const m = await fetchMemoryMetrics();
      setMetrics(m);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <Loading />;

  return (
    <div className="memory-health-panel">
      <h2>🧠 Memory Health</h2>

      <Section title="Storage">
        <Metric
          label="Atomic Entries"
          value={metrics.atomicEntries}
        />
        <Metric
          label="Compression Ratio"
          value={`${(metrics.compressedRatio * 100).toFixed(1)}%`}
          status={metrics.compressedRatio > 0.4 ? 'good' : 'warning'}
        />
        <Metric
          label="Storage Used"
          value={formatBytes(metrics.storageUsedBytes)}
        />
      </Section>

      <Section title="Performance">
        <Metric
          label="Avg Retrieval Time"
          value={`${metrics.avgRetrievalTimeMs.toFixed(0)}ms`}
          status={metrics.avgRetrievalTimeMs < 100 ? 'good' : 'warning'}
        />
        <Metric
          label="Cache Hit Rate"
          value={`${(metrics.cacheHitRate * 100).toFixed(1)}%`}
          status={metrics.cacheHitRate > 0.8 ? 'good' : 'warning'}
        />
      </Section>

      <Section title="Quality">
        <Metric
          label="Duplicate Detection"
          value={`${(metrics.duplicateDetectionRate * 100).toFixed(1)}%`}
        />
        <Metric
          label="Semantic Drift"
          value={metrics.semanticDriftScore.toFixed(2)}
          status={metrics.semanticDriftScore < 0.3 ? 'good' : 'warning'}
        />
      </Section>

      <Actions>
        <Button onClick={runMemoryOptimization}>Optimize Storage</Button>
        <Button onClick={exportMemoryReport}>Export Report</Button>
      </Actions>
    </div>
  );
};
```

```python
# File: openclaw/memory_metrics.py
class MemoryMetricsCollector:
    """Collects metrics from SimpleMem for dashboard display."""

    def collect_metrics(self) -> MemoryMetrics:
        return MemoryMetrics(
            atomic_entries=self.simplemem.count_entries(),
            compressed_ratio=self.calculate_compression_ratio(),
            storage_used_bytes=self.get_storage_size(),
            avg_retrieval_time_ms=self.measure_retrieval_time(),
            cache_hit_rate=self.simplemem.cache.hit_rate(),
            duplicate_detection_rate=self.simplemem.deduplication.rate(),
            semantic_drift_score=self.calculate_semantic_drift()
        )

    def calculate_compression_ratio(self) -> float:
        original_size = sum(e.original_size for e in self.simplemem.entries)
        compressed_size = sum(e.compressed_size for e in self.simplemem.entries)
        return 1 - (compressed_size / original_size) if original_size > 0 else 0
```

### Tasks

**Group 9: Memory Dashboard** (adds 1 iteration)

- [ ] **Task 9.1**: Create `MemoryMetricsCollector` Python bridge
- [ ] **Task 9.2**: Implement `MemoryHealthPanel` React component (< 400 lines)
- [ ] **Task 9.3**: Add real-time polling (5 second interval)
- [ ] **Task 9.4**: Create metric status indicators (good/warning/critical)

**Tests** (3 tests):

- [ ] Metrics calculate correctly
- [ ] Panel updates in real-time
- [ ] Status indicators show correct colors

---

## AR-5: Semantic Memory Timeline

**From**: UI/UX Improvement 3.2.B - Semantic Memory Timeline

### Requirement

Visual timeline with semantic clustering for memory navigation.

### Implementation

```typescript
// File: src/ui/MemoryTimeline.tsx (lines 1-380)
interface TimelineCluster {
  id: string;
  label: string;  // e.g., "Auth Patterns"
  startDate: Date;
  endDate: Date;
  entries: MemoryEntry[];
  relatedClusters: string[];  // Cross-cutting concerns
}

export const MemoryTimeline: React.FC = () => {
  const [clusters, setClusters] = useState<TimelineCluster[]>([]);

  useEffect(() => {
    loadTimelineClusters().then(setClusters);
  }, []);

  return (
    <div className="memory-timeline">
      <h2>📅 Memory Timeline</h2>

      <TimelineAxis>
        <Marker label="Project Start" position={0} />
        {clusters.map((cluster, i) => (
          <TimelineCluster
            key={cluster.id}
            label={cluster.label}
            position={calculatePosition(cluster.startDate)}
            width={calculateWidth(cluster.startDate, cluster.endDate)}
            entries={cluster.entries.length}
            onClick={() => showClusterDetails(cluster)}
          />
        ))}
        <Marker label="Now" position={100} />
      </TimelineAxis>

      <CrossCuttingConcerns>
        <h3>🔗 Cross-Cutting Concerns</h3>
        {findCrossCuttingPatterns(clusters).map(pattern => (
          <PatternLink
            key={pattern.id}
            clusters={pattern.clusters}
            description={pattern.description}
          />
        ))}
      </CrossCuttingConcerns>
    </div>
  );
};

// Visualization:
// [Project Start] ──[Sprint 1]────[Sprint 2]────[Now]
//      │              │              │            │
//    ┌─┴─┐          ┌─┴─┐          ┌─┴─┐        ┌─┴─┐
//    │Auth│          │API│          │UI │        │Deploy│
//    │Patterns│      │Integration│  │Components│  │Config│
//    └─────┘        └─────┘      └─────┘      └─────┘
//        \              |              /            /
//         \____________|_____________/            /
//                 \___________|_________________/
//                             |
//                     [Cross-cutting Concerns]
//                     (deduplicated automatically)
```

### Tasks

**Group 10: Memory Timeline** (adds 1 iteration)

- [ ] **Task 10.1**: Implement semantic clustering algorithm
- [ ] **Task 10.2**: Create `MemoryTimeline` React component (< 400 lines)
- [ ] **Task 10.3**: Add cross-cutting concern detection
- [ ] **Task 10.4**: Implement cluster detail view

**Tests** (3 tests):

- [ ] Clusters group related entries correctly
- [ ] Timeline renders in chronological order
- [ ] Cross-cutting patterns identified accurately

---

## AR-6: Memory Importance Controls

**From**: UI/UX Improvement 3.2.C - Memory Importance Controls

### Requirement

User can "pin" or "archive" memories for priority control.

### Implementation

```typescript
// Extend SimpleMem's AtomicEntry interface
// File: src/memory/clawtopus-entry.ts

interface ClawtopusAtomicEntry extends AtomicEntry {
  userPriority: 'pinned' | 'normal' | 'archive';
  // Pinned: Always included in context
  // Normal: Standard retrieval
  // Archive: Excluded unless explicitly queried

  retentionPolicy: {
    expiresAt?: Date;  // Auto-archive after date
    keepIfReferenced: boolean;  // Keep if other entries reference it
  };

  // Metadata for UI
  pinnedAt?: Date;
  archivedAt?: Date;
  pinReason?: string;
}

// File: src/ui/MemoryControls.tsx (lines 1-250)
interface MemoryControlsProps {
  entry: ClawtopusAtomicEntry;
  onPriorityChange: (priority: 'pinned' | 'normal' | 'archive') => void;
  onRetentionChange: (policy: RetentionPolicy) => void;
}

export const MemoryControls: React.FC<MemoryControlsProps> = ({
  entry,
  onPriorityChange,
  onRetentionChange
}) => {
  return (
    <div className="memory-controls">
      <PrioritySelector
        value={entry.userPriority}
        onChange={onPriorityChange}
        options={[
          { value: 'pinned', label: '📌 Pinned', description: 'Always include in context' },
          { value: 'normal', label: '📄 Normal', description: 'Standard retrieval' },
          { value: 'archive', label: '🗄️ Archive', description: 'Exclude unless queried' }
        ]}
      />

      {entry.userPriority === 'pinned' && (
        <PinReasonInput
          value={entry.pinReason}
          onChange={(reason) => updateEntry({ ...entry, pinReason: reason })}
        />
      )}

      <RetentionPolicyEditor
        policy={entry.retentionPolicy}
        onChange={onRetentionChange}
      />
    </div>
  );
};

// Retrieval modification
class PriorityAwareRetrieval {
  async retrieve(query: string, options: RetrievalOptions): Promise<Entry[]> {
    const allEntries = await this.simplemem.ask(query, return_raw=True);

    // Filter by priority
    const filtered = allEntries.filter(e => {
      if (e.userPriority === 'archive' && !options.includeArchived) {
        return false;
      }
      return true;
    });

    // Sort: pinned first, then by relevance
    return filtered.sort((a, b) => {
      if (a.userPriority === 'pinned' && b.userPriority !== 'pinned') return -1;
      if (b.userPriority === 'pinned' && a.userPriority !== 'pinned') return 1;
      return b.relevance - a.relevance;
    });
  }
}
```

### Tasks

**Group 11: Memory Controls** (adds 1 iteration)

- [ ] **Task 11.1**: Extend AtomicEntry interface with priority fields
- [ ] **Task 11.2**: Implement `MemoryControls` React component
- [ ] **Task 11.3**: Modify retrieval to respect priorities
- [ ] **Task 11.4**: Add auto-archive cron job

**Tests** (3 tests):

- [ ] Pinned entries always appear first
- [ ] Archived entries excluded by default
- [ ] Auto-archive triggers on expiry date

---

## AR-7: Session Brain Bridge

**From**: Model Utilization 4.1 - Session Brain Enhancement

### Requirement

Auto-extract patterns using SimpleMem's semantic compression for PROJECT_STATE.md.

### Implementation

```python
# File: openclaw/session_brain_bridge.py
class SessionBrainBridge:
    """
    Bridges Clawtopus PROJECT_STATE.md with SimpleMem's atomic storage.
    """

    def __init__(self, simplemem: SimpleMemSystem, memory_bank_path: str):
        self.simplemem = simplemem
        self.memory_bank_path = memory_bank_path

    def sync_session(self, session_transcript: str) -> None:
        """Sync session transcript to PROJECT_STATE.md via SimpleMem."""

        # 1. Semantic compression
        atomic_entries = self.simplemem.compress(session_transcript)

        # 2. Deduplicate against existing PROJECT_STATE.md
        existing = self.parse_project_state()
        novel_entries = [
            e for e in atomic_entries
            if not self.is_duplicate(e, existing)
        ]

        # 3. Update PROJECT_STATE.md (reverse-chronological)
        self.prepend_to_project_state(novel_entries)

        # 4. Update SimpleMem's vector index
        self.simplemem.index_entries(novel_entries)

        # 5. Log to SKILL_DECISIONS if patterns detected
        self.check_for_skill_patterns(novel_entries)

    def is_duplicate(self, entry: AtomicEntry, existing: List[AtomicEntry]) -> bool:
        """Check if entry is semantically similar to existing."""
        for e in existing:
            similarity = self.simplemem.semantic_similarity(entry, e)
            if similarity > 0.85:  # Threshold for duplication
                return True
        return False

    def prepend_to_project_state(self, entries: List[AtomicEntry]) -> None:
        """Add entries to PROJECT_STATE.md in reverse-chronological order."""
        project_state_path = os.path.join(
            self.memory_bank_path,
            'PROJECT_STATE.md'
        )

        new_content = self.format_entries(entries)

        # Read existing content
        existing_content = ''
        if os.path.exists(project_state_path):
            with open(project_state_path, 'r') as f:
                existing_content = f.read()

        # Prepend new content (reverse-chronological)
        with open(project_state_path, 'w') as f:
            f.write(new_content + '\n\n' + existing_content)
```

### Tasks

**Group 12: Session Bridge** (adds 1 iteration)

- [ ] **Task 12.1**: Implement `SessionBrainBridge` Python class
- [ ] **Task 12.2**: Add deduplication logic
- [ ] **Task 12.3**: Integrate with skill pattern detection
- [ ] **Task 12.4**: Create TypeScript wrapper for Node.js integration

**Tests** (3 tests):

- [ ] Compression extracts atomic entries correctly
- [ ] Duplicates detected with 0.85 threshold
- [ ] Prepend maintains reverse-chronological order

---

## AR-8: Auto-Skill Detection

**From**: Model Utilization 4.2 - Skill Factory Auto-Trigger

### Requirement

Auto-trigger skill extraction when pattern confidence exceeds threshold.

### Implementation

See `elavate.md` lines 158-186 for full implementation.

Key points:

- `PATTERN_CONFIDENCE_THRESHOLD = 0.85`
- `MIN_PATTERN_OCCURRENCES = 3`
- Notifications with 3 actions: 'extract-skill', 'ignore-pattern', 'review-similar'

### Tasks

**Group 13: Auto-Detection** (adds 1 iteration)

- [ ] **Task 13.1**: Implement `AutoSkillDetector` class
- [ ] **Task 13.2**: Add pattern occurrence counting
- [ ] **Task 13.3**: Create notification system
- [ ] **Task 13.4**: Add user action handlers

**Tests** (3 tests):

- [ ] Detection triggers at 0.85 threshold
- [ ] Minimum 3 occurrences required
- [ ] Notifications show all 3 actions

---

## AR-9: Multi-Agent Memory Sharing

**From**: Model Utilization 4.3 - Multi-Agent Memory Sharing

### Requirement

Shared SimpleMem instance across fractal agents with permission filtering.

### Implementation

See `elavate.md` lines 193-223 for full implementation.

Key points:

- `SharedAgentMemory` class
- Permission-based entry filtering
- Cross-agent pattern detection
- Agent isolation maintained

### Tasks

**Group 14: Multi-Agent Memory** (adds 1 iteration)

- [ ] **Task 14.1**: Implement `SharedAgentMemory` class
- [ ] **Task 14.2**: Add permission system
- [ ] **Task 14.3**: Implement cross-agent pattern detection
- [ ] **Task 14.4**: Integrate with synaesthesia-server

**Tests** (3 tests):

- [ ] Agents only see permitted entries
- [ ] Cross-agent patterns detected correctly
- [ ] Isolation maintained between agents

---

## Revised Implementation Phases

### Phase 1: Foundation (2 iterations) - _Unchanged_

- Internal/external memory structure
- Context detection
- Initialization triggers

### Phase 2: Intelligence (3 iterations) - _Extended from 2-3_

- External memory auto-creation
- Memory bank templates
- **Session Brain Bridge** (AR-7)
- **Auto-Skill Detection** (AR-8)
- **Multi-Agent Memory** (AR-9)

### Phase 3: UI/UX (3 iterations) - _New Phase_

- **Streaming Skill Dashboard** (AR-1)
- **Contextual Suggestions** (AR-2)
- **Glass Box Explorer** (AR-3)
- **Memory Health Dashboard** (AR-4)
- **Semantic Timeline** (AR-5)
- **Memory Controls** (AR-6)

### Phase 4: Integration (2 iterations) - _Unchanged_

- Spec-architect integration
- PM-auditor integration

### Phase 5: QuantumReef (2 iterations) - _Unchanged_

- New task categories
- Protocol extensions
- Progress streaming

**Revised Total**: 12 iterations (was 10)

---

## Additional Test Coverage

| Addendum                 | Tests        |
| ------------------------ | ------------ |
| AR-1 Skill Streaming     | 3 tests      |
| AR-2 Skill Suggestions   | 3 tests      |
| AR-3 Glass Box Logging   | 2 tests      |
| AR-4 Memory Dashboard    | 3 tests      |
| AR-5 Memory Timeline     | 3 tests      |
| AR-6 Memory Controls     | 3 tests      |
| AR-7 Session Bridge      | 3 tests      |
| AR-8 Auto-Detection      | 3 tests      |
| AR-9 Multi-Agent         | 3 tests      |
| **Total Addendum Tests** | **26 tests** |

**Combined Total**: 68 (base) + 26 (addendum) = **94 tests**

---

## Consciousness Alignment Check

| Dimension                   | Base Score | Addendum Impact                      | Final Score    |
| --------------------------- | ---------- | ------------------------------------ | -------------- |
| **Consciousness Expansion** | 8/10       | +0.5 (auto-detection, suggestions)   | 8.5/10         |
| **Glass Box Transparency**  | 9/10       | +0.5 (dashboard, timeline, controls) | 9.5/10         |
| **Elegant Systems**         | 8/10       | 0 (all components < 400 lines)       | 8/10           |
| **Truth Over Theater**      | 9/10       | 0 (evidence-based maintained)        | 9/10           |
| **Average**                 | **8.5/10** |                                      | **8.75/10** ✅ |

---

_Addendum complete. All elavate.md suggestions now incorporated into spec._
