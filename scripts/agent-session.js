#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = execSync('git rev-parse --show-toplevel').toString().trim();
const SESSION_DIR = path.join(ROOT, '.agent');
const SESSION_FILE = path.join(SESSION_DIR, 'session.json');

const DEFAULT_PHASES = [
  { id: 'discover', label: 'Discover changes' },
  { id: 'dev-docs', label: 'Developer docs' },
  { id: 'user-docs', label: 'User docs' },
  { id: 'gather', label: 'Gather changelog' },
];

function git(cmd) {
  try { return execSync(cmd, { cwd: ROOT }).toString().trim(); }
  catch { return ''; }
}

function readSession() {
  if (!fs.existsSync(SESSION_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); }
  catch { return null; }
}

function writeSession(session) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2) + '\n');
}

function cmdInit() {
  const sha = git('git rev-parse HEAD');
  const message = git('git log -1 --pretty=%s');
  const hasParent = Boolean(git('git rev-parse HEAD~1 2>/dev/null'));
  const diffStat = hasParent
    ? git('git diff --stat HEAD~1 HEAD')
    : git('git show --stat --format= HEAD');

  const session = {
    commit: sha,
    commitMessage: message,
    updatedAt: new Date().toISOString(),
    phases: [
      { id: 'discover', label: 'Discover changes', status: 'complete', detail: diffStat || 'No diff detected' },
      { id: 'dev-docs', label: 'Developer docs', status: 'pending', detail: 'Run /dev-docs in Copilot Chat' },
      { id: 'user-docs', label: 'User docs', status: 'pending', detail: 'Run /user-docs in Copilot Chat' },
      { id: 'gather', label: 'Gather changelog', status: 'idle', detail: 'Run /gather-changelog when ready to bundle commits' },
    ],
  };
  writeSession(session);

  console.log('\n📋 doc-agent: session updated for ' + sha.slice(0, 7) + ' — "' + message + '"');
  console.log('   → Open Copilot Chat and run /dev-docs, then /user-docs');
  console.log('   → Watch it live: node dashboard/server.js  (http://localhost:5177)\n');
}

function cmdMark() {
  const [, , , phaseId, status, ...detailParts] = process.argv;
  if (!phaseId || !status) {
    console.error('Usage: node scripts/agent-session.js mark <phaseId> <status> [detail...]');
    process.exit(1);
  }

  const session = readSession() || {
    commit: git('git rev-parse HEAD'),
    commitMessage: git('git log -1 --pretty=%s'),
    updatedAt: new Date().toISOString(),
    phases: DEFAULT_PHASES.map((p) => ({ ...p, status: 'idle', detail: '' })),
  };

  const phase = session.phases.find((p) => p.id === phaseId);
  if (!phase) {
    console.error(`Unknown phase "${phaseId}". Valid phases: ${DEFAULT_PHASES.map((p) => p.id).join(', ')}`);
    process.exit(1);
  }

  phase.status = status;
  if (detailParts.length) phase.detail = detailParts.join(' ');
  session.updatedAt = new Date().toISOString();
  writeSession(session);
  console.log(`✓ ${phaseId} → ${status}`);
}

const command = process.argv[2];
if (command === 'init') cmdInit();
else if (command === 'mark') cmdMark();
else {
  console.error('Usage: node scripts/agent-session.js <init|mark> ...');
  process.exit(1);
}