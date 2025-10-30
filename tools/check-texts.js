#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');

const targetFns = ['findByText', 'getByText', 'findAllByText'];
const quoteRegex = new RegExp(`\\b(${targetFns.join('|')})\\(\\s*(['\`"\\"])`);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const res = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      files.push(...walk(res));
    } else if (/\.jsx?$/.test(e.name) || /\.ts?$/.test(e.name)) {
      files.push(res);
    }
  }
  return files;
}

function checkFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const matches = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (quoteRegex.test(line)) {
      matches.push({ line: i + 1, text: line.trim() });
    }
  }
  return matches;
}

function main() {
  if (!fs.existsSync(src)) {
    console.error('No src/ directory found.');
    process.exit(2);
  }

  const files = walk(src);
  const findings = [];
  for (const f of files) {
    const m = checkFile(f);
    if (m.length) findings.push({ file: path.relative(root, f), matches: m });
  }

  if (findings.length === 0) {
    console.log('OK: no literal text usages of findByText/getByText/findAllByText found.');
    process.exit(0);
  }

  console.log('Found literal text usages in Testing Library queries (consider using roles or regex):');
  for (const f of findings) {
    console.log(`\nFile: ${f.file}`);
    for (const m of f.matches) {
      console.log(`  ${m.line}: ${m.text}`);
    }
  }

  process.exit(1);
}

main();
