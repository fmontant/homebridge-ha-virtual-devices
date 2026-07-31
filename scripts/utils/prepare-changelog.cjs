#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const EXIT = Object.freeze({
  SUCCESS: 0,
  USAGE: 1,
  INVALID_PROJECT_STATE: 2,
  TECHNICAL_ERROR: 3,
});

function printError(message) {
  process.stderr.write(`✗ ${message}\n`);
}

function fail(message, code) {
  printError(message);
  process.exit(code);
}

function normalizeLineEndings(value) {
  return value.replace(/\r\n?/g, '\n');
}

function validateVersion(version) {
  return /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/.test(version);
}

function parseArguments(argv) {
  const args = argv.slice(2);
  let mode = null;
  let version = null;
  let changelogFile = 'CHANGELOG.md';
  let releaseDate = new Date().toISOString().slice(0, 10);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--dry-run' || argument === '--write') {
      if (mode) {
        fail(
          'Un seul mode doit être fourni : --dry-run ou --write.',
          EXIT.USAGE,
        );
      }

      mode = argument;
      continue;
    }

    if (argument === '--file') {
      changelogFile = args[index + 1] || '';

      if (!changelogFile) {
        fail(
          'Valeur manquante après --file.',
          EXIT.USAGE,
        );
      }

      index += 1;
      continue;
    }

    if (argument === '--date') {
      releaseDate = args[index + 1] || '';

      if (!releaseDate) {
        fail(
          'Valeur manquante après --date.',
          EXIT.USAGE,
        );
      }

      index += 1;
      continue;
    }

    if (argument.startsWith('--')) {
      fail(
        `Option inconnue : ${argument}`,
        EXIT.USAGE,
      );
    }

    if (version) {
      fail(
        `Argument inattendu : ${argument}`,
        EXIT.USAGE,
      );
    }

    version = argument;
  }

  if (!mode) {
    fail(
      'Mode manquant. Utilise --dry-run ou --write.',
      EXIT.USAGE,
    );
  }

  if (!version) {
    fail(
      'Version manquante.',
      EXIT.USAGE,
    );
  }

  if (!validateVersion(version)) {
    fail(
      `Version invalide : ${version}`,
      EXIT.USAGE,
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
    fail(
      `Date invalide : ${releaseDate}. Format attendu : YYYY-MM-DD.`,
      EXIT.USAGE,
    );
  }

  return {
    mode,
    version,
    changelogFile,
    releaseDate,
  };
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

function splitUnreleasedContent(lines) {
  const RELEASE_SECTIONS = new Set([
    'Added',
    'Changed',
    'Deprecated',
    'Removed',
    'Fixed',
    'Security',
    'Documentation',
    'Improved',
  ]);

  const permanent = [];
  const release = [];

  let current = permanent;
  let inReleaseSection = false;

  for (const line of lines) {
    const heading = line.match(/^###\s+(.+)$/);

    if (heading) {
      const title = heading[1].trim();

      if (RELEASE_SECTIONS.has(title)) {
        current = release;
        inReleaseSection = true;
      } else {
        current = permanent;
        inReleaseSection = false;
      }
    }

    if (/^---$/.test(line)) {
      current = permanent;
      inReleaseSection = false;
      continue;
    }

    if (
      inReleaseSection &&
  (
    /^>\s*/.test(line) ||
    /^<!--/.test(line)
  )
    ) {
      current = permanent;
      inReleaseSection = false;
    }

    current.push(line);
  }

  while (
    permanent.length &&
    permanent[0].trim() === ''
  ) {
    permanent.shift();
  }

  while (
    permanent.length &&
    permanent[permanent.length - 1].trim() === ''
  ) {
    permanent.pop();
  }

  while (
    release.length &&
    release[0].trim() === ''
  ) {
    release.shift();
  }

  while (
    release.length &&
    release[release.length - 1].trim() === ''
  ) {
    release.pop();
  }

  return {
    permanent,
    release,
  };
}

function countEntries(lines) {
  return lines.filter((line) => /^\s*[-*]\s+\S/.test(line)).length;
}

function prepareChangelog(
  content,
  version,
  releaseDate,
) {
  const normalized =
    normalizeLineEndings(content);

  const hadFinalNewline =
    normalized.endsWith('\n');

  const lines =
    normalized.split('\n');

  if (hadFinalNewline) {
    lines.pop();
  }

  const unreleased =
    findSection(
      lines,
      /^## \[Unreleased\]\s*$/,
    );

  if (!unreleased) {
    fail(
      'Section ## [Unreleased] introuvable.',
      EXIT.INVALID_PROJECT_STATE,
    );
  }

  const versionPattern =
    new RegExp(
      `^## \\[${version.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      )}\\](?:\\s+-\\s+.*)?\\s*$`,
    );

  if (
    findSection(
      lines,
      versionPattern,
    )
  ) {
    fail(
      `La version ${version} existe déjà.`,
      EXIT.INVALID_PROJECT_STATE,
    );
  }

  const body =
    lines.slice(
      unreleased.contentStart,
      unreleased.endIndex,
    );

  const {
    permanent,
    release,
  } = splitUnreleasedContent(body);

  const entryCount =
    countEntries(release);

  if (entryCount === 0) {
    fail(
      `La section [Unreleased] ne contient aucune entrée exploitable.

Le toolkit exige qu'au moins une modification soit documentée
dans CHANGELOG.md avant de préparer une nouvelle version.

Exemple minimal :

## [Unreleased]

### Changed
- Décrire les changements inclus dans cette version.

Complétez CHANGELOG.md puis relancez :

npm run prepare-release`,
      EXIT.INVALID_PROJECT_STATE,
    );
  }

  const replacement = [
    '## [Unreleased]',
    '',
    ...permanent,
  ];

  if (
    replacement[
      replacement.length - 1
    ] !== ''
  ) {
    replacement.push('');
  }

  replacement.push('---');
  replacement.push('');
  replacement.push(
    `## [${version}] - ${releaseDate}`,
  );
  replacement.push('');
  replacement.push(...release);
  replacement.push('');
  replacement.push('---');
  replacement.push('');

  const updated = [
    ...lines.slice(
      0,
      unreleased.headingIndex,
    ),
    ...replacement,
    ...lines.slice(
      unreleased.endIndex,
    ),
  ];

  while (
    updated.length &&
    updated[
      updated.length - 1
    ] === ''
  ) {
    updated.pop();
  }

  return {
    updatedContent:
      updated.join('\n') + '\n',
    entryCount,
  };
}

function writeFileAtomically(filePath, content) {
  const directory = path.dirname(filePath);
  const temporaryPath = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.tmp`,
  );

  try {
    fs.writeFileSync(temporaryPath, content, {
      encoding: 'utf8',
      mode: 0o644,
    });

    fs.renameSync(temporaryPath, filePath);
  } catch (error) {
    try {
      if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
      }
    } catch {
      // Ignore cleanup errors and preserve the original failure.
    }

    fail(
      `Impossible d'écrire ${filePath} : ${error.message}`,
      EXIT.TECHNICAL_ERROR,
    );
  }
}

function printSummary({
  mode,
  version,
  releaseDate,
  changelogFile,
  entryCount,
}) {
  const action =
    mode === '--write'
      ? 'modifié'
      : 'serait modifié';

  process.stdout.write(
    [
      `CHANGELOG : ${changelogFile}`,
      `Version   : ${version}`,
      `Date      : ${releaseDate}`,
      `Entrées   : ${entryCount}`,
      `Résultat  : le fichier ${action}`,
      '',
    ].join('\n'),
  );
}

const options = parseArguments(process.argv);
const changelogPath = path.resolve(
  process.cwd(),
  options.changelogFile,
);

let content;

try {
  content = fs.readFileSync(changelogPath, 'utf8');
} catch (error) {
  if (error && error.code === 'ENOENT') {
    fail(
      `Changelog introuvable : ${options.changelogFile}`,
      EXIT.USAGE,
    );
  }

  fail(
    `Impossible de lire ${options.changelogFile} : ${error.message}`,
    EXIT.TECHNICAL_ERROR,
  );
}

const result = prepareChangelog(
  content,
  options.version,
  options.releaseDate,
);

if (options.mode === '--write') {
  writeFileAtomically(
    changelogPath,
    result.updatedContent,
  );
}

printSummary({
  ...options,
  entryCount: result.entryCount,
});

process.exit(EXIT.SUCCESS);
