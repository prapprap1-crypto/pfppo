import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SettingsTable } from '@/components/settings/SettingsTable';
import { 
  fetchVehiclePositions, 
  createVehiclePosition, 
  updateVehiclePosition, 
  deleteVehiclePosition 
} from '@/lib/api/settings';
import { useToast } from '@/hooks/use-toast';
import { VehiclePosition } from '@/types/settings';

const VehiclePositionSettings = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<VehiclePosition[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchVehiclePositions();
      setItems(data?.map((v: any) => ({
        id: v.id,
        code: v.code,
        name: v.name,
        active: v.active ?? true,
        createdAt: v.created_at,
      })) || []);
    } catch (error) {
      console.error('Error loading vehicle positions:', error);
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
      await createVehiclePosition(item);
      toast({ title: 'เพิ่มตำแหน่งจัดรถสำเร็จ' });
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
      await updateVehiclePosition(id, item);
      toast({ title: 'แก้ไขตำแหน่งจัดรถสำเร็จ' });
      loadData();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVehiclePosition(id);
      toast({ title: 'ลบตำแหน่งจัดรถสำเร็จ' });
      loadData();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  return (
    <MainLayout title="ตั้งค่าตำแหน่งจัดรถ" subtitle="จัดการรายการตำแหน่งจัดรถสำหรับใช้กับ Mapping ลูกค้า">
      <SettingsTable 
        items={items}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        codeLabel="รหัสตำแหน่ง"
        nameLabel="ชื่อตำแหน่ง"
        addLabel="เพิ่มตำแหน่ง"
        editLabel="แก้ไขตำแหน่ง"
      />
    </MainLayout>
  );
};

export default VehiclePositionSettings;
