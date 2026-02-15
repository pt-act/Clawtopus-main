"""
Voyager - Universal AI Coding Agent for Sublime Text

This plugin integrates the Voyager AI coding agent into Sublime Text,
providing session management, brain state updates, and skill retrieval.
"""

import sublime
import sublime_plugin
import subprocess
import json
import threading
import os
from typing import Optional, Dict, Any, List


def get_voyager_command() -> List[str]:
    """Get the base voyager command."""
    return ["voyager"]


def run_voyager_command(args: List[str], timeout: int = 30) -> Optional[str]:
    """
    Run a voyager CLI command and return the output.
    
    Args:
        args: Command arguments to pass to voyager
        timeout: Command timeout in seconds
        
    Returns:
        Command output as string, or None if failed
    """
    try:
        cmd = get_voyager_command() + args
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=os.path.expanduser("~")
        )
        
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            error_msg = result.stderr.strip() if result.stderr else "Unknown error"
            sublime.error_message(f"Voyager command failed:\n{error_msg}")
            return None
    except subprocess.TimeoutExpired:
        sublime.error_message(f"Voyager command timed out after {timeout} seconds")
        return None
    except FileNotFoundError:
        sublime.error_message(
            "Voyager CLI not found. Please ensure it's installed and in your PATH.\n\n"
            "Install with: pip install voyager-agent"
        )
        return None
    except Exception as e:
        sublime.error_message(f"Error running Voyager command:\n{str(e)}")
        return None


def run_voyager_command_async(args: List[str], callback, timeout: int = 30):
    """
    Run a voyager command asynchronously and call callback with result.
    
    Args:
        args: Command arguments
        callback: Function to call with result (receives output string or None)
        timeout: Command timeout in seconds
    """
    def run():
        result = run_voyager_command(args, timeout)
        sublime.set_timeout(lambda: callback(result), 0)
    
    thread = threading.Thread(target=run)
    thread.start()


class VoyagerSessionStartCommand(sublime_plugin.WindowCommand):
    """Start a new Voyager session."""
    
    def run(self):
        def on_complete(output):
            if output:
                sublime.status_message("Voyager session started")
                self.window.run_command("voyager_brain_show")
            else:
                sublime.status_message("Failed to start Voyager session")
        
        sublime.status_message("Starting Voyager session...")
        run_voyager_command_async(["session", "start"], on_complete)


class VoyagerSessionEndCommand(sublime_plugin.WindowCommand):
    """End the current Voyager session."""
    
    def run(self):
        def on_complete(output):
            if output:
                sublime.status_message("Voyager session ended")
            else:
                sublime.status_message("Failed to end Voyager session")
        
        sublime.status_message("Ending Voyager session...")
        run_voyager_command_async(["session", "end"], on_complete)


class VoyagerSessionStatusCommand(sublime_plugin.WindowCommand):
    """Show the current Voyager session status."""
    
    def run(self):
        def on_complete(output):
            if output:
                self.window.show_quick_panel(
                    [line for line in output.split("\n") if line.strip()],
                    None,
                    sublime.MONOSPACE_FONT
                )
            else:
                sublime.status_message("Failed to get session status")
        
        sublime.status_message("Getting session status...")
        run_voyager_command_async(["session", "status"], on_complete)


class VoyagerBrainUpdateCommand(sublime_plugin.WindowCommand):
    """Update the brain with current context."""
    
    def run(self):
        view = self.window.active_view()
        if not view:
            sublime.status_message("No active view")
            return
        
        # Get current file content
        content = view.substr(sublime.Region(0, view.size()))
        file_name = view.file_name() or "untitled"
        
        # Get settings for context
        settings = sublime.load_settings("Voyager.sublime-settings")
        context_lines = settings.get("context_lines", 100)
        
        def on_input(observation):
            if not observation:
                return
            
            def on_complete(output):
                if output:
                    sublime.status_message("Brain updated successfully")
                    self.window.run_command("voyager_brain_show")
                else:
                    sublime.status_message("Failed to update brain")
            
            # Truncate content if too large
            lines = content.split("\n")
            if len(lines) > context_lines:
                truncated = "\n".join(lines[:context_lines])
                content_to_send = f"{truncated}\n... (truncated)"
            else:
                content_to_send = content
            
            context_data = {
                "file": file_name,
                "observation": observation,
                "content": content_to_send
            }
            
            sublime.status_message("Updating brain...")
            run_voyager_command_async(
                ["brain", "update", "--context", json.dumps(context_data)],
                on_complete,
                timeout=60
            )
        
        self.window.show_input_panel(
            "Observation/Note:",
            "",
            on_input,
            None,
            None
        )


class VoyagerBrainShowCommand(sublime_plugin.WindowCommand):
    """Show the current brain state."""
    
    def run(self):
        def on_complete(output):
            if output:
                view = self.window.create_output_panel("voyager_brain")
                view.set_read_only(False)
                view.run_command("append", {"characters": output})
                view.set_read_only(True)
                view.set_syntax_file("Packages/JSON/JSON.sublime-syntax")
                self.window.run_command("show_panel", {"panel": "output.voyager_brain"})
            else:
                sublime.status_message("Failed to get brain state")
        
        sublime.status_message("Loading brain state...")
        run_voyager_command_async(["brain", "show"], on_complete)


class VoyagerBrainClearCommand(sublime_plugin.WindowCommand):
    """Clear the brain state."""
    
    def run(self):
        if sublime.ok_cancel_dialog("Clear the entire brain state?", "Clear"):
            def on_complete(output):
                if output:
                    sublime.status_message("Brain cleared")
                else:
                    sublime.status_message("Failed to clear brain")
            
            sublime.status_message("Clearing brain...")
            run_voyager_command_async(["brain", "clear"], on_complete)


class VoyagerSkillsSearchCommand(sublime_plugin.WindowCommand):
    """Search for skills in the knowledge base."""
    
    def run(self):
        def on_input(query):
            if not query:
                return
            
            def on_complete(output):
                if output:
                    view = self.window.create_output_panel("voyager_skills")
                    view.set_read_only(False)
                    view.run_command("append", {"characters": output})
                    view.set_read_only(True)
                    self.window.run_command("show_panel", {"panel": "output.voyager_skills"})
                else:
                    sublime.status_message("No skills found")
            
            sublime.status_message(f"Searching for skills: {query}")
            run_voyager_command_async(
                ["skills", "search", "--query", query, "--top-k", "5"],
                on_complete,
                timeout=30
            )
        
        self.window.show_input_panel(
            "Search skills:",
            "",
            on_input,
            None,
            None
        )


class VoyagerSkillsListCommand(sublime_plugin.WindowCommand):
    """List all available skills."""
    
    def run(self):
        def on_complete(output):
            if output:
                view = self.window.create_output_panel("voyager_skills")
                view.set_read_only(False)
                view.run_command("append", {"characters": output})
                view.set_read_only(True)
                self.window.run_command("show_panel", {"panel": "output.voyager_skills"})
            else:
                sublime.status_message("Failed to list skills")
        
        sublime.status_message("Loading skills...")
        run_voyager_command_async(["skills", "list"], on_complete)


class VoyagerSkillsAddCommand(sublime_plugin.WindowCommand):
    """Add a new skill to the knowledge base."""
    
    def run(self):
        view = self.window.active_view()
        if not view:
            sublime.status_message("No active view")
            return
        
        # Get selected text or entire file
        selection = view.sel()
        if selection and not selection[0].empty():
            content = view.substr(selection[0])
        else:
            content = view.substr(sublime.Region(0, view.size()))
        
        def on_name(name):
            if not name:
                return
            
            def on_description(description):
                if not description:
                    return
                
                def on_complete(output):
                    if output:
                        sublime.status_message(f"Skill '{name}' added successfully")
                    else:
                        sublime.status_message("Failed to add skill")
                
                skill_data = {
                    "name": name,
                    "description": description,
                    "content": content
                }
                
                sublime.status_message(f"Adding skill: {name}")
                run_voyager_command_async(
                    ["skills", "add", "--data", json.dumps(skill_data)],
                    on_complete,
                    timeout=30
                )
            
            self.window.show_input_panel(
                "Skill description:",
                "",
                on_description,
                None,
                None
            )
        
        self.window.show_input_panel(
            "Skill name:",
            "",
            on_name,
            None,
            None
        )


class VoyagerConfigShowCommand(sublime_plugin.WindowCommand):
    """Show the current Voyager configuration."""
    
    def run(self):
        def on_complete(output):
            if output:
                view = self.window.create_output_panel("voyager_config")
                view.set_read_only(False)
                view.run_command("append", {"characters": output})
                view.set_read_only(True)
                view.set_syntax_file("Packages/TOML/TOML.sublime-syntax")
                self.window.run_command("show_panel", {"panel": "output.voyager_config"})
            else:
                sublime.status_message("Failed to get configuration")
        
        sublime.status_message("Loading configuration...")
        run_voyager_command_async(["config", "show"], on_complete)


class VoyagerConfigEditCommand(sublime_plugin.WindowCommand):
    """Open the Voyager configuration file for editing."""
    
    def run(self):
        config_path = os.path.expanduser("~/.config/voyager/config.toml")
        if os.path.exists(config_path):
            self.window.open_file(config_path)
        else:
            sublime.error_message(
                f"Configuration file not found at:\n{config_path}\n\n"
                "Run 'voyager config init' to create it."
            )


class VoyagerProviderSelectCommand(sublime_plugin.WindowCommand):
    """Select the AI provider to use."""
    
    PROVIDERS = [
        "claude",
        "openai",
        "ollama",
        "gemini",
        "cohere",
        "openrouter",
        "azure-openai",
        "together",
        "fireworks"
    ]
    
    def run(self):
        self.window.show_quick_panel(
            self.PROVIDERS,
            self.on_select
        )
    
    def on_select(self, index):
        if index < 0:
            return
        
        provider = self.PROVIDERS[index]
        
        def on_complete(output):
            if output:
                sublime.status_message(f"Provider set to: {provider}")
            else:
                sublime.status_message("Failed to set provider")
        
        sublime.status_message(f"Setting provider to: {provider}")
        run_voyager_command_async(
            ["config", "set", "ai.provider", provider],
            on_complete
        )


class VoyagerEventListener(sublime_plugin.EventListener):
    """Event listener for auto-save and other events."""
    
    def on_post_save_async(self, view):
        """Optionally update brain on file save."""
        settings = sublime.load_settings("Voyager.sublime-settings")
        if settings.get("auto_update_brain_on_save", False):
            view.window().run_command("voyager_brain_update")


def plugin_loaded():
    """Called when the plugin is loaded."""
    print("Voyager plugin loaded")


def plugin_unloaded():
    """Called when the plugin is unloaded."""
    print("Voyager plugin unloaded")
