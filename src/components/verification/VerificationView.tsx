import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  RefreshCw,
  Building2,
  Package,
  MapPin,
  Pencil,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { POHeader, POItem } from '@/types/po';
import { refreshPOMappings, refreshPOCustomerMapping, findBranchMapping, updatePOHeader } from '@/lib/api/database';
import { supabase } from '@/integrations/supabase/client';
import { PdfViewer } from './PdfViewer';
import { 
  QuickCustomerMappingDialog, 
  QuickBranchMappingDialog, 
  QuickProductMappingDialog,
  EditCustomerNameDialog,
  EditBranchNameDialog
} from './QuickMappingDialogs';
import { EditHistoryDialog } from './EditHistoryDialog';

interface VerificationViewProps {
  po: POHeader;
  items: POItem[];
  onVerify?: () => void;
  onReject?: () => void;
}

const STATUS_LABELS: Record<POHeader['status'], string> = {
  NEW: 'ใหม่',
  IMPORTED: 'นำเข้าแล้ว',
  NEED_REVIEW: 'รอตรวจสอบ',
  VERIFIED: 'ตรวจสอบแล้ว/รอส่งออก',
  EXPORTED: 'ส่งออกแล้ว',
  ERROR: 'ผิดพลาด',
};

const STATUS_CLASSES: Record<POHeader['status'], string> = {
  NEW: 'bg-blue-500/10 text-blue-600 border-blue-200',
  IMPORTED: 'bg-green-500/10 text-green-600 border-green-200',
  NEED_REVIEW: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  VERIFIED: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  EXPORTED: 'bg-purple-500/10 text-purple-600 border-purple-200',
  ERROR: 'bg-red-500/10 text-red-600 border-red-200',
};

export function VerificationView({ po, items, onVerify, onReject }: VerificationViewProps) {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [editedItems, setEditedItems] = useState<Record<string, Partial<POItem>>>({});
  const [localItems, setLocalItems] = useState<POItem[]>(items);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingCustomer, setIsRefreshingCustomer] = useState(false);
  const [isRefreshingBranch, setIsRefreshingBranch] = useState(false);
  const [localPO, setLocalPO] = useState<POHeader>(po);
  const [remark, setRemark] = useState<string>(po.remark || '');

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    setLocalPO(po);
    setRemark(po.remark || '');
  }, [po]);

  useEffect(() => {
    const loadPdfUrl = async () => {
      if (po.sourceFile) {
        const { data } = await supabase.storage
          .from('po-files')
          .createSignedUrl(po.sourceFile, 3600);
        
        if (data?.signedUrl) {
          setPdfUrl(data.signedUrl);
        }
      }
    };
    loadPdfUrl();
  }, [po.sourceFile]);

  const unmappedCount = localItems.filter(item => !item.isMapped).length;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleItemEdit = (itemId: string, field: keyof POItem, value: string | number) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const getItemValue = (item: POItem, field: keyof POItem) => {
    return editedItems[item.id]?.[field] ?? item[field];
  };

  const handleVerify = async () => {
    try {
      // Update status to VERIFIED and save remark in database
      await updatePOHeader(po.id, { status: 'VERIFIED', remark: remark || null });
      
      toast({
        title: "ยืนยันเอกสารสำเร็จ",
        description: `เอกสาร ${po.poNumber} พร้อมส่งออกแล้ว`,
      });
      onVerify?.();
    } catch (error) {
      console.error('Error verifying PO:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยืนยันเอกสารได้",
        variant: "destructive",
      });
    }
  };

  const handleReject = () => {
    toast({
      title: "ปฏิเสธเอกสาร",
      description: `เอกสาร ${po.poNumber} ถูกปฏิเสธ`,
      variant: "destructive",
    });
    onReject?.();
  };

  const handleRefreshMapping = async () => {
    try {
      setIsRefreshing(true);
      const result = await refreshPOMappings(po.id);
      
      // Reload items from database
      const { data: updatedItems } = await supabase
        .from('po_items')
        .select('*')
        .eq('po_id', po.id)
        .order('created_at', { ascending: true });
      
      if (updatedItems) {
        const mappedItems: POItem[] = updatedItems.map((item: any) => ({
          id: item.id,
          poId: item.po_id,
          customerProductCode: item.customer_product_code,
          customerDescription: item.customer_description || '',
          vendorProductCode: item.vendor_product_code || '',
          vendorDescription: item.vendor_description || '',
          quantity: Number(item.quantity),
          unit: item.unit || 'ลัง',
          unitPrice: Number(item.unit_price),
          amount: Number(item.amount),
          deliveryDate: item.delivery_date || '',
          isMapped: item.is_mapped || false,
        }));
        setLocalItems(mappedItems);
      }

      toast({
        title: "อัปเดต Mapping สินค้าสำเร็จ",
        description: `อัปเดต ${result.updated} จาก ${result.total} รายการ`,
      });
    } catch (error) {
      console.error('Error refreshing mappings:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดต mapping สินค้าได้",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshCustomerMapping = async () => {
    try {
      setIsRefreshingCustomer(true);
      const result = await refreshPOCustomerMapping(po.id, true);
      
      // Reload PO header from database
      const { data: updatedPO } = await supabase
        .from('po_headers')
        .select('*')
        .eq('id', po.id)
        .maybeSingle();
      
      if (updatedPO) {
        setLocalPO({
          ...localPO,
          customerName: updatedPO.customer_name || undefined,
          vendorCustomerCode: updatedPO.vendor_customer_code || undefined,
          vendorCustomerName: updatedPO.vendor_customer_name || undefined,
          isCustomerMapped: updatedPO.is_customer_mapped || false,
        });
      }

      if (result.updated) {
        const description = result.fuzzyMatched 
          ? `จับคู่กับ "${result.matchedCustomerName}" (${result.similarity}% ใกล้เคียง) → ${result.vendorCustomerName}`
          : `อัปเดตเป็น: ${result.vendorCustomerName}`;
        
        toast({
          title: result.fuzzyMatched ? `พบ Mapping ที่ใกล้เคียง (${result.similarity}%)` : "อัปเดต Mapping ลูกค้าสำเร็จ",
          description,
        });
      } else {
        toast({
          title: "ไม่พบ Mapping ลูกค้า",
          description: "กรุณาเพิ่ม mapping ในหน้า Mapping ลูกค้า",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error refreshing customer mapping:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดต mapping ลูกค้าได้",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingCustomer(false);
    }
  };

  const handleRefreshBranchMapping = async () => {
    try {
      setIsRefreshingBranch(true);
      
      // Check if customer is mapped first
      if (!localPO.isCustomerMapped) {
        toast({
          title: "กรุณา Mapping ลูกค้าก่อน",
          description: "ต้อง Mapping ลูกค้าให้เสร็จก่อนจึงจะสามารถ Mapping สาขาได้",
          variant: "destructive",
        });
        return;
      }

      // Find branch mapping with fuzzy matching enabled (85% threshold)
      // Pass vendorCustomerCode to help find the correct customer mapping
      const branchResult = await findBranchMapping(
        localPO.customerName || '', 
        localPO.branch, 
        true, 
        85,
        localPO.vendorCustomerCode // Use vendor code for more reliable lookup
      );
      
      if (!branchResult) {
        toast({
          title: "ไม่พบ Mapping ลูกค้า",
          description: "กรุณา Mapping ลูกค้าก่อน",
          variant: "destructive",
        });
        return;
      }

      if (branchResult.branchMapping) {
        // Update local state
        const updatedPO = {
          ...localPO,
          vendorBranchCode: branchResult.branchMapping.vendor_branch_code || undefined,
          vendorBranchName: branchResult.branchMapping.vendor_branch_name || undefined,
          isBranchMapped: !!(branchResult.branchMapping.vendor_branch_code),
        };
        setLocalPO(updatedPO);

        // Also update database
        await updatePOHeader(po.id, {
          vendor_branch_code: branchResult.branchMapping.vendor_branch_code || null,
          vendor_branch_name: branchResult.branchMapping.vendor_branch_name || null,
        });

        const description = branchResult.fuzzyMatched 
          ? `จับคู่กับ "${branchResult.matchedBranch}" (${branchResult.similarity}% ใกล้เคียง) → ${branchResult.branchMapping.vendor_branch_name}`
          : `อัปเดตเป็น: ${branchResult.branchMapping.vendor_branch_name}`;
        
        toast({
          title: branchResult.fuzzyMatched 
            ? `พบ Mapping สาขาที่ใกล้เคียง (${branchResult.similarity}%)` 
            : "อัปเดต Mapping สาขาสำเร็จ",
          description,
        });
      } else {
        setLocalPO({
          ...localPO,
          vendorBranchCode: undefined,
          vendorBranchName: undefined,
          isBranchMapped: false,
        });

        toast({
          title: "ไม่พบ Mapping สาขา",
          description: `ไม่พบสาขาที่ตรงกับ "${localPO.branch}" - กรุณาเพิ่ม mapping ในหน้า Mapping ลูกค้า`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error refreshing branch mapping:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดต mapping สาขาได้",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingBranch(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{localPO.poNumber.slice(-3)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{localPO.poNumber}</h2>
              <p className="text-muted-foreground">{localPO.supplierName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <EditHistoryDialog poId={po.id} />
            <span className={cn('status-badge px-3 py-1 rounded-full text-sm font-medium border', STATUS_CLASSES[localPO.status])}>
              {STATUS_LABELS[localPO.status]}
            </span>
            {unmappedCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {unmappedCount} รายการยังไม่ได้ mapping
              </Badge>
            )}
          </div>
        </div>

        {/* Customer Mapping Info */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">ลูกค้า:</span>
                  <span className="font-medium">{localPO.customerName || '-'}</span>
                  {localPO.customerName && (
                    <EditCustomerNameDialog
                      poId={po.id}
                      currentCustomerName={localPO.customerName}
                      onSuccess={(newName) => {
                        setLocalPO({
                          ...localPO,
                          customerName: newName,
                          isCustomerMapped: false,
                          vendorCustomerCode: undefined,
                          vendorCustomerName: undefined,
                        });
                      }}
                    />
                  )}
                  {localPO.isCustomerMapped ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Mapped
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      ยังไม่ได้ Mapping
                    </Badge>
                  )}
                </div>
                {localPO.isCustomerMapped && localPO.vendorCustomerCode && (
                  <div className="text-sm text-muted-foreground mt-1">
                    <span>รหัส Vendor: </span>
                    <span className="font-medium text-foreground">{localPO.vendorCustomerCode}</span>
                    <span className="mx-2">|</span>
                    <span>ชื่อ Vendor: </span>
                    <span className="font-medium text-foreground">{localPO.vendorCustomerName}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!localPO.isCustomerMapped && localPO.customerName && (
                <QuickCustomerMappingDialog 
                  customerName={localPO.customerName} 
                  onSuccess={handleRefreshCustomerMapping} 
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshCustomerMapping}
                disabled={isRefreshingCustomer}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshingCustomer && "animate-spin")} />
                อัปเดต
              </Button>
            </div>
          </div>
        </div>

        {/* Branch Mapping Info */}
        <div className="mt-2 p-3 rounded-lg bg-muted/30 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">สาขา:</span>
                  <span className="font-medium">{localPO.branch || '-'}</span>
                  {localPO.branch && (
                    <EditBranchNameDialog
                      poId={po.id}
                      currentBranch={localPO.branch}
                      onSuccess={(newBranch) => {
                        setLocalPO({
                          ...localPO,
                          branch: newBranch,
                          isBranchMapped: false,
                          vendorBranchCode: undefined,
                          vendorBranchName: undefined,
                        });
                      }}
                    />
                  )}
                  {localPO.isBranchMapped ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Mapped
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      ยังไม่ได้ Mapping
                    </Badge>
                  )}
                </div>
                {localPO.isBranchMapped && localPO.vendorBranchCode && (
                  <div className="text-sm text-muted-foreground mt-1">
                    <span>รหัสสาขา: </span>
                    <span className="font-medium text-foreground">{localPO.vendorBranchCode}</span>
                    <span className="mx-2">|</span>
                    <span>ชื่อสาขา: </span>
                    <span className="font-medium text-foreground">{localPO.vendorBranchName}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!localPO.isBranchMapped && localPO.branch && localPO.isCustomerMapped && (
                <QuickBranchMappingDialog 
                  customerName={localPO.customerName || ''} 
                  branch={localPO.branch}
                  onSuccess={handleRefreshBranchMapping} 
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshBranchMapping}
                disabled={isRefreshingBranch}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshingBranch && "animate-spin")} />
                อัปเดต
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">สาขา:</span>
            <p className="font-medium">{localPO.branch || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">วันครบกำหนด:</span>
            <p className="font-medium">{new Date(localPO.dueDate).toLocaleDateString('th-TH')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">รวมมูลค่า:</span>
            <p className="font-medium">฿{formatCurrency(localPO.netTotal)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">ส่วนลด:</span>
            <p className="font-medium">-</p>
          </div>
          <div>
            <span className="text-muted-foreground">มูลค่าหลังหักส่วนลด:</span>
            <p className="font-medium">฿{formatCurrency(localPO.netTotal)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">ภาษีมูลค่าเพิ่ม 7%:</span>
            <p className="font-medium">฿{formatCurrency(localPO.vat)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">มูลค่าสุทธิ:</span>
            <p className="font-bold text-lg text-primary">฿{formatCurrency(localPO.grandTotal)}</p>
          </div>
        </div>
      </div>

      {/* Split View: PDF + Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PDF Preview */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">เอกสาร PDF</h3>
          </div>
          {pdfUrl ? (
            <PdfViewer url={pdfUrl} />
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
              <p className="text-muted-foreground">ไม่มีไฟล์ PDF</p>
            </div>
          )}
        </Card>

        {/* Items Table */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">รายการสินค้า ({localItems.length} รายการ)</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshMapping}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              อัปเดต Mapping สินค้า
            </Button>
          </div>
          
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>รหัสลูกค้า</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead>รหัส Vendor</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-right">ราคา/หน่วย</TableHead>
                  <TableHead className="text-right">รวม</TableHead>
                  <TableHead className="w-[80px]">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{item.customerProductCode}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.customerDescription}</TableCell>
                    <TableCell>
                      {item.vendorProductCode ? (
                        <span className="font-mono text-sm text-green-600">{item.vendorProductCode}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={Number(getItemValue(item, 'quantity'))}
                        onChange={(e) => handleItemEdit(item.id, 'quantity', Number(e.target.value))}
                        className="w-20 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={Number(getItemValue(item, 'unitPrice'))}
                        onChange={(e) => handleItemEdit(item.id, 'unitPrice', Number(e.target.value))}
                        className="w-24 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      {item.isMapped ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          <QuickProductMappingDialog 
                            customerCode={item.customerProductCode}
                            customerDesc={item.customerDescription}
                            unit={item.unit}
                            onSuccess={handleRefreshMapping}
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Remark Field */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">หมายเหตุ</h3>
        </div>
        <Textarea
          placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)..."
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleReject} className="gap-2">
          <XCircle className="w-4 h-4" />
          ปฏิเสธ
        </Button>
        <Button onClick={handleVerify} className="gap-2">
          <CheckCircle2 className="w-4 h-4" />
          ยืนยันเอกสาร
        </Button>
      </div>
    </div>
  );
}
