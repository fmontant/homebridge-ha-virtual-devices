#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  escapeRegExp,
  getLanguageLines,
  findSection,
  normalizeLineEndings,
} = require('./changelog/parser.cjs');

function fail(message) {
  process.stderr.write(`✗ ${message}\n`);
  process.exit(1);
}

function extractChangelogSection(content, version, language) {
  const lines = normalizeLineEndings(content).split('\n');

  const languageHeading =
    language === 'fr'
      ? '# Français'
      : '# English';

  const languageLines =
    getLanguageLines(
      lines,
      language,
    );

  if (!languageLines) {
    fail(
      `Section ${languageHeading} introuvable.`,
    );
  }
  const escapedVersion = escapeRegExp(version);
  const targetHeading = new RegExp(
    `^## \\[${escapedVersion}\\](?:\\s+-\\s+.*)?\\s*$`,
  );

  const section =
    findSection(
      languageLines,
      targetHeading,
    );

  if (!section) {
    fail(
      `Section ${version} introuvable dans ${languageHeading}.`,
    );
  }

  const sectionLines =
    languageLines.slice(
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

const args = process.argv.slice(2);

let version;
let changelogArgument = 'CHANGELOG.md';
let language = 'en';

for (const arg of args) {
  if (arg === '--lang=fr') {
    language = 'fr';
    continue;
  }

  if (arg === '--lang=en') {
    language = 'en';
    continue;
  }
  if (!['en', 'fr'].includes(language)) {
    fail(`Langue non prise en charge : ${language}`);
  }
  if (!version && !arg.startsWith('--')) {
    version = arg;
    continue;
  }

  if (!arg.startsWith('--')) {
    changelogArgument = arg;
  }
}

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
  extractChangelogSection(
    content,
    version,
    language,
  ),
);
