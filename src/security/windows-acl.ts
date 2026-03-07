import os from "node:os";
import { runExec } from "../process/exec.js";

export type ExecFn = typeof runExec;

export type WindowsAclEntry = {
  principal: string;
  rights: string[];
  rawRights: string;
  canRead: boolean;
  canWrite: boolean;
};

export type WindowsAclSummary = {
  ok: boolean;
  entries: WindowsAclEntry[];
  untrustedWorld: WindowsAclEntry[];
  untrustedGroup: WindowsAclEntry[];
  trusted: WindowsAclEntry[];
  error?: string;
};

const INHERIT_FLAGS = new Set(["I", "OI", "CI", "IO", "NP"]);
const WORLD_PRINCIPALS = new Set([
  "everyone",
  "users",
  "builtin\\users",
  "authenticated users",
  "nt authority\\authenticated users",
]);
const TRUSTED_BASE = new Set([
  "nt authority\\system",
  "system",
  "builtin\\administrators",
  "creator owner",
]);
const WORLD_SUFFIXES = ["\\users", "\\authenticated users"];
const TRUSTED_SUFFIXES = ["\\administrators", "\\system", "\\système"];

// Accept an optional leading * which icacls prefixes to SIDs when invoked with /sid
// (e.g. *S-1-5-18 instead of S-1-5-18).
const SID_RE = /^\*?s-\d+-\d+(-\d+)+$/i;
const TRUSTED_SIDS = new Set([
  "s-1-5-18",
  "s-1-5-32-544",
  "s-1-5-80-956008885-3418522649-1831038044-1853292631-2271478464",
]);
// SIDs for world-equivalent principals that icacls /sid emits as raw SIDs.
// Without this list these would be classified as "group" instead of "world".
//   S-1-1-0        Everyone
//   S-1-5-11       Authenticated Users
//   S-1-5-32-545   BUILTIN\Users
const WORLD_SIDS = new Set(["s-1-1-0", "s-1-5-11", "s-1-5-32-545"]);
const STATUS_PREFIXES = [
  "successfully processed",
  "processed",
  "failed processing",
  "no mapping between account names",
];

const normalize = (value: string) => value.trim().toLowerCase();

function normalizeSid(value: string): string {
  const normalized = normalize(value);
  return normalized.startsWith("*") ? normalized.slice(1) : normalized;
}

export function resolveWindowsUserPrincipal(env?: NodeJS.ProcessEnv): string | null {
  const username = env?.USERNAME?.trim() || os.userInfo().username?.trim();
  if (!username) {
    return null;
  }
  const domain = env?.USERDOMAIN?.trim();
  return domain ? `${domain}\\${username}` : username;
}

function buildTrustedPrincipals(env?: NodeJS.ProcessEnv): Set<string> {
  const trusted = new Set<string>(TRUSTED_BASE);
  const principal = resolveWindowsUserPrincipal(env);
  if (principal) {
    trusted.add(normalize(principal));
    const parts = principal.split("\\");
    const userOnly = parts.at(-1);
    if (userOnly) {
      trusted.add(normalize(userOnly));
    }
  }
  const userSid = normalizeSid(env?.USERSID ?? "");
  if (userSid && SID_RE.test(userSid)) {
    trusted.add(userSid);
  }
  return trusted;
}

function classifyPrincipal(
  principal: string,
  env?: NodeJS.ProcessEnv,
): "trusted" | "world" | "group" {
  const normalized = normalize(principal);

  if (SID_RE.test(normalized)) {
    // Strip the leading * that icacls /sid prefixes to SIDs before lookup.
    const sid = normalizeSid(normalized);
    // World-equivalent SIDs must be classified as "world", not "group", so
    // that callers applying world-write policies catch everyone/authenticated-
    // users entries the same way they would catch the human-readable names.
    if (WORLD_SIDS.has(sid)) {
      return "world";
    }
    if (TRUSTED_SIDS.has(sid) || trustedPrincipals.has(sid)) {
      return "trusted";
    }
    return "group";
  }

  if (
    trustedPrincipals.has(normalized) ||
    TRUSTED_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
  ) {
    return "trusted";
  }
  if (WORLD_PRINCIPALS.has(normalized) || WORLD_SUFFIXES.some((s) => normalized.endsWith(s))) {
    return "world";
  }
  return "group";
}

function rightsFromTokens(tokens: string[]): { canRead: boolean; canWrite: boolean } {
  const upper = tokens.join("").toUpperCase();
  const canWrite =
    upper.includes("F") || upper.includes("M") || upper.includes("W") || upper.includes("D");
  const canRead = upper.includes("F") || upper.includes("M") || upper.includes("R");
  return { canRead, canWrite };
}

export function parseIcaclsOutput(output: string, targetPath: string): WindowsAclEntry[] {
  const entries: WindowsAclEntry[] = [];
  const normalizedTarget = targetPath.trim();
  const lowerTarget = normalizedTarget.toLowerCase();
  const quotedTarget = `"${normalizedTarget}"`;
  const quotedLower = quotedTarget.toLowerCase();

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      continue;
    }
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith("successfully processed") ||
      lower.startsWith("processed") ||
      lower.startsWith("failed processing") ||
      lower.startsWith("no mapping between account names")
    ) {
      continue;
    }

    let entry = trimmed;
    if (lower.startsWith(lowerTarget)) {
      entry = trimmed.slice(normalizedTarget.length).trim();
    } else if (lower.startsWith(quotedLower)) {
      entry = trimmed.slice(quotedTarget.length).trim();
    }
    if (!entry) {
      continue;
    }

    const idx = entry.indexOf(":");
    if (idx === -1) {
      continue;
    }

    const principal = entry.slice(0, idx).trim();
    const rawRights = entry.slice(idx + 1).trim();
    const tokens =
      rawRights
        .match(/\(([^)]+)\)/g)
        ?.map((token) => token.slice(1, -1).trim())
        .filter(Boolean) ?? [];
    if (tokens.some((token) => token.toUpperCase() === "DENY")) {
      continue;
    }
    const rights = tokens.filter((token) => !INHERIT_FLAGS.has(token.toUpperCase()));
    if (rights.length === 0) {
      continue;
    }
    const { canRead, canWrite } = rightsFromTokens(rights);
    entries.push({ principal, rights, rawRights, canRead, canWrite });
  }

  return entries;
}

export function summarizeWindowsAcl(
  entries: WindowsAclEntry[],
  env?: NodeJS.ProcessEnv,
): Pick<WindowsAclSummary, "trusted" | "untrustedWorld" | "untrustedGroup"> {
  const trusted: WindowsAclEntry[] = [];
  const untrustedWorld: WindowsAclEntry[] = [];
  const untrustedGroup: WindowsAclEntry[] = [];
  for (const entry of entries) {
    const classification = classifyPrincipal(entry.principal, env);
    if (classification === "trusted") {
      trusted.push(entry);
    } else if (classification === "world") {
      untrustedWorld.push(entry);
    } else {
      untrustedGroup.push(entry);
    }
  }
  return { trusted, untrustedWorld, untrustedGroup };
}

async function resolveCurrentUserSid(exec: ExecFn): Promise<string | null> {
  try {
    const { stdout, stderr } = await exec("whoami", ["/user", "/fo", "csv", "/nh"]);
    const match = `${stdout}\n${stderr}`.match(/\*?S-\d+-\d+(?:-\d+)+/i);
    return match ? normalizeSid(match[0]) : null;
  } catch {
    return null;
  }
}

export async function inspectWindowsAcl(
  targetPath: string,
  opts?: { env?: NodeJS.ProcessEnv; exec?: ExecFn },
): Promise<WindowsAclSummary> {
  const exec = opts?.exec ?? runExec;
  try {
    // /sid outputs security identifiers (e.g. *S-1-5-18) instead of locale-
    // dependent account names so the audit works correctly on non-English
    // Windows (Russian, Chinese, etc.) where icacls prints Cyrillic / CJK
    // characters that may be garbled when Node reads them in the wrong code
    // page.  Fixes #35834.
    const { stdout, stderr } = await exec("icacls", [targetPath, "/sid"]);
    const output = `${stdout}\n${stderr}`.trim();
    const entries = parseIcaclsOutput(output, targetPath);
    let effectiveEnv = opts?.env;
    let { trusted, untrustedWorld, untrustedGroup } = summarizeWindowsAcl(entries, effectiveEnv);

    const needsUserSidResolution =
      !effectiveEnv?.USERSID &&
      untrustedGroup.some((entry) => SID_RE.test(normalize(entry.principal)));
    if (needsUserSidResolution) {
      const currentUserSid = await resolveCurrentUserSid(exec);
      if (currentUserSid) {
        effectiveEnv = { ...effectiveEnv, USERSID: currentUserSid };
        ({ trusted, untrustedWorld, untrustedGroup } = summarizeWindowsAcl(entries, effectiveEnv));
      }
    }

    return { ok: true, entries, trusted, untrustedWorld, untrustedGroup };
  } catch (err) {
    return {
      ok: false,
      entries: [],
      trusted: [],
      untrustedWorld: [],
      untrustedGroup: [],
      error: String(err),
    };
  }
}

export function formatWindowsAclSummary(summary: WindowsAclSummary): string {
  if (!summary.ok) {
    return "unknown";
  }
  const untrusted = [...summary.untrustedWorld, ...summary.untrustedGroup];
  if (untrusted.length === 0) {
    return "trusted-only";
  }
  return untrusted.map((entry) => `${entry.principal}:${entry.rawRights}`).join(", ");
}

export function formatIcaclsResetCommand(
  targetPath: string,
  opts: { isDir: boolean; env?: NodeJS.ProcessEnv },
): string {
  const user = resolveWindowsUserPrincipal(opts.env) ?? "%USERNAME%";
  const grant = opts.isDir ? "(OI)(CI)F" : "F";
  return `icacls "${targetPath}" /inheritance:r /grant:r "${user}:${grant}" /grant:r "SYSTEM:${grant}"`;
}

export function createIcaclsResetCommand(
  targetPath: string,
  opts: { isDir: boolean; env?: NodeJS.ProcessEnv },
): { command: string; args: string[]; display: string } | null {
  const user = resolveWindowsUserPrincipal(opts.env);
  if (!user) {
    return null;
  }
  const grant = opts.isDir ? "(OI)(CI)F" : "F";
  const args = [
    targetPath,
    "/inheritance:r",
    "/grant:r",
    `${user}:${grant}`,
    "/grant:r",
    `SYSTEM:${grant}`,
  ];
  return { command: "icacls", args, display: formatIcaclsResetCommand(targetPath, opts) };
}
