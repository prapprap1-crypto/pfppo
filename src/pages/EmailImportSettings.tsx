import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Mail, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Settings {
  id: string;
  folder: string;
  sender_filter: string | null;
  subject_filter: string | null;
  is_enabled: boolean;
  last_synced_at: string | null;
}

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function EmailImportSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('email_import_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      setSettings(data as Settings | null);
      setLoading(false);
    })();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from('email_import_settings')
      .update({
        folder: settings.folder || 'inbox',
        sender_filter: settings.sender_filter,
        subject_filter: settings.subject_filter,
        is_enabled: settings.is_enabled,
      })
      .eq('id', settings.id);
    setSaving(false);
    toast({
      title: error ? 'บันทึกไม่สำเร็จ' : 'บันทึกการตั้งค่าแล้ว',
      description: error?.message,
      variant: error ? 'destructive' : undefined,
    });
  };

  return (
    <MainLayout title="ตั้งค่านำเข้าจากอีเมล">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6" /> ตั้งค่านำเข้าจากอีเมล (Microsoft 365)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            กำหนดโฟลเดอร์เมล เงื่อนไขการกรองผู้ส่งและหัวข้อ สำหรับการดึงไฟล์ PO อัตโนมัติ
          </p>
        </div>

        {loading ? (
          <Card className="p-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </Card>
        ) : settings ? (
          <Card className="p-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>โฟลเดอร์เมล</Label>
                <Input
                  value={settings.folder}
                  placeholder="inbox หรือชื่อโฟลเดอร์ เช่น PO"
                  onChange={(e) => setSettings({ ...settings, folder: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>กรองผู้ส่ง (อีเมล/โดเมน)</Label>
                <Input
                  value={settings.sender_filter ?? ''}
                  placeholder="เช่น @bnn.co.th"
                  onChange={(e) => setSettings({ ...settings, sender_filter: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>กรองหัวข้อเมล</Label>
                <Input
                  value={settings.subject_filter ?? ''}
                  placeholder="เช่น ใบสั่งซื้อ"
                  onChange={(e) => setSettings({ ...settings, subject_filter: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.is_enabled}
                  onCheckedChange={(v) => setSettings({ ...settings, is_enabled: v })}
                />
                <span className="text-sm">เปิดใช้งานการนำเข้าจากอีเมล</span>
                <span className="text-xs text-muted-foreground">
                  ซิงก์ล่าสุด: {formatDateTime(settings.last_synced_at)}
                </span>
              </div>
              <Button variant="secondary" onClick={saveSettings} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                บันทึกการตั้งค่า
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center text-muted-foreground">ยังไม่มีข้อมูลการตั้งค่า</Card>
        )}
      </div>
    </MainLayout>
  );
}
