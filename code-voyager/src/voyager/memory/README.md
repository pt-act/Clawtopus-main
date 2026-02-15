# Unified Memory System Integration

This directory contains the integration of **Code Voyager** and **SimpleMem** into a unified memory system.

## 🧠 Architecture

### **Dual-Layer Memory System**

1. **Skill Layer (Code Voyager)**
   - Procedural knowledge: "How to do things"
   - Workflows, patterns, techniques
   - Project context and session state

2. **Fact Layer (SimpleMem)**
   - Episodic knowledge: "What happened when"
   - Compressed dialogue and temporal facts
   - Efficient retrieval with hybrid scoring

### **Memory Type Classification**

- **SKILL**: Procedural knowledge (workflows, techniques, methods)
- **FACT**: Episodic knowledge (results, outcomes, discoveries)
- **CONTEXT**: Project state (current work, session info)
- **DIALOGUE**: Conversational memory (compressed interactions)

## 🚀 Quick Start

### Basic Usage

```python
from voyager.memory import create_unified_memory

# Create unified memory for a project
memory = create_unified_memory("/path/to/project", agent_name="security_agent")

# Store different types of information
memory.store("How to perform SQL injection with sqlmap", memory_type="skill")
memory.store("Found XSS vulnerability in login form", memory_type="fact")
memory.store("Currently testing example.com web application", memory_type="context")

# Recall information
results = memory.recall("SQL injection techniques")
print(results["skills"])  # Relevant skills
print(results["facts"])   # Relevant facts
```

### CLI Integration

```bash
# Store information
voyager memory-store "Found SQL injection in /search endpoint" --type fact

# Recall information
voyager memory-recall "SQL injection vulnerabilities"

# View memory statistics
voyager memory-stats

# Finalize session (compress dialogue)
voyager memory-finalize
```

## 🔧 Integration with HexStrike

See `examples/hexstrike_integration.py` for a complete example of integrating the unified memory system with HexStrike AI agents.

### Key Benefits for Security Testing

1. **Learning from Experience**: Agents remember what worked on similar targets
2. **Technique Evolution**: Security methods improve through accumulated experience
3. **Context Continuity**: Long-running penetration tests maintain state
4. **Knowledge Sharing**: Multiple agents learn from each other's discoveries

### Enhanced Agent Capabilities

```python
class EnhancedSecurityAgent:
    def __init__(self, agent_name: str, project_dir: Path):
        self.memory = create_unified_memory(project_dir, agent_name)

    def execute_scan(self, target: str, scan_type: str):
        # 1. Recall relevant techniques and previous results
        context = self.memory.recall(f"{scan_type} techniques for {target}")

        # 2. Execute enhanced scan with context
        results = self.run_scan_with_context(target, scan_type, context)

        # 3. Store results for future reference
        self.memory.store(f"Scan results for {target}: {results}", memory_type="fact")

        return results
```

## 📁 Files

- `unified_memory.py`: Core unified memory system
- `cli_integration.py`: CLI commands for memory operations
- `__init__.py`: Module exports
- `../examples/hexstrike_integration.py`: HexStrike integration example

## 🔄 Memory Flow

1. **Input Classification**: Automatically classify content into memory types
2. **Dual Storage**: Store in appropriate memory system (Voyager/SimpleMem)
3. **Intelligent Retrieval**: Query both systems and merge results
4. **Session Finalization**: Compress dialogue into atomic facts

## 🎯 Use Cases

### Security Testing

- Remember successful attack vectors for similar targets
- Learn from failed attempts to avoid repetition
- Build knowledge base of vulnerability patterns

### Development Workflows

- Maintain context across long coding sessions
- Remember project-specific patterns and decisions
- Share knowledge between team members

### Research & Analysis

- Accumulate insights from multiple information sources
- Build comprehensive knowledge graphs
- Maintain research continuity across sessions

## 🛠️ Dependencies

The unified memory system requires:

- **Code Voyager**: Skill and context memory
- **SimpleMem** (optional): Dialogue compression and fact storage
  - `lancedb>=0.3.0`: Vector database
  - `dateparser>=1.1.0`: Temporal parsing

Install with:

```bash
pip install "voyager[simplemem]"
```

## 🔮 Future Enhancements

- **Cross-Agent Learning**: Agents share knowledge across projects
- **Semantic Clustering**: Group related memories automatically
- **Temporal Reasoning**: Understand time-based patterns in data
- **Multi-Modal Memory**: Support for images, documents, and structured data
