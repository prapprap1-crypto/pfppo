import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { getActionLabel } from '@/hooks/useActivityLog';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Shield
} from 'lucide-react';

interface ActivityLog {
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
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, isAdmin]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Admin sees all logs, users see only their own
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

      // Fetch user profiles for admin view
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

        setLogs(logsWithProfiles as ActivityLog[]);
      } else {
        setLogs(data as ActivityLog[]);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    return (
      getActionLabel(log.action).toLowerCase().includes(searchLower) ||
      log.entity_type?.toLowerCase().includes(searchLower) ||
      log.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      log.profiles?.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <MainLayout title="ประวัติการใช้งาน" subtitle="ดูประวัติกิจกรรมในระบบ">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ประวัติการใช้งาน</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'ดูประวัติกิจกรรมทั้งหมดในระบบ' : 'ดูประวัติกิจกรรมของคุณ'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหากิจกรรม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{logs.length}</p>
                  <p className="text-sm text-muted-foreground">กิจกรรมทั้งหมด</p>
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
                    {logs.filter(l => l.action === 'login').length}
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
                    {logs.filter(l => l.action.startsWith('po_')).length}
                  </p>
                  <p className="text-sm text-muted-foreground">กิจกรรม PO</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายการกิจกรรม</CardTitle>
            <CardDescription>แสดง 100 กิจกรรมล่าสุด</CardDescription>
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
