#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');

const args = process.argv.slice(2);
const cssPath = args.find((arg) => !arg.startsWith('--'));
const topArgIndex = args.indexOf('--top');
const top = topArgIndex >= 0 ? Number(args[topArgIndex + 1]) || 30 : 30;
const asJson = args.includes('--json');

if (!cssPath) {
  console.error('Usage: node scripts/css-conflicts.js <css-file> [--top N] [--json]');
  process.exit(1);
}

const css = fs.readFileSync(cssPath, 'utf8');

const lineStarts = [0];
for (let i = 0; i < css.length; i += 1) {
  if (css[i] === '\n') {
    lineStarts.push(i + 1);
  }
}

function lineAt(index) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lineStarts[mid] <= index && (mid === lineStarts.length - 1 || lineStarts[mid + 1] > index)) {
      return mid + 1;
    }
    if (lineStarts[mid] > index) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return 1;
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function splitTopLevel(input, delimiter) {
  const parts = [];
  let start = 0;
  let depthParen = 0;
  let depthBracket = 0;
  let quote = null;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quote) {
      if (ch === quote && input[i - 1] !== '\\') {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '(') {
      depthParen += 1;
      continue;
    }
    if (ch === ')') {
      depthParen = Math.max(0, depthParen - 1);
      continue;
    }
    if (ch === '[') {
      depthBracket += 1;
      continue;
    }
    if (ch === ']') {
      depthBracket = Math.max(0, depthBracket - 1);
      continue;
    }
    if (ch === delimiter && depthParen === 0 && depthBracket === 0) {
      parts.push(input.slice(start, i));
      start = i + 1;
    }
  }

  parts.push(input.slice(start));
  return parts;
}

function splitSelectors(selectorText) {
  return splitTopLevel(selectorText, ',')
    .map((selector) => normalizeWhitespace(selector))
    .filter(Boolean);
}

function parseAtRule(prelude) {
  const trimmed = prelude.trim();
  const match = /^@([a-zA-Z0-9_-]+)/.exec(trimmed);
  if (!match) {
    return { name: '', raw: trimmed, prelude: '' };
  }
  const name = match[1].toLowerCase();
  return { name, raw: trimmed, prelude: trimmed.slice(match[0].length).trim() };
}

const containerAtRules = new Set(['media', 'supports', 'layer', 'container', 'document', 'scope']);

const registry = new Map();

function addDeclaration(contextKey, selector, property, value, index) {
  const key = `${contextKey}||${selector}||${property}`;
  const entry = registry.get(key) || {
    context: contextKey,
    selector,
    property,
    values: new Map(),
    occurrences: [],
  };
  entry.values.set(value, (entry.values.get(value) || 0) + 1);
  entry.occurrences.push({ value, line: lineAt(index), offset: index });
  registry.set(key, entry);
}

function parseDeclarations(selectorText, blockContent, blockStartIndex, contextKey) {
  const selectors = splitSelectors(selectorText);
  if (!selectors.length) {
    return;
  }

  let depthParen = 0;
  let depthBracket = 0;
  let quote = null;
  let declStart = 0;

  for (let i = 0; i <= blockContent.length; i += 1) {
    const ch = blockContent[i];

    if (i === blockContent.length) {
      const decl = blockContent.slice(declStart, i);
      handleDeclaration(decl, declStart, selectors, blockStartIndex, contextKey);
      break;
    }

    if (quote) {
      if (ch === quote && blockContent[i - 1] !== '\\') {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '(') {
      depthParen += 1;
      continue;
    }
    if (ch === ')') {
      depthParen = Math.max(0, depthParen - 1);
      continue;
    }
    if (ch === '[') {
      depthBracket += 1;
      continue;
    }
    if (ch === ']') {
      depthBracket = Math.max(0, depthBracket - 1);
      continue;
    }
    if (ch === ';' && depthParen === 0 && depthBracket === 0) {
      const decl = blockContent.slice(declStart, i);
      handleDeclaration(decl, declStart, selectors, blockStartIndex, contextKey);
      declStart = i + 1;
    }
  }
}

function handleDeclaration(decl, declStart, selectors, blockStartIndex, contextKey) {
  const raw = decl.trim();
  if (!raw) {
    return;
  }

  const parts = splitTopLevel(raw, ':');
  if (parts.length < 2) {
    return;
  }
  const property = normalizeWhitespace(parts[0]).toLowerCase();
  const value = normalizeWhitespace(parts.slice(1).join(':'));
  if (!property || !value) {
    return;
  }

  const leadingWhitespace = decl.match(/^\s*/u)?.[0].length || 0;
  const propIndex = blockStartIndex + declStart + leadingWhitespace;

  selectors.forEach((selector) => {
    addDeclaration(contextKey, selector, property, value, propIndex);
  });
}

function parseScope(start, end, contextStack) {
  let i = start;
  let preludeStart = start;
  let quote = null;
  let inComment = false;

  while (i < end) {
    const ch = css[i];
    const next = css[i + 1];

    if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (!quote && ch === '/' && next === '*') {
      inComment = true;
      i += 2;
      continue;
    }

    if (quote) {
      if (ch === quote && css[i - 1] !== '\\') {
        quote = null;
      }
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      i += 1;
      continue;
    }

    if (ch === '{') {
      const prelude = css.slice(preludeStart, i).trim();
      const blockEnd = findMatchingBrace(i, end);
      if (blockEnd < 0) {
        return;
      }

      if (prelude.startsWith('@')) {
        const at = parseAtRule(prelude);
        const isKeyframes = at.name.includes('keyframes');
        const isContainer = containerAtRules.has(at.name);
        if (isContainer && !isKeyframes) {
          const nextContext = contextStack.concat(at.raw);
          parseScope(i + 1, blockEnd, nextContext);
        }
        i = blockEnd + 1;
        preludeStart = i;
        continue;
      }

      const contextKey = contextStack.length ? contextStack.join(' | ') : '';
      parseDeclarations(prelude, css.slice(i + 1, blockEnd), i + 1, contextKey);
      i = blockEnd + 1;
      preludeStart = i;
      continue;
    }

    i += 1;
  }
}

function findMatchingBrace(openIndex, end) {
  let depth = 1;
  let quote = null;
  let inComment = false;

  for (let i = openIndex + 1; i < end; i += 1) {
    const ch = css[i];
    const next = css[i + 1];

    if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        i += 1;
      }
      continue;
    }
    if (!quote && ch === '/' && next === '*') {
      inComment = true;
      i += 1;
      continue;
    }
    if (quote) {
      if (ch === quote && css[i - 1] !== '\\') {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

parseScope(0, css.length, []);

const conflicts = [];
const duplicates = [];

registry.forEach((entry) => {
  const valueList = Array.from(entry.values.keys());
  const occurrences = entry.occurrences.length;
  const lines = entry.occurrences.map((occ) => occ.line);
  const offsets = entry.occurrences.map((occ) => occ.offset);
  const payload = {
    context: entry.context,
    selector: entry.selector,
    property: entry.property,
    values: valueList,
    occurrences,
    lines,
    offsets,
  };
  if (valueList.length > 1) {
    conflicts.push(payload);
  } else if (occurrences > 1) {
    duplicates.push(payload);
  }
});

const sortByOccurrences = (a, b) => {
  if (b.occurrences !== a.occurrences) {
    return b.occurrences - a.occurrences;
  }
  if (b.values.length !== a.values.length) {
    return b.values.length - a.values.length;
  }
  return a.selector.localeCompare(b.selector);
};

conflicts.sort(sortByOccurrences);
duplicates.sort(sortByOccurrences);

const topConflicts = conflicts.slice(0, top);
const topDuplicates = duplicates.slice(0, top);

if (asJson) {
  console.log(
    JSON.stringify(
      {
        cssFile: cssPath,
        conflictCount: conflicts.length,
        duplicateCount: duplicates.length,
        top,
        conflicts: topConflicts,
        duplicates: topDuplicates,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

function formatEntry(entry) {
  const selectorLabel = entry.context ? `${entry.context} | ${entry.selector}` : entry.selector;
  const offsetPreview = entry.offsets.slice(0, 6).join(', ');
  const offsetSuffix = entry.offsets.length > 6 ? ` (+${entry.offsets.length - 6} more)` : '';
  return {
    selector: selectorLabel,
    property: entry.property,
    values: entry.values.join(' | '),
    occurrences: String(entry.occurrences),
    offsets: `${offsetPreview}${offsetSuffix}`,
  };
}

function printTable(rows, title) {
  console.log(`\n${title}`);
  console.log('Selector | Property | Values | Occurrences | Offsets');
  console.log('--- | --- | --- | --- | ---');
  rows.forEach((row) => {
    const entry = formatEntry(row);
    console.log(
      `${entry.selector} | ${entry.property} | ${entry.values} | ${entry.occurrences} | ${entry.offsets}`,
    );
  });
}

printTable(topConflicts, 'Top Conflicts');
printTable(topDuplicates, 'Top Duplicates');
