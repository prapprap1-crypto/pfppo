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
  // Customer mapping fields
  vendor_branch_code?: string;
  warehouse_code?: string;
  warehouse_name?: string;
  vehicle_position_code?: string;
  vehicle_position_name?: string;
  vat_type?: number;
  transport_code?: string;
  transport_name?: string;
  salesperson_code?: string;
  salesperson_name?: string;
  remark?: string;
  // Additional fields for customer info
  vendor_customer_name?: string;
  vendor_customer_code?: string;
}

export interface ExportColumn {
  key: string;
  label: string;
  enabled: boolean;
}

// Updated column mappings based on Express format
// Format: Memo = WarehouseCode-VehiclePositionCode-VAT-TransportCode
// Format: Note = Remark-BranchCode-PO_Number
const COLUMN_MAPPINGS: Record<string, { header: string; width: number; getValue: (item: ExportItem, index: number, isFirstInGroup: boolean) => string | number }> = {
  no: { 
    header: 'No.', 
    width: 5, 
    getValue: (_, i, isFirstInGroup) => isFirstInGroup ? i + 1 : '' 
  },
  customer_code: { 
    header: 'Customer Code', 
    width: 15, 
    getValue: (item, _, isFirstInGroup) => isFirstInGroup ? (item.vendor_customer_code || item.supplier_code) : '' 
  },
  customer_name: { 
    header: 'Customer Name', 
    width: 35, 
    getValue: (item, _, isFirstInGroup) => isFirstInGroup ? (item.vendor_customer_name || item.branch) : '' 
  },
  memo: { 
    header: 'Memo', 
    width: 20, 
    getValue: (item, _, isFirstInGroup) => {
      if (!isFirstInGroup) return '';
      // Format: WarehouseCode-VehiclePositionCode-VAT-TransportCode
      const parts = [
        item.warehouse_code || '',
        item.vehicle_position_code || '',
        item.vat_type === 1 ? '1' : '0',
        item.transport_code || ''
      ];
      return parts.join('-');
    }
  },
  note: { 
    header: 'Note', 
    width: 40, 
    getValue: (item, _, isFirstInGroup) => {
      if (!isFirstInGroup) return '';
      // Format: Remark-BranchCode-Memo-PO_Number
      // If Remark is empty, replace with '0'
      const remarkValue = item.remark && item.remark.trim() !== '' ? item.remark : '0';
      // Memo format: WarehouseCode-VehiclePositionCode-VAT-TransportCode
      const memo = [
        item.warehouse_code || '',
        item.vehicle_position_code || '',
        item.vat_type === 1 ? '1' : '0',
        item.transport_code || ''
      ].join('-');
      const parts = [
        remarkValue,
        item.vendor_branch_code || '',
        memo,
        item.po_number
      ];
      return parts.join('-');
    }
  },
  product_code: { 
    header: 'Product Code', 
    width: 18, 
    getValue: (item) => item.vendor_product_code || '' 
  },
  product_name: { 
    header: 'Product', 
    width: 45, 
    getValue: (item) => item.vendor_description || '' 
  },
  quantity: { 
    header: 'Unit', 
    width: 8, 
    getValue: (item) => item.quantity 
  },
  old_price: { 
    header: 'Old Price', 
    width: 12, 
    getValue: (item) => item.unit_price 
  },
  new_price: { 
    header: 'New Price', 
    width: 12, 
    getValue: (item) => item.unit_price 
  },
  create_date: { 
    header: 'Create Date', 
    width: 15, 
    getValue: () => {
      const now = new Date();
      const day = now.getDate();
      const month = now.getMonth() + 1;
      const year = now.getFullYear() + 543; // Thai Buddhist year
      return `${day}/${month}/${year}`;
    }
  },
  contact_date: { 
    header: 'Contact Date', 
    width: 15, 
    getValue: (item) => {
      if (!item.due_date) return '';
      const date = new Date(item.due_date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  },
  status: { 
    header: 'Status', 
    width: 10, 
    getValue: () => 'Delivery' 
  },
  owner: { 
    header: 'Owner', 
    width: 12, 
    getValue: (item) => item.salesperson_code || '' 
  },
  // Legacy columns (kept for backward compatibility)
  due_date: { header: 'Due Date', width: 12, getValue: (item) => item.due_date },
  branch: { header: 'Branch', width: 20, getValue: (item) => item.branch },
  amount: { header: 'Amount', width: 12, getValue: (item) => item.amount },
  vendor_branch_code: { header: 'Branch Code', width: 15, getValue: (item) => item.vendor_branch_code || '' },
  warehouse_code: { header: 'Warehouse Code', width: 15, getValue: (item) => item.warehouse_code || '' },
  warehouse_name: { header: 'Warehouse', width: 20, getValue: (item) => item.warehouse_name || '' },
  vehicle_position_code: { header: 'Vehicle Position Code', width: 18, getValue: (item) => item.vehicle_position_code || '' },
  vehicle_position_name: { header: 'Vehicle Position', width: 20, getValue: (item) => item.vehicle_position_name || '' },
  vat_type: { header: 'VAT', width: 8, getValue: (item) => item.vat_type === 1 ? 1 : 0 },
  transport_code: { header: 'Transport Code', width: 15, getValue: (item) => item.transport_code || '' },
  transport_name: { header: 'Transport', width: 20, getValue: (item) => item.transport_name || '' },
  salesperson_code: { header: 'Salesperson Code', width: 15, getValue: (item) => item.salesperson_code || '' },
  salesperson_name: { header: 'Salesperson', width: 20, getValue: (item) => item.salesperson_name || '' },
  remark: { header: 'Remark', width: 30, getValue: (item) => item.remark || '' },
};

export function generateC303Excel(
  items: ExportItem[], 
  fileName: string = 'PO_EXPORT.xls',
  columns?: ExportColumn[]
) {
  // Determine which columns to use - default Express format columns
  const enabledColumns = columns 
    ? columns.filter(c => c.enabled)
    : [
        { key: 'no', label: '', enabled: true },
        { key: 'customer_code', label: '', enabled: true },
        { key: 'customer_name', label: '', enabled: true },
        { key: 'memo', label: '', enabled: true },
        { key: 'note', label: '', enabled: true },
        { key: 'product_code', label: '', enabled: true },
        { key: 'product_name', label: '', enabled: true },
        { key: 'quantity', label: '', enabled: true },
        { key: 'old_price', label: '', enabled: true },
        { key: 'new_price', label: '', enabled: true },
        { key: 'create_date', label: '', enabled: true },
        { key: 'contact_date', label: '', enabled: true },
        { key: 'status', label: '', enabled: true },
        { key: 'owner', label: '', enabled: true },
      ];

  // Create header row
  const headers = enabledColumns.map(col => {
    const mapping = COLUMN_MAPPINGS[col.key];
    return mapping?.header || col.key;
  });

  // Track groups by customer code to identify first item in each group
  let currentGroupKey = '';
  let groupIndex = 0;

  // Create data rows
  const dataRows = items.map((item, index) => {
    // Determine if this is the first item in a new group
    const groupKey = `${item.vendor_customer_code || item.supplier_code}-${item.po_number}`;
    const isFirstInGroup = groupKey !== currentGroupKey;
    if (isFirstInGroup) {
      currentGroupKey = groupKey;
      groupIndex++;
    }

    return enabledColumns.map(col => {
      const mapping = COLUMN_MAPPINGS[col.key];
      return mapping ? mapping.getValue(item, groupIndex - 1, isFirstInGroup) : '';
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

  // Add worksheet to workbook with sheet name "EXPRESS"
  XLSX.utils.book_append_sheet(wb, ws, 'EXPRESS');

  // Generate filename with format PO_EXPORT_ddmmyyyy.xls
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const formattedFileName = `PO_EXPORT_${day}${month}${year}.xls`;

  // Generate buffer and download as .xls format
  const excelBuffer = XLSX.write(wb, { bookType: 'biff8', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = formattedFileName;
  link.click();
  window.URL.revokeObjectURL(url);

  return formattedFileName;
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
