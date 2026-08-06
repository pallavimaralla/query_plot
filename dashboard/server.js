#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = execSync('git rev-parse --show-toplevel').toString().trim();
const SESSION_FILE = path.join(ROOT, '.agent', 'session.json');
const DEV_LOG = path.join(ROOT, 'docs', 'dev-log.md');
const USER_LOG = path.join(ROOT, 'docs', 'user-log.md');
const PUBLIC_DIR = __dirname;
const PORT = process.env.PORT || 5177;

const EMPTY_PHASES = [
  { id: 'discover', label: 'Discover changes', status: 'idle', detail: '' },
  { id: 'dev-docs', label: 'Developer docs', status: 'idle', detail: '' },
  { id: 'user-docs', label: 'User docs', status: 'idle', detail: '' },
  { id: 'gather', label: 'Gather changelog', status: 'idle', detail: '' },
];

function readJsonSafe(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}

function readTextSafe(file, fallback) {
  try { return fs.readFileSync(file, 'utf8'); }
  catch { return fallback; }
}

function tail(text, n) {
  const lines = text.split('\n');
  return lines.slice(Math.max(0, lines.length - n)).join('\n');
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  if (req.url === '/api/session') {
    const raw = readJsonSafe(SESSION_FILE);
    const body = raw
      ? { ...raw, hasSession: true }
      : { commit: null, commitMessage: null, updatedAt: null, phases: EMPTY_PHASES, hasSession: false };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
    return;
  }

  if (req.url === '/api/logs') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      devLog: tail(readTextSafe(DEV_LOG, '_No developer log yet._'), 60),
      userLog: tail(readTextSafe(USER_LOG, '_No user log yet._'), 60),
    }));
    return;
  }

  const filePath = path.join(PUBLIC_DIR, req.url === '/' ? '/index.html' : req.url);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🖥️  doc-agent dashboard → http://localhost:${PORT}\n`);
});