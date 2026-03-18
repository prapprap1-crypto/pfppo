import { useState, useRef } from 'react';
import { ProductMapping } from '@/types/po';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Plus, Pencil, Trash2, Upload, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { parseExcelForMappings } from '@/lib/utils/excel';
import { useToast } from '@/hooks/use-toast';

interface MappingTableProps {
  mappings: ProductMapping[];
  onAdd?: (mapping: Partial<ProductMapping>) => void;
  onEdit?: (id: string, mapping: Partial<ProductMapping>) => void;
  onDelete?: (id: string) => void;
  onBulkImport?: (mappings: Partial<ProductMapping>[]) => Promise<void>;
}

export function MappingTable({ mappings, onAdd, onEdit, onDelete, onBulkImport }: MappingTableProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductMapping | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    customerCode: '',
    customerDesc: '',
    vendorCode: '',
    vendorDesc: '',
    unit: '',
    unitPrice: '' as string | number,
    active: true,
  });

  const filteredMappings = mappings.filter(m => 
    m.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.customerDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.vendorDesc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (editingId) {
      onEdit?.(editingId, formData);
      setEditingId(null);
    } else {
      onAdd?.(formData);
    }
    setFormData({ customerCode: '', customerDesc: '', vendorCode: '', vendorDesc: '', unit: '', unitPrice: '', active: true });
    setIsAddOpen(false);
  };

  const openEdit = (mapping: ProductMapping) => {
    setFormData({
      customerCode: mapping.customerCode,
      customerDesc: mapping.customerDesc,
      vendorCode: mapping.vendorCode,
      vendorDesc: mapping.vendorDesc,
      unit: mapping.unit,
      unitPrice: mapping.unitPrice ?? '',
      active: mapping.active,
    });
    setEditingId(mapping.id);
    setIsAddOpen(true);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const importedData = await parseExcelForMappings(file);
      
      if (importedData.length === 0) {
        toast({ title: 'ไม่พบข้อมูลที่สามารถนำเข้าได้', variant: 'destructive' });
        return;
      }

      const mappingsToImport: Partial<ProductMapping>[] = importedData.map(item => ({
        customerCode: item.customer_code,
        customerDesc: item.customer_desc || '',
        vendorCode: item.vendor_code,
        vendorDesc: item.vendor_desc || '',
        unit: item.unit || 'ลัง',
        active: true,
      }));

      if (onBulkImport) {
        await onBulkImport(mappingsToImport);
        toast({ title: `นำเข้าข้อมูลสำเร็จ ${mappingsToImport.length} รายการ` });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: 'เกิดข้อผิดพลาดในการนำเข้าไฟล์', variant: 'destructive' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete?.(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="bg-card rounded-xl border">
      {/* Header */}
      <div className="p-4 border-b flex flex-wrap items-center gap-4 justify-between">
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหารหัสสินค้าหรือรายละเอียด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls"
            onChange={handleFileImport}
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isImporting ? 'กำลังนำเข้า...' : 'นำเข้า Excel'}
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม Mapping
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? 'แก้ไข Mapping' : 'เพิ่ม Mapping ใหม่'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>รหัสสินค้าลูกค้า</Label>
                    <Input 
                      value={formData.customerCode}
                      onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                      placeholder="FG-FZ-0001"
                    />
                  </div>
                  <div>
                    <Label>รหัสสินค้าผู้ขาย</Label>
                    <Input 
                      value={formData.vendorCode}
                      onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                      placeholder="8852014009331"
                    />
                  </div>
                </div>
                <div>
                  <Label>รายละเอียดสินค้าลูกค้า</Label>
                  <Input 
                    value={formData.customerDesc}
                    onChange={(e) => setFormData({ ...formData, customerDesc: e.target.value })}
                    placeholder="ลูกชิ้นปลาฮ่องเต้"
                  />
                </div>
                <div>
                  <Label>รายละเอียดสินค้าผู้ขาย</Label>
                  <Input 
                    value={formData.vendorDesc}
                    onChange={(e) => setFormData({ ...formData, vendorDesc: e.target.value })}
                    placeholder="ลูกชิ้นปลาภูเก็ต 500 กรัม"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>หน่วย</Label>
                    <Input 
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="ลัง"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch 
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label>เปิดใช้งาน</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>ยกเลิก</Button>
                  <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90">
                    {editingId ? 'บันทึก' : 'เพิ่ม'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead>รหัสสินค้าลูกค้า</TableHead>
              <TableHead>รายละเอียดลูกค้า</TableHead>
              <TableHead>รหัสสินค้าผู้ขาย</TableHead>
              <TableHead>รายละเอียดผู้ขาย</TableHead>
              <TableHead className="text-center">หน่วย</TableHead>
              <TableHead className="text-center">สถานะ</TableHead>
              <TableHead className="text-center w-24">การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMappings.map((mapping, index) => (
              <TableRow 
                key={mapping.id}
                className="animate-fade-in hover:bg-muted/30"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <TableCell className="font-mono font-medium text-primary">
                  {mapping.customerCode}
                </TableCell>
                <TableCell className="max-w-48 truncate">{mapping.customerDesc}</TableCell>
                <TableCell className="font-mono text-sm">{mapping.vendorCode}</TableCell>
                <TableCell className="max-w-48 truncate">{mapping.vendorDesc}</TableCell>
                <TableCell className="text-center">{mapping.unit}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={mapping.active ? "default" : "secondary"}>
                    {mapping.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEdit(mapping)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDeleteTarget(mapping)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ Mapping</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ Mapping "{deleteTarget?.customerCode}" → "{deleteTarget?.vendorCode}" ใช่หรือไม่? 
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-sm text-muted-foreground">
        แสดง {filteredMappings.length} จาก {mappings.length} รายการ
      </div>
    </div>
  );
}
