# loop-audit

CLI that scores a project's **Loop Readiness** (0–100) and suggests next steps.

## Install & Run

```bash
cd tools/loop-audit
npm install
npm run build
node dist/cli.js /path/to/your/project
```

Or from repo root after build:

```bash
node tools/loop-audit/dist/cli.js starters/minimal-loop
```

## Options

```bash
loop-audit .              # human-readable (default)
loop-audit . --json       # machine-readable
loop-audit . --md         # markdown report
```

Exit code `2` if score < 40 (useful for CI gates once your project is loop-ready).

## Signals Checked

| Signal | Weight |
|--------|--------|
| State file (`STATE.md`, etc.) | High |
| Triage skill | High |
| Verifier skill (maker/checker) | High |
| `LOOP.md` config | Medium |
| `AGENTS.md` / project rules | Medium |
| Safety gates documented | Low |

## Levels

| Level | Meaning |
|-------|---------|
| L0 | Draft — document intent |
| L1 | Report-only loops |
| L2 | Assisted auto-fix with verifier |
| L3 | Unattended-capable (with human gates) |

See [docs/loop-design-checklist.md](../../docs/loop-design-checklist.md).