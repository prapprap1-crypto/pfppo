import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { sendNotificationEmail } from '@/lib/api/notifications';
import { FolderOpen, Mail, Lock, User, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('กรุณากรอกอีเมลให้ถูกต้อง');
const passwordSchema = z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');

type AuthStep = 'credentials' | 'otp-verification' | 'pending-approval';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  
  // OTP and approval states
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [otpValue, setOtpValue] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  // Check if user is approved when logged in
  useEffect(() => {
    const checkApproval = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('is_approved')
          .eq('user_id', user.id)
          .single();
        
        if (data?.is_approved) {
          navigate('/');
        } else {
          setIsApproved(false);
          setAuthStep('pending-approval');
        }
      }
    };
    
    checkApproval();
  }, [user, navigate]);

  const validateForm = (isSignUp = false) => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    
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
    
    if (isSignUp && password !== confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
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
          : error.message === 'Email not confirmed'
          ? 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ'
          : error.message,
        variant: 'destructive',
      });
    }
    // Navigation will be handled by useEffect when user state changes
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    
    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
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
      setPendingEmail(email);
      setAuthStep('otp-verification');
      toast({ 
        title: 'ส่งรหัส OTP แล้ว',
        description: 'กรุณาตรวจสอบอีเมลของคุณเพื่อรับรหัสยืนยัน',
      });
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpValue.length !== 6) {
      toast({
        title: 'รหัส OTP ไม่ถูกต้อง',
        description: 'กรุณากรอกรหัส OTP 6 หลัก',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    const { error, data } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: otpValue,
      type: 'signup',
    });
    
    if (error) {
      setLoading(false);
      toast({
        title: 'ยืนยัน OTP ไม่สำเร็จ',
        description: 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่',
        variant: 'destructive',
      });
    } else {
      // Send notification to all admins
      try {
        const { data: adminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');
        
        if (adminRoles && adminRoles.length > 0) {
          const { data: adminProfiles } = await supabase
            .from('profiles')
            .select('email')
            .in('id', adminRoles.map(r => r.user_id));
          
          // Send email to each admin
          if (adminProfiles) {
            for (const admin of adminProfiles) {
              if (admin.email) {
                await sendNotificationEmail({
                  to: admin.email,
                  subject: 'ผู้ใช้ใหม่รอการอนุมัติ - PO System',
                  type: 'new_user_pending',
                  data: {
                    userName: fullName || 'ไม่ระบุ',
                    userEmail: pendingEmail
                  }
                });
              }
            }
          }
        }
      } catch (notifyError) {
        console.error('Error notifying admins:', notifyError);
      }
      
      setLoading(false);
      setAuthStep('pending-approval');
      toast({ 
        title: 'ยืนยันอีเมลสำเร็จ',
        description: 'กรุณารอการอนุมัติจากผู้ดูแลระบบ',
      });
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: pendingEmail,
    });
    
    setLoading(false);
    
    if (error) {
      toast({
        title: 'ส่ง OTP ไม่สำเร็จ',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'ส่ง OTP ใหม่แล้ว',
        description: 'กรุณาตรวจสอบอีเมลของคุณ',
      });
    }
  };

  const handleBackToCredentials = () => {
    setAuthStep('credentials');
    setOtpValue('');
    setPendingEmail('');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthStep('credentials');
    setIsApproved(null);
  };

  // Render OTP verification step
  if (authStep === 'otp-verification') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">ยืนยันอีเมล</h1>
            <p className="text-muted-foreground">กรอกรหัส OTP ที่ส่งไปยัง {pendingEmail}</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle>รหัสยืนยัน OTP</CardTitle>
              <CardDescription>ตรวจสอบอีเมลของคุณสำหรับรหัส 6 หลัก</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={(value) => setOtpValue(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading || otpValue.length !== 6}>
                  {loading ? 'กำลังยืนยัน...' : 'ยืนยันรหัส OTP'}
                </Button>
                
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleResendOTP}
                    disabled={loading}
                  >
                    ส่งรหัส OTP ใหม่
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleBackToCredentials}
                  >
                    กลับ
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render pending approval step
  if (authStep === 'pending-approval') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent mx-auto flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">รอการอนุมัติ</h1>
          <p className="text-muted-foreground">บัญชีของคุณกำลังรอการอนุมัติ</p>
        </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                ยืนยันอีเมลสำเร็จ
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <p className="text-warning-foreground text-sm">
                  บัญชีของคุณได้รับการยืนยันอีเมลแล้ว แต่ต้องรอการอนุมัติจากผู้ดูแลระบบก่อนจึงจะสามารถเข้าใช้งานได้
                </p>
              </div>
              
              <div className="pt-2">
                <p className="text-muted-foreground text-sm mb-4">
                  ผู้ดูแลระบบจะตรวจสอบและอนุมัติบัญชีของคุณโดยเร็วที่สุด
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  ออกจากระบบ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render main login/signup form
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
                  <div>
                    <Label htmlFor="signup-confirm-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      ยืนยันรหัสผ่าน
                    </Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1"
                    />
                    {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
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