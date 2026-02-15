;;; voyager.el --- Code Voyager integration for Emacs -*- lexical-binding: t; -*-

;; Copyright (C) 2024 Voyager Team

;; Author: Voyager Team
;; Version: 0.2.0
;; Package-Requires: ((emacs "27.1"))
;; Keywords: ai, tools, productivity
;; URL: https://github.com/infinity-vs/code-voyager

;;; Commentary:

;; Code Voyager brings persistent AI assistant memory to Emacs.
;; This package provides:
;; - Session management (start/end sessions)
;; - Brain state visualization and updates
;; - Skill management (search, index, propose)
;; - Curriculum planning
;; - LSP integration (optional, with eglot or lsp-mode)

;;; Code:

(require 'json)

(defgroup voyager nil
  "Code Voyager AI assistant with persistent memory."
  :group 'tools
  :prefix "voyager-")

(defcustom voyager-cli-path "voyager"
  "Path to the voyager CLI executable."
  :type 'string
  :group 'voyager)

(defcustom voyager-state-dir ".voyager"
  "Directory for Voyager state files."
  :type 'string
  :group 'voyager)

(defcustom voyager-ai-provider "claude"
  "AI provider to use (claude, openai, gemini, cohere, ollama, openrouter)."
  :type '(choice (const "claude")
                 (const "openai")
                 (const "gemini")
                 (const "cohere")
                 (const "ollama")
                 (const "openrouter")
                 (const "openai_compatible"))
  :group 'voyager)

(defcustom voyager-auto-start t
  "Automatically start Voyager session when opening a project."
  :type 'boolean
  :group 'voyager)

;;; Internal variables

(defvar voyager--session-active nil
  "Whether a Voyager session is currently active.")

(defvar voyager--brain-buffer "*Voyager Brain*"
  "Buffer name for displaying brain state.")

(defvar voyager--skills-buffer "*Voyager Skills*"
  "Buffer name for displaying skills.")

;;; Utility functions

(defun voyager--run-command (command &rest args)
  "Run a voyager COMMAND with ARGS and return the output.
Returns nil on error."
  (let* ((default-directory (voyager--project-root))
         (cmd (mapconcat #'shell-quote-argument
                        (cons voyager-cli-path (cons command args))
                        " "))
         (output (shell-command-to-string cmd)))
    (if (string-prefix-p "Error:" output)
        (progn
          (message "Voyager error: %s" output)
          nil)
      output)))

(defun voyager--run-command-async (command callback &rest args)
  "Run a voyager COMMAND with ARGS asynchronously.
Call CALLBACK with output when complete."
  (let* ((default-directory (voyager--project-root))
         (cmd (mapconcat #'shell-quote-argument
                        (cons voyager-cli-path (cons command args))
                        " ")))
    (async-shell-command cmd (get-buffer-create "*Voyager Output*"))
    (when callback
      (funcall callback))))

(defun voyager--project-root ()
  "Get the current project root directory."
  (or (when (fboundp 'project-root)
        (when-let ((project (project-current)))
          (if (fboundp 'project-root)
              (project-root project)
            (cdr project))))
      (locate-dominating-file default-directory ".git")
      default-directory))

(defun voyager--brain-path ()
  "Get the path to the brain markdown file."
  (expand-file-name (concat voyager-state-dir "/brain.md")
                    (voyager--project-root)))

(defun voyager--skills-dir ()
  "Get the path to the skills directory."
  (expand-file-name (concat voyager-state-dir "/skills")
                    (voyager--project-root)))

;;; Core commands

;;;###autoload
(defun voyager-session-start ()
  "Start a Voyager session."
  (interactive)
  (message "Starting Voyager session...")
  (let ((output (voyager--run-command "session" "start")))
    (if output
        (progn
          (setq voyager--session-active t)
          (message "Voyager session started")
          (voyager-brain-show))
      (message "Failed to start Voyager session"))))

;;;###autoload
(defun voyager-session-end ()
  "End the current Voyager session."
  (interactive)
  (message "Ending Voyager session...")
  (let ((output (voyager--run-command "session" "end")))
    (setq voyager--session-active nil)
    (message "Voyager session ended")))

;;;###autoload
(defun voyager-brain-update ()
  "Update the brain state."
  (interactive)
  (message "Updating brain state...")
  (voyager--run-command-async
   "brain"
   (lambda ()
     (message "Brain state updated")
     (when (get-buffer voyager--brain-buffer)
       (voyager-brain-show)))
   "update"))

;;;###autoload
(defun voyager-brain-show ()
  "Display the brain state in a buffer."
  (interactive)
  (let ((brain-path (voyager--brain-path)))
    (if (file-exists-p brain-path)
        (progn
          (with-current-buffer (get-buffer-create voyager--brain-buffer)
            (let ((inhibit-read-only t))
              (erase-buffer)
              (insert-file-contents brain-path)
              (markdown-mode)
              (read-only-mode 1)
              (goto-char (point-min)))
            (display-buffer (current-buffer))))
      (message "No brain state found. Start a session first."))))

;;;###autoload
(defun voyager-skill-find (query)
  "Find skills matching QUERY."
  (interactive "sSearch skills: ")
  (message "Searching for skills: %s" query)
  (let ((output (voyager--run-command "skill" "find" query)))
    (if output
        (with-current-buffer (get-buffer-create voyager--skills-buffer)
          (let ((inhibit-read-only t))
            (erase-buffer)
            (insert "# Skill Search Results\n\n")
            (insert "Query: " query "\n\n")
            (insert output)
            (markdown-mode)
            (read-only-mode 1)
            (goto-char (point-min)))
          (display-buffer (current-buffer)))
      (message "No skills found"))))

;;;###autoload
(defun voyager-skill-index ()
  "Index skills for search."
  (interactive)
  (message "Indexing skills...")
  (voyager--run-command-async
   "skill"
   (lambda ()
     (message "Skills indexed successfully"))
   "index" "--verbose"))

;;;###autoload
(defun voyager-curriculum-plan ()
  "Create a curriculum plan."
  (interactive)
  (message "Creating curriculum...")
  (voyager--run-command-async
   "curriculum"
   (lambda ()
     (message "Curriculum created")
     (let ((curriculum-path (expand-file-name
                            (concat voyager-state-dir "/curriculum.md")
                            (voyager--project-root))))
       (when (file-exists-p curriculum-path)
         (find-file curriculum-path))))
   "plan" "--output" voyager-state-dir))

;;;###autoload
(defun voyager-factory-propose ()
  "Propose new skills based on workflows."
  (interactive)
  (message "Proposing skills...")
  (voyager--run-command-async
   "factory"
   (lambda ()
     (message "Skills proposed. Check .voyager/skill_proposals.json"))
   "propose"))

;;;###autoload
(defun voyager-configure ()
  "Open Voyager configuration."
  (interactive)
  (let ((config-path (expand-file-name
                     (concat voyager-state-dir "/config.toml")
                     (voyager--project-root))))
    (find-file config-path)))

;;; Mode definition

(defvar voyager-mode-map
  (let ((map (make-sparse-keymap)))
    (define-key map (kbd "C-c v s") 'voyager-session-start)
    (define-key map (kbd "C-c v e") 'voyager-session-end)
    (define-key map (kbd "C-c v u") 'voyager-brain-update)
    (define-key map (kbd "C-c v b") 'voyager-brain-show)
    (define-key map (kbd "C-c v f") 'voyager-skill-find)
    (define-key map (kbd "C-c v i") 'voyager-skill-index)
    (define-key map (kbd "C-c v c") 'voyager-curriculum-plan)
    (define-key map (kbd "C-c v p") 'voyager-factory-propose)
    (define-key map (kbd "C-c v C") 'voyager-configure)
    map)
  "Keymap for `voyager-mode'.")

;;;###autoload
(define-minor-mode voyager-mode
  "Minor mode for Code Voyager integration.

\\{voyager-mode-map}"
  :lighter " Voyager"
  :keymap voyager-mode-map
  :global nil
  (if voyager-mode
      (when (and voyager-auto-start (not voyager--session-active))
        (voyager-session-start))
    (when voyager--session-active
      (voyager-session-end))))

;;;###autoload
(define-globalized-minor-mode global-voyager-mode
  voyager-mode
  (lambda ()
    (when (and (buffer-file-name)
               (voyager--project-root))
      (voyager-mode 1)))
  :group 'voyager)

;;; LSP integration (optional)

(with-eval-after-load 'lsp-mode
  (lsp-register-client
   (make-lsp-client
    :new-connection (lsp-stdio-connection "voyager-lsp")
    :major-modes '(prog-mode)
    :server-id 'voyager
    :priority -1)))

(with-eval-after-load 'eglot
  (add-to-list 'eglot-server-programs
               '((prog-mode) . ("voyager-lsp"))))

(provide 'voyager)
;;; voyager.el ends here
