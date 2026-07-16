import type { CatalogDevice } from './catalogDevice.js';

export class CatalogSynchronizationResult {
  public readonly added:
    CatalogDevice[] = [];

  public readonly updated:
    CatalogDevice[] = [];

  public readonly missing:
    CatalogDevice[] = [];

  public get totalChanges():
    number {
    return (
      this.added.length +
      this.updated.length +
      this.missing.length
    );
  }

  public isEmpty():
    boolean {
    return this.totalChanges === 0;
  }

  public hasNewDevices():
    boolean {
    return this.added.length > 0;
  }

  public hasUpdatedDevices():
    boolean {
    return this.updated.length > 0;
  }

  public hasMissingDevices():
    boolean {
    return this.missing.length > 0;
  }

  public summary():
    string {
    if (this.isEmpty()) {
      return (
        'Catalogue synchronisé : ' +
        'aucune modification'
      );
    }

    return (
      'Catalogue synchronisé : ' +
      `${this.added.length} ajout(s), ` +
      `${this.updated.length} modification(s), ` +
      `${this.missing.length} disparition(s)`
    );
  }
}