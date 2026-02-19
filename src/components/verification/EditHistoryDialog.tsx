import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { History, Building2, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface EditHistoryItem {
  id: string;
  field_name: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

interface EditHistoryDialogProps {
  poId: string;
}

export function EditHistoryDialog({ poId }: EditHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<EditHistoryItem[]>([]);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, poId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('po_edit_history')
        .select('*')
        .eq('po_id', poId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading edit history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (fieldName: string) => {
    switch (fieldName) {
      case 'customer_name': return 'ชื่อลูกค้า';
      case 'branch': return 'ชื่อสาขา';
      case 'net_total': return 'มูลค่าหลังหักส่วนลด';
      case 'vat': return 'ภาษีมูลค่าเพิ่ม 7%';
      case 'grand_total': return 'มูลค่าสุทธิ';
      default: return fieldName;
    }
  };

  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'customer_name': return <Building2 className="w-4 h-4" />;
      case 'branch': return <MapPin className="w-4 h-4" />;
      case 'net_total':
      case 'vat':
      case 'grand_total':
        return <span className="text-xs font-bold">฿</span>;
      default: return null;
    }
  };

  const formatValue = (fieldName: string, value: string) => {
    if (['net_total', 'vat', 'grand_total'].includes(fieldName)) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return `฿${num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
    return value;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <History className="w-4 h-4" />
          ประวัติการแก้ไข
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            ประวัติการแก้ไข
          </DialogTitle>
        <DialogDescription>
            รายการแก้ไขข้อมูลของเอกสารนี้
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีประวัติการแก้ไข</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 rounded-lg border bg-muted/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="gap-1.5">
                      {getFieldIcon(item.field_name)}
                      {getFieldLabel(item.field_name)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: th })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground line-through truncate max-w-[40%]" title={item.old_value}>
                      {formatValue(item.field_name, item.old_value)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground truncate max-w-[40%]" title={item.new_value}>
                      {formatValue(item.field_name, item.new_value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
