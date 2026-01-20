import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

export const ExportSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-foreground">การส่งออกไฟล์ Excel</h2>

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
