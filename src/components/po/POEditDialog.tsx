import { useState, useEffect } from 'react';
import { POHeader } from '@/types/po';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePOActionLog } from '@/hooks/usePOActionLog';
import { Loader2 } from 'lucide-react';

interface POEditDialogProps {
  po: POHeader | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function POEditDialog({ po, open, onOpenChange, onSuccess }: POEditDialogProps) {
  const { toast } = useToast();
  const { logAction } = usePOActionLog();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    poNumber: '',
    customerName: '',
    branch: '',
    dueDate: '',
    remark: '',
  });

  useEffect(() => {
    if (po) {
      setFormData({
        poNumber: po.poNumber || '',
        customerName: po.customerName || '',
        branch: po.branch || '',
        dueDate: po.dueDate ? po.dueDate.split('T')[0] : '',
        remark: po.remark || '',
      });
    }
  }, [po]);

  const handleSave = async () => {
    if (!po) return;
    
    setLoading(true);
    try {
      const changes: string[] = [];
      
      // Track changes for logging
      if (formData.poNumber !== po.poNumber) {
        changes.push(`เลข PO: ${po.poNumber} → ${formData.poNumber}`);
      }
      if (formData.customerName !== (po.customerName || '')) {
        changes.push(`ลูกค้า: ${po.customerName || '-'} → ${formData.customerName || '-'}`);
      }
      if (formData.branch !== po.branch) {
        changes.push(`สาขา: ${po.branch} → ${formData.branch}`);
      }
      if (formData.dueDate !== (po.dueDate?.split('T')[0] || '')) {
        changes.push(`วันครบกำหนด: ${po.dueDate?.split('T')[0] || '-'} → ${formData.dueDate}`);
      }
      if (formData.remark !== (po.remark || '')) {
        changes.push(`หมายเหตุ: ${po.remark || '-'} → ${formData.remark || '-'}`);
      }

      if (changes.length === 0) {
        toast({
          title: "ไม่มีการเปลี่ยนแปลง",
          description: "ไม่พบข้อมูลที่แก้ไข",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('po_headers')
        .update({
          po_number: formData.poNumber,
          customer_name: formData.customerName || null,
          branch: formData.branch,
          due_date: formData.dueDate,
          remark: formData.remark || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', po.id);

      if (error) throw error;

      // Log edit action
      await logAction(po.id, 'edited', {
        description: `แก้ไขข้อมูล PO ${po.poNumber}`,
        changes: changes,
      });

      // Also log to po_edit_history for detailed tracking
      const user = (await supabase.auth.getUser()).data.user;
      for (const change of changes) {
        const [field, values] = change.split(': ');
        const [oldVal, newVal] = values.split(' → ');
        
        await supabase.from('po_edit_history').insert({
          po_id: po.id,
          field_name: field,
          old_value: oldVal,
          new_value: newVal,
          edited_by: user?.id || null,
        });
      }

      toast({
        title: "บันทึกสำเร็จ",
        description: `แก้ไขข้อมูล PO ${formData.poNumber} เรียบร้อยแล้ว`,
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating PO:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูล PO</DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลหลักของ PO {po?.poNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="poNumber">เลข PO</Label>
            <Input
              id="poNumber"
              value={formData.poNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="customerName">ชื่อลูกค้า</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="branch">สาขา</Label>
            <Input
              id="branch"
              value={formData.branch}
              onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="dueDate">วันครบกำหนด</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="remark">หมายเหตุ</Label>
            <Textarea
              id="remark"
              value={formData.remark}
              onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
