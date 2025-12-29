import { MainLayout } from '@/components/layout/MainLayout';
import { ExportPanel } from '@/components/export/ExportPanel';
import { mockPOHeaders } from '@/data/mockData';

const Export = () => {
  return (
    <MainLayout title="ส่งออก Excel" subtitle="ส่งออกข้อมูล PO เป็นรูปแบบ C303">
      <ExportPanel poList={mockPOHeaders} />
    </MainLayout>
  );
};

export default Export;
