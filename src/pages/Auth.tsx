import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Mail, Lock, User } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('กรุณากรอกอีเมลให้ถูกต้อง');
const passwordSchema = z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      toast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: error.message === 'Invalid login credentials' 
          ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'เข้าสู่ระบบสำเร็จ' });
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    
    if (error) {
      const message = error.message.includes('already registered')
        ? 'อีเมลนี้ถูกใช้งานแล้ว'
        : error.message;
      toast({
        title: 'สมัครสมาชิกไม่สำเร็จ',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({ 
        title: 'สมัครสมาชิกสำเร็จ',
        description: 'ยินดีต้อนรับเข้าสู่ระบบ PO Processing',
      });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">PO System</h1>
          <p className="text-muted-foreground">PDF Processing & Mapping</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle>ยินดีต้อนรับ</CardTitle>
            <CardDescription>เข้าสู่ระบบหรือสมัครสมาชิกใหม่</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">เข้าสู่ระบบ</TabsTrigger>
                <TabsTrigger value="signup">สมัครสมาชิก</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      อีเมล
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="mt-1"
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      รหัสผ่าน
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1"
                    />
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full bg-primary" disabled={loading}>
                    {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      ชื่อ-นามสกุล
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="สมชาย ใจดี"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      อีเมล
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="mt-1"
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      รหัสผ่าน
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1"
                    />
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
                    {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
