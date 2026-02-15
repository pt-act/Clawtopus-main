"""
Unified Memory System - Integration of Code Voyager and SimpleMem

This module provides a unified interface that combines:
- Code Voyager: Skill-based procedural memory (workflows, patterns, project context)
- SimpleMem: Conversational episodic memory (facts, dialogue, temporal events)

Architecture:
- VoyagerBrain: Handles skills, curriculum, and project state
- SimpleMemSystem: Handles dialogue compression and factual recall
- UnifiedMemory: Orchestrates both systems with intelligent routing
"""

from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import json
from datetime import datetime

# Import SimpleMem components (we'll integrate these)
import sys
sys.path.append(str(Path(__file__).parent.parent.parent / "SimpleMem-main"))

try:
    from main import SimpleMemSystem
    SIMPLEMEM_AVAILABLE = True
except ImportError:
    SIMPLEMEM_AVAILABLE = False
    SimpleMemSystem = None


class MemoryType:
    """Memory type classification for intelligent routing"""
    SKILL = "skill"           # Procedural knowledge (how to do things)
    FACT = "fact"            # Episodic knowledge (what happened)
    CONTEXT = "context"      # Project/session context
    DIALOGUE = "dialogue"    # Conversational memory


class SimpleVoyagerBrain:
    """Simplified Voyager Brain for memory storage"""
    
    def __init__(self, state_dir: Path):
        self.state_dir = Path(state_dir)
        self.state_dir.mkdir(parents=True, exist_ok=True)
        self.brain_file = self.state_dir / "brain.json"
        self._state = self._load_state()
    
    def _load_state(self) -> Dict[str, Any]:
        """Load brain state from file"""
        if self.brain_file.exists():
            try:
                with open(self.brain_file, 'r') as f:
                    return json.load(f)
            except Exception:
                pass
        return {"unified_memory": []}
    
    def _save_state(self):
        """Save brain state to file"""
        try:
            with open(self.brain_file, 'w') as f:
                json.dump(self._state, f, indent=2)
        except Exception as e:
            print(f"Failed to save brain state: {e}")
    
    def get_state(self) -> Dict[str, Any]:
        """Get current brain state"""
        return self._state
    
    def update_state(self, state: Dict[str, Any]):
        """Update brain state"""
        self._state = state
        self._save_state()


class UnifiedMemory:
    """
    Unified Memory System combining Code Voyager and SimpleMem
    
    Memory Layers:
    1. Skill Layer (Voyager): Workflows, patterns, reusable knowledge
    2. Fact Layer (SimpleMem): Compressed dialogue, temporal facts
    3. Context Layer (Voyager): Project state, session continuity
    """
    
    def __init__(
        self,
        project_dir: Path,
        agent_name: str = "default",
        enable_simplemem: bool = True
    ):
        self.project_dir = Path(project_dir)
        self.agent_name = agent_name
        self.memory_dir = self.project_dir / ".voyager" / "memory" / agent_name
        self.memory_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize Simple Voyager Brain (Skill + Context Memory)
        self.voyager_brain = SimpleVoyagerBrain(
            state_dir=self.project_dir / ".voyager"
        )
        
        # Initialize SimpleMem (Fact + Dialogue Memory)
        self.simplemem = None
        if enable_simplemem and SIMPLEMEM_AVAILABLE:
            try:
                self.simplemem = SimpleMemSystem(
                    db_path=str(self.memory_dir / "simplemem.db"),
                    clear_db=False,
                    enable_parallel_processing=True,
                    max_parallel_workers=2
                )
            except Exception as e:
                print(f"SimpleMem initialization failed: {e}")
                self.simplemem = None
        
        # Memory routing configuration
        self.routing_config = {
            "skill_keywords": ["how to", "workflow", "pattern", "technique", "method", "process"],
            "fact_keywords": ["when", "what", "where", "who", "result", "outcome", "found"],
            "context_keywords": ["project", "session", "working on", "current", "status"]
        }
    
    def store(
        self,
        content: str,
        memory_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        speaker: str = "user",
        timestamp: Optional[str] = None
    ) -> bool:
        """
        Store information in the appropriate memory layer
        
        Args:
            content: Information to store
            memory_type: Explicit memory type (skill/fact/context/dialogue)
            metadata: Additional metadata
            speaker: Who provided the information
            timestamp: When the information was provided
        """
        if not memory_type:
            memory_type = self._classify_memory_type(content)
        
        timestamp = timestamp or datetime.now().isoformat()
        metadata = metadata or {}
        
        success = False
        
        # Route to appropriate memory system
        if memory_type in [MemoryType.SKILL, MemoryType.CONTEXT]:
            # Store in Voyager Brain
            try:
                # Update brain state with new information
                brain_update = {
                    "type": memory_type,
                    "content": content,
                    "metadata": metadata,
                    "timestamp": timestamp,
                    "speaker": speaker
                }
                
                # Add to brain's working memory
                current_state = self.voyager_brain.get_state()
                if "unified_memory" not in current_state:
                    current_state["unified_memory"] = []
                
                current_state["unified_memory"].append(brain_update)
                self.voyager_brain.update_state(current_state)
                success = True
                
            except Exception as e:
                print(f"Voyager storage failed: {e}")
        
        if memory_type in [MemoryType.FACT, MemoryType.DIALOGUE]:
            # Store in SimpleMem
            if self.simplemem:
                try:
                    self.simplemem.add_dialogue(speaker, content, timestamp)
                    success = True
                except Exception as e:
                    print(f"SimpleMem storage failed: {e}")
        
        return success
    
    def recall(
        self,
        query: str,
        memory_types: Optional[List[str]] = None,
        limit: int = 10
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Recall information from both memory systems
        
        Args:
            query: What to search for
            memory_types: Which memory types to search (None = all)
            limit: Maximum results per memory type
            
        Returns:
            Dictionary with results from each memory system
        """
        results = {
            "skills": [],
            "facts": [],
            "context": [],
            "dialogue": []
        }
        
        memory_types = memory_types or [MemoryType.SKILL, MemoryType.FACT, MemoryType.CONTEXT, MemoryType.DIALOGUE]
        
        # Query Voyager Brain for skills and context
        if any(mt in [MemoryType.SKILL, MemoryType.CONTEXT] for mt in memory_types):
            try:
                brain_state = self.voyager_brain.get_state()
                unified_memory = brain_state.get("unified_memory", [])
                
                # Simple keyword matching for now (can be enhanced with embeddings)
                query_lower = query.lower()
                for entry in unified_memory:
                    if any(word in entry["content"].lower() for word in query_lower.split()):
                        if entry["type"] == MemoryType.SKILL and MemoryType.SKILL in memory_types:
                            results["skills"].append(entry)
                        elif entry["type"] == MemoryType.CONTEXT and MemoryType.CONTEXT in memory_types:
                            results["context"].append(entry)
                
                # Limit results
                results["skills"] = results["skills"][:limit]
                results["context"] = results["context"][:limit]
                
            except Exception as e:
                print(f"Voyager recall failed: {e}")
        
        # Query SimpleMem for facts and dialogue
        if any(mt in [MemoryType.FACT, MemoryType.DIALOGUE] for mt in memory_types):
            if self.simplemem:
                try:
                    # SimpleMem's ask method returns compressed factual answers
                    answer = self.simplemem.ask(query)
                    if answer:
                        results["facts"].append({
                            "content": answer,
                            "type": MemoryType.FACT,
                            "timestamp": datetime.now().isoformat(),
                            "source": "simplemem"
                        })
                except Exception as e:
                    print(f"SimpleMem recall failed: {e}")
        
        return results
    
    def _classify_memory_type(self, content: str) -> str:
        """Classify content into memory type based on keywords and patterns"""
        content_lower = content.lower()
        
        # Check for skill-related content
        if any(keyword in content_lower for keyword in self.routing_config["skill_keywords"]):
            return MemoryType.SKILL
        
        # Check for fact-related content
        if any(keyword in content_lower for keyword in self.routing_config["fact_keywords"]):
            return MemoryType.FACT
        
        # Check for context-related content
        if any(keyword in content_lower for keyword in self.routing_config["context_keywords"]):
            return MemoryType.CONTEXT
        
        # Default to dialogue for conversational content
        return MemoryType.DIALOGUE
    
    def finalize_session(self):
        """Finalize both memory systems at session end"""
        try:
            # Finalize SimpleMem (compress dialogue into atomic facts)
            if self.simplemem:
                self.simplemem.finalize()
        except Exception as e:
            print(f"Session finalization failed: {e}")
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get statistics from both memory systems"""
        stats = {
            "voyager_brain": {},
            "simplemem": {},
            "unified": {
                "total_entries": 0,
                "memory_types": {
                    "skills": 0,
                    "facts": 0,
                    "context": 0,
                    "dialogue": 0
                }
            }
        }
        
        try:
            # Voyager stats
            brain_state = self.voyager_brain.get_state()
            unified_memory = brain_state.get("unified_memory", [])
            stats["voyager_brain"]["entries"] = len(unified_memory)
            
            # Count by type
            for entry in unified_memory:
                entry_type = entry.get("type", "unknown")
                if entry_type in stats["unified"]["memory_types"]:
                    stats["unified"]["memory_types"][entry_type] += 1
            
        except Exception as e:
            print(f"Voyager stats failed: {e}")
        
        try:
            # SimpleMem stats (if available)
            if self.simplemem:
                # SimpleMem doesn't expose direct stats, so we estimate
                stats["simplemem"]["available"] = True
                stats["unified"]["memory_types"]["facts"] += 1  # Placeholder
        except Exception as e:
            print(f"SimpleMem stats failed: {e}")
        
        stats["unified"]["total_entries"] = sum(stats["unified"]["memory_types"].values())
        
        return stats


# Convenience functions for easy integration
def create_unified_memory(
    project_dir: Union[str, Path],
    agent_name: str = "default"
) -> UnifiedMemory:
    """Create a unified memory system for a project"""
    return UnifiedMemory(
        project_dir=Path(project_dir),
        agent_name=agent_name,
        enable_simplemem=SIMPLEMEM_AVAILABLE
    )


def quick_store(
    memory: UnifiedMemory,
    content: str,
    speaker: str = "user"
) -> bool:
    """Quick store with automatic memory type classification"""
    return memory.store(content=content, speaker=speaker)


def quick_recall(
    memory: UnifiedMemory,
    query: str,
    limit: int = 5
) -> str:
    """Quick recall that returns a formatted summary"""
    results = memory.recall(query, limit=limit)
    
    summary_parts = []
    
    if results["skills"]:
        summary_parts.append("**Skills:**")
        for skill in results["skills"][:3]:
            summary_parts.append(f"- {skill['content'][:100]}...")
    
    if results["facts"]:
        summary_parts.append("**Facts:**")
        for fact in results["facts"][:3]:
            summary_parts.append(f"- {fact['content'][:100]}...")
    
    if results["context"]:
        summary_parts.append("**Context:**")
        for ctx in results["context"][:2]:
            summary_parts.append(f"- {ctx['content'][:100]}...")
    
    return "\n".join(summary_parts) if summary_parts else "No relevant memories found."
