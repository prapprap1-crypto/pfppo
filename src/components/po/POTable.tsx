import { useState } from 'react';
import { POHeader, STATUS_LABELS, STATUS_CLASSES } from '@/types/po';
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, FileCheck, Download, Search, Filter, Trash2, Building2, CheckCircle2, AlertTriangle, MapPin, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { usePOActionLog } from '@/hooks/usePOActionLog';
import { POActionHistoryDialog } from './POActionHistoryDialog';
import { POEditDialog } from './POEditDialog';

interface POTableProps {
  poList: POHeader[];
  onRefresh?: () => void;
}

export function POTable({ poList, onRefresh }: POTableProps) {
  const { toast } = useToast();
  const { logAction } = usePOActionLog();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerMappingFilter, setCustomerMappingFilter] = useState<string>('all');
  const [branchMappingFilter, setBranchMappingFilter] = useState<string>('all');
  const [editingPO, setEditingPO] = useState<POHeader | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const filteredList = poList.filter(po => {
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    
    const matchesCustomerMapping = 
      customerMappingFilter === 'all' || 
      (customerMappingFilter === 'mapped' && po.isCustomerMapped) ||
      (customerMappingFilter === 'unmapped' && !po.isCustomerMapped);
    
    const matchesBranchMapping = 
      branchMappingFilter === 'all' || 
      (branchMappingFilter === 'mapped' && po.isBranchMapped) ||
      (branchMappingFilter === 'unmapped' && !po.isBranchMapped);
    
    return matchesSearch && matchesStatus && matchesCustomerMapping && matchesBranchMapping;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleDelete = async (po: POHeader) => {
    try {
      // Log delete action before deletion (since po_id will be invalid after)
      await logAction(po.id, 'deleted', { 
        description: `ลบเอกสาร ${po.poNumber}` 
      });

      // Delete PO action logs first
      await supabase.from('po_action_logs').delete().eq('po_id', po.id);
      
      // Delete PO items (cascade)
      await supabase.from('po_items').delete().eq('po_id', po.id);
      
      // Delete PO header
      const { error } = await supabase.from('po_headers').delete().eq('id', po.id);
      
      if (error) throw error;

      // Delete PDF file from storage if exists
      if (po.sourceFile) {
        await supabase.storage.from('po-files').remove([po.sourceFile]);
      }

      toast({
        title: "ลบสำเร็จ",
        description: `ลบ PO ${po.poNumber} เรียบร้อยแล้ว`,
      });
      
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting PO:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบ PO ได้",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card rounded-xl border">
      {/* Filters */}
      <div className="p-4 border-b flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลข PO, ผู้จำหน่าย, หรือสาขา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="ทุกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="NEW">พบไฟล์ใหม่</SelectItem>
              <SelectItem value="IMPORTED">นำเข้าสำเร็จ</SelectItem>
              <SelectItem value="NEED_REVIEW">รอตรวจสอบ</SelectItem>
              <SelectItem value="VERIFIED">ตรวจสอบสำเร็จ</SelectItem>
              <SelectItem value="EXPORTED">นำออกแล้ว</SelectItem>
              <SelectItem value="ERROR">มีข้อผิดพลาด</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <Select value={customerMappingFilter} onValueChange={setCustomerMappingFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Mapping ลูกค้า" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ลูกค้า: ทั้งหมด</SelectItem>
              <SelectItem value="mapped">ลูกค้า: Mapped</SelectItem>
              <SelectItem value="unmapped">ลูกค้า: ยังไม่ Mapped</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <Select value={branchMappingFilter} onValueChange={setBranchMappingFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Mapping สาขา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">สาขา: ทั้งหมด</SelectItem>
              <SelectItem value="mapped">สาขา: Mapped</SelectItem>
              <SelectItem value="unmapped">สาขา: ยังไม่ Mapped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead className="w-36">เลข PO</TableHead>
              <TableHead>ผู้จำหน่าย</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>สาขา</TableHead>
              <TableHead className="text-center">วันครบกำหนด</TableHead>
              <TableHead className="text-right">มูลค่ารวม</TableHead>
              <TableHead className="text-center">สถานะ</TableHead>
              <TableHead className="text-center w-36">การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.map((po, index) => (
              <TableRow 
                key={po.id}
                className="animate-fade-in hover:bg-muted/30"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <TableCell className="font-medium text-primary">
                  {po.poNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{po.supplierName}</p>
                    <p className="text-xs text-muted-foreground">{po.supplierCode}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{po.customerName || '-'}</span>
                    {po.customerName && (
                      po.isCustomerMapped ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 gap-1 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 gap-1 text-xs">
                          <AlertTriangle className="w-3 h-3" />
                        </Badge>
                      )
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{po.branch}</span>
                    {po.branch && (
                      po.isBranchMapped ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 gap-1 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 gap-1 text-xs">
                          <AlertTriangle className="w-3 h-3" />
                        </Badge>
                      )
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm">
                  {formatDate(po.dueDate)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ฿{formatCurrency(po.grandTotal)}
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn('status-badge', STATUS_CLASSES[po.status])}>
                    {STATUS_LABELS[po.status]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <POActionHistoryDialog poId={po.id} poNumber={po.poNumber} />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingPO(po);
                        setEditDialogOpen(true);
                      }}
                      title="แก้ไข"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild title="ดูรายละเอียด">
                      <Link to={`/verification/${po.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    {po.status === 'IMPORTED' && (
                      <Button variant="ghost" size="icon" asChild title="ตรวจสอบ">
                        <Link to={`/verification/${po.id}`}>
                          <FileCheck className="w-4 h-4 text-warning" />
                        </Link>
                      </Button>
                    )}
                    {po.status === 'VERIFIED' && (
                      <Button variant="ghost" size="icon" title="ดาวน์โหลด">
                        <Download className="w-4 h-4 text-success" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="ลบ">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                          <AlertDialogDescription>
                            คุณต้องการลบ PO {po.poNumber} ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(po)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            ลบ
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info */}
      <div className="p-4 border-t text-sm text-muted-foreground">
        แสดง {filteredList.length} จาก {poList.length} รายการ
      </div>

      {/* Edit Dialog */}
      <POEditDialog
        po={editingPO}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={onRefresh}
      />
    </div>
  );
}
