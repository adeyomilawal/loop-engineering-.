#!/usr/bin/env node
import { auditProject } from './auditor.js';
import { formatHuman, formatJson, formatMarkdown } from './reporter.js';
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('-')) || '.';
const json = args.includes('--json');
const md = args.includes('--md');
const help = args.includes('--help') || args.includes('-h');
if (help) {
    console.log(`loop-audit — Loop Readiness Score CLI

Usage:
  loop-audit [path] [options]

Options:
  --json    JSON output
  --md      Markdown output
  --help    Show help

Exit codes:
  0  score >= 40
  2  score < 40 (early stage)
`);
    process.exit(0);
}
try {
    const result = await auditProject(target);
    if (json)
        console.log(formatJson(result));
    else if (md)
        console.log(formatMarkdown(result));
    else
        console.log(formatHuman(result));
    if (result.score < 40)
        process.exitCode = 2;
}
catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Audit failed:', msg);
    process.exitCode = 1;
}
