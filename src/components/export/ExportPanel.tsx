import { useState } from 'react';
import { POHeader } from '@/types/po';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, FileSpreadsheet, Filter, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchPOItems } from '@/lib/api/database';
import { generateC303Excel, ExportColumn } from '@/lib/utils/excel';
import { ExportColumnSelector, DEFAULT_COLUMNS } from './ExportColumnSelector';
import { ExportPreviewDialog, ExportItem } from './ExportPreviewDialog';

interface ExportPanelProps {
  poList: POHeader[];
}

export function ExportPanel({ poList }: ExportPanelProps) {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [branch, setBranch] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'VERIFIED' | 'EXPORTED' | 'all'>('VERIFIED');
  const [selectedPOs, setSelectedPOs] = useState<string[]>([]);
  const [exportColumns, setExportColumns] = useState<ExportColumn[]>(DEFAULT_COLUMNS);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState<ExportItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Filter by status first
  const exportablePOs = poList.filter(po => {
    if (statusFilter === 'all') return po.status === 'VERIFIED' || po.status === 'EXPORTED';
    return po.status === statusFilter;
  });
  
  const branches = [...new Set(poList.map(po => po.branch))];

  const filteredPOs = exportablePOs.filter(po => {
    const matchesBranch = branch === 'all' || po.branch === branch;
    const matchesDateFrom = !dateFrom || new Date(po.dueDate) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(po.dueDate) <= new Date(dateTo);
    return matchesBranch && matchesDateFrom && matchesDateTo;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPOs(filteredPOs.map(po => po.id));
    } else {
      setSelectedPOs([]);
    }
  };

  const handleSelectPO = (poId: string, checked: boolean) => {
    if (checked) {
      setSelectedPOs(prev => [...prev, poId]);
    } else {
      setSelectedPOs(prev => prev.filter(id => id !== poId));
    }
  };

  const fetchExportItems = async (): Promise<ExportItem[]> => {
    const allItems: ExportItem[] = [];

    for (const poId of selectedPOs) {
      const po = filteredPOs.find(p => p.id === poId);
      if (!po) continue;
      
      // Fetch customer mapping data for this PO's customer with explicit joins
      let warehouseData: { code: string; name: string } | null = null;
      let vehiclePositionData: { code: string; name: string } | null = null;
      let transportCodeData: { code: string; name: string } | null = null;
      let branchData: { vendor_branch_code: string | null; vendor_branch_name: string | null } | null = null;
      let vatType = 1;
      let customerMappingId: string | null = null;
      
      if (po.vendorCustomerCode) {
        const { data: customerMapping } = await supabase
          .from('customer_mappings')
          .select('id, warehouse_id, vehicle_position_id, transport_code_id, vat_type')
          .eq('vendor_customer_code', po.vendorCustomerCode)
          .maybeSingle();
        
        if (customerMapping) {
          customerMappingId = customerMapping.id;
          vatType = customerMapping.vat_type ?? 1;
          
          // Fetch related data separately
          if (customerMapping.warehouse_id) {
            const { data: wh } = await supabase
              .from('warehouses')
              .select('code, name')
              .eq('id', customerMapping.warehouse_id)
              .maybeSingle();
            warehouseData = wh;
          }
          
          if (customerMapping.vehicle_position_id) {
            const { data: vp } = await supabase
              .from('vehicle_positions')
              .select('code, name')
              .eq('id', customerMapping.vehicle_position_id)
              .maybeSingle();
            vehiclePositionData = vp;
          }
          
          if (customerMapping.transport_code_id) {
            const { data: tc } = await supabase
              .from('transport_codes')
              .select('code, name')
              .eq('id', customerMapping.transport_code_id)
              .maybeSingle();
            transportCodeData = tc;
          }
        }
      }
      
      // Fetch branch mapping - first try from po_headers, then from customer_branch_mappings
      let vendorBranchCode = po.vendorBranchCode || '';
      let vendorBranchName = '';
      
      if (!vendorBranchCode && customerMappingId && po.branch) {
        // Try to find branch mapping from customer_branch_mappings table
        const { data: branchMapping } = await supabase
          .from('customer_branch_mappings')
          .select('vendor_branch_code, vendor_branch_name')
          .eq('customer_mapping_id', customerMappingId)
          .eq('branch', po.branch)
          .eq('active', true)
          .maybeSingle();
        
        if (branchMapping) {
          vendorBranchCode = branchMapping.vendor_branch_code || '';
          vendorBranchName = branchMapping.vendor_branch_name || '';
        }
      }
      
      const items = await fetchPOItems(poId);
      for (const item of items) {
        allItems.push({
          po_number: po.poNumber,
          due_date: po.dueDate,
          branch: po.branch,
          supplier_code: po.supplierCode,
          vendor_product_code: item.vendor_product_code || '',
          vendor_description: item.vendor_description || '',
          quantity: item.quantity,
          unit: item.unit || 'ลัง',
          unit_price: item.unit_price,
          amount: item.amount,
          // Customer mapping fields
          vendor_branch_code: vendorBranchCode,
          warehouse_code: warehouseData?.code || '',
          warehouse_name: warehouseData?.name || '',
          vehicle_position_code: vehiclePositionData?.code || '',
          vehicle_position_name: vehiclePositionData?.name || '',
          vat_type: vatType,
          transport_code: transportCodeData?.code || '',
          transport_name: transportCodeData?.name || '',
        });
      }
    }

    return allItems;
  };

  const handlePreview = async () => {
    if (selectedPOs.length === 0) {
      toast({
        title: "กรุณาเลือก PO",
        description: "เลือกอย่างน้อย 1 รายการเพื่อดูตัวอย่าง",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingPreview(true);
    try {
      const items = await fetchExportItems();
      setPreviewItems(items);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดตัวอย่างได้",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Use already fetched preview items or fetch new ones
      const allItems = previewItems.length > 0 ? previewItems : await fetchExportItems();

      // Generate Excel file with selected columns
      const fileName = `C303_${new Date().toISOString().slice(0, 10)}.xlsx`;
      generateC303Excel(allItems, fileName, exportColumns);

      // Update status to EXPORTED for all selected POs
      const { error } = await supabase
        .from('po_headers')
        .update({ status: 'EXPORTED' })
        .in('id', selectedPOs);

      if (error) throw error;

      // Get current user for export history
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save export history
      await supabase.from('export_history').insert({
        user_id: user?.id,
        exported_pos: selectedPOs,
        file_name: fileName,
      });

      toast({
        title: "ส่งออกสำเร็จ",
        description: `ส่งออก ${selectedPOs.length} รายการเป็น ${fileName} (${exportColumns.filter(c => c.enabled).length} คอลัมน์)`,
      });

      // Clear selection and close preview
      setSelectedPOs([]);
      setPreviewItems([]);
      setPreviewOpen(false);
      
    } catch (error) {
      console.error('Error exporting POs:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกได้",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

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
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">ตัวกรองการส่งออก</h3>
          </div>
          <ExportColumnSelector 
            columns={exportColumns} 
            onColumnsChange={setExportColumns} 
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label className="mb-2 block">สถานะ</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'VERIFIED' | 'EXPORTED' | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VERIFIED">รอส่งออก</SelectItem>
                <SelectItem value="EXPORTED">ส่งออกแล้ว</SelectItem>
                <SelectItem value="all">ทั้งหมด</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              วันครบกำหนด (เริ่มต้น)
            </Label>
            <Input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              วันครบกำหนด (สิ้นสุด)
            </Label>
            <Input 
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-2 block">สาขา</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกสาขา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสาขา</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handlePreview} 
              disabled={selectedPOs.length === 0 || isLoadingPreview}
              className="w-full gap-2"
            >
              <Eye className="w-4 h-4" />
              {isLoadingPreview ? 'กำลังโหลด...' : `ดูตัวอย่าง (${selectedPOs.length})`}
            </Button>
          </div>
        </div>
      </div>

      {/* PO Selection */}
      <div className="bg-card rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-success" />
            <div>
              <h3 className="font-semibold">
                PO พร้อมส่งออก 
                {statusFilter === 'VERIFIED' && ' (สถานะ: รอส่งออก)'}
                {statusFilter === 'EXPORTED' && ' (สถานะ: ส่งออกแล้ว)'}
                {statusFilter === 'all' && ' (ทุกสถานะ)'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filteredPOs.length} รายการ | เลือกแล้ว {selectedPOs.length} รายการ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox 
              id="selectAll"
              checked={selectedPOs.length === filteredPOs.length && filteredPOs.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="selectAll" className="text-sm cursor-pointer">เลือกทั้งหมด</Label>
          </div>
        </div>

        <div className="divide-y">
          {filteredPOs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ไม่พบ PO ที่พร้อมส่งออก</p>
              <p className="text-sm">PO ต้องมีสถานะ "ตรวจสอบแล้ว/รอส่งออก" จึงจะส่งออกได้</p>
            </div>
          ) : (
            filteredPOs.map((po, index) => (
              <div 
                key={po.id}
                className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Checkbox 
                  checked={selectedPOs.includes(po.id)}
                  onCheckedChange={(checked) => handleSelectPO(po.id, checked as boolean)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-primary">{po.poNumber}</p>
                    <Badge 
                      variant={po.status === 'VERIFIED' ? 'default' : 'secondary'}
                      className={po.status === 'VERIFIED' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600 text-white'}
                    >
                      {po.status === 'VERIFIED' ? 'รอส่งออก' : 'ส่งออกแล้ว'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">|</span>
                    <p className="text-sm">{po.supplierName}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{po.branch}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">฿{formatCurrency(po.grandTotal)}</p>
                  <p className="text-sm text-muted-foreground">ครบกำหนด: {formatDate(po.dueDate)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <ExportPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        items={previewItems}
        columns={exportColumns}
        onConfirm={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
}
