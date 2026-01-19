import { useEffect, useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  MapPin, 
  Package, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { 
  fetchPOHeaders, 
  fetchCustomerMappings, 
  fetchAllCustomerBranchMappings,
  findBranchMapping
} from '@/lib/api/database';
import { supabase } from '@/integrations/supabase/client';

interface MappingStats {
  totalPOs: number;
  mappedCustomers: number;
  unmappedCustomers: number;
  mappedBranches: number;
  unmappedBranches: number;
  mappedProducts: number;
  unmappedProducts: number;
  customerMappings: number;
  branchMappings: number;
}

interface CustomerBreakdown {
  customerName: string;
  totalPOs: number;
  mappedBranches: number;
  unmappedBranches: number;
  isCustomerMapped: boolean;
}

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

const MappingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MappingStats>({
    totalPOs: 0,
    mappedCustomers: 0,
    unmappedCustomers: 0,
    mappedBranches: 0,
    unmappedBranches: 0,
    mappedProducts: 0,
    unmappedProducts: 0,
    customerMappings: 0,
    branchMappings: 0,
  });
  const [customerBreakdown, setCustomerBreakdown] = useState<CustomerBreakdown[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [headers, customerMappings, branchMappings] = await Promise.all([
        fetchPOHeaders(),
        fetchCustomerMappings(),
        fetchAllCustomerBranchMappings(),
      ]);

      // Count products
      const { count: mappedProductsCount } = await supabase
        .from('po_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_mapped', true);

      const { count: unmappedProductsCount } = await supabase
        .from('po_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_mapped', false);

      // Process PO headers with branch mapping status
      const processedHeaders = await Promise.all(
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
            ...h,
            isBranchMapped: !!(branchMappingResult?.branchMapping?.vendor_branch_code),
          };
        })
      );

      // Calculate stats
      const mappedCustomers = processedHeaders.filter(h => h.is_customer_mapped).length;
      const unmappedCustomers = processedHeaders.filter(h => h.customer_name && !h.is_customer_mapped).length;
      const mappedBranches = processedHeaders.filter(h => h.isBranchMapped).length;
      const unmappedBranches = processedHeaders.filter(h => h.branch && !h.isBranchMapped).length;

      setStats({
        totalPOs: processedHeaders.length,
        mappedCustomers,
        unmappedCustomers,
        mappedBranches,
        unmappedBranches,
        mappedProducts: mappedProductsCount || 0,
        unmappedProducts: unmappedProductsCount || 0,
        customerMappings: customerMappings?.length || 0,
        branchMappings: branchMappings?.length || 0,
      });

      // Build customer breakdown
      const customerMap = new Map<string, CustomerBreakdown>();
      processedHeaders.forEach((h: any) => {
        const name = h.customer_name || 'ไม่ระบุ';
        const existing = customerMap.get(name) || {
          customerName: name,
          totalPOs: 0,
          mappedBranches: 0,
          unmappedBranches: 0,
          isCustomerMapped: h.is_customer_mapped || false,
        };
        existing.totalPOs++;
        if (h.isBranchMapped) {
          existing.mappedBranches++;
        } else {
          existing.unmappedBranches++;
        }
        customerMap.set(name, existing);
      });
      
      setCustomerBreakdown(Array.from(customerMap.values()).sort((a, b) => b.totalPOs - a.totalPOs));
    } catch (error) {
      console.error('Error loading mapping dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const customerPieData = useMemo(() => [
    { name: 'Mapped', value: stats.mappedCustomers, color: '#22c55e' },
    { name: 'Unmapped', value: stats.unmappedCustomers, color: '#eab308' },
  ].filter(d => d.value > 0), [stats]);

  const branchPieData = useMemo(() => [
    { name: 'Mapped', value: stats.mappedBranches, color: '#22c55e' },
    { name: 'Unmapped', value: stats.unmappedBranches, color: '#eab308' },
  ].filter(d => d.value > 0), [stats]);

  const productPieData = useMemo(() => [
    { name: 'Mapped', value: stats.mappedProducts, color: '#22c55e' },
    { name: 'Unmapped', value: stats.unmappedProducts, color: '#ef4444' },
  ].filter(d => d.value > 0), [stats]);

  const customerBarData = useMemo(() => 
    customerBreakdown.slice(0, 10).map(c => ({
      name: c.customerName.length > 15 ? c.customerName.substring(0, 15) + '...' : c.customerName,
      fullName: c.customerName,
      mapped: c.mappedBranches,
      unmapped: c.unmappedBranches,
    })), [customerBreakdown]);

  const customerMappingPercent = stats.totalPOs > 0 
    ? Math.round((stats.mappedCustomers / stats.totalPOs) * 100) 
    : 0;
  const branchMappingPercent = stats.totalPOs > 0 
    ? Math.round((stats.mappedBranches / stats.totalPOs) * 100) 
    : 0;
  const productMappingPercent = (stats.mappedProducts + stats.unmappedProducts) > 0 
    ? Math.round((stats.mappedProducts / (stats.mappedProducts + stats.unmappedProducts)) * 100) 
    : 0;

  if (loading) {
    return (
      <MainLayout title="สรุปสถานะ Mapping" subtitle="ภาพรวมการ Mapping ลูกค้า สาขา และสินค้า">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="สรุปสถานะ Mapping" subtitle="ภาพรวมการ Mapping ลูกค้า สาขา และสินค้า">
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">PO ทั้งหมด</p>
                  <p className="text-3xl font-bold">{stats.totalPOs}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mapping ลูกค้า</p>
                  <p className="text-3xl font-bold">{stats.customerMappings}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mapping สาขา</p>
                  <p className="text-3xl font-bold">{stats.branchMappings}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">สินค้า Unmapped</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.unmappedProducts}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Customer Mapping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ความครบถ้วน</span>
                  <span className="font-medium">{customerMappingPercent}%</span>
                </div>
                <Progress value={customerMappingPercent} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="text-green-600">{stats.mappedCustomers} Mapped</span>
                  <span className="text-yellow-600">{stats.unmappedCustomers} Unmapped</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Branch Mapping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ความครบถ้วน</span>
                  <span className="font-medium">{branchMappingPercent}%</span>
                </div>
                <Progress value={branchMappingPercent} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="text-green-600">{stats.mappedBranches} Mapped</span>
                  <span className="text-yellow-600">{stats.unmappedBranches} Unmapped</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4" />
                Product Mapping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ความครบถ้วน</span>
                  <span className="font-medium">{productMappingPercent}%</span>
                </div>
                <Progress value={productMappingPercent} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="text-green-600">{stats.mappedProducts} Mapped</span>
                  <span className="text-red-600">{stats.unmappedProducts} Unmapped</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                สถานะ Customer Mapping
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={customerPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {customerPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  ไม่มีข้อมูล
                </div>
              )}
            </CardContent>
          </Card>

          {/* Branch Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                สถานะ Branch Mapping
              </CardTitle>
            </CardHeader>
            <CardContent>
              {branchPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={branchPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {branchPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  ไม่มีข้อมูล
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" />
                สถานะ Product Mapping
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={productPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {productPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  ไม่มีข้อมูล
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Breakdown Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              สถานะ Branch Mapping แยกตามลูกค้า (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customerBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerBarData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'mapped' ? 'Mapped' : 'Unmapped']}
                    labelFormatter={(label) => customerBarData.find(d => d.name === label)?.fullName || label}
                  />
                  <Legend />
                  <Bar dataKey="mapped" name="Mapped" fill="#22c55e" stackId="a" />
                  <Bar dataKey="unmapped" name="Unmapped" fill="#eab308" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                ไม่มีข้อมูล
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Detail Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">รายละเอียดแยกตามลูกค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">ลูกค้า</th>
                    <th className="text-center py-3 px-4 font-medium">Customer Mapping</th>
                    <th className="text-center py-3 px-4 font-medium">จำนวน PO</th>
                    <th className="text-center py-3 px-4 font-medium">Branch Mapped</th>
                    <th className="text-center py-3 px-4 font-medium">Branch Unmapped</th>
                    <th className="text-center py-3 px-4 font-medium">ความครบถ้วน</th>
                  </tr>
                </thead>
                <tbody>
                  {customerBreakdown.map((customer, index) => {
                    const percent = customer.totalPOs > 0 
                      ? Math.round((customer.mappedBranches / customer.totalPOs) * 100) 
                      : 0;
                    return (
                      <tr key={index} className="border-b hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium">{customer.customerName}</td>
                        <td className="py-3 px-4 text-center">
                          {customer.isCustomerMapped ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Mapped
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Unmapped
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">{customer.totalPOs}</td>
                        <td className="py-3 px-4 text-center text-green-600">{customer.mappedBranches}</td>
                        <td className="py-3 px-4 text-center text-yellow-600">{customer.unmappedBranches}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Progress value={percent} className="h-2 flex-1" />
                            <span className="text-xs font-medium w-10 text-right">{percent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {customerBreakdown.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  ไม่มีข้อมูล
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default MappingDashboard;
