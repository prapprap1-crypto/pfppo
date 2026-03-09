import { useState, useMemo } from 'react';
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
import { Eye, FileCheck, Download, Search, Filter, Trash2, Building2, CheckCircle2, AlertTriangle, MapPin, Pencil, User, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import { useUserRole } from '@/hooks/useUserRole';

interface POTableProps {
  poList: POHeader[];
  onRefresh?: () => void;
}

type SortField = 'poNumber' | 'customerName' | 'branch' | 'dueDate' | 'grandTotal' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function POTable({ poList, onRefresh }: POTableProps) {
  const { toast } = useToast();
  const { logAction } = usePOActionLog();
  const { isModerator } = useUserRole();
  const [editingPO, setEditingPO] = useState<POHeader | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const sortedList = useMemo(() => {
    return [...poList].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'poNumber':
          comparison = a.poNumber.localeCompare(b.poNumber, 'th');
          break;
        case 'customerName':
          comparison = (a.customerName || '').localeCompare(b.customerName || '', 'th');
          break;
        case 'branch':
          comparison = a.branch.localeCompare(b.branch, 'th');
          break;
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'grandTotal':
          comparison = a.grandTotal - b.grandTotal;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [poList, sortField, sortDirection]);

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
    <div>
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
              <TableHead className="w-36">
                <button 
                  onClick={() => handleSort('poNumber')} 
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  เลข PO {getSortIcon('poNumber')}
                </button>
              </TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort('customerName')} 
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  ลูกค้า {getSortIcon('customerName')}
                </button>
              </TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort('branch')} 
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  สาขา {getSortIcon('branch')}
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button 
                  onClick={() => handleSort('dueDate')} 
                  className="flex items-center justify-center hover:text-foreground transition-colors w-full"
                >
                  วันครบกำหนด {getSortIcon('dueDate')}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button 
                  onClick={() => handleSort('grandTotal')} 
                  className="flex items-center justify-end hover:text-foreground transition-colors w-full"
                >
                  มูลค่ารวม {getSortIcon('grandTotal')}
                </button>
              </TableHead>
              <TableHead>ผู้อัปโหลด</TableHead>
              <TableHead className="text-center">
                <button 
                  onClick={() => handleSort('status')} 
                  className="flex items-center justify-center hover:text-foreground transition-colors w-full"
                >
                  สถานะ {getSortIcon('status')}
                </button>
              </TableHead>
              <TableHead className="text-center w-36">การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedList.map((po, index) => (
              <TableRow 
                key={po.id}
                className="animate-fade-in hover:bg-muted/30"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <TableCell className="font-medium text-primary">
                  {po.poNumber}
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
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium truncate max-w-32" title={po.uploaderName || po.uploaderEmail || '-'}>
                        {po.uploaderName || po.uploaderEmail || '-'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn('status-badge', STATUS_CLASSES[po.status])}>
                    {STATUS_LABELS[po.status]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <POActionHistoryDialog poId={po.id} poNumber={po.poNumber} />
                    {isModerator && (
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
                    )}
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
                    {isModerator && (
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
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
