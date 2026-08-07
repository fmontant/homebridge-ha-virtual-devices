'use strict';

class Release {
  constructor(version, date = null) {
    this.version = version;
    this.date = date;
    this.sections = new Map();
  }
  setSection(name, entries) {
    this.sections.set(
      name,
      entries,
    );
  }
  getSection(name) {
    return this.sections.get(name);
  }
  hasSection(name) {
    return this.sections.has(name);
  }
  getSections() {
    return this.sections;
  }
}

class Changelog {
  constructor() {
    this.header = [];
    this.unreleased = null;
    this.releases = new Map();
  }

  addRelease(release) {
    if (!(release instanceof Release)) {
      throw new TypeError(
        'release must be an instance of Release',
      );
    }

    this.releases.set(
      release.version,
      release,
    );
  }
  getRelease(version) {
    return this.releases.get(version);
  }
}

module.exports = {
  Changelog,
  Release,
};