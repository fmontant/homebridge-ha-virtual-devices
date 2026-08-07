#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  getLanguageLines,
} = require('./changelog/parser.cjs');

const [, , changelogFile, outputFile, languageArgument] = process.argv;

const language =
  languageArgument === '--lang=fr'
    ? 'fr'
    : 'en';

if (!changelogFile) {
  throw new Error('Changelog manquant.');
}

if (!outputFile) {
  throw new Error('Fichier de sortie manquant.');
}
const content = fs.readFileSync(changelogFile, 'utf8').replace(/\r\n?/g, '\n');

const allLines = content.split('\n');

const lines =
  getLanguageLines(
    allLines,
    language,
  );

if (!lines) {
  throw new Error(
    language === 'fr'
      ? 'Section # Français introuvable.'
      : 'Section # English introuvable.',
  );
}

const unreleasedIndex = lines.findIndex((line) => /^## \[Unreleased\]\s*$/.test(line));
if (unreleasedIndex === -1) {
  throw new Error('Section ## [Unreleased] introuvable.');
}

let unreleasedEnd = lines.length;
for (let index = unreleasedIndex + 1; index < lines.length; index += 1) {
  if (/^##\s+/.test(lines[index])) {
    unreleasedEnd = index;
    break;
  }
}

let changedIndex = -1;
for (let index = unreleasedIndex + 1; index < unreleasedEnd; index += 1) {
  if (/^### Changed\s*$/.test(lines[index])) {
    changedIndex = index;
    break;
  }
}

if (changedIndex === -1) {
  throw new Error('Section ### Changed introuvable sous ## [Unreleased].');
}

const entries = [];
for (let index = changedIndex + 1; index < unreleasedEnd; index += 1) {
  const line = lines[index];
  if (/^###\s+/.test(line) || /^---\s*$/.test(line)) {
    break;
  }

  const match = line.match(/^\s*-\s+(.+?)\s*$/);
  if (match && match[1]) {
    entries.push(`- ${match[1]}`);
  }
}

fs.writeFileSync(path.resolve(outputFile), entries.join('\n') + (entries.length ? '\n' : ''), 'utf8');