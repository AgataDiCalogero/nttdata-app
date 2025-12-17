#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const filePath = path.resolve(__dirname, '..', 'src', 'styles', '_tokens.scss');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);
const selectorRegex = /\.(?:mat-mdc|mdc|cdk)-/;

const violations = lines
  .map((line, index) => ({ line: index + 1, text: line.trim() }))
  .filter(({ text }) => selectorRegex.test(text));

if (violations.length) {
  console.error('Guardrail failed: `_tokens.scss` must only declare CSS custom properties.');
  violations.forEach(({ line, text }) =>
    console.error(`  src/styles/_tokens.scss:${line}: ${text}`),
  );
  process.exit(1);
}

console.log('Guardrail passed: `_tokens.scss` contains only CSS variables.');
