import { Card } from '@/components/ui/card';
import { Building2, MapPin, Package } from 'lucide-react';
import { GuideScreenshot } from './GuideScreenshot';

export const MappingSection = ({ image }: { image: string }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-foreground">การจับคู่ข้อมูล (Mapping)</h2>

    <GuideScreenshot src={image} alt="ตาราง Mapping" caption="ภาพ: หน้าจัดการ Mapping ลูกค้าและสินค้า" />

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">Mapping ลูกค้า</h3>
        </div>
        <p className="text-sm text-muted-foreground">จับคู่ชื่อลูกค้าจาก PO กับรหัส Vendor</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">Mapping สาขา</h3>
        </div>
        <p className="text-sm text-muted-foreground">จับคู่สาขาของลูกค้ากับรหัสสาขา Vendor</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">Mapping สินค้า</h3>
        </div>
        <p className="text-sm text-muted-foreground">จับคู่รหัสสินค้าลูกค้ากับรหัส Vendor</p>
      </Card>
    </div>
  </div>
);
