import { MainLayout } from '@/components/layout/MainLayout';
import { POTable } from '@/components/po/POTable';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { mockPOHeaders } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const POList = () => {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <MainLayout title="รายการ PO" subtitle="จัดการใบสั่งซื้อทั้งหมด">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">ทั้งหมด {mockPOHeaders.length} รายการ</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              รีเฟรช
            </Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={() => setShowUpload(!showUpload)}>
              <Upload className="w-4 h-4 mr-2" />
              นำเข้า PO
            </Button>
          </div>
        </div>

        {showUpload && (
          <div className="bg-card rounded-xl border p-6 animate-slide-up">
            <h3 className="font-semibold mb-4">อัปโหลดไฟล์ PO (PDF)</h3>
            <FileUploadZone maxFiles={10} />
          </div>
        )}

        <POTable poList={mockPOHeaders} />
      </div>
    </MainLayout>
  );
};

export default POList;
