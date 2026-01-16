import { useState } from 'react';
import { CustomerMapping } from '@/types/po';
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
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CustomerMappingTableProps {
  mappings: CustomerMapping[];
  onAdd?: (mapping: Partial<CustomerMapping>) => void;
  onEdit?: (id: string, mapping: Partial<CustomerMapping>) => void;
  onDelete?: (id: string) => void;
}

export function CustomerMappingTable({ mappings, onAdd, onEdit, onDelete }: CustomerMappingTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<CustomerMapping | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    vendorCustomerCode: '',
    vendorCustomerName: '',
    active: true,
  });

  const filteredMappings = mappings.filter(m => 
    m.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.vendorCustomerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.vendorCustomerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (editingId) {
      onEdit?.(editingId, formData);
      setEditingId(null);
    } else {
      onAdd?.(formData);
    }
    setFormData({ customerName: '', vendorCustomerCode: '', vendorCustomerName: '', active: true });
    setIsAddOpen(false);
  };

  const openEdit = (mapping: CustomerMapping) => {
    setFormData({
      customerName: mapping.customerName,
      vendorCustomerCode: mapping.vendorCustomerCode,
      vendorCustomerName: mapping.vendorCustomerName,
      active: mapping.active,
    });
    setEditingId(mapping.id);
    setIsAddOpen(true);
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
            placeholder="ค้นหาชื่อลูกค้าหรือรหัส..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม Mapping ลูกค้า
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? 'แก้ไข Mapping ลูกค้า' : 'เพิ่ม Mapping ลูกค้าใหม่'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>ชื่อลูกค้า (จาก PO)</Label>
                  <Input 
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="บริษัท บี เอ็น เอ็น เรสเตอรองท์ กรุ๊ป จำกัด"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>รหัสลูกค้า (ผู้จำหน่าย)</Label>
                    <Input 
                      value={formData.vendorCustomerCode}
                      onChange={(e) => setFormData({ ...formData, vendorCustomerCode: e.target.value })}
                      placeholder="C001"
                    />
                  </div>
                  <div>
                    <Label>ชื่อลูกค้า (ผู้จำหน่าย)</Label>
                    <Input 
                      value={formData.vendorCustomerName}
                      onChange={(e) => setFormData({ ...formData, vendorCustomerName: e.target.value })}
                      placeholder="BNN Restaurant Group"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label>เปิดใช้งาน</Label>
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
              <TableHead>ชื่อลูกค้า (จาก PO)</TableHead>
              <TableHead>รหัสลูกค้า (ผู้จำหน่าย)</TableHead>
              <TableHead>ชื่อลูกค้า (ผู้จำหน่าย)</TableHead>
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
                <TableCell className="font-medium text-primary max-w-64 truncate">
                  {mapping.customerName}
                </TableCell>
                <TableCell className="font-mono text-sm">{mapping.vendorCustomerCode || '-'}</TableCell>
                <TableCell className="max-w-48 truncate">{mapping.vendorCustomerName || '-'}</TableCell>
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
                </TableCell>
              </TableRow>
            ))}
            {filteredMappings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  ไม่พบข้อมูล Mapping ลูกค้า
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-sm text-muted-foreground">
        แสดง {filteredMappings.length} จาก {mappings.length} รายการ
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ Mapping ลูกค้า</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ Mapping "{deleteTarget?.customerName}" ใช่หรือไม่? 
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
    </div>
  );
}
