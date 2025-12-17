#!/usr/bin/env node
const { execSync } = require('node:child_process');
const output = execSync('git ls-files "*.log"', { encoding: 'utf8' }).trim();

if (output) {
  console.error('Guardrail failed: log files are tracked in git.');
  output.split('\n').forEach((line) => {
    if (line) {
      console.error(`  tracked log: ${line}`);
    }
  });
  process.exit(1);
}

console.log('Guardrail passed: no tracked log files.');
