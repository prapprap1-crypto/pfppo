import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { getActionLabel, ActivityAction } from '@/hooks/useActivityLog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Activity, 
  LogIn, 
  LogOut, 
  Key, 
  User, 
  FileText, 
  Upload, 
  Trash2,
  Shield,
  CalendarIcon,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

const actionTypes: { value: ActivityAction | 'all'; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'login', label: 'เข้าสู่ระบบ' },
  { value: 'logout', label: 'ออกจากระบบ' },
  { value: 'password_changed', label: 'เปลี่ยนรหัสผ่าน' },
  { value: 'profile_updated', label: 'อัปเดตโปรไฟล์' },
  { value: 'avatar_uploaded', label: 'อัปโหลดรูปโปรไฟล์' },
  { value: 'po_created', label: 'สร้าง PO' },
  { value: 'po_updated', label: 'อัปเดต PO' },
  { value: 'po_deleted', label: 'ลบ PO' },
  { value: 'po_exported', label: 'ส่งออก PO' },
  { value: 'mapping_created', label: 'สร้าง Mapping' },
  { value: 'mapping_updated', label: 'อัปเดต Mapping' },
  { value: 'mapping_deleted', label: 'ลบ Mapping' },
  { value: 'role_changed', label: 'เปลี่ยนบทบาท' },
  { value: 'user_deleted', label: 'ลบผู้ใช้' },
];

const getActionIcon = (action: string) => {
  switch (action) {
    case 'login':
      return <LogIn className="w-4 h-4 text-green-500" />;
    case 'logout':
      return <LogOut className="w-4 h-4 text-gray-500" />;
    case 'password_changed':
      return <Key className="w-4 h-4 text-amber-500" />;
    case 'profile_updated':
    case 'avatar_uploaded':
      return <User className="w-4 h-4 text-blue-500" />;
    case 'po_created':
    case 'po_updated':
    case 'po_exported':
      return <FileText className="w-4 h-4 text-primary" />;
    case 'po_deleted':
    case 'user_deleted':
    case 'mapping_deleted':
      return <Trash2 className="w-4 h-4 text-destructive" />;
    case 'mapping_created':
    case 'mapping_updated':
      return <Upload className="w-4 h-4 text-indigo-500" />;
    case 'role_changed':
      return <Shield className="w-4 h-4 text-orange-500" />;
    default:
      return <Activity className="w-4 h-4 text-muted-foreground" />;
  }
};

const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (action.includes('deleted')) return 'destructive';
  if (action.includes('created')) return 'default';
  if (action.includes('updated') || action.includes('changed')) return 'secondary';
  return 'outline';
};

export default function ActivityLog() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, isAdmin]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (isAdmin && data && data.length > 0) {
        const userIds = [...new Set(data.map(log => log.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const logsWithProfiles = data.map(log => ({
          ...log,
          profiles: profiles?.find(p => p.id === log.user_id) || null
        }));

        setLogs(logsWithProfiles as ActivityLogEntry[]);
      } else {
        setLogs(data as ActivityLogEntry[]);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      getActionLabel(log.action).toLowerCase().includes(searchLower) ||
      log.entity_type?.toLowerCase().includes(searchLower) ||
      log.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      log.profiles?.email?.toLowerCase().includes(searchLower);

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    const logDate = new Date(log.created_at);
    const matchesStartDate = !startDate || logDate >= startDate;
    const matchesEndDate = !endDate || logDate <= new Date(endDate.getTime() + 86400000);

    return matchesSearch && matchesAction && matchesStartDate && matchesEndDate;
  });

  const hasActiveFilters = searchTerm || actionFilter !== 'all' || startDate || endDate;

  return (
    <MainLayout title="ประวัติการใช้งาน" subtitle="ดูประวัติกิจกรรมในระบบ">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ประวัติการใช้งาน</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'ดูประวัติกิจกรรมทั้งหมดในระบบ' : 'ดูประวัติกิจกรรมของคุณ'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">ตัวกรอง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหากิจกรรม..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="ประเภทกิจกรรม" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yy', { locale: th }) : 'เริ่มต้น'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yy', { locale: th }) : 'สิ้นสุด'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  ล้างตัวกรอง
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{filteredLogs.length}</p>
                  <p className="text-sm text-muted-foreground">กิจกรรมที่แสดง</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {filteredLogs.filter(l => l.action === 'login').length}
                  </p>
                  <p className="text-sm text-muted-foreground">การเข้าสู่ระบบ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {filteredLogs.filter(l => l.action.startsWith('po_')).length}
                  </p>
                  <p className="text-sm text-muted-foreground">กิจกรรม PO</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>รายการกิจกรรม</CardTitle>
            <CardDescription>แสดง {filteredLogs.length} กิจกรรม</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">กิจกรรม</TableHead>
                  {isAdmin && <TableHead className="font-semibold">ผู้ใช้</TableHead>}
                  <TableHead className="font-semibold">ประเภท</TableHead>
                  <TableHead className="font-semibold">รายละเอียด</TableHead>
                  <TableHead className="font-semibold">วันเวลา</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-muted-foreground">กำลังโหลด...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-muted-foreground">
                      ไม่พบประวัติกิจกรรม
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {getActionLabel(log.action)}
                          </Badge>
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {log.profiles?.full_name || 'ไม่ระบุชื่อ'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {log.profiles?.email}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-muted-foreground">
                        {log.entity_type || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {log.entity_id || (log.details ? JSON.stringify(log.details).slice(0, 50) : '-')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('th-TH')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}