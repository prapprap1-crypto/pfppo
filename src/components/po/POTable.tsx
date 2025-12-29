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
import { Eye, FileCheck, Download, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface POTableProps {
  poList: POHeader[];
}

export function POTable({ poList }: POTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredList = poList.filter(po => {
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.branch.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead className="w-36">เลข PO</TableHead>
              <TableHead>ผู้จำหน่าย</TableHead>
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
                <TableCell className="text-sm">{po.branch}</TableCell>
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
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/verification/${po.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    {po.status === 'IMPORTED' && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/verification/${po.id}`}>
                          <FileCheck className="w-4 h-4 text-warning" />
                        </Link>
                      </Button>
                    )}
                    {po.status === 'VERIFIED' && (
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4 text-success" />
                      </Button>
                    )}
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
    </div>
  );
}
