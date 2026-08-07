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
}

module.exports = {
  Changelog,
  Release,
};