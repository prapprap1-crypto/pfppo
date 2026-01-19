import * as XLSX from 'xlsx';

export interface ExportItem {
  po_number: string;
  due_date: string;
  branch: string;
  supplier_code: string;
  vendor_product_code: string;
  vendor_description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

export interface ExportColumn {
  key: string;
  label: string;
  enabled: boolean;
}

const COLUMN_MAPPINGS: Record<string, { header: string; width: number; getValue: (item: ExportItem, index: number) => string | number }> = {
  no: { header: 'No.', width: 5, getValue: (_, i) => i + 1 },
  customer_code: { header: 'Customer Code', width: 15, getValue: (item) => item.supplier_code },
  customer_name: { header: 'Customer Name', width: 30, getValue: (item) => item.branch },
  memo: { header: 'Memo', width: 20, getValue: (item) => item.po_number },
  note: { header: 'Note', width: 10, getValue: () => '' },
  product_code: { header: 'Product Code', width: 15, getValue: (item) => item.vendor_product_code || '' },
  product_name: { header: 'Product', width: 40, getValue: (item) => item.vendor_description || '' },
  quantity: { header: 'Unit', width: 8, getValue: (item) => item.quantity },
  old_price: { header: 'Old Price', width: 12, getValue: (item) => item.unit_price },
  new_price: { header: 'New Price', width: 12, getValue: (item) => item.unit_price },
  create_date: { header: 'Create Date', width: 15, getValue: () => new Date().toLocaleDateString('th-TH') },
  status: { header: 'Status', width: 10, getValue: () => 'Delivery' },
  owner: { header: 'Owner', width: 12, getValue: () => 'C303 PFP' },
  due_date: { header: 'Due Date', width: 12, getValue: (item) => item.due_date },
  branch: { header: 'Branch', width: 20, getValue: (item) => item.branch },
  amount: { header: 'Amount', width: 12, getValue: (item) => item.amount },
};

export function generateC303Excel(
  items: ExportItem[], 
  fileName: string = 'C303_Export.xlsx',
  columns?: ExportColumn[]
) {
  // Determine which columns to use
  const enabledColumns = columns 
    ? columns.filter(c => c.enabled)
    : Object.keys(COLUMN_MAPPINGS).slice(0, 13).map(key => ({ key, label: '', enabled: true })); // Default first 13 columns

  // Create header row
  const headers = enabledColumns.map(col => {
    const mapping = COLUMN_MAPPINGS[col.key];
    return mapping?.header || col.key;
  });

  // Create data rows
  const dataRows = items.map((item, index) => {
    return enabledColumns.map(col => {
      const mapping = COLUMN_MAPPINGS[col.key];
      return mapping ? mapping.getValue(item, index) : '';
    });
  });

  const wsData = [headers, ...dataRows];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = enabledColumns.map(col => {
    const mapping = COLUMN_MAPPINGS[col.key];
    return { wch: mapping?.width || 15 };
  });

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'C303');

  // Generate buffer and download
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);

  return true;
}

// Parse Excel file for importing mappings
export async function parseExcelForMappings(file: File): Promise<Array<{
  customer_code: string;
  customer_desc: string;
  vendor_code: string;
  vendor_desc: string;
  unit: string;
}>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        
        // Skip header row, map columns
        const mappings = jsonData.slice(1).map((row) => ({
          customer_code: String(row[0] || ''),
          customer_desc: String(row[1] || ''),
          vendor_code: String(row[2] || ''),
          vendor_desc: String(row[3] || ''),
          unit: String(row[4] || 'ลัง'),
        })).filter(m => m.customer_code && m.vendor_code);
        
        resolve(mappings);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
