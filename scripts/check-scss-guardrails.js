#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const tokensPath = path.join(root, 'src', 'styles', '_tokens.scss');
const styleRoot = path.join(root, 'src');

const fileViolations = new Map();
const categoryCounts = new Map();
const deepWarnings = [];
const importantWarnings = [];
const deepCountsByFile = new Map();
const importantCountsByFile = new Map();

const normalizePath = (file) => path.relative(root, file).split(path.sep).join('/');

const addViolation = (file, category) => {
  const current = fileViolations.get(file) ?? 0;
  fileViolations.set(file, current + 1);
  categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
};

const recordDeepWarning = (file, line, match) => {
  deepWarnings.push({ file, line, match });
  deepCountsByFile.set(file, (deepCountsByFile.get(file) ?? 0) + 1);
  addViolation(file, 'deep selector');
};

const recordImportantWarning = (file, line) => {
  importantWarnings.push({ file, line });
  importantCountsByFile.set(file, (importantCountsByFile.get(file) ?? 0) + 1);
  addViolation(file, 'important');
};

const tokensViolations = [];
const tokensLines = fs.readFileSync(tokensPath, 'utf8').split(/\r?\n/);
let insideProperty = false;
let blockComment = false;

const bannedSelectors = [
  /:root/,
  /body\b/,
  /\.mat-mdc-/,
  /\.mdc-/,
  /\.cdk-/,
  /::ng-deep/,
  /@media/,
  /@mixin/,
  /@import/,
  /@use/,
  /@forward/,
  /{/,
  /}/,
];

const recordTokensViolation = (lineNumber, text, reason, suggestion) => {
  const file = normalizePath(tokensPath);
  tokensViolations.push({ file, lineNumber, text, reason, suggestion });
  addViolation(file, 'tokens');
};

tokensLines.forEach((line, index) => {
  const trimmed = line.trim();
  if (blockComment) {
    if (trimmed.includes('*/')) {
      blockComment = false;
    }
    return;
  }

  if (trimmed === '') {
    return;
  }

  if (trimmed.startsWith('//')) {
    return;
  }

  if (trimmed.startsWith('/*')) {
    if (!trimmed.includes('*/')) {
      blockComment = true;
    }
    return;
  }

  if (insideProperty) {
    if (trimmed.includes(';')) {
      insideProperty = false;
    }
    if (trimmed.includes('!important')) {
      recordTokensViolation(
        index + 1,
        trimmed,
        '`!important` is disallowed inside tokens.',
        'Keep token declarations clean; move the override to a component if necessary.',
      );
    }
    return;
  }

  if (trimmed.startsWith('--')) {
    if (!trimmed.includes(':')) {
      recordTokensViolation(
        index + 1,
        trimmed,
        'CSS custom properties must include a colon.',
        'Use the form `--token-name: value;`.',
      );
    }
    insideProperty = !trimmed.includes(';');
    if (trimmed.includes('!important')) {
      recordTokensViolation(
        index + 1,
        trimmed,
        '`!important` is disallowed inside tokens.',
        'Keep token declarations clean; move the override to a component if necessary.',
      );
    }
    return;
  }

  for (const regex of bannedSelectors) {
    if (regex.test(trimmed)) {
      recordTokensViolation(
        index + 1,
        trimmed,
        'Only CSS custom properties and comments are allowed in `_tokens.scss`.',
        'Keep token declarations in this file and use selectors via `tokens-wrapper`.',
      );
      return;
    }
  }

  if (trimmed.includes('!important')) {
    recordTokensViolation(
      index + 1,
      trimmed,
      '`!important` is disallowed inside tokens.',
      'Move the declaration to a component stylesheet or drop the override.',
    );
    return;
  }

  recordTokensViolation(
    index + 1,
    trimmed,
    'Unexpected content in `_tokens.scss`.',
    'Ensure only `--token: value;` or comments are present.',
  );
});

const gatherFiles = (dir, collector = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'coverage'].includes(entry.name) || entry.name.startsWith('.')) {
        continue;
      }
      gatherFiles(path.join(dir, entry.name), collector);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (ext === '.scss' || ext === '.css') {
        collector.push(path.join(dir, entry.name));
      }
    }
  }
  return collector;
};

const styleFiles = gatherFiles(styleRoot);
const deepRegex = /(::ng-deep|\.mat-mdc-|\.mdc-|\.cdk-)/;

styleFiles.forEach((file) => {
  const relativeFile = normalizePath(file);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  let commentBlock = false;
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (commentBlock) {
      if (trimmed.includes('*/')) {
        commentBlock = false;
      }
      return;
    }

    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        commentBlock = true;
      }
      return;
    }

    if (trimmed.startsWith('//') || trimmed === '') {
      return;
    }

    const deepMatch = trimmed.match(deepRegex);
    if (deepMatch) {
      recordDeepWarning(relativeFile, index + 1, deepMatch[0]);
    }

    if (trimmed.includes('!important')) {
      recordImportantWarning(relativeFile, index + 1);
    }
  });
});

const totalViolations = Array.from(fileViolations.values()).reduce((sum, value) => sum + value, 0);

const pad = (value, length) => {
  const str = String(value);
  return str + ' '.repeat(Math.max(0, length - str.length));
};

const printTopFiles = () => {
  if (!fileViolations.size) {
    console.log('Top 10 files by violations: none');
    return;
  }
  const entries = Array.from(fileViolations.entries()).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 10);
  const fileWidth = Math.max('File'.length, ...top.map(([file]) => file.length));
  console.log('\nTop 10 files by violations');
  console.log(`${pad('File', fileWidth)}  Count`);
  console.log(`${'-'.repeat(fileWidth)}  -----`);
  top.forEach(([file, count]) => {
    console.log(`${pad(file, fileWidth)}  ${count}`);
  });
};

const printCategorySummary = () => {
  if (!categoryCounts.size) {
    console.log('Violations by category: none');
    return;
  }
  const entries = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);
  const catWidth = Math.max('Category'.length, ...entries.map(([category]) => category.length));
  console.log('\nViolations by category');
  console.log(`${pad('Category', catWidth)}  Count`);
  console.log(`${'-'.repeat(catWidth)}  -----`);
  entries.forEach(([category, count]) => {
    console.log(`${pad(category, catWidth)}  ${count}`);
  });
};

const tokensFileRel = normalizePath(tokensPath);
if (tokensViolations.length) {
  console.error('\nTokens guard failed: only CSS custom properties are allowed in `_tokens.scss`.');
  tokensViolations.forEach(({ lineNumber, text, reason, suggestion }) => {
    console.error(`  ${tokensFileRel}:${lineNumber}: ${reason}`);
    console.error(`    ${text}`);
    console.error(`    Suggestion: ${suggestion}`);
    console.error('');
  });
  process.exitCode = 1;
}

printTopFiles();
printCategorySummary();

if (deepWarnings.length) {
  const [topFile, topCount] = Array.from(deepCountsByFile.entries()).sort((a, b) => b[1] - a[1])[0];
  console.log(
    `\nDeep selector warnings: ${deepWarnings.length} total, top file ${topFile} (${topCount} occurrences).`,
  );
  deepWarnings.slice(0, 3).forEach(({ file, line, match }) =>
    console.log(`  ${file}:${line} contains "${match}".`),
  );
}

if (importantWarnings.length) {
  const [topFile, topCount] = Array.from(importantCountsByFile.entries()).sort((a, b) => b[1] - a[1])[0];
  console.log(
    `\n'!important' warnings: ${importantWarnings.length} total, top file ${topFile} (${topCount} occurrences).`,
  );
  importantWarnings.slice(0, 3).forEach(({ file, line }) => {
    console.log(`  ${file}:${line} contains "!important".`);
  });
}

if (totalViolations === 0) {
  console.log('\nNo style violations detected.');
}
