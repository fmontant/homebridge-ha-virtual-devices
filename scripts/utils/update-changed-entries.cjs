#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const [, , sourceFile, notesFile, outputFile] = process.argv;
if (!sourceFile) {
  throw new Error('Changelog source manquant.');
}

if (!notesFile) {
  throw new Error('Fichier des notes manquant.');
}

if (!outputFile) {
  throw new Error('Fichier de sortie manquant.');
}

const content = fs.readFileSync(sourceFile, 'utf8').replace(/\r\n?/g, '\n');
const notes = fs.readFileSync(notesFile, 'utf8')
  .replace(/\r\n?/g, '\n')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.startsWith('- ') ? line : `- ${line}`);

if (notes.length === 0) {
  throw new Error('Aucune note de publication fournie.');
}

const lines = content.split('\n');
const hadFinalNewline = content.endsWith('\n');
if (hadFinalNewline) {
  lines.pop();
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

let changedEnd = unreleasedEnd;
for (let index = changedIndex + 1; index < unreleasedEnd; index += 1) {
  if (/^###\s+/.test(lines[index]) || /^---\s*$/.test(lines[index])) {
    changedEnd = index;
    break;
  }
}

const replacement = [
  ...lines.slice(0, changedIndex + 1),
  '',
  ...notes,
  '',
  ...lines.slice(changedEnd),
];

while (replacement.length > 0 && replacement[replacement.length - 1] === '') {
  replacement.pop();
}

fs.writeFileSync(path.resolve(outputFile), `${replacement.join('\n')}\n`, 'utf8');