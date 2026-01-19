import { useState } from 'react';
import { CustomerMapping, CustomerBranchMapping } from '@/types/po';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Search, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Building2, MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CustomerMappingTableProps {
  mappings: CustomerMapping[];
  onAdd?: (mapping: Partial<CustomerMapping>) => void;
  onEdit?: (id: string, mapping: Partial<CustomerMapping>) => void;
  onDelete?: (id: string) => void;
  onAddBranch?: (customerMappingId: string, branch: Partial<CustomerBranchMapping>) => void;
  onEditBranch?: (id: string, branch: Partial<CustomerBranchMapping>) => void;
  onDeleteBranch?: (id: string) => void;
}

export function CustomerMappingTable({ 
  mappings, 
  onAdd, 
  onEdit, 
  onDelete,
  onAddBranch,
  onEditBranch,
  onDeleteBranch,
}: CustomerMappingTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<CustomerMapping | null>(null);
  const [deleteBranchTarget, setDeleteBranchTarget] = useState<CustomerBranchMapping | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  
  // Customer form
  const [formData, setFormData] = useState({
    customerName: '',
    vendorCustomerCode: '',
    vendorCustomerName: '',
    active: true,
  });

  // Branch form
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [currentCustomerMappingId, setCurrentCustomerMappingId] = useState<string | null>(null);
  const [branchFormData, setBranchFormData] = useState({
    branch: '',
    vendorBranchCode: '',
    vendorBranchName: '',
    active: true,
  });

  const filteredMappings = mappings.filter(m => 
    m.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.vendorCustomerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.vendorCustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.branches?.some(b => 
      b.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vendorBranchCode?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const toggleExpanded = (id: string) => {
    setExpandedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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

  // Branch handlers
  const openAddBranch = (customerMappingId: string) => {
    setCurrentCustomerMappingId(customerMappingId);
    setBranchFormData({ branch: '', vendorBranchCode: '', vendorBranchName: '', active: true });
    setEditingBranchId(null);
    setIsBranchDialogOpen(true);
  };

  const openEditBranch = (branch: CustomerBranchMapping) => {
    setCurrentCustomerMappingId(branch.customerMappingId);
    setBranchFormData({
      branch: branch.branch,
      vendorBranchCode: branch.vendorBranchCode || '',
      vendorBranchName: branch.vendorBranchName || '',
      active: branch.active,
    });
    setEditingBranchId(branch.id);
    setIsBranchDialogOpen(true);
  };

  const handleBranchSubmit = () => {
    if (editingBranchId) {
      onEditBranch?.(editingBranchId, branchFormData);
    } else if (currentCustomerMappingId) {
      onAddBranch?.(currentCustomerMappingId, branchFormData);
    }
    setBranchFormData({ branch: '', vendorBranchCode: '', vendorBranchName: '', active: true });
    setIsBranchDialogOpen(false);
    setEditingBranchId(null);
    setCurrentCustomerMappingId(null);
  };

  const confirmDeleteBranch = () => {
    if (deleteBranchTarget) {
      onDeleteBranch?.(deleteBranchTarget.id);
      setDeleteBranchTarget(null);
    }
  };

  return (
    <div className="bg-card rounded-xl border">
      {/* Header */}
      <div className="p-4 border-b flex flex-wrap items-center gap-4 justify-between">
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อลูกค้า, สาขา หรือรหัส..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData({ customerName: '', vendorCustomerCode: '', vendorCustomerName: '', active: true });
            }
          }}>
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
              <TableHead className="w-10"></TableHead>
              <TableHead>ชื่อลูกค้า (จาก PO)</TableHead>
              <TableHead>รหัสลูกค้า (ผู้จำหน่าย)</TableHead>
              <TableHead>ชื่อลูกค้า (ผู้จำหน่าย)</TableHead>
              <TableHead className="text-center">สาขา</TableHead>
              <TableHead className="text-center">สถานะ</TableHead>
              <TableHead className="text-center w-24">การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMappings.map((mapping, index) => {
              const isExpanded = expandedCustomers.has(mapping.id);
              const branchCount = mapping.branches?.length || 0;
              
              return (
                <Collapsible key={mapping.id} open={isExpanded} onOpenChange={() => toggleExpanded(mapping.id)} asChild>
                  <>
                    <TableRow 
                      className="animate-fade-in hover:bg-muted/30"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell>
                        {branchCount > 0 && (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-primary max-w-64">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{mapping.customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{mapping.vendorCustomerCode || '-'}</TableCell>
                      <TableCell className="max-w-48 truncate">{mapping.vendorCustomerName || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <MapPin className="w-3 h-3" />
                          {branchCount} สาขา
                        </Badge>
                      </TableCell>
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
                            onClick={() => openAddBranch(mapping.id)}
                            title="เพิ่มสาขา"
                          >
                            <Plus className="w-4 h-4 text-green-600" />
                          </Button>
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
                    <CollapsibleContent asChild>
                      <>
                        {mapping.branches?.map((branch) => (
                          <TableRow key={branch.id} className="bg-muted/20">
                            <TableCell></TableCell>
                            <TableCell className="pl-10">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="text-sm">{branch.branch}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {branch.vendorBranchCode || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {branch.vendorBranchName || '-'}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-center">
                              <Badge variant={branch.active ? "outline" : "secondary"} className="text-xs">
                                {branch.active ? 'เปิด' : 'ปิด'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openEditBranch(branch)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setDeleteBranchTarget(branch)}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              );
            })}
            {filteredMappings.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  ไม่พบข้อมูล Mapping ลูกค้า
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-sm text-muted-foreground">
        แสดง {filteredMappings.length} ลูกค้า จาก {mappings.length} รายการ
      </div>

      {/* Delete Customer Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ Mapping ลูกค้า</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ Mapping "{deleteTarget?.customerName}" และสาขาทั้งหมดใช่หรือไม่? 
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

      {/* Delete Branch Confirmation Dialog */}
      <AlertDialog open={!!deleteBranchTarget} onOpenChange={() => setDeleteBranchTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบสาขา</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบสาขา "{deleteBranchTarget?.branch}" ใช่หรือไม่? 
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBranch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Branch Add/Edit Dialog */}
      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBranchId ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>ชื่อสาขา (จาก PO)</Label>
              <Input 
                value={branchFormData.branch}
                onChange={(e) => setBranchFormData({ ...branchFormData, branch: e.target.value })}
                placeholder="สาขาสีลม"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>รหัสสาขา (ผู้จำหน่าย)</Label>
                <Input 
                  value={branchFormData.vendorBranchCode}
                  onChange={(e) => setBranchFormData({ ...branchFormData, vendorBranchCode: e.target.value })}
                  placeholder="B001"
                />
              </div>
              <div>
                <Label>ชื่อสาขา (ผู้จำหน่าย)</Label>
                <Input 
                  value={branchFormData.vendorBranchName}
                  onChange={(e) => setBranchFormData({ ...branchFormData, vendorBranchName: e.target.value })}
                  placeholder="Silom Branch"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch 
                checked={branchFormData.active}
                onCheckedChange={(checked) => setBranchFormData({ ...branchFormData, active: checked })}
              />
              <Label>เปิดใช้งาน</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsBranchDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleBranchSubmit} className="bg-accent hover:bg-accent/90">
                {editingBranchId ? 'บันทึก' : 'เพิ่ม'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}