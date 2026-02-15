"""Configuration loader and settings management.

This module handles loading and managing Voyager configuration from TOML files.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore

from voyager.logging import get_logger

_logger = get_logger("config")

# Global config instance
_config: VoyagerConfig | None = None


@dataclass
class AIProviderConfig:
    """Configuration for an AI provider."""

    model: str
    timeout_seconds: int = 60
    max_turns: int = 10
    base_url: str | None = None
    api_key_env: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class IDEAdapterConfig:
    """Configuration for an IDE adapter."""

    name: str
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class VoyagerConfig:
    """Main Voyager configuration.

    Attributes:
        state_dir: Directory for Voyager state (brain, curriculum, etc.)
        skills_dir: Directory for skills
        ide_adapter: Name of the IDE adapter to use
        ai_provider: Name of the AI provider to use
        ai_configs: Configuration for each AI provider
        ide_configs: Configuration for each IDE adapter
        project_dir: Root directory of the project (auto-detected)
    """

    state_dir: str = ".voyager"
    skills_dir: str = ".voyager/skills"
    ide_adapter: str = "claude_code"
    ai_provider: str = "claude"
    ai_configs: dict[str, AIProviderConfig] = field(default_factory=dict)
    ide_configs: dict[str, IDEAdapterConfig] = field(default_factory=dict)
    project_dir: Path | None = None

    def get_state_path(self) -> Path:
        """Get the absolute path to the state directory."""
        base = self.project_dir or Path.cwd()
        return base / self.state_dir

    def get_skills_path(self) -> Path:
        """Get the absolute path to the skills directory."""
        base = self.project_dir or Path.cwd()
        return base / self.skills_dir

    def get_ai_config(self, provider: str | None = None) -> AIProviderConfig:
        """Get configuration for an AI provider.

        Args:
            provider: Name of the provider, or None to use the default.

        Returns:
            AIProviderConfig for the specified provider.

        Raises:
            KeyError: If the provider is not configured.
        """
        provider_name = provider or self.ai_provider
        if provider_name not in self.ai_configs:
            raise KeyError(f"AI provider '{provider_name}' not configured")
        return self.ai_configs[provider_name]

    def get_ide_config(self, adapter: str | None = None) -> IDEAdapterConfig:
        """Get configuration for an IDE adapter.

        Args:
            adapter: Name of the adapter, or None to use the default.

        Returns:
            IDEAdapterConfig for the specified adapter.

        Raises:
            KeyError: If the adapter is not configured.
        """
        adapter_name = adapter or self.ide_adapter
        if adapter_name not in self.ide_configs:
            raise KeyError(f"IDE adapter '{adapter_name}' not configured")
        return self.ide_configs[adapter_name]


def load_defaults() -> dict[str, Any]:
    """Load default configuration from defaults.toml."""
    defaults_path = Path(__file__).parent / "defaults.toml"
    with open(defaults_path, "rb") as f:
        return tomllib.load(f)


def load_config(config_path: Path | None = None, project_dir: Path | None = None) -> VoyagerConfig:
    """Load Voyager configuration from a TOML file.

    Searches for configuration in this order:
    1. Specified config_path
    2. .voyager/config.toml in project_dir
    3. voyager.toml in project_dir
    4. .voyager/config.toml in current directory
    5. voyager.toml in current directory
    6. Default configuration

    Args:
        config_path: Explicit path to config file.
        project_dir: Project root directory.

    Returns:
        Loaded VoyagerConfig.
    """
    # Determine project directory
    proj_dir = project_dir or _get_project_dir()

    # Find config file
    config_data = load_defaults()

    if config_path and config_path.exists():
        _logger.debug("Loading config from %s", config_path)
        with open(config_path, "rb") as f:
            user_config = tomllib.load(f)
            _merge_config(config_data, user_config)
    else:
        # Search for config file
        search_paths = [
            proj_dir / ".voyager" / "config.toml",
            proj_dir / "voyager.toml",
            Path.cwd() / ".voyager" / "config.toml",
            Path.cwd() / "voyager.toml",
        ]

        for path in search_paths:
            if path.exists():
                _logger.debug("Loading config from %s", path)
                with open(path, "rb") as f:
                    user_config = tomllib.load(f)
                    _merge_config(config_data, user_config)
                break
        else:
            _logger.debug("No config file found, using defaults")

    # Parse configuration
    voyager_section = config_data.get("voyager", {})
    ai_section = config_data.get("ai", {})
    ide_section = config_data.get("ide", {})

    # Build AI provider configs
    ai_configs = {}
    for provider_name, provider_data in ai_section.items():
        ai_configs[provider_name] = AIProviderConfig(
            model=provider_data.get("model", ""),
            timeout_seconds=provider_data.get("timeout_seconds", 60),
            max_turns=provider_data.get("max_turns", 10),
            base_url=provider_data.get("base_url"),
            api_key_env=provider_data.get("api_key_env"),
            extra={k: v for k, v in provider_data.items() if k not in ["model", "timeout_seconds", "max_turns", "base_url", "api_key_env"]},
        )

    # Build IDE adapter configs
    ide_configs = {}
    for adapter_name, adapter_data in ide_section.items():
        ide_configs[adapter_name] = IDEAdapterConfig(
            name=adapter_name,
            extra=adapter_data,
        )

    return VoyagerConfig(
        state_dir=voyager_section.get("state_dir", ".voyager"),
        skills_dir=voyager_section.get("skills_dir", ".voyager/skills"),
        ide_adapter=voyager_section.get("ide_adapter", "claude_code"),
        ai_provider=voyager_section.get("ai_provider", "claude"),
        ai_configs=ai_configs,
        ide_configs=ide_configs,
        project_dir=proj_dir,
    )


def get_config() -> VoyagerConfig:
    """Get the global Voyager configuration.

    Loads the configuration on first call and caches it.

    Returns:
        The global VoyagerConfig instance.
    """
    global _config
    if _config is None:
        _config = load_config()
    return _config


def reload_config(config_path: Path | None = None, project_dir: Path | None = None) -> VoyagerConfig:
    """Reload the global configuration.

    Args:
        config_path: Explicit path to config file.
        project_dir: Project root directory.

    Returns:
        The reloaded VoyagerConfig instance.
    """
    global _config
    _config = load_config(config_path, project_dir)
    return _config


def _get_project_dir() -> Path:
    """Get the project directory.

    Uses VOYAGER_PROJECT_DIR or CLAUDE_PROJECT_DIR env var if set,
    otherwise falls back to current directory.
    """
    env_dir = os.environ.get("VOYAGER_PROJECT_DIR") or os.environ.get("CLAUDE_PROJECT_DIR")
    if env_dir:
        return Path(env_dir)
    return Path.cwd()


def _merge_config(base: dict[str, Any], override: dict[str, Any]) -> None:
    """Merge override config into base config (in-place).

    Args:
        base: Base configuration dict.
        override: Override configuration dict.
    """
    for key, value in override.items():
        if key in base and isinstance(base[key], dict) and isinstance(value, dict):
            _merge_config(base[key], value)
        else:
            base[key] = value
