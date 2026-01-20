import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ExportPanel } from '@/components/export/ExportPanel';
import { mockPOHeaders } from '@/data/mockData';
import { fetchPOHeaders } from '@/lib/api/database';
import { POHeader } from '@/types/po';

const Export = () => {
  const [poList, setPOList] = useState<POHeader[]>(mockPOHeaders);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const headers = await fetchPOHeaders();
        if (headers && headers.length > 0) {
          setPOList(headers.map((h: any) => ({
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
            // Customer mapping fields
            customerName: h.customer_name,
            vendorCustomerCode: h.vendor_customer_code,
            vendorCustomerName: h.vendor_customer_name,
            isCustomerMapped: h.is_customer_mapped,
            vendorBranchCode: h.vendor_branch_code,
            vendorBranchName: h.vendor_branch_name,
          })));
        }
      } catch (error) {
        console.log('Using mock data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <MainLayout title="ส่งออก Excel" subtitle="ส่งออกข้อมูล PO เป็นรูปแบบ C303">
      <ExportPanel poList={poList} />
    </MainLayout>
  );
};

export default Export;
