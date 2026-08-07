#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  escapeRegExp,
  findSection,
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
  const section =
    findSection(
      lines,
      targetHeading,
    );

  if (!section) {
    fail(
      `Section ${version} introuvable dans le changelog.`,
    );
  }

  const sectionLines =
    lines.slice(
      section.contentStart,
      section.endIndex,
    );

  const separatorIndex =
    sectionLines.findIndex(
      line => line.trim() === '---',
    );

  const notes =
    (
      separatorIndex === -1
        ? sectionLines
        : sectionLines.slice(
          0,
          separatorIndex,
        )
    )
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
