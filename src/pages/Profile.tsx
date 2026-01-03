import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, ShieldCheck, Save, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState<string>('user');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRole();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setFullName(data?.full_name || '');
      setEmail(data?.email || user?.email || '');
      setAvatarUrl(data?.avatar_url || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRole = async () => {
    if (!user) return;
    
    const { data } = await supabase.rpc('get_user_role', { _user_id: user.id });
    setRole(data || 'user');
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว'
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกข้อมูลได้',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
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
            <User className="w-3 h-3 mr-1" />
            ผู้ใช้งาน
          </Badge>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <MainLayout title="โปรไฟล์" subtitle="จัดการข้อมูลส่วนตัวของคุณ">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-muted-foreground">กำลังโหลด...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="โปรไฟล์" subtitle="จัดการข้อมูลส่วนตัวของคุณ">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {fullName ? getInitials(fullName) : <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {fullName || 'ไม่ระบุชื่อ'}
                </h2>
                <p className="text-muted-foreground">{email}</p>
                <div className="mt-2">
                  {getRoleBadge(role)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลส่วนตัว</CardTitle>
            <CardDescription>แก้ไขข้อมูลโปรไฟล์ของคุณ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                <User className="w-4 h-4 inline-block mr-2" />
                ชื่อ-นามสกุล
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="กรอกชื่อ-นามสกุล"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="w-4 h-4 inline-block mr-2" />
                อีเมล
              </Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                ไม่สามารถเปลี่ยนอีเมลได้
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">
                URL รูปโปรไฟล์
              </Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                บันทึกข้อมูล
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลบัญชี</CardTitle>
            <CardDescription>ข้อมูลทั่วไปเกี่ยวกับบัญชีของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">รหัสผู้ใช้</p>
                <p className="font-mono text-xs text-foreground truncate">{user?.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">สร้างเมื่อ</p>
                <p className="text-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
