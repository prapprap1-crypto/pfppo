import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CustomerMappingTable } from '@/components/mapping/CustomerMappingTable';
import { 
  fetchCustomerMappings, 
  createCustomerMapping, 
  updateCustomerMapping, 
  deleteCustomerMapping,
  fetchAllCustomerBranchMappings,
  createCustomerBranchMapping,
  updateCustomerBranchMapping,
  deleteCustomerBranchMapping,
} from '@/lib/api/database';
import {
  fetchWarehouses,
  fetchVehiclePositions,
  fetchTransportCodes,
} from '@/lib/api/settings';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from '@/hooks/useActivityLog';
import { CustomerMapping, CustomerBranchMapping } from '@/types/po';
import { Warehouse, VehiclePosition, TransportCode } from '@/types/settings';

const CustomerMappingPage = () => {
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const [mappings, setMappings] = useState<CustomerMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);
  const [transportCodes, setTransportCodes] = useState<TransportCode[]>([]);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const [customerData, branchData, warehouseData, positionData, transportData] = await Promise.all([
        fetchCustomerMappings(),
        fetchAllCustomerBranchMappings(),
        fetchWarehouses(),
        fetchVehiclePositions(),
        fetchTransportCodes(),
      ]);
      
      // Set options
      setWarehouses(warehouseData?.filter((w: any) => w.active).map((w: any) => ({
        id: w.id,
        code: w.code,
        name: w.name,
        active: w.active,
        createdAt: w.created_at,
      })) || []);
      
      setVehiclePositions(positionData?.filter((v: any) => v.active).map((v: any) => ({
        id: v.id,
        code: v.code,
        name: v.name,
        active: v.active,
        createdAt: v.created_at,
      })) || []);
      
      setTransportCodes(transportData?.filter((t: any) => t.active).map((t: any) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        active: t.active,
        createdAt: t.created_at,
      })) || []);
      
      if (customerData) {
        // Map branches to their customers
        const branchMap = new Map<string, CustomerBranchMapping[]>();
        (branchData || []).forEach((b: any) => {
          const mapped: CustomerBranchMapping = {
            id: b.id,
            customerMappingId: b.customer_mapping_id,
            branch: b.branch,
            vendorBranchCode: b.vendor_branch_code || '',
            vendorBranchName: b.vendor_branch_name || '',
            active: b.active ?? true,
            createdAt: b.created_at,
          };
          const existing = branchMap.get(b.customer_mapping_id) || [];
          existing.push(mapped);
          branchMap.set(b.customer_mapping_id, existing);
        });

        setMappings(customerData.map((m: any) => ({
          id: m.id,
          customerName: m.customer_name,
          vendorCustomerCode: m.vendor_customer_code,
          vendorCustomerName: m.vendor_customer_name,
          warehouseId: m.warehouse_id,
          warehouseCode: m.warehouses?.code,
          warehouseName: m.warehouses?.name,
          vehiclePositionId: m.vehicle_position_id,
          vehiclePositionCode: m.vehicle_positions?.code,
          vehiclePositionName: m.vehicle_positions?.name,
          vatType: m.vat_type ?? 1,
          transportCodeId: m.transport_code_id,
          transportCode: m.transport_codes?.code,
          transportName: m.transport_codes?.name,
          active: m.active ?? true,
          createdAt: m.created_at,
          branches: branchMap.get(m.id) || [],
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
        warehouse_id: mapping.warehouseId || null,
        vehicle_position_id: mapping.vehiclePositionId || null,
        vat_type: mapping.vatType ?? 1,
        transport_code_id: mapping.transportCodeId || null,
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
        warehouse_id: mapping.warehouseId || null,
        vehicle_position_id: mapping.vehiclePositionId || null,
        vat_type: mapping.vatType,
        transport_code_id: mapping.transportCodeId || null,
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

  // Branch handlers
  const handleAddBranch = async (customerMappingId: string, branch: Partial<CustomerBranchMapping>) => {
    try {
      await createCustomerBranchMapping({
        customer_mapping_id: customerMappingId,
        branch: branch.branch || '',
        vendor_branch_code: branch.vendorBranchCode || '',
        vendor_branch_name: branch.vendorBranchName || '',
        active: branch.active ?? true,
      });
      
      toast({ title: 'เพิ่มสาขาสำเร็จ' });
      loadMappings();
    } catch (error: any) {
      if (error?.code === '23505') {
        toast({ title: 'สาขานี้มีอยู่แล้วสำหรับลูกค้านี้', variant: 'destructive' });
      } else {
        toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
      }
    }
  };

  const handleEditBranch = async (id: string, branch: Partial<CustomerBranchMapping>) => {
    try {
      await updateCustomerBranchMapping(id, {
        branch: branch.branch,
        vendor_branch_code: branch.vendorBranchCode,
        vendor_branch_name: branch.vendorBranchName,
        active: branch.active,
      });
      
      toast({ title: 'แก้ไขสาขาสำเร็จ' });
      loadMappings();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleDeleteBranch = async (id: string) => {
    try {
      await deleteCustomerBranchMapping(id);
      toast({ title: 'ลบสาขาสำเร็จ' });
      loadMappings();
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  return (
    <MainLayout title="Mapping ลูกค้า" subtitle="จับคู่ชื่อลูกค้าและสาขาจาก PO กับรหัส/ชื่อของผู้จำหน่าย">
      <CustomerMappingTable 
        mappings={mappings} 
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddBranch={handleAddBranch}
        onEditBranch={handleEditBranch}
        onDeleteBranch={handleDeleteBranch}
        warehouses={warehouses}
        vehiclePositions={vehiclePositions}
        transportCodes={transportCodes}
      />
    </MainLayout>
  );
};

export default CustomerMappingPage;
