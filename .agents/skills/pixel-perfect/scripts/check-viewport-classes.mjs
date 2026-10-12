#!/usr/bin/env node
/**
 * check-viewport-classes.mjs
 * Single source of truth validator for pixel-perfect Tailwind utility classes.
 *
 * Usage:
 *   node check-viewport-classes.mjs --staged        (Inspects Git index of staged files via execFileSync)
 *   node check-viewport-classes.mjs                 (Inspects all project files)
 *   node check-viewport-classes.mjs --desktop-only  (Desktop-only mode)
 */

import fs from 'fs';
import path from 'path';
import { execSync, execFileSync } from 'child_process';

const args = process.argv.slice(2);
const isStagedOnly = args.includes('--staged');
const isDesktopOnly = args.includes('--desktop-only');

// Target file extensions
const TARGET_EXTENSIONS = new Set(['.tsx', '.jsx', '.ts', '.js', '.html', '.vue', '.astro', '.svelte']);

// Directories ignored during full scan
const IGNORE_DIRS = new Set([
  'node_modules',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  '.git',
  '.cache',
  'coverage',
  '.agents'
]);

// Rule A: Desktop breakpoint (lg:, xl:, 2xl:) using built-in numeric/named scales (resolves to rem, won't scale).
// - Excludes 0 values: lg:p-0, lg:top-0, lg:inset-0 (0rem == 0px, never breaks).
// - Excludes fractions: lg:w-1/2, lg:w-2/3.
// - Catches numeric & decimal scales: lg:p-4, lg:h-0.5, lg:p-0.5, lg:gap-6, lg:w-96, lg:text-base, lg:text-2xl.
// - Catches named sizing scale: lg:max-w-md, lg:min-w-sm, lg:max-w-lg (resolves to rem).
// - Catches border scale: lg:border-2, lg:border-4, lg:border-t-2.
// - Catches border radius scale: lg:rounded-lg, lg:rounded-md (excludes rounded-none, rounded-full).
const RULE_A_REGEX = /(?:^|[\s"':`])([a-zA-Z0-9_:-]*(?:lg|xl|2xl):[a-zA-Z0-9_:-]*(?:(?:gap|gap-x|gap-y|space-x|space-y|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|min-w|min-h|max-w|h|size|basis|top|right|bottom|left|inset|leading|tracking)-(?!(?:0(?![0-9.])|\d+\/))\d+(?:\.\d+)?|(?:max-w|min-w|max-h|min-h)-(?:xs|sm|md|lg|xl|\d+xl|prose)|text-(?:xs|sm|base|lg|xl|\d+xl)|rounded-(?:sm|md|lg|xl|2xl|3xl)|border-(?:[248]|t-[248]|r-[248]|b-[248]|l-[248]|x-[248]|y-[248])))(?=[\s"':`]|$)/g;

// Rule B: Arbitrary px outside desktop layer (leaks desktop sizing into mobile).
const ARBITRARY_PX_REGEX = /(?:^|[\s"':`])([a-zA-Z0-9_:-]*(?:gap|gap-x|gap-y|space-x|space-y|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|min-w|min-h|max-w|size|basis|text|leading|tracking|top|right|bottom|left|inset|rounded)-\[\d+(?:\.\d+)?px\])(?=[\s"':`]|$)/g;

// Desktop-Only Mode: Any built-in numeric/named scale anywhere (excluding 0 and fractions).
const DESKTOP_ONLY_BUILTIN = /(?:^|[\s"':`])([a-zA-Z0-9_:-]*(?:(?:gap|gap-x|gap-y|space-x|space-y|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|min-w|min-h|max-w|h|size|basis|top|right|bottom|left|inset|leading|tracking)-(?!(?:0(?![0-9.])|\d+\/))\d+(?:\.\d+)?|(?:max-w|min-w|max-h|min-h)-(?:xs|sm|md|lg|xl|\d+xl|prose)|text-(?:xs|sm|base|lg|xl|\d+xl)|rounded-(?:sm|md|lg|xl|2xl|3xl)|border-(?:[248]|t-[248]|r-[248]|b-[248]|l-[248]|x-[248]|y-[248])))(?=[\s"':`]|$)/g;

// ANSI colors
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m${t}\x1b[0m`;
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;

function getFiles() {
  if (isStagedOnly) {
    try {
      // Use core.quotepath=off so non-ASCII paths (e.g. src/café/x.tsx) are not quoted
      const stdout = execFileSync(
        'git',
        ['-c', 'core.quotepath=off', 'diff', '--cached', '--name-only', '--diff-filter=ACMR'],
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
      return stdout
        .split(/\r?\n/)
        .map((f) => f.trim())
        .filter((f) => f && TARGET_EXTENSIONS.has(path.extname(f)));
    } catch (err) {
      console.error(red('✖ Failed to retrieve staged files from Git:'));
      console.error(err.stderr ? err.stderr.toString().trim() : err.message);
      process.exit(1);
    }
  }

  function walk(dir = '.') {
    let out = [];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory() && !IGNORE_DIRS.has(ent.name)) {
        out = out.concat(walk(full));
      } else if (ent.isFile() && TARGET_EXTENSIONS.has(path.extname(ent.name))) {
        out.push(full);
      }
    }
    return out;
  }
  return walk();
}

function getFileContent(file) {
  if (isStagedOnly) {
    try {
      // Use execFileSync to avoid shell parsing bugs on parenthesis folders like app/(marketing)/page.tsx
      return execFileSync('git', ['show', `:${file}`], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err) {
      console.error(red(`\n✖ Failed to read staged content for "${file}":`));
      console.error(err.stderr ? err.stderr.toString().trim() : err.message);
      process.exit(1);
    }
  }

  try {
    return fs.readFileSync(file, 'utf8');
  } catch (err) {
    console.error(red(`\n✖ Failed to read file "${file}": ${err.message}`));
    process.exit(1);
  }
}

function check(file) {
  const content = getFileContent(file);
  const lines = content.split(/\r?\n/);
  const issues = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Skip comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('<!--') || trimmed.startsWith('*')) {
      return;
    }

    if (isDesktopOnly) {
      let match;
      DESKTOP_ONLY_BUILTIN.lastIndex = 0;
      while ((match = DESKTOP_ONLY_BUILTIN.exec(line)) !== null) {
        issues.push({
          file,
          line: lineNum,
          token: match[1],
          rule: 'Desktop-Only Mode: Built-in numeric/named scale forbidden',
          description: 'Built-in scale resolves to rem and stays frozen while viewport shrinks.',
          fix: 'Replace with arbitrary px from Figma (e.g. w-[500px], gap-[32px], text-[24px]).'
        });
      }
      return;
    }

    // Responsive Mode:
    // 1. Rule A check (Built-in scale at desktop breakpoint)
    let matchA;
    RULE_A_REGEX.lastIndex = 0;
    while ((matchA = RULE_A_REGEX.exec(line)) !== null) {
      issues.push({
        file,
        line: lineNum,
        token: matchA[1],
        rule: 'Rule A: Built-in scale at desktop breakpoint',
        description: `Class "${matchA[1]}" resolves to rem and will NOT convert to vw. Proportions break on laptops.`,
        fix: 'Replace with arbitrary px from Figma (e.g. lg:gap-[32px], lg:p-[40px], lg:w-[500px], lg:max-w-[1200px]).'
      });
    }

    // 2. Rule B check (Arbitrary px outside desktop breakpoint)
    let matchB;
    ARBITRARY_PX_REGEX.lastIndex = 0;
    while ((matchB = ARBITRARY_PX_REGEX.exec(line)) !== null) {
      const token = matchB[1];
      const hasDesktopPrefix = /(?:^|:)(?:lg|xl|2xl):/.test(token);
      if (!hasDesktopPrefix) {
        const cleanUtility = token.replace(/^(?:[a-zA-Z0-9_-]+:)*([a-zA-Z0-9_-]+-\[[0-9.]+px\])$/, '$1');
        issues.push({
          file,
          line: lineNum,
          token,
          rule: 'Rule B: Bare arbitrary px outside desktop layer',
          description: `Class "${token}" leaks desktop proportions into mobile screens. For fixed elements, use arbitrary rem like w-[1.5rem].`,
          fix: `Move behind lg: (e.g. lg:${cleanUtility}) or use built-in Tailwind class on mobile.`
        });
      }
    }
  });

  return issues;
}

// Execution
console.log(cyan(`\n🔍 Checking Tailwind classes against pixel-perfect viewport rules (${isDesktopOnly ? 'Desktop-Only' : 'Responsive'} mode)...`));

const files = getFiles();

if (!files.length) {
  console.log(green('✓ No relevant files to check.'));
  process.exit(0);
}

let totalIssues = 0;

for (const file of files) {
  const issues = check(file);
  if (issues.length > 0) {
    totalIssues += issues.length;
    console.log(`\n${bold(red('✖'))} ${bold(file)}:`);
    for (const issue of issues) {
      console.log(`  ${yellow(`line ${issue.line}`)}: ${red(bold(issue.token))}`);
      console.log(`    ${bold(issue.rule)}`);
      if (issue.description) console.log(`    ${issue.description}`);
      console.log(`    ${cyan('💡 Fix:')} ${issue.fix}`);
    }
  }
}

if (totalIssues > 0) {
  console.log(red(`\n⛔ Found ${totalIssues} violation(s). Commit aborted.`));
  console.log(yellow('Fix the classes above before committing. See pixel-perfect documentation.\n'));
  process.exit(1);
} else {
  console.log(green('✓ All classes adhere to pixel-perfect rules!\n'));
  process.exit(0);
}
