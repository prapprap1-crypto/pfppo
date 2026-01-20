import { useState } from 'react';
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

interface SettingsItem {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

interface SettingsTableProps {
  items: SettingsItem[];
  onAdd: (item: { code: string; name: string; active: boolean }) => void;
  onEdit: (id: string, item: { code: string; name: string; active: boolean }) => void;
  onDelete: (id: string) => void;
  codeLabel?: string;
  nameLabel?: string;
  addLabel?: string;
  editLabel?: string;
}

export function SettingsTable({ 
  items, 
  onAdd, 
  onEdit, 
  onDelete,
  codeLabel = 'รหัส',
  nameLabel = 'ชื่อ',
  addLabel = 'เพิ่มรายการ',
  editLabel = 'แก้ไข',
}: SettingsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<SettingsItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    active: true,
  });

  const filteredItems = items.filter(item => 
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (editingId) {
      onEdit(editingId, formData);
      setEditingId(null);
    } else {
      onAdd(formData);
    }
    setFormData({ code: '', name: '', active: true });
    setIsAddOpen(false);
  };

  const openEdit = (item: SettingsItem) => {
    setFormData({
      code: item.code,
      name: item.name,
      active: item.active,
    });
    setEditingId(item.id);
    setIsAddOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
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
            placeholder="ค้นหา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData({ code: '', name: '', active: true });
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />
              {addLabel}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? editLabel : addLabel}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>{codeLabel}</Label>
                <Input 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="รหัส"
                />
              </div>
              <div>
                <Label>{nameLabel}</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ชื่อ"
                />
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

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead>{codeLabel}</TableHead>
              <TableHead>{nameLabel}</TableHead>
              <TableHead className="text-center">สถานะ</TableHead>
              <TableHead className="text-center w-24">การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item, index) => (
              <TableRow 
                key={item.id}
                className="animate-fade-in hover:bg-muted/30"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <TableCell className="font-mono text-sm">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={item.active ? "default" : "secondary"}>
                    {item.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-sm text-muted-foreground">
        แสดง {filteredItems.length} รายการ จาก {items.length} รายการ
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ "{deleteTarget?.name}" ใช่หรือไม่? 
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
