import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Calendar, Package, Eye, Download, RefreshCw, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { generateC303Excel } from '@/lib/utils/excel';
import { useToast } from '@/hooks/use-toast';

interface ExportHistoryRecord {
  id: string;
  user_id: string | null;
  exported_pos: string[];
  exported_at: string;
  file_name: string;
}

interface PODetail {
  id: string;
  po_number: string;
  supplier_name: string;
  supplier_code: string;
  branch: string;
  grand_total: number | null;
  document_date: string;
  due_date: string;
}

interface POItem {
  id: string;
  po_id: string;
  vendor_product_code: string | null;
  vendor_description: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  amount: number;
}

const ExportHistory = () => {
  const { toast } = useToast();
  const [history, setHistory] = useState<ExportHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExport, setSelectedExport] = useState<ExportHistoryRecord | null>(null);
  const [poDetails, setPODetails] = useState<PODetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [redownloading, setRedownloading] = useState<string | null>(null);
  
  // Filter states
  const [searchFileName, setSearchFileName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('export_history')
        .select('*')
        .order('exported_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching export history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPODetails = async (poIds: string[]) => {
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from('po_headers')
        .select('id, po_number, supplier_name, supplier_code, branch, grand_total, document_date, due_date')
        .in('id', poIds);

      if (error) throw error;
      setPODetails(data || []);
    } catch (error) {
      console.error('Error fetching PO details:', error);
      setPODetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = (record: ExportHistoryRecord) => {
    setSelectedExport(record);
    fetchPODetails(record.exported_pos);
  };

  const handleRedownload = async (record: ExportHistoryRecord) => {
    setRedownloading(record.id);
    try {
      // Fetch PO headers for the exported POs
      const { data: poHeaders, error: poError } = await supabase
        .from('po_headers')
        .select('id, po_number, supplier_code, branch, due_date')
        .in('id', record.exported_pos);

      if (poError) throw poError;
      if (!poHeaders || poHeaders.length === 0) {
        toast({
          title: "ไม่พบข้อมูล",
          description: "ไม่พบข้อมูล PO ที่ส่งออก",
          variant: "destructive",
        });
        return;
      }

      // Fetch all items for these POs
      const { data: poItems, error: itemsError } = await supabase
        .from('po_items')
        .select('*')
        .in('po_id', record.exported_pos);

      if (itemsError) throw itemsError;

      // Build export items
      const allItems: Array<{
        po_number: string;
        due_date: string;
        branch: string;
        supplier_code: string;
        vendor_product_code: string;
        vendor_description: string;
        quantity: number;
        unit: string;
        unit_price: number;
        amount: number;
      }> = [];

      for (const po of poHeaders) {
        const items = (poItems || []).filter(item => item.po_id === po.id);
        for (const item of items) {
          allItems.push({
            po_number: po.po_number,
            due_date: po.due_date,
            branch: po.branch,
            supplier_code: po.supplier_code,
            vendor_product_code: item.vendor_product_code || '',
            vendor_description: item.vendor_description || '',
            quantity: item.quantity,
            unit: item.unit || 'ลัง',
            unit_price: item.unit_price,
            amount: item.amount,
          });
        }
      }

      // Generate Excel
      generateC303Excel(allItems, record.file_name);

      toast({
        title: "ดาวน์โหลดสำเร็จ",
        description: `ดาวน์โหลดไฟล์ ${record.file_name}`,
      });
    } catch (error) {
      console.error('Error re-downloading:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดาวน์โหลดไฟล์ได้",
        variant: "destructive",
      });
    } finally {
      setRedownloading(null);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  // Filter history based on search criteria
  const filteredHistory = history.filter(record => {
    const matchesFileName = !searchFileName || 
      record.file_name.toLowerCase().includes(searchFileName.toLowerCase());
    
    const exportDate = new Date(record.exported_at);
    const matchesDateFrom = !dateFrom || exportDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || exportDate <= new Date(dateTo + 'T23:59:59');
    
    return matchesFileName && matchesDateFrom && matchesDateTo;
  });

  const clearFilters = () => {
    setSearchFileName('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchFileName || dateFrom || dateTo;

  const totalExportedAmount = poDetails.reduce((sum, po) => sum + (po.grand_total || 0), 0);

  return (
    <MainLayout 
      title="ประวัติการส่งออก" 
      subtitle="รายการไฟล์ที่ส่งออกพร้อมรายละเอียด PO"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{history.length}</p>
                  <p className="text-sm text-muted-foreground">การส่งออกทั้งหมด</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {history.reduce((sum, h) => sum + h.exported_pos.length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">PO ที่ส่งออกแล้ว</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {history.length > 0 
                      ? format(new Date(history[0].exported_at), 'd MMM', { locale: th })
                      : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">ส่งออกล่าสุด</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">ค้นหาและกรอง</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                  <X className="w-4 h-4 mr-1" />
                  ล้างตัวกรอง
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  ชื่อไฟล์
                </Label>
                <Input 
                  placeholder="ค้นหาชื่อไฟล์..."
                  value={searchFileName}
                  onChange={(e) => setSearchFileName(e.target.value)}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  วันที่เริ่มต้น
                </Label>
                <Input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  วันที่สิ้นสุด
                </Label>
                <Input 
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export History List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                รายการส่งออก
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {filteredHistory.length} / {history.length} รายการ
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Download className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{history.length === 0 ? 'ยังไม่มีประวัติการส่งออก' : 'ไม่พบรายการที่ค้นหา'}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่ส่งออก</TableHead>
                    <TableHead>ชื่อไฟล์</TableHead>
                    <TableHead className="text-center">จำนวน PO</TableHead>
                    <TableHead className="text-right">ดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(record.exported_at), 'd MMM yyyy HH:mm', { locale: th })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{record.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {record.exported_pos.length} รายการ
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRedownload(record)}
                            disabled={redownloading === record.id}
                          >
                            {redownloading === record.id ? (
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-1" />
                            )}
                            ดาวน์โหลด
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetails(record)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                ดูรายละเอียด
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FileText className="w-5 h-5" />
                                  รายละเอียดการส่งออก: {selectedExport?.file_name}
                                </DialogTitle>
                              </DialogHeader>
                              
                              {loadingDetails ? (
                                <div className="flex items-center justify-center py-8">
                                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                    <div>
                                      <p className="text-sm text-muted-foreground">วันที่ส่งออก</p>
                                      <p className="font-medium">
                                        {selectedExport && format(new Date(selectedExport.exported_at), 'd MMMM yyyy HH:mm น.', { locale: th })}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">มูลค่ารวม</p>
                                      <p className="font-medium text-primary">
                                        {formatCurrency(totalExportedAmount)}
                                      </p>
                                    </div>
                                  </div>

                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>เลขที่ PO</TableHead>
                                        <TableHead>ลูกค้า</TableHead>
                                        <TableHead>สาขา</TableHead>
                                        <TableHead>วันที่เอกสาร</TableHead>
                                        <TableHead className="text-right">มูลค่า</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {poDetails.map((po) => (
                                        <TableRow key={po.id}>
                                          <TableCell className="font-medium">{po.po_number}</TableCell>
                                          <TableCell>{po.supplier_name}</TableCell>
                                          <TableCell>{po.branch}</TableCell>
                                          <TableCell>
                                            {format(new Date(po.document_date), 'd MMM yy', { locale: th })}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {formatCurrency(po.grand_total)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>

                                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                                    <span className="font-medium">รวมทั้งหมด ({poDetails.length} รายการ)</span>
                                    <span className="text-lg font-bold text-primary">
                                      {formatCurrency(totalExportedAmount)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ExportHistory;
