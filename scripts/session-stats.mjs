#!/usr/bin/env node
// Writes a snapshot of the current Claude Code session into docs/SESSION_STATS.md.
//
//   node scripts/session-stats.mjs            # find the transcript automatically
//   node scripts/session-stats.mjs <file>     # or name it
//
// Why this exists: the session's context is compacted by the harness without
// warning, and everything not written down goes with it. The logbook in
// docs/reference/session-logbook/ had to be rebuilt from the raw transcript
// after that had already happened seventeen times. Running this regularly is
// cheaper than reconstructing it later. See the "Session stats" section of
// CLAUDE.md.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const REPO = path.resolve(import.meta.dirname, "..");

function findTranscript() {
  const named = process.argv[2] ?? process.env.SESSION_TRANSCRIPT;
  if (named) return named;
  const root = path.join(homedir(), ".claude", "projects");
  if (!existsSync(root)) return null;
  let best = null;
  for (const dir of readdirSync(root)) {
    const d = path.join(root, dir);
    if (!statSync(d).isDirectory()) continue;
    for (const f of readdirSync(d)) {
      if (!f.endsWith(".jsonl")) continue;
      const p = path.join(d, f);
      const s = statSync(p);
      // Biggest file wins: the live session is by far the largest.
      if (!best || s.size > best.size) best = { path: p, size: s.size, mtime: s.mtime };
    }
  }
  return best?.path ?? null;
}

// A "user" entry is only a message the human typed. Tool results, command
// invocations, system reminders, task notifications and compaction summaries
// all arrive as the user role too, and counting them inflates the total by
// about a third. That mistake was made once already.
const NOT_TYPED =
  /^\s*(<command-message>|<command-name>|<local-command|Caveat:|<system-reminder>|<task-notification>|<wake |<event |<webhook-payload|This session is being continued|\[Request interrupted)/;

function textOf(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((b) => b && typeof b === "object")
    .map((b) => (b.type === "text" ? b.text ?? "" : b.type === "image" ? "[IMAGE]" : ""))
    .join("\n");
}

async function readTranscript(file) {
  const s = {
    lines: 0, first: null, last: null,
    typed: 0, assistant: 0, toolCalls: 0, toolResults: 0, toolErrors: 0,
    compactions: 0, withImages: 0,
    outputTokens: 0, cacheReads: 0,
    tools: new Map(), days: new Map(), words: [],
  };
  const useById = new Map();
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });

  for await (const line of rl) {
    s.lines++;
    let d;
    try { d = JSON.parse(line); } catch { continue; }
    const ts = d.timestamp ?? "";
    if (ts) {
      if (!s.first || ts < s.first) s.first = ts;
      if (!s.last || ts > s.last) s.last = ts;
    }
    const usage = d.message?.usage ?? {};
    s.outputTokens += usage.output_tokens ?? 0;
    s.cacheReads += usage.cache_read_input_tokens ?? 0;
    const content = d.message?.content;

    if (d.type === "assistant") {
      s.assistant++;
      if (Array.isArray(content)) {
        for (const b of content) {
          if (b?.type === "tool_use") {
            s.toolCalls++;
            useById.set(b.id, b.name);
            const key = String(b.name ?? "?").startsWith("mcp__") ? "MCP" : b.name ?? "?";
            s.tools.set(key, (s.tools.get(key) ?? 0) + 1);
          }
        }
      }
      continue;
    }
    if (d.type !== "user") continue;
    if (d.isCompactSummary) { s.compactions++; continue; }
    if (d.isMeta) continue;

    if (Array.isArray(content) && content.some((b) => b?.type === "tool_result")) {
      for (const b of content) {
        if (b?.type !== "tool_result") continue;
        s.toolResults++;
        if (b.is_error) s.toolErrors++;
      }
      continue;
    }
    const text = textOf(content).replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim();
    if (!text || NOT_TYPED.test(text)) continue;
    s.typed++;
    if (text.includes("[IMAGE]")) s.withImages++;
    s.words.push(text.split(/\s+/).length);
    if (ts) s.days.set(ts.slice(0, 10), (s.days.get(ts.slice(0, 10)) ?? 0) + 1);
  }
  return s;
}

function sh(cmd, fallback = "0") {
  try { return execSync(cmd, { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return fallback; }
}

function codeStats() {
  const src = "web/app web/components web/lib web/tests supabase/migrations";
  const count = (pat) =>
    Number(sh(`find ${src} -type f ${pat} 2>/dev/null | grep -v node_modules | xargs cat 2>/dev/null | wc -l`)) || 0;
  const files = Number(sh(`find ${src} -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.sql' \\) | grep -v node_modules | wc -l`)) || 0;
  const churn = sh(`git log --numstat --pretty=tformat: -- . | awk 'NF==3 && $1!="-" {a+=$1; d+=$2} END {print a" "d}'`, "0 0").split(/\s+/);
  return {
    lines: count(`\\( -name '*.ts' -o -name '*.tsx' -o -name '*.sql' \\)`),
    files,
    migrations: Number(sh(`ls supabase/migrations/*.sql 2>/dev/null | wc -l`)) || 0,
    commits: Number(sh(`git rev-list --count HEAD`)) || 0,
    added: Number(churn[0]) || 0,
    removed: Number(churn[1]) || 0,
    branch: sh(`git rev-parse --abbrev-ref HEAD`, "unknown"),
    head: sh(`git rev-parse --short HEAD`, "unknown"),
  };
}

const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);
const n = (v) => v.toLocaleString("en-US");

const file = findTranscript();
if (!file) {
  console.error("No transcript found. Pass one: node scripts/session-stats.mjs <file.jsonl>");
  process.exit(1);
}
const s = await readTranscript(file);
const c = codeStats();
const stamp = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
const days = [...s.days.keys()].sort();
const errPct = s.toolResults ? ((s.toolErrors / s.toolResults) * 100).toFixed(1) : "0.0";
const topTools = [...s.tools.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

const md = `# Session stats

Snapshot taken ${stamp}. Regenerate with \`node scripts/session-stats.mjs\` from
the repo root. This file exists because the session's context is compacted
without warning and these numbers are not recoverable afterwards without
re-reading the whole transcript. See "Session stats" in CLAUDE.md.

Transcript: \`${file}\`

## The session

| | |
|---|---|
| Span | ${s.first?.slice(0, 10) ?? "?"} to ${s.last?.slice(0, 10) ?? "?"} |
| Days with messages | ${days.length} |
| Transcript lines | ${n(s.lines)} |
| Messages typed by the owner | ${n(s.typed)} |
| Assistant turns | ${n(s.assistant)} |
| Tool calls | ${n(s.toolCalls)} |
| Tool results | ${n(s.toolResults)} |
| Tool errors | ${n(s.toolErrors)} (${errPct}%) |
| Compactions so far | ${n(s.compactions)} |
| Messages carrying an image | ${n(s.withImages)} |
| Median message length | ${median(s.words)} words |
| Assistant output tokens | ${n(s.outputTokens)} |
| Cache reads | ${n(s.cacheReads)} |

## Tools

| Tool | Calls |
|---|---|
${topTools.map(([k, v]) => `| ${k} | ${n(v)} |`).join("\n")}

## The codebase

| | |
|---|---|
| Branch | \`${c.branch}\` at \`${c.head}\` |
| Source lines standing | ${n(c.lines)} |
| Source files | ${n(c.files)} |
| Migrations | ${n(c.migrations)} |
| Commits reachable | ${n(c.commits)} |
| Lines added, all commits | ${n(c.added)} |
| Lines removed, all commits | ${n(c.removed)} |

## Messages per day

${days.map((d) => `- ${d}: ${s.days.get(d)}`).join("\n")}
`;

writeFileSync(path.join(REPO, "docs", "SESSION_STATS.md"), md);
console.log(`Wrote docs/SESSION_STATS.md`);
console.log(`  ${n(s.typed)} messages, ${n(s.toolCalls)} tool calls, ${n(s.compactions)} compactions, ${n(c.lines)} source lines`);
