import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SettingsTable } from '@/components/settings/SettingsTable';
import { 
  fetchWarehouses, 
  createWarehouse, 
  updateWarehouse, 
  deleteWarehouse 
} from '@/lib/api/settings';
import { useToast } from '@/hooks/use-toast';
import { Warehouse } from '@/types/settings';

const WarehouseSettings = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchWarehouses();
      setItems(data?.map((w: any) => ({
        id: w.id,
        code: w.code,
        name: w.name,
        active: w.active ?? true,
        createdAt: w.created_at,
      })) || []);
    } catch (error) {
      console.error('Error loading warehouses:', error);
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
      await createWarehouse(item);
      toast({ title: 'เพิ่มคลังสินค้าสำเร็จ' });
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
      await updateWarehouse(id, item);
      toast({ title: 'แก้ไขคลังสินค้าสำเร็จ' });
      loadData();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWarehouse(id);
      toast({ title: 'ลบคลังสินค้าสำเร็จ' });
      loadData();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  return (
    <MainLayout title="ตั้งค่าคลังสินค้า" subtitle="จัดการรายการคลังสินค้าสำหรับใช้กับ Mapping ลูกค้า">
      <SettingsTable 
        items={items}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        codeLabel="รหัสคลัง"
        nameLabel="ชื่อคลังสินค้า"
        addLabel="เพิ่มคลังสินค้า"
        editLabel="แก้ไขคลังสินค้า"
      />
    </MainLayout>
  );
};

export default WarehouseSettings;
