import { MainLayout } from '@/components/layout/MainLayout';
import { MappingTable } from '@/components/mapping/MappingTable';
import { mockProductMappings } from '@/data/mockData';

const Mapping = () => {
  return (
    <MainLayout title="Mapping สินค้า" subtitle="จับคู่รหัสสินค้าลูกค้ากับรหัสผู้ขาย">
      <MappingTable mappings={mockProductMappings} />
    </MainLayout>
  );
};

export default Mapping;
