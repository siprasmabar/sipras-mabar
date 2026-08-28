import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { DocumentSigner } from '../types';

export interface ExportColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => string | number);
}

/**
 * Export data array to Excel (.xlsx)
 */
export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  fileName: string,
  sheetName = 'Data'
): void {
  const formattedData = data.map(item => {
    const row: Record<string, any> = {};
    columns.forEach(col => {
      if (typeof col.accessor === 'function') {
        row[col.header] = col.accessor(item);
      } else {
        row[col.header] = item[col.accessor] ?? '-';
      }
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export data array to CSV (.csv)
 */
export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  fileName: string
): void {
  const headers = columns.map(c => `"${c.header}"`).join(',');
  const rows = data.map(item => {
    return columns
      .map(col => {
        let val = typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] ?? '');
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data array to official PDF report with header and stamp
 */
export function exportToPDF<T>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string,
  signer?: DocumentSigner,
  orientation: 'p' | 'l' = 'l'
): void {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  // Header Dinas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(
    signer?.department_name || 'PEMERINTAH KABUPATEN MANGGARAI BARAT',
    orientation === 'l' ? 148 : 105,
    14,
    { align: 'center' }
  );

  doc.setFontSize(12);
  doc.text(
    signer?.regency_name ? `DINAS PENDIDIKAN, KEPEMUDAAN DAN OLAHRAGA` : 'DINAS PENDIDIKAN, KEPEMUDAAN DAN OLAHRAGA',
    orientation === 'l' ? 148 : 105,
    20,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    signer?.address_line || 'Jl. Frans Sales Lega No. 1, Labuan Bajo, Nusa Tenggara Timur',
    orientation === 'l' ? 148 : 105,
    25,
    { align: 'center' }
  );

  // Line divider
  const pageWidth = orientation === 'l' ? 297 : 210;
  doc.setLineWidth(0.8);
  doc.line(14, 28, pageWidth - 14, 28);
  doc.setLineWidth(0.2);
  doc.line(14, 29, pageWidth - 14, 29);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), orientation === 'l' ? 148 : 105, 36, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, orientation === 'l' ? 148 : 105, 41, { align: 'center' });

  // Table
  const tableHeaders = columns.map(c => c.header);
  const tableRows = data.map((item, idx) => {
    return columns.map(col => {
      if (col.header === 'No' || col.header === 'No.') return String(idx + 1);
      return typeof col.accessor === 'function' ? String(col.accessor(item)) : String(item[col.accessor] ?? '-');
    });
  });

  (doc as any).autoTable({
    startY: 46,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110], // Teal-700
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  // Footer signature
  const finalY = (doc as any).lastAutoTable?.finalY || 140;
  const sigX = orientation === 'l' ? 220 : 140;

  if (finalY + 35 < (orientation === 'l' ? 200 : 285)) {
    doc.setFontSize(9);
    doc.text('Labuan Bajo, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), sigX, finalY + 12);
    doc.text(signer?.head_of_department_title || 'Kepala Dinas Pendidikan, Kepemudaan dan Olahraga', sigX, finalY + 17);
    doc.setFont('helvetica', 'bold');
    doc.text(signer?.head_of_department_name || 'Yohanes Hibur, S.Pd., M.M.', sigX, finalY + 35);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${signer?.head_of_department_nip || '19740512 199903 1 004'}`, sigX, finalY + 39);
  }

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Trigger clean browser print dialog
 */
export function triggerPrint(): void {
  window.print();
}
