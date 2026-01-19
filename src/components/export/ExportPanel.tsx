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
import { Calendar, Download, FileSpreadsheet, Filter, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExportPanelProps {
  poList: POHeader[];
}

export function ExportPanel({ poList }: ExportPanelProps) {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [branch, setBranch] = useState('all');
  const [selectedPOs, setSelectedPOs] = useState<string[]>([]);

  const verifiedPOs = poList.filter(po => po.status === 'VERIFIED');
  
  const branches = [...new Set(poList.map(po => po.branch))];

  const filteredPOs = verifiedPOs.filter(po => {
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

  const handleExport = async () => {
    if (selectedPOs.length === 0) {
      toast({
        title: "กรุณาเลือก PO",
        description: "เลือกอย่างน้อย 1 รายการเพื่อส่งออก",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update status to EXPORTED for all selected POs
      const { error } = await supabase
        .from('po_headers')
        .update({ status: 'EXPORTED' })
        .in('id', selectedPOs);

      if (error) throw error;

      // Get current user for export history
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save export history
      const fileName = `C303_${new Date().toISOString().slice(0, 10)}.xls`;
      await supabase.from('export_history').insert({
        user_id: user?.id,
        exported_pos: selectedPOs,
        file_name: fileName,
      });

      toast({
        title: "ส่งออกสำเร็จ",
        description: `ส่งออก ${selectedPOs.length} รายการเป็น ${fileName} และอัพเดทสถานะเป็น "ส่งออกแล้ว"`,
      });

      // Clear selection
      setSelectedPOs([]);
      
    } catch (error) {
      console.error('Error exporting POs:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกได้",
        variant: "destructive",
      });
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
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">ตัวกรองการส่งออก</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              onClick={handleExport} 
              disabled={selectedPOs.length === 0}
              className="w-full gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              ยืนยันส่งออก ({selectedPOs.length})
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
              <h3 className="font-semibold">PO พร้อมส่งออก (สถานะ: ตรวจสอบแล้ว/รอส่งออก)</h3>
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

      {/* Export History */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="font-semibold mb-4">ประวัติการส่งออก</h3>
        <div className="text-center py-8 text-muted-foreground">
          <p>ยังไม่มีประวัติการส่งออก</p>
        </div>
      </div>
    </div>
  );
}
