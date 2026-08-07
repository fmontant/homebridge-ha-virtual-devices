#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  escapeRegExp,
  normalizeLineEndings,
} = require('./changelog/parser.cjs');

function fail(message) {
  process.stderr.write(`✗ ${message}\n`);
  process.exit(1);
}

function extractChangelogSection(content, version) {
  const lines = normalizeLineEndings(content).split('\n');
  const escapedVersion = escapeRegExp(version);
  const targetHeading = new RegExp(
    `^## \\[${escapedVersion}\\](?:\\s+-\\s+.*)?\\s*$`,
  );
  const nextVersionHeading = /^## \[[^\]]+\](?:\s+-\s+.*)?\s*$/;

  let sectionStart = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (targetHeading.test(lines[index])) {
      sectionStart = index + 1;
      break;
    }
  }

  if (sectionStart === -1) {
    fail(`Section ${version} introuvable dans le changelog.`);
  }

  let sectionEnd = lines.length;

  for (let index = sectionStart; index < lines.length; index += 1) {
    const line = lines[index];

    if (nextVersionHeading.test(line) || line.trim() === '---') {
      sectionEnd = index;
      break;
    }
  }

  const notes = lines
    .slice(sectionStart, sectionEnd)
    .join('\n')
    .trim();

  if (!notes) {
    fail(`La section ${version} ne contient aucune note.`);
  }

  return `${notes}\n`;
}

const [, , version, changelogArgument] = process.argv;

if (!version) {
  fail('Version manquante.');
}

const changelogFile = changelogArgument || 'CHANGELOG.md';
const changelogPath = path.resolve(process.cwd(), changelogFile);

let content;

try {
  content = fs.readFileSync(changelogPath, 'utf8');
} catch (error) {
  if (error && error.code === 'ENOENT') {
    fail(`Changelog introuvable : ${changelogFile}`);
  }

  fail(`Impossible de lire ${changelogFile} : ${error.message}`);
}

process.stdout.write(
  extractChangelogSection(content, version),
);
