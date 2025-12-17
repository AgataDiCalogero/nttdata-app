#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'src', 'app');
const ignore = new Set(['.git', 'node_modules', 'dist']);
const empties = [];

function findEmpty(dir) {
  const entries = fs.readdirSync(dir).filter((name) => !ignore.has(name));
  if (!entries.length) {
    empties.push(path.relative(root, dir) || path.basename(dir));
    return;
  }
  entries.forEach((name) => {
    const fullPath = path.join(dir, name);
    if (fs.statSync(fullPath).isDirectory()) {
      findEmpty(fullPath);
    }
  });
}

findEmpty(root);

if (empties.length) {
  console.error('Guardrail failed: empty directories found inside src/app.');
  empties.forEach((dir) => console.error(`  ${dir}`));
  process.exit(1);
}

console.log('Guardrail passed: no empty directories under src/app.');
