import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, Mail, RefreshCw, Play, Save, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  createPOHeader, createPOItems, autoCreateMappingsForItems,
  findMappingsForCodes, findCustomerMappingByName,
} from '@/lib/api/database';
import { usePOActionLog } from '@/hooks/usePOActionLog';

interface EmailImportRow {
  id: string;
  subject: string | null;
  sender_email: string | null;
  received_at: string | null;
  file_name: string;
  file_path: string | null;
  status: string;
  error_message: string | null;
  po_id: string | null;
}

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

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export default function EmailImport() {
  const { toast } = useToast();
  const { logAction } = usePOActionLog();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [rows, setRows] = useState<EmailImportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: s }, { data: list }] = await Promise.all([
      supabase.from('email_import_settings').select('*').limit(1).maybeSingle(),
      supabase.from('email_imports').select('*').order('received_at', { ascending: false }).limit(200),
    ]);
    setSettings(s as Settings | null);
    setRows((list || []) as EmailImportRow[]);
    setSelectedIds([]);
    setLoading(false);
  };

  const toggleOne = (id: string, checked: boolean) =>
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? rows.map((r) => r.id) : []);

  const deleteSelected = async () => {
    setDeleting(true);
    const { error } = await supabase.from('email_imports').delete().in('id', selectedIds);
    setDeleting(false);
    setConfirmOpen(false);
    if (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `ลบ ${selectedIds.length} รายการแล้ว` });
    await loadAll();
  };

  useEffect(() => { loadAll(); }, []);

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

  const fetchEmails = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-outlook-po', { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: 'ดึงอีเมลสำเร็จ',
        description: `พบเมล ${data.scanned} ฉบับ, ไฟล์ใหม่ ${data.newCount} ไฟล์, ข้ามซ้ำ ${data.skipped}`,
      });
      await loadAll();
    } catch (e) {
      toast({
        title: 'ดึงอีเมลไม่สำเร็จ',
        description: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      });
    } finally {
      setFetching(false);
    }
  };

  const processRow = async (row: EmailImportRow) => {
    if (!row.file_path) return;
    setProcessingId(row.id);
    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from('po-files')
        .download(row.file_path);
      if (dlError || !fileData) throw new Error(dlError?.message || 'ดาวน์โหลดไฟล์ไม่สำเร็จ');

      const pdfBase64 = await blobToBase64(fileData);
      const { data, error } = await supabase.functions.invoke('parse-po-pdf', {
        body: { pdfBase64, fileName: row.file_name },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'วิเคราะห์ไฟล์ไม่สำเร็จ');
      const extracted = data.data;

      let vendorCustomerCode = '';
      let vendorCustomerName = '';
      let isCustomerMapped = false;
      if (extracted.customer_name) {
        const cm = await findCustomerMappingByName(extracted.customer_name);
        if (cm?.vendor_customer_code) {
          vendorCustomerCode = cm.vendor_customer_code;
          vendorCustomerName = cm.vendor_customer_name;
          isCustomerMapped = true;
        }
      }

      const poHeader = await createPOHeader({
        po_number: extracted.po_number,
        customer_name: extracted.customer_name || null,
        vendor_customer_code: vendorCustomerCode,
        vendor_customer_name: vendorCustomerName,
        is_customer_mapped: isCustomerMapped,
        supplier_code: extracted.supplier_code,
        supplier_name: extracted.supplier_name,
        branch: extracted.branch,
        document_date: extracted.document_date,
        due_date: extracted.due_date,
        net_total: extracted.net_total,
        vat: extracted.vat,
        grand_total: extracted.grand_total,
        source_file: row.file_path,
        status: 'NEED_REVIEW',
      });

      if (poHeader) {
        await logAction(poHeader.id, 'imported', {
          source_file: row.file_name,
          description: `นำเข้าจากอีเมล ${extracted.po_number}`,
        });
      }

      if (poHeader && extracted.items?.length > 0) {
        const codes = extracted.items.map((i: { customer_product_code: string }) => i.customer_product_code);
        const existingMappings = await findMappingsForCodes(codes);
        const mappingMap = new Map(existingMappings.map((m) => [m.customer_code, m]));

        await createPOItems(
          extracted.items.map((item: Record<string, string | number>) => {
            const mapping = mappingMap.get(item.customer_product_code as string);
            return {
              po_id: poHeader.id,
              customer_product_code: item.customer_product_code,
              customer_description: item.customer_description,
              vendor_product_code: mapping?.vendor_code || '',
              vendor_description: mapping?.vendor_desc || '',
              quantity: item.quantity,
              unit: item.unit || 'ลัง',
              unit_price: item.unit_price,
              amount: item.amount,
              delivery_date: item.delivery_date,
              is_mapped: !!mapping && !!mapping.vendor_code,
            };
          }),
        );

        try {
          await autoCreateMappingsForItems(
            extracted.items.map((item: Record<string, string>) => ({
              customer_product_code: item.customer_product_code,
              customer_description: item.customer_description,
              unit: item.unit,
            })),
          );
        } catch (e) {
          console.error('auto mapping error', e);
        }
      }

      await supabase
        .from('email_imports')
        .update({
          status: 'PROCESSED',
          po_id: poHeader?.id ?? null,
          processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', row.id);

      toast({ title: 'นำเข้าสำเร็จ', description: `PO ${extracted.po_number}` });
      await loadAll();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'เกิดข้อผิดพลาด';
      await supabase.from('email_imports').update({ status: 'ERROR', error_message: message }).eq('id', row.id);
      toast({ title: 'ประมวลผลไม่สำเร็จ', description: message, variant: 'destructive' });
      await loadAll();
    } finally {
      setProcessingId(null);
    }
  };

  const processAll = async () => {
    for (const row of rows.filter((r) => r.status === 'FETCHED')) {
      await processRow(row);
    }
  };

  const pendingCount = rows.filter((r) => r.status === 'FETCHED').length;

  return (
    <MainLayout title="นำเข้าจากอีเมล">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="w-6 h-6" /> นำเข้าจากอีเมล (Microsoft 365)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              ดึงไฟล์ PO (PDF) จากกล่องเมลอัตโนมัติ แล้ววิเคราะห์เข้าสู่ระบบโดยไม่ต้องอัปโหลดเอง
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchEmails} disabled={fetching}>
              {fetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              ดึงเมลใหม่
            </Button>
            <Button onClick={processAll} disabled={!pendingCount || !!processingId}>
              <Play className="w-4 h-4 mr-2" />
              วิเคราะห์ทั้งหมด ({pendingCount})
            </Button>
          </div>
        </div>

        {settings && (
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
        )}

        <Card>
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b">
            <span className="text-sm font-medium">รายการไฟล์จากอีเมล</span>
            <Badge variant="secondary">ทั้งหมด {rows.length} รายการ</Badge>
            <Badge variant="outline">
              รอวิเคราะห์ {rows.filter((r) => r.status !== 'PROCESSED' && r.status !== 'ERROR').length}
            </Badge>
            <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/15">
              วิเคราะห์แล้ว {rows.filter((r) => r.status === 'PROCESSED').length}
            </Badge>
            {rows.some((r) => r.status === 'ERROR') && (
              <Badge variant="destructive">
                ผิดพลาด {rows.filter((r) => r.status === 'ERROR').length}
              </Badge>
            )}
            {selectedIds.length > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">เลือก {selectedIds.length} รายการ</span>
                <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-1" /> ลบที่เลือก
                </Button>
              </div>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={rows.length > 0 && selectedIds.length === rows.length}
                    onCheckedChange={(v) => toggleAll(!!v)}
                    aria-label="เลือกทั้งหมด"
                  />
                </TableHead>
                <TableHead>วันที่รับ</TableHead>
                <TableHead>ผู้ส่ง</TableHead>
                <TableHead>หัวข้อ</TableHead>
                <TableHead>ไฟล์แนบ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    ยังไม่มีไฟล์จากอีเมล — กด "ดึงเมลใหม่" เพื่อเริ่ม
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} data-state={selectedIds.includes(row.id) ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onCheckedChange={(v) => toggleOne(row.id, !!v)}
                        aria-label="เลือกรายการ"
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(row.received_at)}</TableCell>
                    <TableCell className="max-w-48 truncate">{row.sender_email || '-'}</TableCell>
                    <TableCell className="max-w-64 truncate">{row.subject || '-'}</TableCell>
                    <TableCell className="max-w-48 truncate">{row.file_name}</TableCell>
                    <TableCell>
                      {row.status === 'PROCESSED' ? (
                        <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/15">
                          <CheckCircle className="w-3 h-3 mr-1" /> นำเข้าแล้ว
                        </Badge>
                      ) : row.status === 'ERROR' ? (
                        <Badge variant="destructive" title={row.error_message ?? ''}>
                          <AlertCircle className="w-3 h-3 mr-1" /> ผิดพลาด
                        </Badge>
                      ) : (
                        <Badge variant="outline">รอวิเคราะห์</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.status !== 'PROCESSED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === row.id}
                          onClick={() => processRow(row)}
                        >
                          {processingId === row.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 mr-1" />
                          )}
                          วิเคราะห์
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
              <AlertDialogDescription>
                ต้องการลบรายการที่เลือก {selectedIds.length} รายการใช่หรือไม่? การลบไม่สามารถย้อนกลับได้
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); deleteSelected(); }} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                ลบ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
