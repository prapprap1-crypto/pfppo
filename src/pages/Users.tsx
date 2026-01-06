import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useActivityLog } from '@/hooks/useActivityLog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendNotificationEmail } from '@/lib/api/notifications';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  UserCog, 
  Shield, 
  ShieldCheck, 
  User as UserIcon,
  MoreHorizontal,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: 'admin' | 'moderator' | 'user';
}

export default function Users() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { logActivity } = useActivityLog();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: 'ไม่มีสิทธิ์เข้าถึง',
        description: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงหน้านี้ได้',
        variant: 'destructive'
      });
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email || '',
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          role: (userRole?.role || 'user') as 'admin' | 'moderator' | 'user'
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'ผู้ดูแลระบบ';
      case 'moderator': return 'ผู้ควบคุม';
      case 'user': return 'ผู้ใช้งาน';
      default: return role;
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    const oldRole = selectedUser.role;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as 'admin' | 'moderator' | 'user' })
        .eq('user_id', selectedUser.id);

      if (error) throw error;

      await logActivity({
        action: 'role_changed',
        entity_type: 'user',
        entity_id: selectedUser.id,
        details: { 
          user_email: selectedUser.email,
          old_role: oldRole, 
          new_role: newRole 
        }
      });

      if (selectedUser.email) {
        await sendNotificationEmail({
          to: selectedUser.email,
          subject: 'บทบาทของคุณถูกเปลี่ยนแปลง',
          type: 'role_changed',
          data: {
            userName: selectedUser.full_name || selectedUser.email,
            newRole: getRoleLabel(newRole)
          }
        });
      }

      toast({
        title: 'สำเร็จ',
        description: `เปลี่ยนบทบาทของ ${selectedUser.email} เป็น ${getRoleLabel(newRole)} แล้ว`
      });

      setRoleDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเปลี่ยนบทบาทได้',
        variant: 'destructive'
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <ShieldCheck className="w-3 h-3 mr-1" />
            ผู้ดูแลระบบ
          </Badge>
        );
      case 'moderator':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            <Shield className="w-3 h-3 mr-1" />
            ผู้ควบคุม
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <UserIcon className="w-3 h-3 mr-1" />
            ผู้ใช้งาน
          </Badge>
        );
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (roleLoading) {
    return (
      <MainLayout title="จัดการผู้ใช้งาน" subtitle="ดูและจัดการบัญชีผู้ใช้ทั้งหมดในระบบ">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">กำลังตรวจสอบสิทธิ์...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout title="ไม่มีสิทธิ์เข้าถึง" subtitle="">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-muted-foreground">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงหน้านี้ได้</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="จัดการผู้ใช้งาน" subtitle="ดูและจัดการบัญชีผู้ใช้ทั้งหมดในระบบ">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">จัดการผู้ใช้งาน</h1>
            <p className="text-muted-foreground">ดูและจัดการบัญชีผู้ใช้ทั้งหมดในระบบ</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาผู้ใช้..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-sm text-muted-foreground">ผู้ใช้ทั้งหมด</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.role === 'admin').length}
                </p>
                <p className="text-sm text-muted-foreground">ผู้ดูแลระบบ</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.role === 'moderator').length}
                </p>
                <p className="text-sm text-muted-foreground">ผู้ควบคุม</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">ผู้ใช้งาน</TableHead>
                <TableHead className="font-semibold">อีเมล</TableHead>
                <TableHead className="font-semibold">บทบาท</TableHead>
                <TableHead className="font-semibold">วันที่สร้าง</TableHead>
                {isAdmin && <TableHead className="font-semibold text-right">จัดการ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-muted-foreground">กำลังโหลด...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    ไม่พบผู้ใช้งาน
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          {u.avatar_url ? (
                            <img 
                              src={u.avatar_url} 
                              alt={u.full_name || ''} 
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <span className="font-medium text-foreground">
                          {u.full_name || 'ไม่ระบุชื่อ'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('th-TH')}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUser(u);
                                setNewRole(u.role);
                                setRoleDialogOpen(true);
                              }}
                            >
                              <UserCog className="w-4 h-4 mr-2" />
                              เปลี่ยนบทบาท
                            </DropdownMenuItem>
                            {u.id !== user?.id && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(u);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                ลบผู้ใช้
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เปลี่ยนบทบาทผู้ใช้</DialogTitle>
            <DialogDescription>
              เปลี่ยนบทบาทของ {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกบทบาท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    ผู้ใช้งาน
                  </div>
                </SelectItem>
                <SelectItem value="moderator">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    ผู้ควบคุม
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    ผู้ดูแลระบบ
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleRoleChange}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบผู้ใช้</DialogTitle>
            <DialogDescription>
              คุณต้องการลบผู้ใช้ <strong>{selectedUser?.email}</strong> หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={() => {
              toast({ title: 'ฟีเจอร์นี้ยังไม่พร้อมใช้งาน', variant: 'destructive' });
              setDeleteDialogOpen(false);
            }}>
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}