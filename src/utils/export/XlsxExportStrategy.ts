import ExcelJS from 'exceljs';
import type { ExportStrategy } from './ExportStrategy';

export class XlsxExportStrategy implements ExportStrategy {
  async export(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    if (data.length === 0) {
      return Buffer.from('');
    }

    const headers = Object.keys(data[0]!);
    worksheet.addRow(headers);

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      worksheet.addRow(values);
    });

    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    const bufferData = await workbook.xlsx.writeBuffer();
    return Buffer.from(bufferData);
  }

  getContentType(): string {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  getFileExtension(): string {
    return 'xlsx';
  }
}
