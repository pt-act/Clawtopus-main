"""
Integration Example: Unified Memory with HexStrike AI

This example shows how to integrate the unified memory system
with HexStrike AI agents for enhanced security testing capabilities.
"""

from pathlib import Path
from typing import Dict, List, Any
from voyager.memory import create_unified_memory, MemoryType


class EnhancedSecurityAgent:
    """
    Enhanced Security Agent with Unified Memory
    
    Combines:
    - Code Voyager: Skill-based procedural memory (security techniques)
    - SimpleMem: Conversational episodic memory (scan results, facts)
    """
    
    def __init__(self, agent_name: str, project_dir: Path):
        self.agent_name = agent_name
        self.project_dir = project_dir
        
        # Initialize unified memory system
        self.memory = create_unified_memory(project_dir, agent_name)
        
        # Agent-specific configuration
        self.security_keywords = {
            "vulnerability": MemoryType.FACT,
            "exploit": MemoryType.SKILL,
            "technique": MemoryType.SKILL,
            "found": MemoryType.FACT,
            "discovered": MemoryType.FACT,
            "workflow": MemoryType.SKILL,
            "methodology": MemoryType.SKILL
        }
    
    def execute_scan(self, target: str, scan_type: str) -> Dict[str, Any]:
        """
        Execute security scan with memory-enhanced context
        """
        # 1. Recall relevant knowledge from memory
        context = self._gather_context(target, scan_type)
        
        # 2. Simulate scan execution (replace with actual HexStrike integration)
        scan_results = self._simulate_scan(target, scan_type, context)
        
        # 3. Store results in memory
        self._store_scan_results(target, scan_type, scan_results)
        
        return scan_results
    
    def _gather_context(self, target: str, scan_type: str) -> Dict[str, Any]:
        """Gather relevant context from unified memory"""
        context = {
            "previous_scans": [],
            "relevant_techniques": [],
            "target_history": []
        }
        
        # Query for previous scans of this target
        target_query = f"scan results for {target}"
        target_memories = self.memory.recall(target_query, memory_types=[MemoryType.FACT])
        context["previous_scans"] = target_memories.get("facts", [])
        
        # Query for relevant techniques
        technique_query = f"{scan_type} techniques and methods"
        technique_memories = self.memory.recall(technique_query, memory_types=[MemoryType.SKILL])
        context["relevant_techniques"] = technique_memories.get("skills", [])
        
        # Query for general target information
        history_query = f"information about {target}"
        history_memories = self.memory.recall(history_query)
        context["target_history"] = [
            *history_memories.get("facts", []),
            *history_memories.get("context", [])
        ]
        
        return context
    
    def _simulate_scan(self, target: str, scan_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate security scan (replace with actual HexStrike integration)"""
        
        # Enhanced scan based on memory context
        base_results = {
            "target": target,
            "scan_type": scan_type,
            "timestamp": "2025-01-11T00:55:00Z",
            "status": "completed"
        }
        
        # Simulate memory-enhanced results
        if context["previous_scans"]:
            base_results["memory_enhanced"] = True
            base_results["context_used"] = len(context["previous_scans"])
            base_results["findings"] = [
                f"Enhanced scan based on {len(context['previous_scans'])} previous scans",
                f"Applied {len(context['relevant_techniques'])} relevant techniques from memory"
            ]
        else:
            base_results["memory_enhanced"] = False
            base_results["findings"] = ["Initial scan - no previous context available"]
        
        # Simulate vulnerability discovery
        if scan_type == "web_app":
            base_results["vulnerabilities"] = [
                {"type": "XSS", "severity": "medium", "location": "/login"},
                {"type": "SQL Injection", "severity": "high", "location": "/search"}
            ]
        elif scan_type == "network":
            base_results["open_ports"] = [22, 80, 443, 8080]
            base_results["services"] = ["SSH", "HTTP", "HTTPS", "HTTP-Alt"]
        
        return base_results
    
    def _store_scan_results(self, target: str, scan_type: str, results: Dict[str, Any]):
        """Store scan results in unified memory"""
        
        # Store factual results
        fact_content = f"Completed {scan_type} scan of {target} on {results['timestamp']}"
        if "vulnerabilities" in results:
            vuln_summary = ", ".join([f"{v['type']} ({v['severity']})" for v in results["vulnerabilities"]])
            fact_content += f". Found vulnerabilities: {vuln_summary}"
        
        self.memory.store(
            content=fact_content,
            memory_type=MemoryType.FACT,
            speaker="security_agent",
            metadata={
                "target": target,
                "scan_type": scan_type,
                "results": results
            }
        )
        
        # Store any new techniques discovered
        if results.get("memory_enhanced") and "findings" in results:
            for finding in results["findings"]:
                if "technique" in finding.lower():
                    self.memory.store(
                        content=finding,
                        memory_type=MemoryType.SKILL,
                        speaker="security_agent"
                    )
    
    def learn_technique(self, technique_description: str, context: str = ""):
        """Learn a new security technique"""
        content = f"Security technique: {technique_description}"
        if context:
            content += f" Context: {context}"
        
        self.memory.store(
            content=content,
            memory_type=MemoryType.SKILL,
            speaker="security_agent"
        )
    
    def get_agent_knowledge(self) -> Dict[str, Any]:
        """Get summary of agent's accumulated knowledge"""
        stats = self.memory.get_memory_stats()
        
        # Get recent learnings
        recent_skills = self.memory.recall("security technique", memory_types=[MemoryType.SKILL], limit=5)
        recent_facts = self.memory.recall("scan results", memory_types=[MemoryType.FACT], limit=5)
        
        return {
            "agent_name": self.agent_name,
            "memory_stats": stats,
            "recent_skills": recent_skills.get("skills", []),
            "recent_discoveries": recent_facts.get("facts", []),
            "knowledge_areas": list(self.security_keywords.keys())
        }


def demo_enhanced_security_agent():
    """Demo the enhanced security agent with unified memory"""
    import tempfile
    
    with tempfile.TemporaryDirectory() as temp_dir:
        project_path = Path(temp_dir)
        
        # Create enhanced security agent
        agent = EnhancedSecurityAgent("penetration_tester", project_path)
        
        print("🔒 Enhanced Security Agent Demo")
        print("=" * 40)
        
        # Teach the agent some techniques
        print("\n📚 Teaching security techniques...")
        agent.learn_technique(
            "SQL injection testing with sqlmap --batch --dbs",
            "Automated database enumeration"
        )
        agent.learn_technique(
            "XSS testing with payload: <script>alert('XSS')</script>",
            "Basic reflected XSS detection"
        )
        
        # Execute scans
        print("\n🔍 Executing security scans...")
        
        # First scan (no previous context)
        results1 = agent.execute_scan("example.com", "web_app")
        print(f"First scan - Memory enhanced: {results1['memory_enhanced']}")
        
        # Second scan (with context from first scan)
        results2 = agent.execute_scan("example.com", "network")
        print(f"Second scan - Memory enhanced: {results2['memory_enhanced']}")
        
        # Third scan (with accumulated context)
        results3 = agent.execute_scan("example.com", "web_app")
        print(f"Third scan - Memory enhanced: {results3['memory_enhanced']}")
        print(f"Context used: {results3.get('context_used', 0)} previous scans")
        
        # Show agent knowledge
        print("\n🧠 Agent Knowledge Summary:")
        knowledge = agent.get_agent_knowledge()
        print(f"Total memory entries: {knowledge['memory_stats']['unified']['total_entries']}")
        print(f"Skills learned: {knowledge['memory_stats']['unified']['memory_types']['skills']}")
        print(f"Facts recorded: {knowledge['memory_stats']['unified']['memory_types']['facts']}")
        
        # Finalize session
        agent.memory.finalize_session()
        print("\n✅ Session finalized - dialogue compressed into facts")


if __name__ == "__main__":
    demo_enhanced_security_agent()
