import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SettingsTable } from '@/components/settings/SettingsTable';
import { 
  fetchTransportCodes, 
  createTransportCode, 
  updateTransportCode, 
  deleteTransportCode 
} from '@/lib/api/settings';
import { useToast } from '@/hooks/use-toast';
import { TransportCode } from '@/types/settings';

const TransportCodeSettings = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<TransportCode[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTransportCodes();
      setItems(data?.map((t: any) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        active: t.active ?? true,
        createdAt: t.created_at,
      })) || []);
    } catch (error) {
      console.error('Error loading transport codes:', error);
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
      await createTransportCode(item);
      toast({ title: 'เพิ่มรหัสขนส่งสำเร็จ' });
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
      await updateTransportCode(id, item);
      toast({ title: 'แก้ไขรหัสขนส่งสำเร็จ' });
      loadData();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransportCode(id);
      toast({ title: 'ลบรหัสขนส่งสำเร็จ' });
      loadData();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  return (
    <MainLayout title="ตั้งค่ารหัสขนส่ง" subtitle="จัดการรายการรหัสและชื่อขนส่งสำหรับใช้กับ Mapping ลูกค้า">
      <SettingsTable 
        items={items}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        codeLabel="รหัสขนส่ง"
        nameLabel="ชื่อขนส่ง"
        addLabel="เพิ่มรหัสขนส่ง"
        editLabel="แก้ไขรหัสขนส่ง"
      />
    </MainLayout>
  );
};

export default TransportCodeSettings;
