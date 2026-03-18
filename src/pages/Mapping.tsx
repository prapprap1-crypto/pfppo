import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MappingTable } from '@/components/mapping/MappingTable';
import { fetchProductMappings, createProductMapping, updateProductMapping, deleteProductMapping } from '@/lib/api/database';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from '@/hooks/useActivityLog';
import { ProductMapping } from '@/types/po';

const Mapping = () => {
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const data = await fetchProductMappings();
      if (data) {
        setMappings(data.map((m: any) => ({
          id: m.id,
          customerCode: m.customer_code,
          customerDesc: m.customer_desc,
          vendorCode: m.vendor_code,
          vendorDesc: m.vendor_desc,
          unit: m.unit || 'ลัง',
          unitPrice: m.unit_price != null ? Number(m.unit_price) : null,
          active: m.active ?? true,
          createdAt: m.created_at,
        })));
      }
    } catch (error) {
      console.error('Error loading mappings:', error);
      toast({ title: 'ไม่สามารถโหลดข้อมูลได้', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const handleAdd = async (mapping: Partial<ProductMapping>) => {
    try {
      const result = await createProductMapping({
        customer_code: mapping.customerCode || '',
        customer_desc: mapping.customerDesc || '',
        vendor_code: mapping.vendorCode || '',
        vendor_desc: mapping.vendorDesc || '',
        unit: mapping.unit || 'ลัง',
        unit_price: mapping.unitPrice != null ? Number(mapping.unitPrice) : null,
        active: mapping.active ?? true,
      });
      
      await logActivity({
        action: 'mapping_created',
        entity_type: 'mapping',
        entity_id: result?.id,
        details: { customer_code: mapping.customerCode, vendor_code: mapping.vendorCode }
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
        unit_price: mapping.unitPrice != null ? Number(mapping.unitPrice) : null,
        active: mapping.active,
      });
      
      await logActivity({
        action: 'mapping_updated',
        entity_type: 'mapping',
        entity_id: id,
        details: { customer_code: mapping.customerCode, vendor_code: mapping.vendorCode }
      });
      
      toast({ title: 'แก้ไข Mapping สำเร็จ' });
      loadMappings();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const mappingToDelete = mappings.find(m => m.id === id);
      await deleteProductMapping(id);
      
      await logActivity({
        action: 'mapping_deleted',
        entity_type: 'mapping',
        entity_id: id,
        details: { customer_code: mappingToDelete?.customerCode }
      });
      
      toast({ title: 'ลบ Mapping สำเร็จ' });
      loadMappings();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleBulkImport = async (importMappings: Partial<ProductMapping>[]) => {
    try {
      for (const mapping of importMappings) {
        await createProductMapping({
          customer_code: mapping.customerCode || '',
          customer_desc: mapping.customerDesc || '',
          vendor_code: mapping.vendorCode || '',
          vendor_desc: mapping.vendorDesc || '',
          unit: mapping.unit || 'ลัง',
          active: mapping.active ?? true,
        });
      }
      
      await logActivity({
        action: 'mapping_created',
        entity_type: 'mapping',
        details: { imported_count: importMappings.length }
      });
      
      loadMappings();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาดในการนำเข้า', variant: 'destructive' });
      throw error;
    }
  };

  return (
    <MainLayout title="Mapping สินค้า" subtitle="จับคู่รหัสสินค้าลูกค้ากับรหัสผู้ขาย">
      <MappingTable 
        mappings={mappings} 
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkImport={handleBulkImport}
      />
    </MainLayout>
  );
};

export default Mapping;
