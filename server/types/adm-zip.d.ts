declare module "adm-zip" {
  class AdmZip {
    constructor(buffer?: Buffer);
    getEntries(): IZipEntry[];
    extractAllTo(targetPath: string, overwrite?: boolean): void;
  }

  interface IZipEntry {
    name: string;
    isDirectory: boolean;
    getData(): Buffer;
  }

  export = AdmZip;
}
