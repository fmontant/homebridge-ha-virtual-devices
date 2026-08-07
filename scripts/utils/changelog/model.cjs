'use strict';

class Release {
  constructor(version, date = null) {
    this.version = version;
    this.date = date;
    this.sections = new Map();
  }
}

class Changelog {
  constructor() {
    this.header = [];
    this.unreleased = null;
    this.releases = [];
  }

  addRelease(release) {
    if (!(release instanceof Release)) {
      throw new TypeError(
        'release must be an instance of Release',
      );
    }

    this.releases.push(release);
  }
}

module.exports = {
  Changelog,
  Release,
};