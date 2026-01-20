import { Card } from '@/components/ui/card';
import { Upload, ChevronRight, CheckCircle2 } from 'lucide-react';

export const ImportSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-foreground">การนำเข้าเอกสาร PDF</h2>
    
    <Card className="p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
        เข้าหน้าหลัก (Dashboard)
      </h3>
      <p className="text-muted-foreground mb-4">คลิกที่เมนู "หน้าหลัก" ด้านซ้าย จะเห็นพื้นที่สำหรับลากวางไฟล์</p>
      <div className="bg-muted/50 rounded-lg p-8 border-2 border-dashed border-muted-foreground/30 text-center">
        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
        <p className="font-medium">ลากวางไฟล์ PDF ที่นี่</p>
        <p className="text-sm text-muted-foreground">หรือคลิกเพื่อเลือกไฟล์</p>
      </div>
    </Card>

    <Card className="p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
        อัปโหลดไฟล์
      </h3>
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>ลากไฟล์ PDF วางในพื้นที่อัปโหลด หรือคลิกเพื่อเลือกไฟล์จากเครื่อง</span></li>
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>สามารถอัปโหลดได้หลายไฟล์พร้อมกัน</span></li>
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>ระบบจะอ่านข้อมูลจาก PDF โดยอัตโนมัติ (OCR)</span></li>
      </ul>
    </Card>

    <Card className="p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
        ตรวจสอบผลลัพธ์
      </h3>
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-1 text-primary" /><span>สร้างรายการ PO ใหม่ในระบบ</span></li>
        <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-1 text-primary" /><span>พยายามจับคู่ลูกค้าและสินค้าโดยอัตโนมัติ</span></li>
        <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-1 text-primary" /><span>แสดงสถานะการ Mapping</span></li>
      </ul>
    </Card>
  </div>
);
