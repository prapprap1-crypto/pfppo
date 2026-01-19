import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { POTable } from '@/components/po/POTable';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { fetchPOHeaders, findBranchMapping } from '@/lib/api/database';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw } from 'lucide-react';
import { POHeader } from '@/types/po';

const POList = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [poHeaders, setPOHeaders] = useState<POHeader[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = await fetchPOHeaders();
      
      // Map headers with branch mapping data
      const mappedHeaders = await Promise.all(
        (headers || []).map(async (h: any) => {
          let branchMappingResult = null;
          if (h.customer_name && h.branch) {
            try {
              branchMappingResult = await findBranchMapping(h.customer_name, h.branch);
            } catch (err) {
              console.error('Error finding branch mapping:', err);
            }
          }
          
          return {
            id: h.id,
            poNumber: h.po_number,
            customerName: h.customer_name,
            vendorCustomerCode: h.vendor_customer_code,
            vendorCustomerName: h.vendor_customer_name,
            isCustomerMapped: h.is_customer_mapped,
            vendorBranchCode: branchMappingResult?.branchMapping?.vendor_branch_code || undefined,
            vendorBranchName: branchMappingResult?.branchMapping?.vendor_branch_name || undefined,
            isBranchMapped: !!(branchMappingResult?.branchMapping?.vendor_branch_code),
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
          };
        })
      );
      
      setPOHeaders(mappedHeaders);
    } catch (error) {
      console.error('Error loading PO headers:', error);
      setPOHeaders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <MainLayout title="รายการ PO" subtitle="จัดการใบสั่งซื้อทั้งหมด">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">ทั้งหมด {poHeaders.length} รายการ</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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

        <POTable poList={poHeaders} onRefresh={loadData} />
      </div>
    </MainLayout>
  );
};

export default POList;
