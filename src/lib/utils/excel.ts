import * as XLSX from 'xlsx';

interface ExportItem {
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

export function generateC303Excel(items: ExportItem[], fileName: string = 'C303_Export.xlsx') {
  // Create worksheet data
  const wsData = [
    // Header row
    ['No.', 'Customer Code', 'Customer Name', 'Memo', 'Note', 'Product Code', 'Product', 'Unit', 'Old Price', 'New Price', 'Create Date', 'Status', 'Owner'],
    // Data rows
    ...items.map((item, index) => [
      index + 1,
      item.supplier_code,
      item.branch,
      item.po_number,
      '',
      item.vendor_product_code || '',
      item.vendor_description || '',
      item.quantity,
      item.unit_price,
      item.unit_price,
      new Date().toLocaleDateString('th-TH'),
      'Delivery',
      'C303 PFP'
    ])
  ];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // No.
    { wch: 15 },  // Customer Code
    { wch: 30 },  // Customer Name
    { wch: 20 },  // Memo
    { wch: 10 },  // Note
    { wch: 15 },  // Product Code
    { wch: 40 },  // Product
    { wch: 8 },   // Unit
    { wch: 12 },  // Old Price
    { wch: 12 },  // New Price
    { wch: 15 },  // Create Date
    { wch: 10 },  // Status
    { wch: 12 },  // Owner
  ];

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
