import { useState, useEffect, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { POTable } from '@/components/po/POTable';
import { MappingAlertBanner } from '@/components/po/MappingAlertBanner';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { fetchPOHeadersPaginated, batchFetchBranchMappings } from '@/lib/api/database';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, RefreshCw, Search, Filter, X, Building2, MapPin, Package } from 'lucide-react';
import { DateInput } from '@/components/ui/date-input';
import { POHeader } from '@/types/po';
import { POPagination } from '@/components/po/POPagination';

const POList = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [poHeaders, setPOHeaders] = useState<POHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [unmappedProductsCount, setUnmappedProductsCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerMappingFilter, setCustomerMappingFilter] = useState('all');
  const [branchMappingFilter, setBranchMappingFilter] = useState('all');
  const [productMappingFilter, setProductMappingFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Track all mapped headers before client-side filtering for banner stats
  const [allMappedHeaders, setAllMappedHeaders] = useState<POHeader[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPOHeadersPaginated({
        page: currentPage,
        pageSize,
        search: searchTerm,
        status: statusFilter,
        customerMapped: customerMappingFilter,
        dateFrom,
        dateTo
      });
      
      const headers = result.data;
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
      
      // Get unique user IDs to fetch profiles (batch)
      const userIds = [...new Set(headers.map((h: any) => h.user_id).filter(Boolean))];
      
      // Batch fetch profiles
      let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {} as Record<string, { full_name: string | null; email: string | null }>);
        }
      }
      
      // Batch fetch branch mappings
      const branchMappingsMap = await batchFetchBranchMappings(
        headers.map((h: any) => ({ customer_name: h.customer_name, branch: h.branch }))
      );
      
      const mappedHeaders = headers.map((h: any) => {
        const branchKey = `${h.customer_name}|||${h.branch}`;
        const branchMapping = branchMappingsMap.get(branchKey);
        const uploaderProfile = h.user_id ? profilesMap[h.user_id] : null;
        
        return {
          id: h.id,
          poNumber: h.po_number,
          customerName: h.customer_name,
          vendorCustomerCode: h.vendor_customer_code,
          vendorCustomerName: h.vendor_customer_name,
          isCustomerMapped: h.is_customer_mapped,
          vendorBranchCode: branchMapping?.vendor_branch_code,
          vendorBranchName: branchMapping?.vendor_branch_name,
          isBranchMapped: !!(branchMapping?.vendor_branch_code),
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
          userId: h.user_id,
          uploaderName: uploaderProfile?.full_name || undefined,
          uploaderEmail: uploaderProfile?.email || undefined,
        };
      });

      setAllMappedHeaders(mappedHeaders);

      // Apply client-side filters
      let filteredHeaders = mappedHeaders;
      
      // Branch mapping filter
      if (branchMappingFilter === 'mapped') {
        filteredHeaders = filteredHeaders.filter(h => h.isBranchMapped);
      } else if (branchMappingFilter === 'unmapped') {
        filteredHeaders = filteredHeaders.filter(h => !h.isBranchMapped);
      }

      // Date range filter
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredHeaders = filteredHeaders.filter(h => new Date(h.dueDate) >= fromDate);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filteredHeaders = filteredHeaders.filter(h => new Date(h.dueDate) <= toDate);
      }
      
      setPOHeaders(filteredHeaders);

      // Count unmapped products
      if (currentPage === 1) {
        const { count } = await supabase
          .from('po_items')
          .select('*', { count: 'exact', head: true })
          .eq('is_mapped', false);
        
        setUnmappedProductsCount(count || 0);
      }

      // Product mapping filter: need to check PO-level product mapping status
      if (productMappingFilter !== 'all') {
        const poIds = filteredHeaders.map(h => h.id);
        if (poIds.length > 0) {
          // Fetch unmapped item counts per PO
          const { data: unmappedItems } = await supabase
            .from('po_items')
            .select('po_id, is_mapped')
            .in('po_id', poIds)
            .eq('is_mapped', false);
          
          const posWithUnmappedItems = new Set((unmappedItems || []).map(i => i.po_id));
          
          if (productMappingFilter === 'mapped') {
            filteredHeaders = filteredHeaders.filter(h => !posWithUnmappedItems.has(h.id));
          } else if (productMappingFilter === 'unmapped') {
            filteredHeaders = filteredHeaders.filter(h => posWithUnmappedItems.has(h.id));
          }
          setPOHeaders(filteredHeaders);
        }
      }
    } catch (error) {
      console.error('Error loading PO headers:', error);
      setPOHeaders([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, customerMappingFilter, branchMappingFilter, productMappingFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setStatusFilter('all');
    setCustomerMappingFilter('all');
    setBranchMappingFilter('all');
    setProductMappingFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchInput || searchTerm || statusFilter !== 'all' || customerMappingFilter !== 'all' || branchMappingFilter !== 'all' || productMappingFilter !== 'all' || dateFrom || dateTo;

  // Calculate mapping stats with PO detail info
  const mappingStats = useMemo(() => ({
    totalPOs: totalItems,
    unmappedCustomer: allMappedHeaders.filter(p => p.customerName && !p.isCustomerMapped).length,
    unmappedBranch: allMappedHeaders.filter(p => p.branch && !p.isBranchMapped).length,
    unmappedProducts: unmappedProductsCount,
    unmappedCustomerPOs: allMappedHeaders
      .filter(p => p.customerName && !p.isCustomerMapped)
      .map(p => ({ id: p.id, poNumber: p.poNumber, customerName: p.customerName, branch: p.branch })),
    unmappedBranchPOs: allMappedHeaders
      .filter(p => p.branch && !p.isBranchMapped)
      .map(p => ({ id: p.id, poNumber: p.poNumber, customerName: p.customerName, branch: p.branch })),
  }), [allMappedHeaders, unmappedProductsCount, totalItems]);




  return (
    <MainLayout title="รายการ PO" subtitle="จัดการใบสั่งซื้อทั้งหมด">
      <div className="space-y-6">
        <MappingAlertBanner stats={mappingStats} />
        
        {/* Row 1: Search + Status + Customer + Branch filters */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาเลข PO, ลูกค้า, สาขา..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 pr-9"
            />
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title="ล้างการค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="ทุกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="NEED_REVIEW">รอตรวจสอบ</SelectItem>
                <SelectItem value="VERIFIED">ตรวจสอบสำเร็จ</SelectItem>
                <SelectItem value="EXPORTED">นำออกแล้ว</SelectItem>
                <SelectItem value="NEW">พบไฟล์ใหม่</SelectItem>
                <SelectItem value="ERROR">มีข้อผิดพลาด</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <Select value={customerMappingFilter} onValueChange={(val) => { setCustomerMappingFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="ลูกค้า: ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ลูกค้า: ทั้งหมด</SelectItem>
                <SelectItem value="mapped">ลูกค้า: Mapped</SelectItem>
                <SelectItem value="unmapped">ลูกค้า: ยังไม่ Mapped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <Select value={branchMappingFilter} onValueChange={(val) => { setBranchMappingFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="สาขา: ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">สาขา: ทั้งหมด</SelectItem>
                <SelectItem value="mapped">สาขา: Mapped</SelectItem>
                <SelectItem value="unmapped">สาขา: ยังไม่ Mapped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-muted-foreground text-sm">ทั้งหมด {totalItems} รายการ</p>
        </div>

        {/* Row 2: Date range + Product mapping + Actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">วันครบกำหนด:</span>
            <DateInput
              value={dateFrom}
              onChange={(val) => { setDateFrom(val); setCurrentPage(1); }}
              placeholder="เริ่มต้น"
              className="w-40"
            />
            <span className="text-muted-foreground">-</span>
            <DateInput
              value={dateTo}
              onChange={(val) => { setDateTo(val); setCurrentPage(1); }}
              placeholder="สิ้นสุด"
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <Select value={productMappingFilter} onValueChange={(val) => { setProductMappingFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="สินค้า: ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">สินค้า: ทั้งหมด</SelectItem>
                <SelectItem value="mapped">สินค้า: Mapped ครบ</SelectItem>
                <SelectItem value="unmapped">สินค้า: ยังไม่ Mapped</SelectItem>
              </SelectContent>
            </Select>
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
            <FileUploadZone maxFiles={20} onUploadComplete={loadData} />
          </div>
        )}

        <div className="bg-card rounded-xl border">
          <POTable poList={poHeaders} onRefresh={loadData} />
          <POPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default POList;
