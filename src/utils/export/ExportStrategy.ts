export interface ExportStrategy {
  export(data: unknown[]): Promise<Buffer | string>;
  getContentType(): string;
  getFileExtension(): string;
}
