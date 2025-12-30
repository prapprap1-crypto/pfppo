import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MappingTable } from '@/components/mapping/MappingTable';
import { mockProductMappings } from '@/data/mockData';
import { fetchProductMappings, createProductMapping, updateProductMapping, deleteProductMapping } from '@/lib/api/database';
import { useToast } from '@/hooks/use-toast';
import { ProductMapping } from '@/types/po';

const Mapping = () => {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<ProductMapping[]>(mockProductMappings);
  const [loading, setLoading] = useState(true);

  const loadMappings = async () => {
    try {
      const data = await fetchProductMappings();
      if (data && data.length > 0) {
        setMappings(data.map((m: any) => ({
          id: m.id,
          customerCode: m.customer_code,
          customerDesc: m.customer_desc,
          vendorCode: m.vendor_code,
          vendorDesc: m.vendor_desc,
          unit: m.unit,
          active: m.active,
          createdAt: m.created_at,
        })));
      }
    } catch (error) {
      console.log('Using mock data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const handleAdd = async (mapping: Partial<ProductMapping>) => {
    try {
      await createProductMapping({
        customer_code: mapping.customerCode || '',
        customer_desc: mapping.customerDesc || '',
        vendor_code: mapping.vendorCode || '',
        vendor_desc: mapping.vendorDesc || '',
        unit: mapping.unit || 'ลัง',
        active: mapping.active ?? true,
      });
      toast({ title: 'เพิ่ม Mapping สำเร็จ' });
      loadMappings();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleEdit = async (id: string, mapping: Partial<ProductMapping>) => {
    try {
      await updateProductMapping(id, {
        customer_code: mapping.customerCode,
        customer_desc: mapping.customerDesc,
        vendor_code: mapping.vendorCode,
        vendor_desc: mapping.vendorDesc,
        unit: mapping.unit,
        active: mapping.active,
      });
      toast({ title: 'แก้ไข Mapping สำเร็จ' });
      loadMappings();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProductMapping(id);
      toast({ title: 'ลบ Mapping สำเร็จ' });
      loadMappings();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  return (
    <MainLayout title="Mapping สินค้า" subtitle="จับคู่รหัสสินค้าลูกค้ากับรหัสผู้ขาย">
      <MappingTable 
        mappings={mappings} 
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </MainLayout>
  );
};

export default Mapping;
