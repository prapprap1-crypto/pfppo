import { useState, useEffect } from 'react';
import { POHeader, POItem, STATUS_LABELS, STATUS_CLASSES } from '@/types/po';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft,
  ChevronRight,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface VerificationViewProps {
  po: POHeader;
  items: POItem[];
  onVerify?: () => void;
  onReject?: () => void;
}

export function VerificationView({ po, items, onVerify, onReject }: VerificationViewProps) {
  const { toast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [editedItems, setEditedItems] = useState<Record<string, Partial<POItem>>>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Load PDF URL from storage
  useEffect(() => {
    const loadPdfUrl = async () => {
      if (!po.sourceFile) return;
      
      setPdfLoading(true);
      try {
        const { data } = await supabase.storage
          .from('po-files')
          .createSignedUrl(po.sourceFile, 3600); // 1 hour expiry
        
        if (data?.signedUrl) {
          setPdfUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setPdfLoading(false);
      }
    };

    loadPdfUrl();
  }, [po.sourceFile]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
    }).format(amount);
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

  const handleVerify = () => {
    toast({
      title: "ยืนยันความถูกต้อง",
      description: `PO ${po.poNumber} ได้รับการยืนยันแล้ว`,
    });
    onVerify?.();
  };

  const handleReject = () => {
    toast({
      title: "ส่งกลับแก้ไข",
      description: `PO ${po.poNumber} ถูกส่งกลับเพื่อแก้ไข`,
      variant: "destructive",
    });
    onReject?.();
  };

  const unmappedCount = items.filter(i => !i.isMapped).length;

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{po.poNumber.slice(-3)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{po.poNumber}</h2>
              <p className="text-muted-foreground">{po.supplierName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('status-badge', STATUS_CLASSES[po.status])}>
              {STATUS_LABELS[po.status]}
            </span>
            {unmappedCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {unmappedCount} รายการยังไม่ได้ mapping
              </Badge>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">สาขา:</span>
            <p className="font-medium">{po.branch || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">วันครบกำหนด:</span>
            <p className="font-medium">{new Date(po.dueDate).toLocaleDateString('th-TH')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">รวมมูลค่า:</span>
            <p className="font-medium">฿{formatCurrency(po.netTotal)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">ส่วนลด:</span>
            <p className="font-medium">-</p>
          </div>
          <div>
            <span className="text-muted-foreground">มูลค่าหลังหักส่วนลด:</span>
            <p className="font-medium">฿{formatCurrency(po.netTotal)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">ภาษีมูลค่าเพิ่ม 7%:</span>
            <p className="font-medium">฿{formatCurrency(po.vat)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">มูลค่าสุทธิ:</span>
            <p className="font-bold text-lg text-primary">฿{formatCurrency(po.grandTotal)}</p>
          </div>
        </div>
      </div>

      {/* Split Panel View */}
      <div className="split-panel">
        {/* PDF Preview Panel */}
        <div className="pdf-preview-panel">
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">PDF Preview</span>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setZoom(z => Math.max(50, z - 10))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm w-12 text-center">{zoom}%</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setZoom(z => Math.min(200, z + 10))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <div className="border-l pl-2 ml-2 flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">หน้า {currentPage}/1</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div 
            className="flex-1 bg-muted/20 overflow-auto flex items-center justify-center"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}
          >
            {pdfLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">กำลังโหลด PDF...</p>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full min-h-[800px] border-0"
                title={`PDF Preview - ${po.poNumber}`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 text-warning" />
                <p className="text-sm">ไม่พบไฟล์ PDF สำหรับ PO นี้</p>
                <p className="text-xs">กรุณาอัปโหลดไฟล์ใหม่อีกครั้ง</p>
              </div>
            )}
          </div>
        </div>

        {/* Data Panel */}
        <div className="data-panel">
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">ข้อมูลที่ระบบอ่านได้</span>
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-1" />
              บันทึก
            </Button>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>รหัสลูกค้า</TableHead>
                  <TableHead>รหัสผู้ขาย</TableHead>
                  <TableHead className="text-center">จำนวน</TableHead>
                  <TableHead className="text-right">ราคา/หน่วย</TableHead>
                  <TableHead className="text-right">รวม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow 
                    key={item.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      selectedItemId === item.id && 'bg-accent/10',
                      !item.isMapped && 'bg-warning/5'
                    )}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-primary text-sm">{item.customerProductCode}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-32">{item.customerDescription}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.isMapped ? (
                        <div>
                          <p className="font-mono text-sm">{item.vendorProductCode}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-32">{item.vendorDescription}</p>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-warning border-warning">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          ไม่พบ mapping
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input 
                        type="number"
                        value={getItemValue(item, 'quantity') as number}
                        onChange={(e) => handleItemEdit(item.id, 'quantity', Number(e.target.value))}
                        className="w-16 h-7 text-center text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input 
                        type="number"
                        value={getItemValue(item, 'unitPrice') as number}
                        onChange={(e) => handleItemEdit(item.id, 'unitPrice', Number(e.target.value))}
                        className="w-24 h-7 text-right text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ฿{formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Action Buttons */}
          <div className="border-t p-4 flex items-center justify-between bg-muted/30">
            <div className="text-sm">
              <p className="text-muted-foreground">รวมทั้งหมด {items.length} รายการ</p>
              <p className="font-bold text-lg">฿{formatCurrency(po.grandTotal)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleReject} className="border-destructive text-destructive hover:bg-destructive/10">
                <XCircle className="w-4 h-4 mr-2" />
                ส่งกลับแก้ไข
              </Button>
              <Button onClick={handleVerify} className="bg-success hover:bg-success/90">
                <CheckCircle className="w-4 h-4 mr-2" />
                ยืนยันความถูกต้อง
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
