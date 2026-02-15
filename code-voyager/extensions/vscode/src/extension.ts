/**
 * Code Voyager VS Code Extension
 *
 * Provides automatic session management, brain state visualization,
 * and skill management integration for Code Voyager.
 */

import * as vscode from "vscode";
import { BrainViewProvider } from "./views/brainView";
import { SkillsViewProvider } from "./views/skillsView";
import { VoyagerClient } from "./voyagerClient";

let voyagerClient: VoyagerClient;
let brainViewProvider: BrainViewProvider;
let skillsViewProvider: SkillsViewProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log("Code Voyager extension activated");

  // Initialize Voyager client
  voyagerClient = new VoyagerClient();

  // Register webview providers
  brainViewProvider = new BrainViewProvider(context.extensionUri, voyagerClient);
  skillsViewProvider = new SkillsViewProvider(context.extensionUri, voyagerClient);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("voyager.brainView", brainViewProvider),
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("voyager.skillsView", skillsViewProvider),
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("voyager.sessionStart", async () => {
      await sessionStart();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("voyager.sessionEnd", async () => {
      await sessionEnd();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("voyager.brainUpdate", async () => {
      await brainUpdate();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("voyager.brainShow", async () => {
      await brainShow();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("voyager.skillFind", async () => {
      await skillFind();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("voyager.skillIndex", async () => {
      await skillIndex();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("voyager.curriculumPlan", async () => {
      await curriculumPlan();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("voyager.factoryPropose", async () => {
      await factoryPropose();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("voyager.configure", async () => {
      await configure();
    }),
  );

  // Auto-start session if enabled
  const config = vscode.workspace.getConfiguration("voyager");
  if (config.get("enabled") && config.get("autoStart")) {
    sessionStart();
  }

  // Watch for workspace folder changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      if (config.get("autoStart")) {
        sessionStart();
      }
    }),
  );
}

export function deactivate() {
  // Auto-save on deactivation
  const config = vscode.workspace.getConfiguration("voyager");
  if (config.get("enabled")) {
    sessionEnd();
  }
}

async function sessionStart() {
  try {
    const result = await voyagerClient.sessionStart();
    if (result.success) {
      vscode.window.showInformationMessage("Voyager: Session started");
      brainViewProvider.refresh();
    } else {
      vscode.window.showErrorMessage(`Voyager: Failed to start session - ${result.error}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Voyager: ${error}`);
  }
}

async function sessionEnd() {
  try {
    const result = await voyagerClient.sessionEnd();
    if (result.success) {
      vscode.window.showInformationMessage("Voyager: Session ended");
    } else {
      vscode.window.showWarningMessage(`Voyager: Failed to end session - ${result.error}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Voyager: ${error}`);
  }
}

async function brainUpdate() {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Updating brain state...",
        cancellable: false,
      },
      async () => {
        const result = await voyagerClient.brainUpdate();
        if (result.success) {
          vscode.window.showInformationMessage("Voyager: Brain updated");
          brainViewProvider.refresh();
        } else {
          vscode.window.showErrorMessage(`Voyager: Failed to update brain - ${result.error}`);
        }
      },
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Voyager: ${error}`);
  }
}

async function brainShow() {
  try {
    const brain = await voyagerClient.getBrain();
    if (brain) {
      const doc = await vscode.workspace.openTextDocument({
        content: brain.markdown,
        language: "markdown",
      });
      await vscode.window.showTextDocument(doc, { preview: true });
    } else {
      vscode.window.showInformationMessage("Voyager: No brain state found");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Voyager: ${error}`);
  }
}

async function skillFind() {
  const query = await vscode.window.showInputBox({
    prompt: "Search for skills",
    placeHolder: "e.g., deployment workflow",
  });

  if (!query) {
    return;
  }

  try {
    const skills = await voyagerClient.skillFind(query);
    if (skills.length > 0) {
      const selection = await vscode.window.showQuickPick(
        skills.map((s) => ({
          label: s.name,
          description: s.description,
          detail: `Score: ${s.score.toFixed(2)}`,
        })),
        {
          placeHolder: "Select a skill to view",
        },
      );

      if (selection) {
        // TODO: Show skill details
        vscode.window.showInformationMessage(`Selected skill: ${selection.label}`);
      }
    } else {
      vscode.window.showInformationMessage("No skills found");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Voyager: ${error}`);
  }
}

async function skillIndex() {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Indexing skills...",
        cancellable: false,
      },
      async () => {
        const result = await voyagerClient.skillIndex();
        if (result.success) {
          vscode.window.showInformationMessage("Voyager: Skills indexed");
          skillsViewProvider.refresh();
        } else {
          vscode.window.showErrorMessage(`Voyager: Failed to index skills - ${result.error}`);
        }
      },
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Voyager: ${error}`);
  }
}

async function curriculumPlan() {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Creating curriculum...",
        cancellable: false,
      },
      async () => {
        const result = await voyagerClient.curriculumPlan();
        if (result.success) {
          vscode.window.showInformationMessage("Voyager: Curriculum created");
          // Open curriculum file
          const curriculumPath = await voyagerClient.getCurriculumPath();
          if (curriculumPath) {
            const doc = await vscode.workspace.openTextDocument(curriculumPath);
            await vscode.window.showTextDocument(doc);
          }
        } else {
          vscode.window.showErrorMessage(`Voyager: Failed to create curriculum - ${result.error}`);
        }
      },
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Voyager: ${error}`);
  }
}

async function factoryPropose() {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Proposing skills...",
        cancellable: false,
      },
      async () => {
        const result = await voyagerClient.factoryPropose();
        if (result.success) {
          vscode.window.showInformationMessage("Voyager: Skills proposed");
          skillsViewProvider.refresh();
        } else {
          vscode.window.showErrorMessage(`Voyager: Failed to propose skills - ${result.error}`);
        }
      },
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Voyager: ${error}`);
  }
}

async function configure() {
  await vscode.commands.executeCommand("workbench.action.openSettings", "voyager");
}
