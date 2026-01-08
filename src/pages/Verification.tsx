import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { VerificationView } from '@/components/verification/VerificationView';
import { fetchPOHeaderById, fetchPOItems } from '@/lib/api/database';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { POHeader, POItem } from '@/types/po';

const Verification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState<POHeader | null>(null);
  const [items, setItems] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('ไม่พบรหัส PO');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch PO header
        const poData = await fetchPOHeaderById(id);
        if (!poData) {
          setError('ไม่พบเอกสาร PO ที่ต้องการ');
          setLoading(false);
          return;
        }

        // Map to POHeader type
        const mappedPO: POHeader = {
          id: poData.id,
          poNumber: poData.po_number,
          supplierCode: poData.supplier_code,
          supplierName: poData.supplier_name,
          branch: poData.branch,
          documentDate: poData.document_date,
          dueDate: poData.due_date,
          netTotal: Number(poData.net_total),
          vat: Number(poData.vat),
          grandTotal: Number(poData.grand_total),
          status: poData.status as POHeader['status'],
          sourceFile: poData.source_file || undefined,
          createdAt: poData.created_at,
          updatedAt: poData.updated_at,
        };
        setPo(mappedPO);

        // Fetch PO items
        const itemsData = await fetchPOItems(id);
        const mappedItems: POItem[] = (itemsData || []).map((item: any) => ({
          id: item.id,
          poId: item.po_id,
          customerProductCode: item.customer_product_code,
          customerDescription: item.customer_description || '',
          vendorProductCode: item.vendor_product_code || '',
          vendorDescription: item.vendor_description || '',
          quantity: Number(item.quantity),
          unit: item.unit || 'ลัง',
          unitPrice: Number(item.unit_price),
          amount: Number(item.amount),
          deliveryDate: item.delivery_date || '',
          isMapped: item.is_mapped || false,
        }));
        setItems(mappedItems);

      } catch (err) {
        console.error('Error loading PO:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <MainLayout title="ตรวจสอบเอกสาร" subtitle="">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
        </div>
      </MainLayout>
    );
  }

  if (error || !po) {
    return (
      <MainLayout title="ไม่พบ PO" subtitle="">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error || 'ไม่พบเอกสาร PO ที่ต้องการ'}</p>
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
          items={items}
          onVerify={() => navigate('/po-list')}
          onReject={() => navigate('/po-list')}
        />
      </div>
    </MainLayout>
  );
};

export default Verification;
