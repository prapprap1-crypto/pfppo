import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CustomerMappingTable } from '@/components/mapping/CustomerMappingTable';
import { fetchCustomerMappings, createCustomerMapping, updateCustomerMapping, deleteCustomerMapping } from '@/lib/api/database';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from '@/hooks/useActivityLog';
import { CustomerMapping } from '@/types/po';

const CustomerMappingPage = () => {
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const [mappings, setMappings] = useState<CustomerMapping[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomerMappings();
      if (data) {
        setMappings(data.map((m: any) => ({
          id: m.id,
          customerName: m.customer_name,
          vendorCustomerCode: m.vendor_customer_code,
          vendorCustomerName: m.vendor_customer_name,
          active: m.active ?? true,
          createdAt: m.created_at,
        })));
      }
    } catch (error) {
      console.error('Error loading customer mappings:', error);
      toast({ title: 'ไม่สามารถโหลดข้อมูลได้', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const handleAdd = async (mapping: Partial<CustomerMapping>) => {
    try {
      const result = await createCustomerMapping({
        customer_name: mapping.customerName || '',
        vendor_customer_code: mapping.vendorCustomerCode || '',
        vendor_customer_name: mapping.vendorCustomerName || '',
        active: mapping.active ?? true,
      });
      
      await logActivity({
        action: 'customer_mapping_created',
        entity_type: 'customer_mapping',
        entity_id: result?.id,
        details: { customer_name: mapping.customerName }
      });
      
      toast({ title: 'เพิ่ม Mapping ลูกค้าสำเร็จ' });
      loadMappings();
    } catch (error: any) {
      if (error?.code === '23505') {
        toast({ title: 'ชื่อลูกค้านี้มีอยู่แล้ว', variant: 'destructive' });
      } else {
        toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
      }
    }
  };

  const handleEdit = async (id: string, mapping: Partial<CustomerMapping>) => {
    try {
      await updateCustomerMapping(id, {
        customer_name: mapping.customerName,
        vendor_customer_code: mapping.vendorCustomerCode,
        vendor_customer_name: mapping.vendorCustomerName,
        active: mapping.active,
      });
      
      await logActivity({
        action: 'customer_mapping_updated',
        entity_type: 'customer_mapping',
        entity_id: id,
        details: { customer_name: mapping.customerName }
      });
      
      toast({ title: 'แก้ไข Mapping ลูกค้าสำเร็จ' });
      loadMappings();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const mappingToDelete = mappings.find(m => m.id === id);
      await deleteCustomerMapping(id);
      
      await logActivity({
        action: 'customer_mapping_deleted',
        entity_type: 'customer_mapping',
        entity_id: id,
        details: { customer_name: mappingToDelete?.customerName }
      });
      
      toast({ title: 'ลบ Mapping ลูกค้าสำเร็จ' });
      loadMappings();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  return (
    <MainLayout title="Mapping ลูกค้า" subtitle="จับคู่ชื่อลูกค้าจาก PO กับรหัส/ชื่อลูกค้าของผู้จำหน่าย">
      <CustomerMappingTable 
        mappings={mappings} 
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </MainLayout>
  );
};

export default CustomerMappingPage;
