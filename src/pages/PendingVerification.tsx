import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { fetchPOHeaders, findBranchMapping } from '@/lib/api/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FileCheck, 
  Loader2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  Building2,
  MapPin,
  Eye
} from 'lucide-react';
import { POHeader, STATUS_LABELS, STATUS_CLASSES } from '@/types/po';
import { cn } from '@/lib/utils';

const PendingVerification = () => {
  const [poHeaders, setPOHeaders] = useState<POHeader[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = await fetchPOHeaders();
      
      // Filter only pending verification statuses (IMPORTED, NEED_REVIEW)
      const pendingHeaders = (headers || []).filter(
        (h: any) => h.status === 'IMPORTED' || h.status === 'NEED_REVIEW'
      );
      
      // Map headers with branch mapping data
      const mappedHeaders = await Promise.all(
        pendingHeaders.map(async (h: any) => {
          let branchMappingResult = null;
          if (h.customer_name && h.branch) {
            try {
              branchMappingResult = await findBranchMapping(h.customer_name, h.branch);
            } catch (err) {
              console.error('Error finding branch mapping:', err);
            }
          }
          
          return {
            id: h.id,
            poNumber: h.po_number,
            customerName: h.customer_name,
            vendorCustomerCode: h.vendor_customer_code,
            vendorCustomerName: h.vendor_customer_name,
            isCustomerMapped: h.is_customer_mapped,
            vendorBranchCode: branchMappingResult?.branchMapping?.vendor_branch_code || undefined,
            vendorBranchName: branchMappingResult?.branchMapping?.vendor_branch_name || undefined,
            isBranchMapped: !!(branchMappingResult?.branchMapping?.vendor_branch_code),
            supplierCode: h.supplier_code,
            supplierName: h.supplier_name,
            branch: h.branch,
            documentDate: h.document_date,
            dueDate: h.due_date,
            netTotal: Number(h.net_total),
            vat: Number(h.vat),
            grandTotal: Number(h.grand_total),
            status: h.status,
            sourceFile: h.source_file,
            createdAt: h.created_at,
            updatedAt: h.updated_at,
          };
        })
      );
      
      setPOHeaders(mappedHeaders);
    } catch (error) {
      console.error('Error loading pending POs:', error);
      setPOHeaders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <MainLayout title="ตรวจสอบเอกสาร" subtitle="รายการ PO ที่รอตรวจสอบ">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-muted-foreground">
                รอตรวจสอบ {poHeaders.length} รายการ
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            รีเฟรช
          </Button>
        </div>

        {/* Loading */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
              </div>
            </CardContent>
          </Card>
        ) : poHeaders.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">ไม่มีเอกสารรอตรวจสอบ</h3>
                <p className="text-muted-foreground">เอกสาร PO ทั้งหมดได้รับการตรวจสอบแล้ว</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-36">เลข PO</TableHead>
                    <TableHead>ผู้จำหน่าย</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead>สาขา</TableHead>
                    <TableHead className="text-center">วันครบกำหนด</TableHead>
                    <TableHead className="text-right">มูลค่ารวม</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-center w-32">ดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poHeaders.map((po, index) => (
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
                          <Building2 className="w-4 h-4 text-muted-foreground" />
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
                          <MapPin className="w-4 h-4 text-muted-foreground" />
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
                      <TableCell className="text-center">
                        <Button asChild size="sm" className="gap-2">
                          <Link to={`/verification/${po.id}`}>
                            <Eye className="w-4 h-4" />
                            ตรวจสอบ
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default PendingVerification;
