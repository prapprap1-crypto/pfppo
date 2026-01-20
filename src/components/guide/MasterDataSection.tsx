import { Card } from '@/components/ui/card';
import { Warehouse, User, Truck, MapPin } from 'lucide-react';

export const MasterDataSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-foreground">การจัดการข้อมูลหลัก (Master Data)</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Warehouse className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">คลังสินค้า</h3>
        </div>
        <p className="text-sm text-muted-foreground">จัดการรหัสและชื่อคลังสินค้า</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">พนักงานขาย</h3>
        </div>
        <p className="text-sm text-muted-foreground">จัดการข้อมูลพนักงานขาย</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">รหัสขนส่ง</h3>
        </div>
        <p className="text-sm text-muted-foreground">จัดการรหัสและชื่อขนส่ง</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-6 h-6 text-primary" />
          <h3 className="font-semibold">ตำแหน่งรถ</h3>
        </div>
        <p className="text-sm text-muted-foreground">จัดการข้อมูลตำแหน่งรถ</p>
      </Card>
    </div>
  </div>
);
