#!/usr/bin/env node
/**
 * Handoff audit — fails on known placeholder / bug patterns before backend handoff.
 * Usage: node scripts/audit-handoff.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const issues = [];

function walk(dir, ext, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, ext, files);
    else if (name.endsWith(ext)) files.push(path);
  }
  return files;
}

function checkFile(path, content, checks) {
  const rel = relative(ROOT, path);
  for (const check of checks) {
    if (check.test(content)) {
      issues.push(`${rel}: ${check.message}`);
    }
  }
}

const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8');
if (/clearform-version/i.test(indexHtml)) {
  issues.push('index.html: placeholder title "clearform-version" still present');
}
if (!indexHtml.includes('favicon.png')) {
  issues.push('index.html: expected favicon.png link for Clearform branding');
}

const jsxFiles = walk(SRC, '.jsx');
for (const file of jsxFiles) {
  const content = readFileSync(file, 'utf8');
  if (content.includes('\uFFFD')) {
    issues.push(`${relative(ROOT, file)}: contains garbled replacement character (U+FFFD)`);
  }
  if (/>\s*\n\s+\/\* ──/.test(content)) {
    issues.push(`${relative(ROOT, file)}: block comment may render as JSX text (use {/* */})`);
  }
}

if (issues.length) {
  console.error('Handoff audit failed:\n');
  for (const issue of issues) console.error(`  - ${issue}`);
  process.exit(1);
}

console.log('Handoff audit passed.');
