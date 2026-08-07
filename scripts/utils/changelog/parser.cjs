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

function findLanguageSection(
  lines,
  language,
) {
  const heading =
    language === 'fr'
      ? '# Français'
      : '# English';

  const headingIndex =
    lines.findIndex(
      line => line.trim() === heading,
    );

  if (headingIndex === -1) {
    return null;
  }

  let endIndex = lines.length;

  for (
    let index = headingIndex + 1;
    index < lines.length;
    index += 1
  ) {
    if (/^#\s+/.test(lines[index])) {
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

function getLanguageLines(lines, language) {
  const heading =
    language === 'fr'
      ? '# Français'
      : '# English';

  const startIndex =
    lines.findIndex(
      line => line.trim() === heading,
    );

  if (startIndex === -1) {
    return null;
  }

  let endIndex = lines.length;

  for (
    let index = startIndex + 1;
    index < lines.length;
    index += 1
  ) {
    if (/^#\s+/.test(lines[index])) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(
    startIndex,
    endIndex,
  );
}

module.exports = {
  normalizeLineEndings,
  escapeRegExp,
  findSection,
  findLanguageSection,
  getLanguageLines,
};