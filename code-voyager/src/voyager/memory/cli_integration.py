"""
CLI Integration for Unified Memory System

Extends the existing Voyager CLI with unified memory commands
"""

import typer
from typing import Optional
from pathlib import Path

from voyager.memory.unified_memory import create_unified_memory, quick_store, quick_recall


def add_unified_memory_commands(app: typer.Typer):
    """Add unified memory commands to the main CLI app"""
    
    @app.command("memory-store")
    def memory_store(
        content: str = typer.Argument(..., help="Content to store in memory"),
        memory_type: Optional[str] = typer.Option(None, "--type", "-t", help="Memory type (skill/fact/context/dialogue)"),
        speaker: str = typer.Option("user", "--speaker", "-s", help="Who provided the information"),
        agent: str = typer.Option("default", "--agent", "-a", help="Agent name"),
        project_dir: Optional[str] = typer.Option(None, "--project", "-p", help="Project directory")
    ):
        """Store information in unified memory system"""
        project_path = Path(project_dir) if project_dir else Path.cwd()
        
        try:
            memory = create_unified_memory(project_path, agent)
            success = memory.store(content, memory_type=memory_type, speaker=speaker)
            
            if success:
                typer.echo(f"✅ Stored in {memory_type or 'auto-classified'} memory")
            else:
                typer.echo("❌ Failed to store memory", err=True)
                
        except Exception as e:
            typer.echo(f"❌ Error: {e}", err=True)
    
    @app.command("memory-recall")
    def memory_recall(
        query: str = typer.Argument(..., help="What to search for"),
        limit: int = typer.Option(5, "--limit", "-l", help="Maximum results"),
        agent: str = typer.Option("default", "--agent", "-a", help="Agent name"),
        project_dir: Optional[str] = typer.Option(None, "--project", "-p", help="Project directory"),
        format_output: bool = typer.Option(True, "--format/--raw", help="Format output for readability")
    ):
        """Recall information from unified memory system"""
        project_path = Path(project_dir) if project_dir else Path.cwd()
        
        try:
            memory = create_unified_memory(project_path, agent)
            
            if format_output:
                result = quick_recall(memory, query, limit)
                typer.echo(result)
            else:
                results = memory.recall(query, limit=limit)
                typer.echo(results)
                
        except Exception as e:
            typer.echo(f"❌ Error: {e}", err=True)
    
    @app.command("memory-stats")
    def memory_stats(
        agent: str = typer.Option("default", "--agent", "-a", help="Agent name"),
        project_dir: Optional[str] = typer.Option(None, "--project", "-p", help="Project directory")
    ):
        """Show unified memory system statistics"""
        project_path = Path(project_dir) if project_dir else Path.cwd()
        
        try:
            memory = create_unified_memory(project_path, agent)
            stats = memory.get_memory_stats()
            
            typer.echo("📊 Unified Memory Statistics")
            typer.echo("=" * 30)
            
            total = stats["unified"]["total_entries"]
            typer.echo(f"Total Entries: {total}")
            
            if total > 0:
                typer.echo("\nMemory Types:")
                for mem_type, count in stats["unified"]["memory_types"].items():
                    if count > 0:
                        percentage = (count / total) * 100
                        typer.echo(f"  {mem_type.title()}: {count} ({percentage:.1f}%)")
            
            # System availability
            typer.echo(f"\nSystems:")
            typer.echo(f"  Voyager Brain: ✅ Active")
            simplemem_status = "✅ Active" if stats["simplemem"].get("available") else "❌ Unavailable"
            typer.echo(f"  SimpleMem: {simplemem_status}")
            
        except Exception as e:
            typer.echo(f"❌ Error: {e}", err=True)
    
    @app.command("memory-finalize")
    def memory_finalize(
        agent: str = typer.Option("default", "--agent", "-a", help="Agent name"),
        project_dir: Optional[str] = typer.Option(None, "--project", "-p", help="Project directory")
    ):
        """Finalize memory session (compress dialogue into facts)"""
        project_path = Path(project_dir) if project_dir else Path.cwd()
        
        try:
            memory = create_unified_memory(project_path, agent)
            memory.finalize_session()
            typer.echo("✅ Memory session finalized")
            
        except Exception as e:
            typer.echo(f"❌ Error: {e}", err=True)


# Example usage functions for integration testing
def demo_unified_memory():
    """Demo function showing unified memory capabilities"""
    import tempfile
    
    with tempfile.TemporaryDirectory() as temp_dir:
        project_path = Path(temp_dir)
        memory = create_unified_memory(project_path, "demo")
        
        # Store different types of information
        print("Storing memories...")
        
        # Skill memory
        memory.store("How to perform SQL injection testing: Use sqlmap with --batch flag for automated testing", memory_type="skill")
        
        # Fact memory
        memory.store("Found XSS vulnerability in login form at /admin/login on 2025-01-11", memory_type="fact")
        
        # Context memory
        memory.store("Currently working on penetration test of example.com web application", memory_type="context")
        
        # Dialogue memory
        memory.store("The target appears to be running Apache 2.4.41 with PHP 7.4", speaker="scanner")
        
        print("\nRecalling memories...")
        
        # Test different queries
        queries = [
            "SQL injection techniques",
            "XSS vulnerabilities found",
            "What am I working on?",
            "Apache version"
        ]
        
        for query in queries:
            print(f"\nQuery: {query}")
            result = quick_recall(memory, query)
            print(result)
        
        # Show stats
        print("\nMemory Statistics:")
        stats = memory.get_memory_stats()
        print(f"Total entries: {stats['unified']['total_entries']}")
        for mem_type, count in stats['unified']['memory_types'].items():
            if count > 0:
                print(f"  {mem_type}: {count}")


if __name__ == "__main__":
    # Run demo
    demo_unified_memory()
