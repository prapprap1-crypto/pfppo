import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { FileSpreadsheet, Filter, Eye, ExternalLink } from 'lucide-react';
import { DateInput } from '@/components/ui/date-input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchPOItems } from '@/lib/api/database';
import { generateC303Excel, ExportColumn } from '@/lib/utils/excel';
import { ExportColumnSelector, DEFAULT_COLUMNS } from './ExportColumnSelector';
import { ExportPreviewDialog, ExportItem } from './ExportPreviewDialog';
import { usePOActionLog } from '@/hooks/usePOActionLog';

interface ExportPanelProps {
  poList: POHeader[];
}

export function ExportPanel({ poList }: ExportPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logBulkAction } = usePOActionLog();
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
    const selectedPOData = filteredPOs.filter(p => selectedPOs.includes(p.id));
    if (selectedPOData.length === 0) return [];

    // 1. Batch fetch all items for selected POs
    const { data: allItemsData } = await supabase
      .from('po_items')
      .select('*')
      .in('po_id', selectedPOs);

    // 2. Collect unique vendor_customer_codes
    const vendorCodes = [...new Set(selectedPOData.map(po => po.vendorCustomerCode).filter(Boolean))] as string[];

    // 3. Batch fetch customer mappings
    let customerMappingsMap = new Map<string, { id: string; vat_type: number | null; salesperson_id: string | null }>();
    if (vendorCodes.length > 0) {
      const { data: mappings } = await supabase
        .from('customer_mappings')
        .select('id, vendor_customer_code, vat_type, salesperson_id')
        .in('vendor_customer_code', vendorCodes);
      (mappings || []).forEach(m => customerMappingsMap.set(m.vendor_customer_code, m));
    }

    // 4. Batch fetch salespersons
    const salespersonIds = [...new Set([...customerMappingsMap.values()].map(m => m.salesperson_id).filter(Boolean))] as string[];
    let salespersonMap = new Map<string, { code: string; name: string }>();
    if (salespersonIds.length > 0) {
      const { data: sps } = await supabase.from('salespersons').select('id, code, name').in('id', salespersonIds);
      (sps || []).forEach(sp => salespersonMap.set(sp.id, { code: sp.code, name: sp.name }));
    }

    // 5. Batch fetch branch mappings
    const customerMappingIds = [...new Set([...customerMappingsMap.values()].map(m => m.id))];
    let branchMappingsMap = new Map<string, any>();
    if (customerMappingIds.length > 0) {
      const { data: branchMappings } = await supabase
        .from('customer_branch_mappings')
        .select('customer_mapping_id, branch, vendor_branch_code, vendor_branch_name, warehouse_id, vehicle_position_id, transport_code_id')
        .in('customer_mapping_id', customerMappingIds)
        .eq('active', true);
      (branchMappings || []).forEach(bm => {
        branchMappingsMap.set(`${bm.customer_mapping_id}|${bm.branch}`, bm);
      });
    }

    // 6. Collect all referenced setting IDs and batch fetch
    const warehouseIds = new Set<string>();
    const vehiclePositionIds = new Set<string>();
    const transportCodeIds = new Set<string>();
    branchMappingsMap.forEach(bm => {
      if (bm.warehouse_id) warehouseIds.add(bm.warehouse_id);
      if (bm.vehicle_position_id) vehiclePositionIds.add(bm.vehicle_position_id);
      if (bm.transport_code_id) transportCodeIds.add(bm.transport_code_id);
    });

    const [whResult, vpResult, tcResult] = await Promise.all([
      warehouseIds.size > 0 ? supabase.from('warehouses').select('id, code, name').in('id', [...warehouseIds]) : { data: [] },
      vehiclePositionIds.size > 0 ? supabase.from('vehicle_positions').select('id, code, name').in('id', [...vehiclePositionIds]) : { data: [] },
      transportCodeIds.size > 0 ? supabase.from('transport_codes').select('id, code, name').in('id', [...transportCodeIds]) : { data: [] },
    ]);

    const whMap = new Map((whResult.data || []).map(w => [w.id, w]));
    const vpMap = new Map((vpResult.data || []).map(v => [v.id, v]));
    const tcMap = new Map((tcResult.data || []).map(t => [t.id, t]));

    // 7. Assemble items
    const allItems: ExportItem[] = [];
    for (const po of selectedPOData) {
      const cm = po.vendorCustomerCode ? customerMappingsMap.get(po.vendorCustomerCode) : null;
      const vatType = cm?.vat_type ?? 1;
      const sp = cm?.salesperson_id ? salespersonMap.get(cm.salesperson_id) : null;
      const bm = cm ? branchMappingsMap.get(`${cm.id}|${po.branch}`) : null;

      let vendorBranchCode = po.vendorBranchCode || '';
      if (!vendorBranchCode && bm) vendorBranchCode = bm.vendor_branch_code || '';

      const wh = bm?.warehouse_id ? whMap.get(bm.warehouse_id) : null;
      const vp = bm?.vehicle_position_id ? vpMap.get(bm.vehicle_position_id) : null;
      const tc = bm?.transport_code_id ? tcMap.get(bm.transport_code_id) : null;

      const poItems = (allItemsData || []).filter(i => i.po_id === po.id);
      for (const item of poItems) {
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
          vendor_branch_code: vendorBranchCode,
          warehouse_code: wh?.code || '',
          warehouse_name: wh?.name || '',
          vehicle_position_code: vp?.code || '',
          vehicle_position_name: vp?.name || '',
          vat_type: vatType,
          transport_code: tc?.code || '',
          transport_name: tc?.name || '',
          salesperson_code: sp?.code || '',
          salesperson_name: sp?.name || '',
          remark: po.remark || '',
          vendor_customer_code: po.vendorCustomerCode || '',
          vendor_customer_name: po.vendorCustomerName || '',
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

      // Generate Excel file with selected columns - filename is now auto-generated in the function
      const generatedFileName = generateC303Excel(allItems, '', exportColumns);

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
        file_name: generatedFileName,
      });

      // Log export action for all exported POs
      await logBulkAction(selectedPOs, 'exported', { 
        file_name: generatedFileName,
        description: `ส่งออก ${selectedPOs.length} รายการ`
      });

      toast({
        title: "ส่งออกสำเร็จ",
        description: `ส่งออก ${selectedPOs.length} รายการเป็น ${generatedFileName} (${exportColumns.filter(c => c.enabled).length} คอลัมน์)`,
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
              วันครบกำหนด (เริ่มต้น)
            </Label>
            <DateInput
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="เริ่มต้น"
            />
          </div>
          <div>
            <Label className="flex items-center gap-2 mb-2">
              วันครบกำหนด (สิ้นสุด)
            </Label>
            <DateInput
              value={dateTo}
              onChange={setDateTo}
              placeholder="สิ้นสุด"
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
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/verification/${po.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-primary hover:underline">{po.poNumber}</p>
                    <Badge 
                      variant={po.status === 'VERIFIED' ? 'default' : 'secondary'}
                      className={po.status === 'VERIFIED' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600 text-white'}
                    >
                      {po.status === 'VERIFIED' ? 'รอส่งออก' : 'ส่งออกแล้ว'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">|</span>
                    <p className="text-sm">{po.supplierName}</p>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
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
