#!/usr/bin/env node
/**
 * Update bet-state.json and push.
 * Usage: node update-bets.js
 *   or:  node update-bets.js --add '{"date":"2026-05-07","tournament":"UEL","match":"X vs Y","bet":"...","stake":1,"odds":2.0,"result":"pending","pl":"0.00"}'
 *   or:  node update-bets.js --result 2 '{"result":"won","pl":"+2.80"}'  (index 2)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_DIR = '/home/node/.openclaw/workspace/agent-office';
const BET_FILE = path.join(REPO_DIR, 'bet-tracker', 'bet-state.json');

let state = { bets: [], updated: new Date().toISOString() };
if (fs.existsSync(BET_FILE)) {
  try { state = JSON.parse(fs.readFileSync(BET_FILE, 'utf8')); } catch(e) {}
}

const args = process.argv.slice(2);

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--add') {
    const bet = JSON.parse(args[++i]);
    state.bets.push(bet);
  } else if (args[i] === '--result') {
    const idx = parseInt(args[++i]);
    const update = JSON.parse(args[++i]);
    if (idx >= 0 && idx < state.bets.length) {
      Object.assign(state.bets[idx], update);
    }
  } else if (args[i] === '--list') {
    state.bets.forEach((b,i) => console.log(i+'.', b.date, b.match, b.result, b.pl));
    process.exit(0);
  } else if (args[i] === '--clear') {
    state.bets = [];
  } else if (args[i] === '--results') {
    // Update all pending results at once
    const updates = JSON.parse(args[++i]); // array of {index, result, pl} 
    updates.forEach(u => {
      if (u.index >= 0 && u.index < state.bets.length) {
        if (u.result) state.bets[u.index].result = u.result;
        if (u.pl !== undefined) state.bets[u.index].pl = u.pl;
      }
    });
  }
}

state.updated = new Date().toISOString();
fs.writeFileSync(BET_FILE, JSON.stringify(state, null, 2));

try {
  execSync('cd ' + REPO_DIR + ' && git add bet-tracker/bet-state.json && git commit -m "bet state update" && git push origin main 2>&1', {
    stdio: 'pipe', timeout: 30000, encoding: 'utf8'
  });
  console.log('✓ Bet state updated (' + state.bets.length + ' bets)');
} catch(e) {
  console.error('Push error:', e.message.substring(0,200));
  process.exit(1);
}
