/**
 * Zero-dependency CSV Export Helper
 * Formats JSON records into RFC-4180 compliant CSV files with BOM for Excel compatibility.
 * Used for Commission on Audit (COA) compliance, Treasury payment ledgers, and Audit Logs.
 */
export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columnMapping?: Record<keyof T | string, string>
) {
  if (!data || data.length === 0) {
    console.warn('[exportToCsv] No data to export');
    return;
  }

  const keys = Object.keys(columnMapping || data[0]);
  const headers = columnMapping ? Object.values(columnMapping) : keys;

  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','));

  // Data rows
  for (const item of data) {
    const row = keys.map((key) => {
      const val = item[key];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  }

  const csvString = '\uFEFF' + csvRows.join('\r\n'); // Add UTF-8 BOM
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
