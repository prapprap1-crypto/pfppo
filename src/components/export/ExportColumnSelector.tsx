import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2, Save, Trash2, Star, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExportColumn {
  key: string;
  label: string;
  enabled: boolean;
}

export const DEFAULT_COLUMNS: ExportColumn[] = [
  { key: 'no', label: 'ลำดับ (No.)', enabled: true },
  { key: 'customer_code', label: 'รหัสลูกค้า (Customer Code)', enabled: true },
  { key: 'customer_name', label: 'ชื่อลูกค้า (Customer Name)', enabled: true },
  { key: 'memo', label: 'เลขที่ PO (Memo)', enabled: true },
  { key: 'note', label: 'หมายเหตุ (Note)', enabled: false },
  { key: 'product_code', label: 'รหัสสินค้า (Product Code)', enabled: true },
  { key: 'product_name', label: 'ชื่อสินค้า (Product)', enabled: true },
  { key: 'quantity', label: 'จำนวน (Unit)', enabled: true },
  { key: 'old_price', label: 'ราคาเดิม (Old Price)', enabled: true },
  { key: 'new_price', label: 'ราคาใหม่ (New Price)', enabled: true },
  { key: 'create_date', label: 'วันที่สร้าง (Create Date)', enabled: true },
  { key: 'status', label: 'สถานะ (Status)', enabled: true },
  { key: 'owner', label: 'ผู้รับผิดชอบ (Owner)', enabled: true },
  { key: 'due_date', label: 'วันครบกำหนด (Due Date)', enabled: false },
  { key: 'branch', label: 'สาขา (Branch)', enabled: false },
  { key: 'amount', label: 'มูลค่า (Amount)', enabled: false },
];

interface ExportTemplate {
  id: string;
  name: string;
  columns: ExportColumn[];
  is_default: boolean;
}

interface ExportColumnSelectorProps {
  columns: ExportColumn[];
  onColumnsChange: (columns: ExportColumn[]) => void;
}

export function ExportColumnSelector({ columns, onColumnsChange }: ExportColumnSelectorProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [localColumns, setLocalColumns] = useState<ExportColumn[]>(columns);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('export_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const parsedTemplates = (data || []).map(t => ({
        id: t.id,
        name: t.name,
        columns: t.columns as unknown as ExportColumn[],
        is_default: t.is_default || false,
      }));
      
      setTemplates(parsedTemplates);

      // Load default template if exists
      const defaultTemplate = parsedTemplates.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
        onColumnsChange(defaultTemplate.columns);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleColumnToggle = (key: string, checked: boolean) => {
    const updated = localColumns.map(col => 
      col.key === key ? { ...col, enabled: checked } : col
    );
    setLocalColumns(updated);
  };

  const handleApply = () => {
    onColumnsChange(localColumns);
    setOpen(false);
    toast({
      title: "บันทึกการตั้งค่า",
      description: `เลือก ${localColumns.filter(c => c.enabled).length} คอลัมน์`,
    });
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setLocalColumns(template.columns);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "กรุณาใส่ชื่อ Template",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('export_templates')
        .insert([{
          user_id: user.id,
          name: newTemplateName.trim(),
          columns: JSON.parse(JSON.stringify(localColumns)),
          is_default: templates.length === 0,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "บันทึก Template สำเร็จ",
        description: `สร้าง "${newTemplateName}" เรียบร้อย`,
      });

      setNewTemplateName('');
      setShowSaveDialog(false);
      fetchTemplates();
      if (data) setSelectedTemplateId(data.id);
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึก Template ได้",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      // Unset all defaults first
      await supabase
        .from('export_templates')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Set selected as default
      const { error } = await supabase
        .from('export_templates')
        .update({ is_default: true })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "ตั้งเป็นค่าเริ่มต้นแล้ว",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error setting default:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('export_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "ลบ Template แล้ว",
      });

      if (selectedTemplateId === templateId) {
        setSelectedTemplateId('');
        setLocalColumns(DEFAULT_COLUMNS);
      }

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleResetToDefault = () => {
    setLocalColumns(DEFAULT_COLUMNS);
    setSelectedTemplateId('');
  };

  const enabledCount = localColumns.filter(c => c.enabled).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="w-4 h-4" />
          ตั้งค่าคอลัมน์ ({columns.filter(c => c.enabled).length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            เลือกคอลัมน์ที่ต้องการส่งออก
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selection */}
          <div className="flex items-center gap-2">
            <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="เลือก Template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    <span className="flex items-center gap-2">
                      {template.name}
                      {template.is_default && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleResetToDefault}>
              รีเซ็ต
            </Button>
          </div>

          {/* Template Actions */}
          {selectedTemplateId && (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleSetDefault(selectedTemplateId)}
              >
                <Star className="w-4 h-4 mr-1" />
                ตั้งเป็นค่าเริ่มต้น
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive"
                onClick={() => handleDeleteTemplate(selectedTemplateId)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                ลบ
              </Button>
            </div>
          )}

          {/* Column Selection */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="font-medium">เลือกคอลัมน์</Label>
              <Badge variant="secondary">{enabledCount} คอลัมน์</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {localColumns.map((column) => (
                <div 
                  key={column.key} 
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/50"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                  <Checkbox
                    id={column.key}
                    checked={column.enabled}
                    onCheckedChange={(checked) => handleColumnToggle(column.key, checked as boolean)}
                  />
                  <Label 
                    htmlFor={column.key} 
                    className="text-sm cursor-pointer flex-1"
                  >
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Save New Template */}
          {showSaveDialog ? (
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
              <Input
                placeholder="ชื่อ Template..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleSaveTemplate}>
                บันทึก
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewTemplateName('');
                }}
              >
                ยกเลิก
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => setShowSaveDialog(true)}
            >
              <Save className="w-4 h-4" />
              บันทึกเป็น Template ใหม่
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleApply}>
            ใช้งาน ({enabledCount} คอลัมน์)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
