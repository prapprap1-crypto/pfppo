import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SettingsTable } from '@/components/settings/SettingsTable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Salesperson } from '@/types/settings';

const SalespersonSettings = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Salesperson[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salespersons')
        .select('*')
        .order('code', { ascending: true });
      
      if (error) throw error;
      
      setItems(data?.map((s: any) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        active: s.active ?? true,
        createdAt: s.created_at,
      })) || []);
    } catch (error) {
      console.error('Error loading salespersons:', error);
      toast({ title: 'ไม่สามารถโหลดข้อมูลได้', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (item: { code: string; name: string; active: boolean }) => {
    try {
      const { error } = await supabase.from('salespersons').insert({
        code: item.code,
        name: item.name,
        active: item.active,
      });
      
      if (error) throw error;
      toast({ title: 'เพิ่มพนักงานขายสำเร็จ' });
      loadData();
    } catch (error: any) {
      if (error?.code === '23505') {
        toast({ title: 'รหัสนี้มีอยู่แล้ว', variant: 'destructive' });
      } else {
        toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
      }
    }
  };

  const handleEdit = async (id: string, item: { code: string; name: string; active: boolean }) => {
    try {
      const { error } = await supabase
        .from('salespersons')
        .update({ code: item.code, name: item.name, active: item.active })
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: 'แก้ไขพนักงานขายสำเร็จ' });
      loadData();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('salespersons').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'ลบพนักงานขายสำเร็จ' });
      loadData();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  return (
    <MainLayout title="ตั้งค่าพนักงานขาย" subtitle="จัดการรายการพนักงานขายสำหรับใช้กับ Mapping ลูกค้า">
      <SettingsTable 
        items={items}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        codeLabel="รหัสพนักงาน"
        nameLabel="ชื่อพนักงาน"
        addLabel="เพิ่มพนักงานขาย"
        editLabel="แก้ไขพนักงานขาย"
      />
    </MainLayout>
  );
};

export default SalespersonSettings;