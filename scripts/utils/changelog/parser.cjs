'use strict';

function normalizeLineEndings(value) {
  return value.replace(/\r\n?/g, '\n');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findSection(lines, headingPattern) {
  let headingIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (headingPattern.test(lines[index])) {
      headingIndex = index;
      break;
    }
  }

  if (headingIndex === -1) {
    return null;
  }

  let endIndex = lines.length;

  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      endIndex = index;
      break;
    }
  }

  return {
    headingIndex,
    contentStart: headingIndex + 1,
    endIndex,
  };
}

module.exports = {
  normalizeLineEndings,
  escapeRegExp,
  findSection,
};