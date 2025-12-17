#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const [rawPath] = process.argv.slice(2);
const reportPath = rawPath || path.resolve(process.cwd(), 'lint.json');

if (!fs.existsSync(reportPath)) {
  console.error(`Lint report not found: ${reportPath}`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const ruleCounts = new Map();
const fileCounts = new Map();

for (const result of payload.results || []) {
  const relativeFile = path.relative(process.cwd(), result.filePath);
  const messages = result.messages || [];
  for (const message of messages) {
    const ruleId = message.ruleId || '<no rule>';
    ruleCounts.set(ruleId, (ruleCounts.get(ruleId) || 0) + 1);
    fileCounts.set(relativeFile, (fileCounts.get(relativeFile) || 0) + 1);
  }
}

const sortByCount = (entries) =>
  [...entries].sort((a, b) => b[1] - a[1]).slice(0, 10);

console.log('Top 10 rules by warning count:');
console.table(sortByCount(ruleCounts));

console.log('Top 10 files by warning count:');
console.table(sortByCount(fileCounts));
