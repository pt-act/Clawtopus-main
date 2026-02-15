/**
 * Brain View Provider - Shows session brain state in sidebar
 */

import { marked } from "marked";
import * as vscode from "vscode";
import { VoyagerClient } from "../voyagerClient";

export class BrainViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _voyagerClient: VoyagerClient,
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    this.refresh();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "refresh":
          this.refresh();
          break;
        case "update":
          await this._voyagerClient.brainUpdate();
          this.refresh();
          break;
      }
    });
  }

  public async refresh() {
    if (this._view) {
      this._view.webview.html = await this._getHtmlForWebview(this._view.webview);
    }
  }

  private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    const brain = await this._voyagerClient.getBrain();

    if (!brain) {
      return this._getEmptyState(webview);
    }

    // Convert markdown to HTML
    const contentHtml = marked(brain.markdown) as string;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Brain</title>
    <style>
        body {
            padding: 10px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }
        h1, h2, h3 {
            color: var(--vscode-editor-foreground);
        }
        h2 {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 5px;
            margin-top: 20px;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin: 5px 0;
        }
        .actions {
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .stats {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            font-size: 0.9em;
        }
        .stat {
            background: var(--vscode-editor-background);
            padding: 8px 12px;
            border-radius: 4px;
        }
        .stat-label {
            color: var(--vscode-descriptionForeground);
            font-size: 0.85em;
        }
        .stat-value {
            font-weight: bold;
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <div class="actions">
        <button onclick="refresh()">🔄 Refresh</button>
        <button onclick="update()">💾 Update</button>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-label">Goals</div>
            <div class="stat-value">${brain.goals.length}</div>
        </div>
        <div class="stat">
            <div class="stat-label">Decisions</div>
            <div class="stat-value">${brain.decisions.length}</div>
        </div>
        <div class="stat">
            <div class="stat-label">Next Steps</div>
            <div class="stat-value">${brain.nextSteps.length}</div>
        </div>
    </div>
    
    <div id="content">
        ${contentHtml}
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function refresh() {
            vscode.postMessage({ command: 'refresh' });
        }

        function update() {
            vscode.postMessage({ command: 'update' });
        }
    </script>
</body>
</html>`;
  }

  private _getEmptyState(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Brain</title>
    <style>
        body {
            padding: 20px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            text-align: center;
        }
        .empty-state {
            margin-top: 50px;
        }
        .empty-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 2px;
            margin-top: 15px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="empty-state">
        <div class="empty-icon">🧠</div>
        <h2>No Brain State Found</h2>
        <p>Start a session to create your brain state.</p>
        <button onclick="startSession()">Start Session</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function startSession() {
            vscode.postMessage({ command: 'startSession' });
        }
    </script>
</body>
</html>`;
  }
}
