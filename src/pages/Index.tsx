import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentPOList } from '@/components/dashboard/RecentPOList';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { fetchPOHeaders, fetchDashboardStats } from '@/lib/api/database';
import { FileText, FileCheck, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { POHeader, DashboardStats } from '@/types/po';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [poHeaders, setPOHeaders] = useState<POHeader[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPOs: 0,
    newPOs: 0,
    importedPOs: 0,
    needReviewPOs: 0,
    verifiedPOs: 0,
    exportedPOs: 0,
    errorPOs: 0,
    unmappedProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  const handleUploadComplete = () => {
    loadData();
    // Navigate to PO list after successful upload
    setTimeout(() => {
      navigate('/po-list');
    }, 1500);
  };

  const loadData = async () => {
    try {
      const [headers, dashStats] = await Promise.all([
        fetchPOHeaders(),
        fetchDashboardStats()
      ]);
      
      if (headers && headers.length > 0) {
        // Transform database format to UI format
        setPOHeaders(headers.map((h: any) => ({
          id: h.id,
          poNumber: h.po_number,
          supplierCode: h.supplier_code,
          supplierName: h.supplier_name,
          branch: h.branch,
          documentDate: h.document_date,
          dueDate: h.due_date,
          netTotal: Number(h.net_total),
          vat: Number(h.vat),
          grandTotal: Number(h.grand_total),
          status: h.status,
          sourceFile: h.source_file,
          createdAt: h.created_at,
          updatedAt: h.updated_at,
        })));
      }
      
      if (dashStats) {
        setStats(dashStats as any);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <MainLayout title="แดชบอร์ด" subtitle="ภาพรวมระบบ PO Processing">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="PO ทั้งหมด" 
            value={stats.totalPOs} 
            icon={FileText}
            variant="primary"
          />
          <StatCard 
            title="รอตรวจสอบ" 
            value={stats.needReviewPOs} 
            icon={Clock}
            variant="warning"
          />
          <StatCard 
            title="ตรวจสอบสำเร็จ" 
            value={stats.verifiedPOs} 
            icon={FileCheck}
            variant="success"
          />
          <StatCard 
            title="สินค้าไม่มี Mapping" 
            value={(stats as any).unmappedProducts || 0} 
            icon={AlertTriangle}
            variant="info"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentPOList poList={poHeaders} />
          </div>
          <div className="space-y-6">
            <StatusChart stats={stats} />
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4">นำเข้า PO ใหม่</h3>
              <FileUploadZone maxFiles={20} onUploadComplete={handleUploadComplete} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
