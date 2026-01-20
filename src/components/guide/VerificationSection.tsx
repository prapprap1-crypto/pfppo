import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { GuideScreenshot } from './GuideScreenshot';

export const VerificationSection = ({ image }: { image: string }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-foreground">การตรวจสอบและยืนยันเอกสาร</h2>
    
    <GuideScreenshot src={image} alt="หน้าตรวจสอบเอกสาร" caption="ภาพ: หน้าตรวจสอบเอกสารแสดง PDF และข้อมูลสินค้า" />

    <Card className="p-6">
      <h3 className="font-semibold mb-4">ขั้นตอนการตรวจสอบ</h3>
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>คลิกเมนู "ตรวจสอบเอกสาร" เพื่อดูรายการ PO ที่รอตรวจสอบ</span></li>
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>ตรวจสอบข้อมูลลูกค้า, สาขา และรายการสินค้า</span></li>
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>แก้ไขข้อมูลโดยคลิกที่รายการที่ต้องการ</span></li>
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>คลิก "ยืนยันเอกสาร" เมื่อตรวจสอบเสร็จ</span></li>
      </ul>
    </Card>

    <Card className="p-6">
      <h3 className="font-semibold mb-4">การแก้ไขข้อมูล (Inline Edit)</h3>
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span><strong>รหัสสินค้า</strong> - คลิกที่รหัสเพื่อแก้ไข</span></li>
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span><strong>จำนวน/ราคา</strong> - คลิกที่ตัวเลขเพื่อแก้ไข</span></li>
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span><strong>รหัส Vendor</strong> - คลิกเพื่อค้นหาจาก Mapping</span></li>
      </ul>
    </Card>
  </div>
);
