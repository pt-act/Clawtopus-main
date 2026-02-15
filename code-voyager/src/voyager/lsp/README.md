# Voyager Language Server

A Language Server Protocol (LSP) implementation for Code Voyager that works with **any** LSP-compatible editor.

## What is LSP?

Language Server Protocol (LSP) is a standard protocol between editors and language servers. With a single LSP server, Code Voyager can integrate with dozens of editors!

## Supported Editors

Any editor that supports LSP, including:

- ✅ **VS Code** (via extension or LSP client)
- ✅ **Neovim** (via nvim-lspconfig)
- ✅ **Vim** (via vim-lsp or coc.nvim)
- ✅ **Emacs** (via lsp-mode or eglot)
- ✅ **Sublime Text** (via LSP package)
- ✅ **Kate** (built-in LSP support)
- ✅ **And many more!**

## Features

### Commands

- `voyager.sessionStart` - Start a session
- `voyager.sessionEnd` - End a session
- `voyager.brainUpdate` - Update brain state
- `voyager.brainShow` - Show brain state
- `voyager.skillFind` - Find skills
- `voyager.skillIndex` - Index skills
- `voyager.curriculumPlan` - Create curriculum
- `voyager.factoryPropose` - Propose skills

### LSP Capabilities

- **Hover**: View brain context on hover
- **Completions**: Skill suggestions (triggered with `@`)
- **Commands**: Execute Voyager commands
- **Auto-start**: Automatically starts session on workspace open

## Installation

### Install Voyager with LSP Support

```bash
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[lsp]"
```

This installs both `voyager` and `voyager-lsp` commands.

### Verify Installation

```bash
voyager-lsp --help
```

## Configuration

### Neovim (nvim-lspconfig)

Add to your Neovim config:

```lua
-- ~/.config/nvim/init.lua or after/plugin/lsp.lua

local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

-- Define voyager LSP server
if not configs.voyager then
  configs.voyager = {
    default_config = {
      cmd = {'voyager-lsp'},
      filetypes = {'*'},  -- All filetypes
      root_dir = function(fname)
        return lspconfig.util.find_git_ancestor(fname) or vim.fn.getcwd()
      end,
      settings = {},
    },
  }
end

-- Setup voyager LSP
lspconfig.voyager.setup{
  on_attach = function(client, bufnr)
    -- Key mappings
    local opts = { buffer = bufnr, noremap = true, silent = true }
    vim.keymap.set('n', '<leader>vs', ':lua vim.lsp.buf.execute_command({command = "voyager.sessionStart"})<CR>', opts)
    vim.keymap.set('n', '<leader>vu', ':lua vim.lsp.buf.execute_command({command = "voyager.brainUpdate"})<CR>', opts)
    vim.keymap.set('n', '<leader>vb', ':lua vim.lsp.buf.execute_command({command = "voyager.brainShow"})<CR>', opts)

    print("Voyager LSP attached")
  end,
}
```

**Key Bindings**:

- `<leader>vs` - Start session
- `<leader>vu` - Update brain
- `<leader>vb` - Show brain

### Vim (vim-lsp)

Add to your Vim config:

```vim
" ~/.vimrc

if executable('voyager-lsp')
  au User lsp_setup call lsp#register_server({
    \ 'name': 'voyager',
    \ 'cmd': {server_info->['voyager-lsp']},
    \ 'allowlist': ['*'],
    \ })
endif

" Key mappings
nnoremap <leader>vs :call lsp#send_request('voyager', {
  \ 'method': 'workspace/executeCommand',
  \ 'params': {'command': 'voyager.sessionStart'},
  \ })<CR>

nnoremap <leader>vu :call lsp#send_request('voyager', {
  \ 'method': 'workspace/executeCommand',
  \ 'params': {'command': 'voyager.brainUpdate'},
  \ })<CR>
```

### Emacs (lsp-mode)

Add to your Emacs config:

```elisp
;; ~/.emacs.d/init.el

(require 'lsp-mode)

(add-to-list 'lsp-language-id-configuration '(".*" . "voyager"))

(lsp-register-client
 (make-lsp-client
  :new-connection (lsp-stdio-connection "voyager-lsp")
  :major-modes '(prog-mode)
  :server-id 'voyager))

;; Key bindings
(define-key lsp-mode-map (kbd "C-c v s")
  (lambda () (interactive)
    (lsp-execute-command "voyager.sessionStart")))

(define-key lsp-mode-map (kbd "C-c v u")
  (lambda () (interactive)
    (lsp-execute-command "voyager.brainUpdate")))
```

### Emacs (eglot)

Add to your Emacs config:

```elisp
;; ~/.emacs.d/init.el

(require 'eglot)

(add-to-list 'eglot-server-programs '((prog-mode) . ("voyager-lsp")))

;; Auto-start eglot in programming modes
(add-hook 'prog-mode-hook 'eglot-ensure)
```

### Sublime Text (LSP package)

1. Install LSP package: `Preferences > Package Control > Install Package > LSP`

2. Add to LSP settings (`Preferences > Package Settings > LSP > Settings`):

```json
{
  "clients": {
    "voyager": {
      "enabled": true,
      "command": ["voyager-lsp"],
      "selector": "source | text"
    }
  }
}
```

3. Restart Sublime Text

### VS Code (Manual LSP Client)

If not using the extension, you can use generic LSP client:

```json
// settings.json
{
  "lsp.servers": {
    "voyager": {
      "command": ["voyager-lsp"],
      "filetypes": ["*"]
    }
  }
}
```

## Usage

### Automatic Mode

The LSP server automatically starts a session when you open a workspace/project.

### Manual Commands

Execute commands via your editor's LSP command interface:

**Neovim**:

```vim
:lua vim.lsp.buf.execute_command({command = "voyager.brainUpdate"})
```

**Vim**:

```vim
:call lsp#execute_command('voyager.brainUpdate')
```

**Emacs**:

```elisp
M-x lsp-execute-command RET voyager.brainUpdate
```

**Sublime Text**:

1. Open Command Palette (Cmd/Ctrl+Shift+P)
2. Type "LSP: Execute Command"
3. Select "voyager.brainUpdate"

### Hover for Brain Context

In any file, hover over code to see brain context:

- Neovim: `K` (in normal mode)
- Vim: Move cursor and wait
- Emacs: `C-c l h h` (lsp-mode) or hover with mouse
- Sublime: Hover with mouse

## Features Comparison

| Feature                | LSP Server | VS Code Extension | CLI Only |
| ---------------------- | ---------- | ----------------- | -------- |
| Works with any editor  | ✅         | ❌                | ✅       |
| Automatic session mgmt | ✅         | ✅                | ❌       |
| Hover context          | ✅         | ❌                | ❌       |
| Commands               | ✅         | ✅                | ✅       |
| Sidebar UI             | ❌         | ✅                | ❌       |
| Visual brain state     | ❌         | ✅                | ❌       |

## Debugging

### Check if LSP is running

**Neovim**:

```vim
:LspInfo
```

**Emacs (lsp-mode)**:

```elisp
M-x lsp-describe-session
```

### View LSP logs

Logs are written to `/tmp/voyager-lsp.log`:

```bash
tail -f /tmp/voyager-lsp.log
```

### Test LSP server manually

```bash
voyager-lsp
# Type LSP requests manually (for debugging)
```

## Troubleshooting

### "Command not found: voyager-lsp"

**Solution**: Make sure you installed with the `[lsp]` extra:

```bash
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[lsp]"
```

### LSP server not starting

**Solution**: Check logs in `/tmp/voyager-lsp.log`

### Commands not working

**Solution**: Make sure you're in a workspace/project directory with Voyager configured.

## Examples

### Neovim Workflow

1. Open project: `nvim .`
2. LSP auto-starts session
3. Work on code
4. Press `<leader>vu` to update brain
5. Hover over code with `K` to see brain context
6. Close Neovim - session auto-saves

### Emacs Workflow

1. Open project: `C-x d`
2. LSP auto-starts session
3. Work on code
4. `C-c v u` to update brain
5. `C-c v b` to view brain state
6. Close Emacs - session auto-saves

## Contributing

The LSP server is implemented in Python using `pygls`. Contributions welcome!

See [ARCHITECTURE.md](../../../ARCHITECTURE.md) for details on the adapter system.

## License

MIT - see [LICENSE](../../../LICENSE)
