#!/usr/bin/env node
/**
 * scripts/check-viewport-classes.mjs
 * Validates Tailwind utility classes against pixel-perfect viewport rules.
 *
 * Modes:
 *   node scripts/check-viewport-classes.mjs --staged        (Checks only git staged files)
 *   node scripts/check-viewport-classes.mjs                 (Checks all project files)
 *   node scripts/check-viewport-classes.mjs --desktop-only  (Checks desktop-only projects)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const isStagedOnly = args.includes('--staged');
const isDesktopOnly = args.includes('--desktop-only');

// Target file extensions
const TARGET_EXTENSIONS = new Set(['.tsx', '.jsx', '.ts', '.js', '.html', '.vue', '.astro', '.svelte']);

// Directories ignored during full repository scan
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

// Rule A: Desktop breakpoint (lg:, xl:, 2xl:) using built-in numeric scales (resolves to rem, won't scale)
const RULE_A_REGEX = /(?:^|[\s"':`])([a-zA-Z0-9_:-]*(?:lg|xl|2xl):[a-zA-Z0-9_:-]*(?:(?:gap|gap-x|gap-y|space-x|space-y|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|min-w|min-h|max-w|h|size|basis|top|right|bottom|left|inset|leading|tracking)-(?!\d+\/)\d+(?:\.\d+)?|text-(?:xs|sm|base|lg|xl|\d+xl)))(?=[\s"':`]|$)/g;

// Rule B: Arbitrary px values outside desktop layer (leaks desktop sizing into mobile)
const ARBITRARY_PX_REGEX = /(?:^|[\s"':`])([a-zA-Z0-9_:-]*(?:gap|gap-x|gap-y|space-x|space-y|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|min-w|min-h|max-w|size|basis|text|leading|tracking|top|right|bottom|left|inset)-\[\d+(?:\.\d+)?px\])(?=[\s"':`]|$)/g;

// Desktop-Only Mode: Any built-in numeric scale anywhere
const DESKTOP_ONLY_BUILTIN = /(?:^|[\s"':`])([a-zA-Z0-9_:-]*(?:(?:gap|gap-x|gap-y|space-x|space-y|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|min-w|min-h|max-w|h|size|basis|top|right|bottom|left|inset|leading|tracking)-(?!\d+\/)\d+(?:\.\d+)?|text-(?:xs|sm|base|lg|xl|\d+xl)))(?=[\s"':`]|$)/g;

// ANSI colors
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m${t}\x1b[0m`;
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;

function getFiles() {
  if (isStagedOnly) {
    try {
      const stdout = execSync('git diff --cached --name-only --diff-filter=ACMR', { encoding: 'utf8' });
      return stdout
        .split(/\r?\n/)
        .map((f) => f.trim())
        .filter((f) => f && TARGET_EXTENSIONS.has(path.extname(f)) && fs.existsSync(f));
    } catch {
      console.error(red('Failed to retrieve staged files from git.'));
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

function check(file) {
  let content = '';
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    return [];
  }

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
          rule: 'Desktop-Only Mode: Built-in numeric scale forbidden',
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
        rule: 'Rule A: Built-in numeric scale at desktop breakpoint',
        description: `Class "${matchA[1]}" resolves to rem and will NOT convert to vw. Proportions break on laptops.`,
        fix: 'Replace with arbitrary px from Figma (e.g. lg:gap-[32px], lg:p-[40px], lg:w-[500px]).'
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
          description: `Class "${token}" leaks desktop proportions into mobile screens.`,
          fix: `Move behind lg: (e.g. lg:${cleanUtility}) or use built-in Tailwind class for mobile.`
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
  console.log(yellow('Fix the classes above before committing. See pixel-perfect skill documentation.\n'));
  process.exit(1);
} else {
  console.log(green('✓ All classes adhere to pixel-perfect rules!\n'));
  process.exit(0);
}
