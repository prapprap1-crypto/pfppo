import { useState, useEffect, useMemo } from 'react';
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
  MessageSquare,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { POHeader, POItem } from '@/types/po';
import { refreshPOMappings, refreshPOCustomerMapping, findBranchMapping, updatePOHeader, updatePOItem } from '@/lib/api/database';
import { supabase } from '@/integrations/supabase/client';
import { usePOActionLog } from '@/hooks/usePOActionLog';
import { useUserRole } from '@/hooks/useUserRole';
import { PdfViewer } from './PdfViewer';
import { 
  QuickCustomerMappingDialog, 
  QuickBranchMappingDialog, 
  QuickProductMappingDialog,
  EditCustomerNameDialog,
  EditBranchNameDialog
} from './QuickMappingDialogs';
import { EditHistoryDialog } from './EditHistoryDialog';
import { InlineVendorCodeEditor } from './InlineVendorCodeEditor';

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
  const { logAction } = usePOActionLog();
  const { isModerator } = useUserRole();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [editedItems, setEditedItems] = useState<Record<string, Partial<POItem>>>({});
  const [localItems, setLocalItems] = useState<POItem[]>(items);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingCustomer, setIsRefreshingCustomer] = useState(false);
  const [isRefreshingBranch, setIsRefreshingBranch] = useState(false);
  const [localPO, setLocalPO] = useState<POHeader>(po);
  const [remark, setRemark] = useState<string>(po.remark || '');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    setLocalPO(po);
    setRemark(po.remark || '');
  }, [po]);

  useEffect(() => {
    const loadPdfUrl = async () => {
      setPdfLoading(true);
      if (po.sourceFile) {
        try {
          const { data, error } = await supabase.storage
            .from('po-files')
            .createSignedUrl(po.sourceFile, 3600);
          
          if (error) {
            console.error('Error creating signed URL:', error);
          } else if (data?.signedUrl) {
            setPdfUrl(data.signedUrl);
          }
        } catch (err) {
          console.error('Error loading PDF URL:', err);
        }
      }
      setPdfLoading(false);
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

  const hasItemChanges = (itemId: string) => {
    return !!editedItems[itemId] && Object.keys(editedItems[itemId]).length > 0;
  };

  const handleSaveItem = async (item: POItem) => {
    if (!editedItems[item.id]) return;
    
    setSavingItemId(item.id);
    const customerProductCodeChanged = editedItems[item.id]?.customerProductCode !== undefined;
    
    try {
      const quantity = Number(getItemValue(item, 'quantity'));
      const unitPrice = Number(getItemValue(item, 'unitPrice'));
      const customerProductCode = String(getItemValue(item, 'customerProductCode') ?? item.customerProductCode);
      const amount = quantity * unitPrice;

      await updatePOItem(item.id, {
        quantity,
        unit_price: unitPrice,
        amount,
        customer_product_code: customerProductCode,
      });

      // Log the edit action
      const changes: string[] = [];
      if (customerProductCodeChanged) {
        changes.push(`รหัสสินค้า: ${item.customerProductCode} → ${customerProductCode}`);
      }
      if (editedItems[item.id]?.quantity !== undefined) {
        changes.push(`จำนวน: ${item.quantity} → ${quantity}`);
      }
      if (editedItems[item.id]?.unitPrice !== undefined) {
        changes.push(`ราคา: ${item.unitPrice} → ${unitPrice}`);
      }

      await logAction(po.id, 'edited', {
        description: `แก้ไขรายการสินค้า ${customerProductCode}`,
        changes,
      });

      // Update local state
      setLocalItems(prev => prev.map(i => 
        i.id === item.id 
          ? { ...i, quantity, unitPrice, amount, customerProductCode }
          : i
      ));

      // Clear edited state for this item
      setEditedItems(prev => {
        const newState = { ...prev };
        delete newState[item.id];
        return newState;
      });
      setEditingItemId(null);

      // Recalculate totals
      await recalculateTotals();

      toast({
        title: "บันทึกสำเร็จ",
        description: `อัปเดตรายการ ${customerProductCode} เรียบร้อย`,
      });

      // Auto refresh mapping if customer product code was changed
      if (customerProductCodeChanged) {
        await handleRefreshMapping();
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setSavingItemId(null);
    }
  };

  const handleCancelEdit = (itemId: string) => {
    setEditedItems(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      return newState;
    });
    setEditingItemId(null);
  };

  const recalculateTotals = async () => {
    // Fetch updated items and recalculate
    const { data: updatedItems } = await supabase
      .from('po_items')
      .select('amount')
      .eq('po_id', po.id);

    if (updatedItems) {
      const netTotal = updatedItems.reduce((sum, item) => sum + Number(item.amount), 0);
      const vat = netTotal * 0.07;
      const grandTotal = netTotal + vat;

      await updatePOHeader(po.id, {
        net_total: netTotal,
        vat,
        grand_total: grandTotal,
      });

      setLocalPO(prev => ({
        ...prev,
        netTotal,
        vat,
        grandTotal,
      }));
    }
  };

  const handleVerify = async () => {
    try {
      // Update status to VERIFIED and save remark in database
      await updatePOHeader(po.id, { status: 'VERIFIED', remark: remark || null });
      
      // Log verify action
      await logAction(po.id, 'verified', { 
        description: `ยืนยันเอกสาร ${po.poNumber}` 
      });
      
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
          {pdfLoading ? (
            <div className="h-[500px] flex flex-col items-center justify-center bg-muted rounded-lg gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">กำลังโหลด PDF...</p>
            </div>
          ) : pdfUrl ? (
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
                {localItems.map((item, index) => {
                  const isEditing = editingItemId === item.id;
                  const isSaving = savingItemId === item.id;
                  const hasChanges = hasItemChanges(item.id);
                  const editedQuantity = Number(getItemValue(item, 'quantity'));
                  const editedUnitPrice = Number(getItemValue(item, 'unitPrice'));
                  const calculatedAmount = editedQuantity * editedUnitPrice;

                  return (
                    <TableRow key={item.id} className={cn(isEditing && "bg-muted/50")}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {isModerator && isEditing ? (
                          <Input
                            type="text"
                            value={String(getItemValue(item, 'customerProductCode') ?? '')}
                            onChange={(e) => handleItemEdit(item.id, 'customerProductCode', e.target.value)}
                            className="w-24"
                            placeholder="รหัสสินค้า"
                          />
                        ) : (
                          <span 
                            className={cn(
                              isModerator && "cursor-pointer hover:text-primary",
                              editedItems[item.id]?.customerProductCode !== undefined && "text-primary font-semibold"
                            )}
                            onClick={() => isModerator && setEditingItemId(item.id)}
                          >
                            {String(getItemValue(item, 'customerProductCode') ?? '-')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.customerDescription}>
                        {item.customerDescription || '-'}
                      </TableCell>
                      <TableCell>
                        <InlineVendorCodeEditor
                          itemId={item.id}
                          poId={po.id}
                          customerCode={item.customerProductCode}
                          customerDesc={item.customerDescription}
                          currentVendorCode={item.vendorProductCode}
                          currentVendorDesc={item.vendorDescription}
                          unit={item.unit}
                          isMapped={item.isMapped}
                          canEdit={isModerator}
                          onSuccess={handleRefreshMapping}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {isModerator && isEditing ? (
                          <Input
                            type="number"
                            value={editedQuantity}
                            onChange={(e) => handleItemEdit(item.id, 'quantity', Number(e.target.value))}
                            className="w-20 text-right"
                            min={0}
                            step={1}
                          />
                        ) : (
                          <span 
                            className={cn(
                              isModerator && "cursor-pointer hover:text-primary",
                              hasChanges && "text-primary font-semibold"
                            )}
                            onClick={() => isModerator && setEditingItemId(item.id)}
                          >
                            {editedQuantity}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isModerator && isEditing ? (
                          <Input
                            type="number"
                            value={editedUnitPrice}
                            onChange={(e) => handleItemEdit(item.id, 'unitPrice', Number(e.target.value))}
                            className="w-24 text-right"
                            min={0}
                            step={0.01}
                          />
                        ) : (
                          <span 
                            className={cn(
                              isModerator && "cursor-pointer hover:text-primary",
                              hasChanges && "text-primary font-semibold"
                            )}
                            onClick={() => isModerator && setEditingItemId(item.id)}
                          >
                            ฿{formatCurrency(editedUnitPrice)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={cn(hasChanges && "text-primary font-semibold")}>
                          ฿{formatCurrency(hasChanges ? calculatedAmount : item.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isModerator && isEditing && hasChanges ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-green-600 hover:text-green-700"
                                onClick={() => handleSaveItem(item)}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleCancelEdit(item.id)}
                                disabled={isSaving}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : item.isMapped ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <>
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                              <QuickProductMappingDialog 
                                customerCode={item.customerProductCode}
                                customerDesc={item.customerDescription}
                                unit={item.unit}
                                onSuccess={handleRefreshMapping}
                              />
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
