import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, Map, Download } from 'lucide-react';

export const OverviewSection = () => (
  <div className="space-y-6">
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-foreground">ระบบจัดการใบสั่งซื้อ (PO Management System)</h2>
      <p className="text-muted-foreground">
        ระบบนี้ช่วยจัดการกระบวนการทำงานกับใบสั่งซื้อ (Purchase Order) ตั้งแต่การนำเข้าไฟล์ PDF 
        การตรวจสอบข้อมูล การจับคู่ข้อมูล (Mapping) จนถึงการส่งออกไฟล์ Excel
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { icon: Upload, color: 'blue', step: 1, title: 'นำเข้าเอกสาร', desc: 'อัปโหลดไฟล์ PDF และระบบจะอ่านข้อมูลอัตโนมัติ' },
        { icon: CheckCircle2, color: 'yellow', step: 2, title: 'ตรวจสอบ', desc: 'ตรวจสอบความถูกต้องและแก้ไขข้อมูลที่จำเป็น' },
        { icon: Map, color: 'green', step: 3, title: 'Mapping', desc: 'จับคู่รหัสลูกค้า สาขา และสินค้ากับข้อมูล Vendor' },
        { icon: Download, color: 'purple', step: 4, title: 'ส่งออก', desc: 'ส่งออกข้อมูลเป็นไฟล์ Excel ตาม Template' },
      ].map(({ icon: Icon, color, step, title, desc }) => (
        <Card key={step} className={`p-4 border-l-4 border-l-${color}-500`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 text-${color}-500`} />
            </div>
            <h3 className="font-semibold">{step}. {title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </Card>
      ))}
    </div>

    <Card className="p-6 bg-muted/30">
      <h3 className="font-semibold mb-4">สถานะเอกสาร</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'ใหม่', desc: 'เพิ่งนำเข้า', color: 'blue' },
          { label: 'นำเข้าแล้ว', desc: 'อ่านข้อมูลสำเร็จ', color: 'green' },
          { label: 'รอตรวจสอบ', desc: 'ต้องตรวจสอบ', color: 'yellow' },
          { label: 'ตรวจสอบแล้ว', desc: 'พร้อมส่งออก', color: 'emerald' },
          { label: 'ส่งออกแล้ว', desc: 'เสร็จสิ้น', color: 'purple' },
          { label: 'ผิดพลาด', desc: 'มีปัญหา', color: 'red' },
        ].map(({ label, desc, color }) => (
          <div key={label} className="flex items-center gap-2">
            <Badge className={`bg-${color}-500/10 text-${color}-600 border-${color}-200`}>{label}</Badge>
            <span className="text-sm">{desc}</span>
          </div>
        ))}
      </div>
    </Card>
  </div>
);
