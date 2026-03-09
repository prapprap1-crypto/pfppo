import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  History, 
  FileInput, 
  CheckCircle2, 
  FileSpreadsheet, 
  Trash2, 
  Pencil, 
  RefreshCw,
  Loader2,
  ArrowRight,
  Search,
  Filter,
  Calendar,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { getActionLabel, POAction, POActionDetails } from '@/hooks/usePOActionLog';
import { Link } from 'react-router-dom';

interface ActionLogWithPO {
  id: string;
  action: string;
  details: POActionDetails | null;
  created_at: string;
  po_id: string;
  user_id: string | null;
  po_number?: string;
  customer_name?: string;
  user_name?: string;
  user_email?: string;
}

const ACTION_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'imported', label: 'นำเข้าเอกสาร' },
  { value: 'verified', label: 'ยืนยันความถูกต้อง' },
  { value: 'exported', label: 'ส่งออก Excel' },
  { value: 'deleted', label: 'ลบเอกสาร' },
  { value: 'edited', label: 'แก้ไขข้อมูล' },
  { value: 'mapping_updated', label: 'อัปเดต Mapping' },
];

export default function POHistoryReport() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActionLogWithPO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Fetch action logs with PO headers
      const { data: logsData, error: logsError } = await supabase
        .from('po_action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      // Get unique PO IDs and user IDs
      const poIds = [...new Set((logsData || []).map(log => log.po_id))];
      const userIds = [...new Set((logsData || []).map(log => log.user_id).filter(Boolean))] as string[];

      // Fetch PO headers and profiles in parallel
      const [poResponse, profilesResponse] = await Promise.all([
        supabase
          .from('po_headers')
          .select('id, po_number, customer_name')
          .in('id', poIds),
        userIds.length > 0
          ? supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', userIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (poResponse.error) throw poResponse.error;

      // Create maps for quick lookup
      const poMap = new Map(poResponse.data?.map(po => [po.id, po] as const) || []);
      const profileMap = new Map(
        (profilesResponse.data as { id: string; full_name: string | null; email: string | null }[] | null)?.map(
          p => [p.id, p] as const
        ) || []
      );

      // Merge data
      const mergedLogs: ActionLogWithPO[] = (logsData || []).map(log => {
        const po = poMap.get(log.po_id);
        const profile = log.user_id ? profileMap.get(log.user_id) : null;
        return {
          id: log.id,
          action: log.action,
          details: log.details as POActionDetails | null,
          created_at: log.created_at,
          po_id: log.po_id,
          user_id: log.user_id,
          po_number: po?.po_number,
          customer_name: po?.customer_name,
          user_name: profile?.full_name || undefined,
          user_email: profile?.email || undefined,
        };
      });

      setLogs(mergedLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesPO = log.po_number?.toLowerCase().includes(search);
        const matchesCustomer = log.customer_name?.toLowerCase().includes(search);
        if (!matchesPO && !matchesCustomer) {
          return false;
        }
      }

      // Date range filter
      if (dateRange.start) {
        const logDate = new Date(log.created_at);
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        if (logDate < startDate) return false;
      }

      if (dateRange.end) {
        const logDate = new Date(log.created_at);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (logDate > endDate) return false;
      }

      return true;
    });
  }, [logs, actionFilter, searchTerm, dateRange]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'imported':
        return <FileInput className="w-4 h-4" />;
      case 'verified':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'exported':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4" />;
      case 'edited':
        return <Pencil className="w-4 h-4" />;
      case 'mapping_updated':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'imported':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'verified':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'exported':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'deleted':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'edited':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'mapping_updated':
        return 'bg-cyan-500/10 text-cyan-600 border-cyan-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const renderDetails = (log: ActionLogWithPO) => {
    if (!log.details) return '-';

    const details = log.details;

    if (log.action === 'edited' && details.field_name) {
      return (
        <div className="text-sm">
          <span className="font-medium">{details.field_name}:</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="line-through truncate max-w-[100px]">{details.old_value || '-'}</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
            <span className="font-medium text-foreground truncate max-w-[100px]">{details.new_value}</span>
          </div>
        </div>
      );
    }

    if (log.action === 'exported' && details.file_name) {
      return <span className="text-sm text-muted-foreground">{details.file_name}</span>;
    }

    if (log.action === 'imported' && details.source_file) {
      return <span className="text-sm text-muted-foreground">{details.source_file}</span>;
    }

    if (log.action === 'mapping_updated' && details.mapping_type) {
      const typeLabels: Record<string, string> = {
        customer: 'ลูกค้า',
        branch: 'สาขา',
        product: 'สินค้า',
      };
      return <span className="text-sm text-muted-foreground">{typeLabels[details.mapping_type] || details.mapping_type}</span>;
    }

    if (details.description) {
      return <span className="text-sm text-muted-foreground">{details.description}</span>;
    }

    return '-';
  };

  // Summary stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = logs.filter(log => new Date(log.created_at) >= today);
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: logs.length,
      today: todayLogs.length,
      imported: actionCounts['imported'] || 0,
      verified: actionCounts['verified'] || 0,
      exported: actionCounts['exported'] || 0,
      edited: actionCounts['edited'] || 0,
    };
  }, [logs]);

  return (
    <MainLayout
      title="ประวัติ PO ทั้งหมด"
      subtitle="ดูรายการการดำเนินการของเอกสาร PO ทั้งหมดในระบบ"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">รายการทั้งหมด</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold text-primary">{stats.today}</div>
          <div className="text-sm text-muted-foreground">วันนี้</div>
        </div>
        <div className="p-4 rounded-lg border bg-blue-50">
          <div className="text-2xl font-bold text-blue-600">{stats.imported}</div>
          <div className="text-sm text-blue-600/80">นำเข้า</div>
        </div>
        <div className="p-4 rounded-lg border bg-green-50">
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          <div className="text-sm text-green-600/80">ยืนยัน</div>
        </div>
        <div className="p-4 rounded-lg border bg-purple-50">
          <div className="text-2xl font-bold text-purple-600">{stats.exported}</div>
          <div className="text-sm text-purple-600/80">ส่งออก</div>
        </div>
        <div className="p-4 rounded-lg border bg-amber-50">
          <div className="text-2xl font-bold text-amber-600">{stats.edited}</div>
          <div className="text-sm text-amber-600/80">แก้ไข</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหา PO หรือลูกค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="ประเภท" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="w-[140px]"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="w-[140px]"
          />
        </div>

        <Button variant="outline" onClick={loadLogs}>
          <RefreshCw className="w-4 h-4 mr-2" />
          รีเฟรช
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground mb-4">
        แสดง {filteredLogs.length} จาก {logs.length} รายการ
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">วันที่/เวลา</TableHead>
              <TableHead className="w-[140px]">เลข PO</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead className="w-[160px]">การดำเนินการ</TableHead>
              <TableHead className="w-[150px]">ผู้ดำเนินการ</TableHead>
              <TableHead>รายละเอียด</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">กำลังโหลด...</p>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <History className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-muted-foreground">ไม่พบประวัติการดำเนินการ</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    {log.po_number ? (
                      <Link 
                        to={`/verification/${log.po_id}`}
                        className="flex items-center gap-1.5 text-primary hover:underline font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        {log.po_number}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[200px]">
                    {log.customer_name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`gap-1.5 ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      {getActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.user_name || log.user_email ? (
                      <div className="text-sm">
                        <div className="font-medium truncate max-w-[130px]">
                          {log.user_name || '-'}
                        </div>
                        {log.user_email && (
                          <div className="text-xs text-muted-foreground truncate max-w-[130px]">
                            {log.user_email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {renderDetails(log)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
}
