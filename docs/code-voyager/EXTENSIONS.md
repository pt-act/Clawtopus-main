# Editor Extensions and IDE Integrations

Voyager supports multiple editors and IDEs through various integration methods. Choose the integration that best fits your workflow.

## Available Integrations

| Editor/IDE         | Type        | Status    | Location              |
| ------------------ | ----------- | --------- | --------------------- |
| **VS Code**        | Extension   | ✅ Stable | `extensions/vscode/`  |
| **Emacs**          | Package     | ✅ Stable | `extensions/emacs/`   |
| **Sublime Text**   | Plugin      | ✅ Stable | `extensions/sublime/` |
| **Any IDE/Editor** | LSP Server  | ✅ Stable | `src/voyager/lsp/`    |
| **Any CLI**        | Generic CLI | ✅ Stable | Built-in              |

## Quick Comparison

| Feature             | VS Code     | Emacs        | Sublime Text    | LSP           |
| ------------------- | ----------- | ------------ | --------------- | ------------- |
| Session Management  | ✅          | ✅           | ✅              | ✅            |
| Brain Updates       | ✅          | ✅           | ✅              | ✅            |
| Skill Search        | ✅          | ✅           | ✅              | ✅            |
| GUI Sidebar         | ✅          | ❌           | ❌              | IDE-dependent |
| Brain Visualization | ✅ Webview  | ✅ Buffer    | ✅ Panel        | IDE-dependent |
| Configuration UI    | ✅          | ⚠️ CLI       | ✅              | IDE-dependent |
| Auto-completion     | ✅          | ✅           | ✅              | ✅            |
| Installation        | Marketplace | MELPA/Manual | Package Control | Manual        |

---

## VS Code Extension

### Features

- **Sidebar Integration**: Dedicated Voyager sidebar with multiple views
- **Brain State Viewer**: Interactive brain state visualization
- **Skills Browser**: Browse and search skills with syntax highlighting
- **Command Palette**: All features accessible via Command Palette
- **Status Bar**: Current session status display
- **Configuration UI**: Built-in settings editor

### Installation

#### Via Marketplace (Recommended - Coming Soon)

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Voyager"
4. Click Install

#### Manual Installation

```bash
# Clone repository
git clone https://github.com/infinity-vs/code-voyager.git
cd code-voyager

# Build and install extension
cd extensions/vscode
npm install
npm run compile
code --install-extension voyager-*.vsix
```

### Usage

1. **Open Sidebar**: Click Voyager icon in Activity Bar
2. **Start Session**: Click "Start Session" button or use Command Palette
3. **Update Brain**: Right-click in editor → "Voyager: Update Brain"
4. **Search Skills**: Use Skills panel to browse and search

### Keyboard Shortcuts

| Shortcut       | Command       |
| -------------- | ------------- |
| `Ctrl+Alt+V S` | Start Session |
| `Ctrl+Alt+V E` | End Session   |
| `Ctrl+Alt+V U` | Update Brain  |
| `Ctrl+Alt+V F` | Search Skills |
| `Ctrl+Alt+V B` | Show Brain    |

### Configuration

Settings available in VS Code Settings UI or `settings.json`:

```json
{
  "voyager.autoStart": false,
  "voyager.autoUpdateBrain": false,
  "voyager.provider": "claude",
  "voyager.showStatusBar": true
}
```

### Documentation

See [extensions/vscode/README.md](extensions/vscode/README.md) for full documentation.

---

## Emacs Package

### Features

- **Minor Mode**: `voyager-mode` for seamless integration
- **Interactive Commands**: Full M-x command support
- **LSP Integration**: Works with both lsp-mode and eglot
- **Buffer Visualization**: Brain and skills displayed in Emacs buffers
- **Key Bindings**: Customizable with `C-c v` prefix
- **Auto-Start**: Optional session auto-start

### Installation

#### Via MELPA (Coming Soon)

```elisp
(use-package voyager
  :ensure t
  :hook (prog-mode . voyager-mode)
  :config
  (setq voyager-auto-start-session t))
```

#### Manual Installation

```bash
# Download package
git clone https://github.com/infinity-vs/code-voyager.git
cd code-voyager/extensions/emacs

# Add to Emacs load-path
```

Add to your `init.el`:

```elisp
(add-to-list 'load-path "/path/to/code-voyager/extensions/emacs")
(require 'voyager)
(global-voyager-mode 1)

;; Optional: Auto-start sessions
(setq voyager-auto-start-session t)

;; Optional: Custom key prefix (default: C-c v)
(setq voyager-keymap-prefix (kbd "C-c v"))
```

### Usage

#### Interactive Commands

| Command                       | Description               |
| ----------------------------- | ------------------------- |
| `M-x voyager-session-start`   | Start new session         |
| `M-x voyager-session-end`     | End current session       |
| `M-x voyager-session-status`  | Show session status       |
| `M-x voyager-brain-update`    | Update brain with context |
| `M-x voyager-brain-show`      | Display brain state       |
| `M-x voyager-brain-clear`     | Clear brain state         |
| `M-x voyager-skills-search`   | Search skills             |
| `M-x voyager-skills-list`     | List all skills           |
| `M-x voyager-config-show`     | Show configuration        |
| `M-x voyager-provider-select` | Select AI provider        |

#### Key Bindings

All commands use `C-c v` prefix:

| Key       | Command         |
| --------- | --------------- |
| `C-c v s` | Start Session   |
| `C-c v e` | End Session     |
| `C-c v u` | Update Brain    |
| `C-c v b` | Show Brain      |
| `C-c v f` | Search Skills   |
| `C-c v c` | Show Config     |
| `C-c v p` | Select Provider |

### LSP Integration

Voyager works with both `lsp-mode` and `eglot`:

```elisp
;; For lsp-mode
(use-package lsp-mode
  :config
  (add-to-list 'lsp-language-id-configuration '(voyager-mode . "voyager"))
  (lsp-register-client
   (make-lsp-client :new-connection (lsp-stdio-connection "voyager-lsp")
                    :major-modes '(python-mode javascript-mode)
                    :server-id 'voyager-lsp)))

;; For eglot
(use-package eglot
  :config
  (add-to-list 'eglot-server-programs
               '((python-mode javascript-mode) . ("voyager-lsp"))))
```

### Configuration

```elisp
;; Customize settings
(setq voyager-auto-start-session t)
(setq voyager-auto-update-on-save nil)
(setq voyager-default-provider "claude")
(setq voyager-cli-path "/path/to/voyager")  ; Optional
```

### Documentation

See [extensions/emacs/README.md](extensions/emacs/README.md) for full documentation.

---

## Sublime Text Plugin

### Features

- **Command Palette**: All features in Command Palette
- **Menu Integration**: Tools → Voyager menu
- **Output Panels**: Brain and skills in output panels
- **Keyboard Shortcuts**: Two-key chord system
- **Settings UI**: Preferences → Package Settings
- **Auto-Update**: Optional brain update on save

### Installation

#### Via Package Control (Coming Soon)

1. Open Command Palette (Ctrl+Shift+P)
2. Select "Package Control: Install Package"
3. Search for "Voyager"
4. Press Enter

#### Manual Installation

```bash
# Clone repository
git clone https://github.com/infinity-vs/code-voyager.git

# Copy to Sublime packages directory
# Linux/Mac:
cp -r code-voyager/extensions/sublime ~/.config/sublime-text/Packages/Voyager

# Windows:
# Copy to %APPDATA%\Sublime Text\Packages\Voyager
```

### Usage

#### Command Palette

Press `Ctrl+Shift+P` and type "Voyager":

- Voyager: Start Session
- Voyager: Update Brain
- Voyager: Search Skills
- Voyager: Show Brain State
- And more...

#### Keyboard Shortcuts

All shortcuts use `Ctrl+Alt+V` prefix:

| Shortcut                 | Command       |
| ------------------------ | ------------- |
| `Ctrl+Alt+V, Ctrl+Alt+S` | Start Session |
| `Ctrl+Alt+V, Ctrl+Alt+E` | End Session   |
| `Ctrl+Alt+V, Ctrl+Alt+U` | Update Brain  |
| `Ctrl+Alt+V, Ctrl+Alt+B` | Show Brain    |
| `Ctrl+Alt+V, Ctrl+Alt+F` | Search Skills |

#### Menu Access

**Tools → Voyager** provides access to all features organized by category.

### Configuration

Access settings via:

- **Preferences → Package Settings → Voyager → Settings**
- Or edit `Voyager.sublime-settings` directly

```json
{
  "auto_update_brain_on_save": false,
  "context_lines": 100,
  "command_timeout": 30,
  "default_provider": "claude"
}
```

### Documentation

See [extensions/sublime/README.md](extensions/sublime/README.md) for full documentation.

---

## LSP Server (Universal)

### Overview

The Voyager Language Server Protocol (LSP) server provides Voyager integration for any IDE or editor that supports LSP.

### Supported Editors

- **Neovim** (via nvim-lspconfig)
- **Vim** (via vim-lsp)
- **Helix**
- **Kate**
- **Any LSP-compatible editor**

### Installation

```bash
# Install Voyager with LSP support
pip install voyager-agent

# Verify LSP server is available
voyager-lsp --version
```

### Configuration

#### Neovim (nvim-lspconfig)

```lua
local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

-- Define Voyager LSP
if not configs.voyager then
  configs.voyager = {
    default_config = {
      cmd = {'voyager-lsp'},
      filetypes = {'python', 'javascript', 'typescript', 'go', 'rust'},
      root_dir = lspconfig.util.root_pattern('.git', 'voyager.toml'),
      settings = {},
    },
  }
end

-- Activate Voyager LSP
lspconfig.voyager.setup{}
```

#### Helix

Add to `~/.config/helix/languages.toml`:

```toml
[[language]]
name = "python"
language-server = { command = "voyager-lsp" }

[[language]]
name = "javascript"
language-server = { command = "voyager-lsp" }
```

#### Vim (vim-lsp)

```vim
if executable('voyager-lsp')
  augroup LspVoyager
    autocmd!
    autocmd User lsp_setup call lsp#register_server({
      \ 'name': 'voyager',
      \ 'cmd': {server_info->['voyager-lsp']},
      \ 'whitelist': ['python', 'javascript', 'typescript'],
      \ })
  augroup END
endif
```

### Features

The LSP server provides:

- **Code Actions**: Voyager operations as code actions
- **Commands**: Execute Voyager commands via LSP
- **Hover**: View brain state and skill info on hover
- **Completion**: Skill-based code completion (experimental)
- **Diagnostics**: Session status and brain state diagnostics

### Usage

LSP features vary by editor, but typically:

1. Start session: Run LSP command "voyager.session.start"
2. Update brain: Use code action on selection
3. Search skills: Run LSP command "voyager.skills.search"

### Documentation

See [src/voyager/lsp/README.md](src/voyager/lsp/README.md) for full documentation.

---

## Generic CLI Integration

### Overview

Voyager can be used as a standalone CLI tool from any editor or IDE that supports running shell commands.

### Installation

```bash
pip install voyager-agent
```

### Usage

Any editor can integrate Voyager via shell commands:

```bash
# Session management
voyager session start
voyager session end
voyager session status

# Brain operations
voyager brain update --context "Your context here"
voyager brain show
voyager brain clear

# Skills
voyager skills search --query "error handling"
voyager skills list
voyager skills add --name "my-skill" --file skill.py

# Configuration
voyager config show
voyager config set ai.provider claude
```

### Editor Integration Examples

#### Vim

```vim
" Add to .vimrc
command! VoyagerSessionStart !voyager session start
command! VoyagerBrainUpdate !voyager brain update --context "<cword>"
command! VoyagerSkillsSearch !voyager skills search --query "<cword>"

" Key bindings
nnoremap <leader>vs :VoyagerSessionStart<CR>
nnoremap <leader>vu :VoyagerBrainUpdate<CR>
nnoremap <leader>vf :VoyagerSkillsSearch<CR>
```

#### Neovim (Lua)

```lua
-- Add to init.lua
vim.api.nvim_create_user_command('VoyagerStart',
  function() vim.fn.system('voyager session start') end, {})

vim.api.nvim_create_user_command('VoyagerBrain',
  function() vim.fn.system('voyager brain update --context "Working on code"') end, {})

-- Key bindings
vim.keymap.set('n', '<leader>vs', ':VoyagerStart<CR>')
vim.keymap.set('n', '<leader>vu', ':VoyagerBrain<CR>')
```

#### Jupyter/IPython

```python
# In Jupyter notebook
!voyager session start
!voyager brain update --context "Analyzing data with pandas"
!voyager skills search --query "data visualization"
```

---

## Choosing an Integration

### Use VS Code Extension if:

- ✅ You primarily use VS Code
- ✅ You want GUI features and sidebar integration
- ✅ You prefer visual brain state exploration
- ✅ You want the most polished experience

### Use Emacs Package if:

- ✅ Emacs is your primary editor
- ✅ You prefer Emacs-native workflows
- ✅ You want deep customization
- ✅ You use LSP for other languages

### Use Sublime Text Plugin if:

- ✅ Sublime Text is your preferred editor
- ✅ You want lightweight integration
- ✅ You prefer command palette workflows
- ✅ You need simple, fast access

### Use LSP Server if:

- ✅ Your editor supports LSP
- ✅ You use Neovim, Helix, or other modern editors
- ✅ You want standardized integration
- ✅ You're comfortable with LSP configuration

### Use Generic CLI if:

- ✅ Your editor isn't listed above
- ✅ You want maximum flexibility
- ✅ You're comfortable with shell integration
- ✅ You use multiple editors

---

## Installation Checklist

For all integrations:

1. ✅ Install Voyager CLI:

   ```bash
   # From PyPI (when published)
   pip install voyager-agent

   # Or from source
   pip install git+https://github.com/infinity-vs/code-voyager.git
   ```

2. ✅ Initialize configuration: `voyager config init`
3. ✅ Set API key: `voyager config set ai.claude.api_key "your-key"`
4. ✅ Install editor-specific extension (VS Code/Emacs/Sublime)
5. ✅ Verify installation: `voyager --version`
6. ✅ Test basic command: `voyager session start`

---

## Contributing

Want to add support for another editor? See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

New integrations we'd love to see:

- **JetBrains IDEs** (IntelliJ, PyCharm, WebStorm)
- **Zed Editor**
- **Visual Studio**
- **Eclipse**
- **Atom** (if still relevant)

## Support

- 📖 [Main Documentation](README.md)
- 🐛 [Issue Tracker](https://github.com/infinity-vs/code-voyager/issues)
- 💬 [Discussions](https://github.com/infinity-vs/code-voyager/discussions)

---

**Note:** All extensions require the Voyager CLI to be installed and configured. The CLI is the core that powers all integrations.
