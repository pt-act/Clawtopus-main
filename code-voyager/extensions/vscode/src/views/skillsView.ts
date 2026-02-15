/**
 * Skills View Provider - Shows available skills in sidebar
 */

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { VoyagerClient } from "../voyagerClient";

export class SkillsViewProvider implements vscode.WebviewViewProvider {
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
        case "search":
          // TODO: Implement search
          break;
        case "propose":
          await this._voyagerClient.factoryPropose();
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
    const skills = await this._getSkills();

    if (skills.length === 0) {
      return this._getEmptyState(webview);
    }

    const skillsHtml = skills
      .map(
        (skill) => `
            <div class="skill-card">
                <div class="skill-header">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-type">${skill.type}</span>
                </div>
                <div class="skill-description">${skill.description || "No description"}</div>
            </div>
        `,
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skills</title>
    <style>
        body {
            padding: 10px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
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
            flex: 1;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .skills-count {
            margin-bottom: 10px;
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }
        .skill-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
            cursor: pointer;
        }
        .skill-card:hover {
            border-color: var(--vscode-focusBorder);
        }
        .skill-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }
        .skill-name {
            font-weight: bold;
            color: var(--vscode-editor-foreground);
        }
        .skill-type {
            font-size: 0.8em;
            padding: 2px 6px;
            border-radius: 3px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }
        .skill-description {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="actions">
        <button onclick="refresh()">🔄 Refresh</button>
        <button onclick="propose()">💡 Propose</button>
    </div>
    
    <div class="skills-count">${skills.length} skill${skills.length !== 1 ? "s" : ""}</div>
    
    <div id="skills">
        ${skillsHtml}
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function refresh() {
            vscode.postMessage({ command: 'refresh' });
        }

        function propose() {
            vscode.postMessage({ command: 'propose' });
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
    <title>Skills</title>
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
        <div class="empty-icon">⚡</div>
        <h2>No Skills Found</h2>
        <p>Create skills to enhance your workflow.</p>
        <button onclick="propose()">Propose Skills</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function propose() {
            vscode.postMessage({ command: 'propose' });
        }
    </script>
</body>
</html>`;
  }

  private async _getSkills(): Promise<Array<{ name: string; type: string; description?: string }>> {
    const skillsDir = this._voyagerClient.getSkillsDir();
    const skills: Array<{ name: string; type: string; description?: string }> = [];

    if (!fs.existsSync(skillsDir)) {
      return skills;
    }

    // Scan skills directory
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(skillsDir, entry.name);
        const metadataPath = path.join(skillPath, "metadata.json");

        let type = "custom";
        let description = undefined;

        if (fs.existsSync(metadataPath)) {
          try {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
            type = metadata.type || "custom";
            description = metadata.description;
          } catch (error) {
            // Ignore parsing errors
          }
        }

        skills.push({
          name: entry.name,
          type,
          description,
        });
      }
    }

    return skills.sort((a, b) => a.name.localeCompare(b.name));
  }
}
