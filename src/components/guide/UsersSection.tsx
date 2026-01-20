import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const UsersSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-foreground">การจัดการผู้ใช้งาน</h2>

    <Card className="p-6">
      <h3 className="font-semibold mb-4">บทบาทผู้ใช้ (Roles)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-muted/30 rounded-lg">
          <Badge className="mb-2 bg-destructive/10 text-destructive">Admin</Badge>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• จัดการผู้ใช้ทั้งหมด</li>
            <li>• อนุมัติผู้ใช้ใหม่</li>
            <li>• เข้าถึงทุกฟังก์ชัน</li>
          </ul>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <Badge className="mb-2 bg-primary/10 text-primary">Moderator</Badge>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• นำเข้าและตรวจสอบ PO</li>
            <li>• แก้ไขข้อมูล PO</li>
            <li>• จัดการ Mapping</li>
          </ul>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <Badge className="mb-2 bg-muted text-muted-foreground">User</Badge>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• ดูข้อมูล PO</li>
            <li>• ส่งออก Excel</li>
            <li>• ไม่สามารถแก้ไขข้อมูล</li>
          </ul>
        </div>
      </div>
    </Card>

    <Card className="p-6 bg-amber-500/5 border-amber-200">
      <h3 className="font-semibold mb-2 text-amber-700">⚠️ หมายเหตุ</h3>
      <p className="text-muted-foreground">
        ผู้ใช้คนแรกที่สมัครจะได้รับบทบาท Admin โดยอัตโนมัติและได้รับการอนุมัติทันที
      </p>
    </Card>
  </div>
);
