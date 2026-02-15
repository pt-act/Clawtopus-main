import fs from "node:fs";
import path from "node:path";
import type { RuntimeEnv } from "../runtime.js";
import { importContext, type ContextImportPayload } from "../agents/context-import.js";
import { info } from "../globals.js";
import { shortenHomePath } from "../utils.js";

export type ContextImportOptions = {
  input?: string;
  output?: string;
  session?: string;
};

function readPayload(filePath: string): ContextImportPayload {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as ContextImportPayload;
  return parsed;
}

export async function contextImportCommand(
  opts: ContextImportOptions,
  runtime: RuntimeEnv,
): Promise<void> {
  const inputPath = opts.input?.trim();
  if (!inputPath) {
    runtime.error("Missing --input <file>. Run 'openclaw context-export' first.");
    runtime.exit(1);
    return;
  }
  const resolvedInput = path.resolve(inputPath);
  if (!fs.existsSync(resolvedInput)) {
    runtime.error(`Input file not found: ${resolvedInput}`);
    runtime.exit(1);
    return;
  }

  const payload = readPayload(resolvedInput);
  const result = importContext({ payload, sessionId: opts.session?.trim() });

  const outputPath = opts.output?.trim();
  if (outputPath) {
    const resolvedOutput = path.resolve(outputPath);
    fs.writeFileSync(resolvedOutput, JSON.stringify(result, null, 2), "utf-8");
    runtime.log(info(`Import metadata written: ${shortenHomePath(resolvedOutput)}`));
  }

  runtime.log(info("Context imported."));
  runtime.log(info(`Session: ${result.sessionId}`));
  runtime.log(info(`Transcript: ${shortenHomePath(result.sessionFile)}`));
}
