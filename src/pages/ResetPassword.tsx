import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery link and emits a session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'รหัสผ่านสั้นเกินไป', description: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'รหัสผ่านไม่ตรงกัน', description: 'กรุณากรอกรหัสผ่านให้ตรงกัน', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'ตั้งรหัสผ่านใหม่สำเร็จ', description: 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' });
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-muted-foreground">กำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle>รหัสผ่านใหม่</CardTitle>
            <CardDescription>
              {ready ? 'กรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร' : 'กำลังตรวจสอบลิงก์รีเซ็ตรหัสผ่าน...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="new-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  รหัสผ่านใหม่
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirm-new-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  ยืนยันรหัสผ่านใหม่
                </Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !ready}>
                {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
