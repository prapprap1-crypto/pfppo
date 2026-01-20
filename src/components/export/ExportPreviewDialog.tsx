import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileSpreadsheet, Download, Eye } from 'lucide-react';
import { ExportColumn } from '@/lib/utils/excel';

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
}

interface ExportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ExportItem[];
  columns: ExportColumn[];
  onConfirm: () => void;
  isExporting: boolean;
}

const COLUMN_LABELS: Record<string, string> = {
  no: 'No.',
  customer_code: 'Customer Code',
  customer_name: 'Customer Name',
  memo: 'Memo',
  note: 'Note',
  product_code: 'Product Code',
  product_name: 'Product',
  quantity: 'Unit',
  old_price: 'Old Price',
  new_price: 'New Price',
  create_date: 'Create Date',
  status: 'Status',
  owner: 'Owner',
  due_date: 'Due Date',
  branch: 'Branch',
  amount: 'Amount',
  // Customer mapping fields
  vendor_branch_code: 'Branch Code',
  warehouse_code: 'Warehouse Code',
  warehouse_name: 'Warehouse',
  vehicle_position_code: 'Vehicle Position Code',
  vehicle_position_name: 'Vehicle Position',
  vat_type: 'VAT',
  transport_code: 'Transport Code',
  transport_name: 'Transport',
};

const getColumnValue = (item: ExportItem, columnKey: string, index: number): string | number => {
  switch (columnKey) {
    case 'no': return index + 1;
    case 'customer_code': return item.supplier_code;
    case 'customer_name': return item.branch;
    case 'memo': return item.po_number;
    case 'note': return '';
    case 'product_code': return item.vendor_product_code || '';
    case 'product_name': return item.vendor_description || '';
    case 'quantity': return item.quantity;
    case 'old_price': return item.unit_price;
    case 'new_price': return item.unit_price;
    case 'create_date': return new Date().toLocaleDateString('th-TH');
    case 'status': return 'Delivery';
    case 'owner': return 'C303 PFP';
    case 'due_date': return item.due_date;
    case 'branch': return item.branch;
    case 'amount': return item.amount;
    // Customer mapping fields
    case 'vendor_branch_code': return item.vendor_branch_code || '';
    case 'warehouse_code': return item.warehouse_code || '';
    case 'warehouse_name': return item.warehouse_name || '';
    case 'vehicle_position_code': return item.vehicle_position_code || '';
    case 'vehicle_position_name': return item.vehicle_position_name || '';
    case 'vat_type': return item.vat_type === 1 ? 'Vat' : 'No Vat';
    case 'transport_code': return item.transport_code || '';
    case 'transport_name': return item.transport_name || '';
    default: return '';
  }
};

export function ExportPreviewDialog({
  open,
  onOpenChange,
  items,
  columns,
  onConfirm,
  isExporting,
}: ExportPreviewDialogProps) {
  const enabledColumns = columns.filter(c => c.enabled);
  const previewItems = items.slice(0, 5);
  const hasMoreItems = items.length > 5;

  const formatNumber = (value: string | number) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            ตัวอย่างข้อมูลก่อนส่งออก
          </DialogTitle>
          <DialogDescription>
            แสดง {previewItems.length} รายการแรก จากทั้งหมด {items.length} รายการ | {enabledColumns.length} คอลัมน์
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {enabledColumns.map((col) => (
                  <TableHead key={col.key} className="font-semibold bg-muted/50">
                    {COLUMN_LABELS[col.key] || col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewItems.map((item, index) => (
                <TableRow key={index}>
                  {enabledColumns.map((col) => {
                    const value = getColumnValue(item, col.key, index);
                    const isNumber = ['quantity', 'old_price', 'new_price', 'amount'].includes(col.key);
                    return (
                      <TableCell 
                        key={col.key}
                        className={isNumber ? 'text-right font-mono' : ''}
                      >
                        {isNumber ? formatNumber(value) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              {hasMoreItems && (
                <TableRow>
                  <TableCell 
                    colSpan={enabledColumns.length} 
                    className="text-center text-muted-foreground py-4"
                  >
                    ... และอีก {items.length - 5} รายการ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={onConfirm} disabled={isExporting} className="gap-2">
            <Download className="w-4 h-4" />
            {isExporting ? 'กำลังส่งออก...' : 'ยืนยันส่งออก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
