import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export interface LoopSignals {
  stateFile: { present: boolean; paths: string[] };
  loopConfig: { present: boolean; path?: string };
  skills: { count: number; loopSkills: string[] };
  verifier: { present: boolean };
  triage: { present: boolean };
  agentsMd: { present: boolean };
  patterns: { documented: boolean };
  safety: { loopMdMentionsSafety: boolean };
  starters: { used: boolean };
}

export interface Finding {
  level: 'ok' | 'warn' | 'fail';
  message: string;
}

export interface AuditResult {
  target: string;
  score: number;
  level: 'L0' | 'L1' | 'L2' | 'L3';
  assessment: string;
  signals: LoopSignals;
  findings: Finding[];
  recommendations: string[];
}

const STATE_FILES = [
  'STATE.md',
  'pr-babysitter-state.md',
  'ci-sweeper-state.md',
  'post-merge-state.md',
];

const LOOP_SKILL_NAMES = [
  'loop-triage',
  'minimal-fix',
  'loop-verifier',
  'pr-review-triage',
  'ci-triage',
  'post-merge-scan',
];

async function fileExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function findSkills(root: string): Promise<string[]> {
  const dirs = [
    path.join(root, '.grok', 'skills'),
    path.join(root, '.claude', 'skills'),
    path.join(root, '.codex', 'skills'),
    path.join(root, 'skills'),
  ];
  const found: string[] = [];
  for (const dir of dirs) {
    if (!(await fileExists(dir))) continue;
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) found.push(e.name);
      if (e.isFile() && e.name === 'SKILL.md') found.push('root-skill');
    }
  }
  return found;
}

export function computeScore(signals: LoopSignals): { score: number; level: 'L0' | 'L1' | 'L2' | 'L3'; assessment: string } {
  let score = 10;

  if (signals.stateFile.present) score += 20;
  if (signals.triage.present) score += 15;
  if (signals.loopConfig.present) score += 10;
  if (signals.agentsMd.present) score += 10;
  if (signals.skills.count >= 2) score += 15;
  else if (signals.skills.count === 1) score += 8;
  if (signals.verifier.present) score += 15;
  if (signals.safety.loopMdMentionsSafety) score += 5;

  score = Math.min(100, Math.max(0, score));

  let level: 'L0' | 'L1' | 'L2' | 'L3' = 'L0';
  if (score >= 75 && signals.verifier.present && signals.stateFile.present) level = 'L3';
  else if (score >= 55 && signals.triage.present) level = 'L2';
  else if (score >= 35 && signals.stateFile.present) level = 'L1';
  else level = 'L0';

  const assessment =
    score >= 80 ? 'Strong loop readiness — unattended possible with human gates.' :
    score >= 60 ? 'Good foundation — add verifier before L3.' :
    score >= 40 ? 'Early loop setup — complete L1 checklist.' :
    'Not loop-ready — start with minimal-loop starter.';

  return { score, level, assessment };
}

export async function auditProject(target: string): Promise<AuditResult> {
  const root = path.resolve(target);
  const findings: Finding[] = [];
  const recommendations: string[] = [];

  const statePaths: string[] = [];
  for (const f of STATE_FILES) {
    if (await fileExists(path.join(root, f))) statePaths.push(f);
  }

  const loopMd = await fileExists(path.join(root, 'LOOP.md'));
  const agentsMd = await fileExists(path.join(root, 'AGENTS.md')) ||
    await fileExists(path.join(root, 'CLAUDE.md'));

  const skillNames = await findSkills(root);
  const loopSkills = skillNames.filter((s) => LOOP_SKILL_NAMES.includes(s));

  const verifier = skillNames.includes('loop-verifier');
  const triage = skillNames.includes('loop-triage') || skillNames.includes('pr-review-triage') || skillNames.includes('ci-triage');

  let loopMdContent = '';
  if (loopMd) {
    loopMdContent = await readFile(path.join(root, 'LOOP.md'), 'utf8');
  }

  const signals: LoopSignals = {
    stateFile: { present: statePaths.length > 0, paths: statePaths },
    loopConfig: { present: loopMd, path: loopMd ? 'LOOP.md' : undefined },
    skills: { count: loopSkills.length, loopSkills },
    verifier: { present: verifier },
    triage: { present: triage },
    agentsMd: { present: agentsMd },
    patterns: { documented: loopMd },
    safety: { loopMdMentionsSafety: /gate|denylist|auto-merge|safety/i.test(loopMdContent) },
    starters: { used: loopSkills.includes('loop-triage') },
  };

  if (!signals.stateFile.present) {
    findings.push({ level: 'fail', message: 'No state file (STATE.md or pattern-specific state).' });
    recommendations.push('Copy starters/minimal-loop/STATE.md.example to STATE.md');
  } else {
    findings.push({ level: 'ok', message: `State file(s): ${statePaths.join(', ')}` });
  }

  if (!signals.triage.present) {
    findings.push({ level: 'warn', message: 'No triage skill detected.' });
    recommendations.push('Install loop-triage from templates/ or starters/minimal-loop/');
  } else {
    findings.push({ level: 'ok', message: 'Triage skill present.' });
  }

  if (!signals.verifier.present) {
    findings.push({ level: 'warn', message: 'No loop-verifier skill — maker/checker split incomplete.' });
    recommendations.push('Add templates/SKILL.md.verifier as .grok/skills/loop-verifier/SKILL.md');
  } else {
    findings.push({ level: 'ok', message: 'Verifier skill present.' });
  }

  if (!signals.loopConfig.present) {
    findings.push({ level: 'warn', message: 'No LOOP.md documenting cadence, limits, and gates.' });
    recommendations.push('Copy starters/minimal-loop/LOOP.md and customize');
  }

  if (!signals.agentsMd.present) {
    findings.push({ level: 'warn', message: 'No AGENTS.md / CLAUDE.md for project conventions.' });
    recommendations.push('Add AGENTS.md with build/test commands and review norms');
  }

  if (!signals.safety.loopMdMentionsSafety) {
    findings.push({ level: 'warn', message: 'LOOP.md does not mention safety gates or auto-merge policy.' });
    recommendations.push('Document human gates per docs/safety.md in LOOP.md');
  }

  const { score, level, assessment } = computeScore(signals);

  return {
    target: root,
    score,
    level,
    assessment,
    signals,
    findings,
    recommendations,
  };
}