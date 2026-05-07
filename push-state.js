#!/usr/bin/env node
/**
 * Push state update to GitHub repo.
 * Usage: node push-state.js <json-file>
 *   or:  node push-state.js --phase walking --task "..." --meeting 9,7
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_DIR = '/home/node/.openclaw/workspace/agent-office';
const STATE_FILE = path.join(REPO_DIR, 'state.json');

// Load current state
let state = { version: 0, task: null, phase: 'idle', timestamp: null, agent_states: {}, meeting_point: null, result: null };
if (fs.existsSync(STATE_FILE)) {
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch(e) {}
}

const args = process.argv.slice(2);

if (args.length >= 2 && !args[0].startsWith('--')) {
  // Load state from JSON file
  const data = JSON.parse(fs.readFileSync(args[0], 'utf8'));
  Object.assign(state, data);
} else {
  // Parse key=value pairs
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phase') state.phase = args[++i];
    else if (args[i] === '--task') state.task = args[++i];
    else if (args[i] === '--meeting') {
      const [x, y] = args[++i].split(',').map(Number);
      state.meeting_point = { x, y };
    } else if (args[i] === '--agent') {
      const name = args[++i];
      const dialogue = args[++i];
      const targetX = parseFloat(args[++i]);
      const targetY = parseFloat(args[++i]);
      const duration = parseInt(args[++i]) || 200;
      state.agent_states = state.agent_states || {};
      state.agent_states[name] = { dialogue, target: { x: targetX, y: targetY }, duration };
    } else if (args[i] === '--result') {
      state.result = JSON.parse(args[++i]);
    } else if (args[i] === '--clear') {
      state.result = null;
    }
  }
}

state.version = (state.version || 0) + 1;
state.timestamp = new Date().toISOString();

fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

// Git commit & push
try {
  execSync('cd ' + REPO_DIR + ' && git add state.json && git commit -m "state update v' + state.version + ': ' + state.phase + '" && git push origin main 2>&1', {
    stdio: 'pipe',
    timeout: 30000,
    encoding: 'utf8'
  });
  console.log('✓ State v' + state.version + ' pushed: ' + state.phase + ' | ' + (state.task || '-'));
} catch(e) {
  console.error('Push error:', e.message.substring(0, 200));
  process.exit(1);
}
