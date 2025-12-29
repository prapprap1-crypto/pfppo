import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { VerificationView } from '@/components/verification/VerificationView';
import { mockPOHeaders, mockPOItems } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Verification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const po = id ? mockPOHeaders.find(p => p.id === id) : mockPOHeaders[0];
  const items = po ? mockPOItems.filter(i => i.poId === po.id) : mockPOItems;

  if (!po) {
    return (
      <MainLayout title="ไม่พบ PO" subtitle="">
        <div className="text-center py-12">
          <p className="text-muted-foreground">ไม่พบเอกสาร PO ที่ต้องการ</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/po-list')}>
            กลับไปรายการ PO
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="ตรวจสอบเอกสาร" subtitle={po.poNumber}>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/po-list')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับไปรายการ PO
        </Button>
        <VerificationView 
          po={po} 
          items={items.length > 0 ? items : mockPOItems}
          onVerify={() => navigate('/po-list')}
          onReject={() => navigate('/po-list')}
        />
      </div>
    </MainLayout>
  );
};

export default Verification;
