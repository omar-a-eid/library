import { createObjectCsvStringifier } from 'csv-writer';
import type { ExportStrategy } from './ExportStrategy';

export class CsvExportStrategy implements ExportStrategy {
  async export(data: unknown[]): Promise<string> {
    if (data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0] as Record<string, unknown>).map(key => ({ id: key, title: key }));
    
    const csvStringifier = createObjectCsvStringifier({
      header: headers
    });

    const headerString = csvStringifier.getHeaderString();
    const recordsString = csvStringifier.stringifyRecords(data as Array<Record<string, unknown>>);

    return headerString + recordsString;
  }

  getContentType(): string {
    return 'text/csv';
  }

  getFileExtension(): string {
    return 'csv';
  }
}
