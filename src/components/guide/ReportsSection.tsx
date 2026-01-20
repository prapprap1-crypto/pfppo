import { Card } from '@/components/ui/card';
import { FileText, History, Download } from 'lucide-react';

export const ReportsSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-foreground">รายงานและประวัติ</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">รายการ PO</h3>
        </div>
        <p className="text-sm text-muted-foreground">ดู/จัดการ PO ทั้งหมดในระบบ ค้นหาและกรองตามสถานะ</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">รายงานประวัติ PO</h3>
        </div>
        <p className="text-sm text-muted-foreground">ดูประวัติการเปลี่ยนแปลงของ PO แต่ละใบ</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">ประวัติการส่งออก</h3>
        </div>
        <p className="text-sm text-muted-foreground">ดูประวัติการส่งออก Excel และดาวน์โหลดไฟล์ย้อนหลัง</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">Activity Log</h3>
        </div>
        <p className="text-sm text-muted-foreground">บันทึกกิจกรรมทั้งหมดในระบบ</p>
      </Card>
    </div>
  </div>
);
