# Loop Patterns

Documented, reusable loop patterns that have been (or can be) run in real environments.

Each pattern answers:
- What problem it solves
- Recommended scheduling
- Required skills / state shape
- Verification approach
- Human hand-off strategy
- Tool-specific notes (Grok, Claude Code, Codex, GitHub Actions)

## Pattern Registry

| Pattern | Cadence | Risk | File |
|---------|---------|------|------|
| PR Babysitter | 5–15m | Medium | [pr-babysitter.md](./pr-babysitter.md) |
| Daily Triage | 1d–2h | Low | [daily-triage.md](./daily-triage.md) |
| CI Sweeper | 5–15m | Medium | [ci-sweeper.md](./ci-sweeper.md) |
| Post-Merge Cleanup | 1d–6h | Low | [post-merge-cleanup.md](./post-merge-cleanup.md) |

Machine-readable index: [registry.yaml](./registry.yaml)

## How to Use a Pattern

1. Copy the relevant skill(s) from `templates/` into your project (or publish as a plugin).
2. Copy a starter kit from `starters/` if you want a runnable scaffold.
3. Set up scheduling (`/loop`, `scheduler_create`, GitHub Action, Codex Automation).
4. Create the initial state file.
5. Start the loop — **report-only first** when the pattern supports phased rollout.
6. Iterate on the loop definition based on what actually happens.

Good loops are boring and reliable. Start with one that runs every few hours or daily before going to sub-minute cadences.

## Contributing a Pattern

See [CONTRIBUTING.md](../CONTRIBUTING.md) and [templates/pattern-template.md](../templates/pattern-template.md).