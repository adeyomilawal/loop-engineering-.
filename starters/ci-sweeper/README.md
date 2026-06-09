# CI Sweeper Starter

Scaffold for the [CI Sweeper](../../patterns/ci-sweeper.md) loop.

## Quick Start

1. Copy skills and state:
   ```bash
   mkdir -p .grok/skills
   cp starters/ci-sweeper/.grok/skills/ci-triage/SKILL.md .grok/skills/ci-triage/SKILL.md
   cp templates/SKILL.md.minimal-fix .grok/skills/minimal-fix/SKILL.md
   cp templates/SKILL.md.verifier .grok/skills/loop-verifier/SKILL.md
   cp starters/ci-sweeper/ci-sweeper-state.md.example ci-sweeper-state.md
   ```

2. Add GitHub Action (optional): `examples/github-actions/ci-sweeper.yml`

3. Start (Grok):
   ```bash
   /loop 15m Check CI on main. Update ci-sweeper-state.md. Classify failures. For new actionable failures (not flakes): worktree + minimal-fix + loop-verifier. Escalate after 3 attempts.
   ```

## Flake Policy

If the same test failed and passed on retry without code change → Watch, do not auto-fix.