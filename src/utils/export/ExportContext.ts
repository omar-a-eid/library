import type { ExportStrategy } from './ExportStrategy';
import { CsvExportStrategy } from './CsvExportStrategy';
import { XlsxExportStrategy } from './XlsxExportStrategy';

export class ExportContext {
  private strategy: ExportStrategy;

  constructor(format: 'csv' | 'xlsx') {
    this.strategy = format === 'csv' ? new CsvExportStrategy() : new XlsxExportStrategy();
  }

  async exportData(data: unknown[]): Promise<{ buffer: Buffer | string; contentType: string; extension: string }> {
    const buffer = await this.strategy.export(data);
    return {
      buffer,
      contentType: this.strategy.getContentType(),
      extension: this.strategy.getFileExtension()
    };
  }
}
