import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { GuideScreenshot } from './GuideScreenshot';

export const ExportSection = ({ image }: { image: string }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-foreground">การส่งออกไฟล์ Excel</h2>

    <GuideScreenshot src={image} alt="หน้าส่งออก Excel" caption="ภาพ: หน้าจอเลือกคอลัมน์และดูตัวอย่างก่อนส่งออก" />

    <Card className="p-6">
      <h3 className="font-semibold mb-4">ขั้นตอนการส่งออก</h3>
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>ไปที่ "ส่งออก Excel"</span></li>
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>เลือก PO ที่มีสถานะ "ตรวจสอบแล้ว"</span></li>
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>เลือกคอลัมน์ที่ต้องการส่งออก</span></li>
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>คลิก "ดูตัวอย่าง" เพื่อตรวจสอบ</span></li>
        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-1 text-primary" /><span>คลิก "ส่งออก" เพื่อดาวน์โหลด</span></li>
      </ul>
    </Card>
  </div>
);
