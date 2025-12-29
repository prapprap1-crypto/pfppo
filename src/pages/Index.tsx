import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentPOList } from '@/components/dashboard/RecentPOList';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { mockPOHeaders, mockDashboardStats } from '@/data/mockData';
import { FileText, FileCheck, Download, AlertTriangle, Layers, Clock } from 'lucide-react';

const Index = () => {
  return (
    <MainLayout title="แดชบอร์ด" subtitle="ภาพรวมระบบ PO Processing">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="PO ทั้งหมด" 
            value={mockDashboardStats.totalPOs} 
            icon={FileText}
            variant="primary"
          />
          <StatCard 
            title="รอตรวจสอบ" 
            value={mockDashboardStats.needReviewPOs} 
            icon={Clock}
            variant="warning"
          />
          <StatCard 
            title="ตรวจสอบสำเร็จ" 
            value={mockDashboardStats.verifiedPOs} 
            icon={FileCheck}
            variant="success"
          />
          <StatCard 
            title="สินค้าไม่มี Mapping" 
            value={mockDashboardStats.unmappedProducts} 
            icon={AlertTriangle}
            variant="info"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentPOList poList={mockPOHeaders} />
          </div>
          <div className="space-y-6">
            <StatusChart stats={mockDashboardStats} />
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4">นำเข้า PO ใหม่</h3>
              <FileUploadZone maxFiles={5} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
