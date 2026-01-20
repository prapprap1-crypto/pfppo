import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Download, 
  Map, 
  Building2, 
  Package, 
  Settings,
  Users,
  History,
  ChevronRight,
  BookOpen,
  Printer,
  MapPin,
  Truck,
  User,
  Warehouse
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function UserGuide() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections: GuideSection[] = [
    {
      id: 'overview',
      title: 'ภาพรวมระบบ',
      icon: <BookOpen className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-foreground">ระบบจัดการใบสั่งซื้อ (PO Management System)</h2>
            <p className="text-muted-foreground">
              ระบบนี้ช่วยจัดการกระบวนการทำงานกับใบสั่งซื้อ (Purchase Order) ตั้งแต่การนำเข้าไฟล์ PDF 
              การตรวจสอบข้อมูล การจับคู่ข้อมูล (Mapping) จนถึงการส่งออกไฟล์ Excel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-semibold">1. นำเข้าเอกสาร</h3>
              </div>
              <p className="text-sm text-muted-foreground">อัปโหลดไฟล์ PDF และระบบจะอ่านข้อมูลอัตโนมัติ</p>
            </Card>

            <Card className="p-4 border-l-4 border-l-yellow-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                </div>
                <h3 className="font-semibold">2. ตรวจสอบ</h3>
              </div>
              <p className="text-sm text-muted-foreground">ตรวจสอบความถูกต้องและแก้ไขข้อมูลที่จำเป็น</p>
            </Card>

            <Card className="p-4 border-l-4 border-l-green-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Map className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="font-semibold">3. Mapping</h3>
              </div>
              <p className="text-sm text-muted-foreground">จับคู่รหัสลูกค้า สาขา และสินค้ากับข้อมูล Vendor</p>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-semibold">4. ส่งออก</h3>
              </div>
              <p className="text-sm text-muted-foreground">ส่งออกข้อมูลเป็นไฟล์ Excel ตาม Template</p>
            </Card>
          </div>

          <Card className="p-6 bg-muted/30">
            <h3 className="font-semibold mb-4">สถานะเอกสาร</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">ใหม่</Badge>
                <span className="text-sm">เพิ่งนำเข้า</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/10 text-green-600 border-green-200">นำเข้าแล้ว</Badge>
                <span className="text-sm">อ่านข้อมูลสำเร็จ</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">รอตรวจสอบ</Badge>
                <span className="text-sm">ต้องตรวจสอบ</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">ตรวจสอบแล้ว</Badge>
                <span className="text-sm">พร้อมส่งออก</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">ส่งออกแล้ว</Badge>
                <span className="text-sm">เสร็จสิ้น</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500/10 text-red-600 border-red-200">ผิดพลาด</Badge>
                <span className="text-sm">มีปัญหา</span>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'import',
      title: 'นำเข้าเอกสาร',
      icon: <Upload className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">การนำเข้าเอกสาร PDF</h2>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
              เข้าหน้าหลัก (Dashboard)
            </h3>
            <p className="text-muted-foreground mb-4">
              คลิกที่เมนู "หน้าหลัก" ด้านซ้าย จะเห็นพื้นที่สำหรับลากวางไฟล์
            </p>
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
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>ลากไฟล์ PDF วางในพื้นที่อัปโหลด หรือคลิกเพื่อเลือกไฟล์จากเครื่อง</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>สามารถอัปโหลดได้หลายไฟล์พร้อมกัน</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>ระบบจะอ่านข้อมูลจาก PDF โดยอัตโนมัติ (OCR)</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
              ตรวจสอบผลลัพธ์
            </h3>
            <p className="text-muted-foreground mb-4">
              หลังอัปโหลดสำเร็จ ระบบจะ:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-1 text-green-500" />
                <span>สร้างรายการ PO ใหม่ในระบบ</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-1 text-green-500" />
                <span>พยายามจับคู่ลูกค้าและสินค้าโดยอัตโนมัติ</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-1 text-green-500" />
                <span>แสดงสถานะการ Mapping (สำเร็จ/ไม่สำเร็จ)</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-yellow-500/5 border-yellow-200">
            <h3 className="font-semibold mb-2 text-yellow-700">⚠️ หมายเหตุ</h3>
            <p className="text-muted-foreground">
              หาก PO นั้นมีอยู่ในระบบแล้ว (เลข PO ซ้ำ) ระบบจะแจ้งเตือนและไม่สามารถนำเข้าซ้ำได้
            </p>
          </Card>
        </div>
      ),
    },
    {
      id: 'verification',
      title: 'ตรวจสอบเอกสาร',
      icon: <CheckCircle2 className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">การตรวจสอบและยืนยันเอกสาร</h2>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
              เข้าหน้าตรวจสอบ
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>คลิกเมนู "ตรวจสอบเอกสาร" เพื่อดูรายการ PO ที่รอตรวจสอบ</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>หรือคลิกปุ่ม "ตรวจสอบ" ที่รายการ PO ในหน้า "รายการ PO"</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
              ตรวจสอบข้อมูล
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">ข้อมูลลูกค้า</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• ชื่อลูกค้า - คลิกปุ่มดินสอเพื่อแก้ไข</li>
                  <li>• สถานะ Mapping - ตรวจสอบว่า Mapped แล้วหรือไม่</li>
                  <li>• รหัส Vendor - แสดงหลังจาก Mapping สำเร็จ</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">ข้อมูลสาขา</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• ชื่อสาขา - คลิกปุ่มดินสอเพื่อแก้ไข</li>
                  <li>• สถานะ Mapping - ต้อง Mapping ลูกค้าก่อน</li>
                  <li>• รหัสสาขา Vendor - แสดงหลังจาก Mapping</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
              แก้ไขรายการสินค้า (Inline Edit)
            </h3>
            <p className="text-muted-foreground mb-4">
              ผู้ใช้ที่มีสิทธิ์ Admin หรือ Moderator สามารถแก้ไขข้อมูลได้โดยตรง:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span><strong>รหัสสินค้าลูกค้า</strong> - คลิกที่รหัสเพื่อแก้ไข แล้วกดปุ่ม Save</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span><strong>จำนวน</strong> - คลิกที่ตัวเลขจำนวนเพื่อแก้ไข</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span><strong>ราคาต่อหน่วย</strong> - คลิกที่ราคาเพื่อแก้ไข</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span><strong>รหัส Vendor</strong> - คลิกเพื่อแก้ไขหรือค้นหาจาก Mapping</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">4</span>
              ยืนยันเอกสาร
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>ตรวจสอบว่าสินค้าทุกรายการ Mapped แล้ว</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>กรอกหมายเหตุ (ถ้ามี)</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>คลิกปุ่ม "ยืนยันเอกสาร" เพื่อเปลี่ยนสถานะเป็น "ตรวจสอบแล้ว"</span>
              </li>
            </ul>
          </Card>
        </div>
      ),
    },
    {
      id: 'mapping',
      title: 'Mapping ข้อมูล',
      icon: <Map className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">การจับคู่ข้อมูล (Mapping)</h2>
          
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customer">Mapping ลูกค้า</TabsTrigger>
              <TabsTrigger value="branch">Mapping สาขา</TabsTrigger>
              <TabsTrigger value="product">Mapping สินค้า</TabsTrigger>
            </TabsList>

            <TabsContent value="customer" className="mt-4 space-y-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Mapping ลูกค้า</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  จับคู่ชื่อลูกค้าจากเอกสาร PO กับรหัสและชื่อ Vendor
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">1.</span>
                    <span>ไปที่เมนู ตั้งค่า → Mapping ลูกค้า</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">2.</span>
                    <span>คลิก "เพิ่ม Mapping" และกรอกข้อมูล:</span>
                  </li>
                  <ul className="ml-6 space-y-1">
                    <li>• ชื่อลูกค้า (ตามที่ปรากฏใน PO)</li>
                    <li>• รหัสลูกค้า Vendor</li>
                    <li>• ชื่อลูกค้า Vendor</li>
                    <li>• คลังสินค้า, ตำแหน่งรถ, รหัสขนส่ง, พนักงานขาย</li>
                  </ul>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">3.</span>
                    <span>หลังบันทึก ระบบจะอัปเดต PO ที่มีชื่อลูกค้าตรงกันโดยอัตโนมัติ</span>
                  </li>
                </ul>
              </Card>
            </TabsContent>

            <TabsContent value="branch" className="mt-4 space-y-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Mapping สาขา</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  จับคู่ชื่อสาขาภายใต้ลูกค้าแต่ละราย
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">1.</span>
                    <span>ไปที่เมนู ตั้งค่า → Mapping ลูกค้า</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">2.</span>
                    <span>คลิกที่ปุ่มขยาย (Expand) ของลูกค้าที่ต้องการ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">3.</span>
                    <span>เพิ่มหรือแก้ไขสาขาพร้อมรหัสสาขา Vendor</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Quick Mapping:</strong> ในหน้าตรวจสอบ หากสาขายังไม่มี Mapping 
                    จะมีปุ่ม "Quick Map" เพื่อเพิ่ม Mapping ได้ทันที
                  </p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="product" className="mt-4 space-y-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Mapping สินค้า</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  จับคู่รหัสสินค้าลูกค้ากับรหัสสินค้า Vendor
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">1.</span>
                    <span>ไปที่เมนู ตั้งค่า → Mapping สินค้า</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">2.</span>
                    <span>ค้นหาสินค้าที่ต้องการ Mapping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">3.</span>
                    <span>กรอกรหัสและรายละเอียด Vendor แล้วบันทึก</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Inline Edit:</strong> ในหน้าตรวจสอบ สามารถคลิกที่รหัส Vendor 
                    เพื่อแก้ไขหรือค้นหา Mapping ที่มีอยู่ได้ทันที
                  </p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="p-6 bg-blue-500/5 border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-700">🔄 Fuzzy Matching</h3>
            <p className="text-muted-foreground">
              ระบบมีการจับคู่แบบ Fuzzy (85% ขึ้นไป) เพื่อช่วยแก้ปัญหา OCR อ่านผิดพลาด 
              เช่น "กรุ๊ค" vs "กรุ๊ป" โดยจะแสดงเปอร์เซ็นต์ความใกล้เคียงให้ทราบ
            </p>
          </Card>
        </div>
      ),
    },
    {
      id: 'export',
      title: 'ส่งออก Excel',
      icon: <Download className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">การส่งออกไฟล์ Excel</h2>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
              เข้าหน้าส่งออก
            </h3>
            <p className="text-muted-foreground">
              คลิกเมนู "ส่งออก Excel" จะแสดงรายการ PO ที่พร้อมส่งออก (สถานะ "ตรวจสอบแล้ว")
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
              เลือก PO และ Template
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>เลือก PO ที่ต้องการส่งออก (เลือกได้หลายรายการ)</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>เลือก Template การส่งออก (หรือใช้ค่าเริ่มต้น)</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>คลิก "ดูตัวอย่าง" เพื่อตรวจสอบข้อมูลก่อนส่งออก</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
              ส่งออกไฟล์
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>คลิกปุ่ม "ส่งออก Excel"</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>ไฟล์จะถูกดาวน์โหลดอัตโนมัติ</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>สถานะ PO จะเปลี่ยนเป็น "ส่งออกแล้ว"</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">จัดการ Template</h3>
            <p className="text-muted-foreground mb-4">
              สามารถสร้าง Template ส่งออกเองได้โดยเลือกคอลัมน์และลำดับที่ต้องการ
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>คลิก "จัดการ Template" ในหน้าส่งออก</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>เลือกคอลัมน์และลากเรียงลำดับ</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>บันทึกเป็น Template ใหม่หรือตั้งเป็นค่าเริ่มต้น</span>
              </li>
            </ul>
          </Card>
        </div>
      ),
    },
    {
      id: 'masterdata',
      title: 'ข้อมูลหลัก',
      icon: <Settings className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">การจัดการข้อมูลหลัก (Master Data)</h2>
          <p className="text-muted-foreground">
            ข้อมูลหลักเหล่านี้ใช้ในการ Mapping ลูกค้า และส่งออก Excel
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Warehouse className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">คลังสินค้า</h3>
                  <p className="text-sm text-muted-foreground">ตั้งค่า → คลังสินค้า</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                จัดการรหัสและชื่อคลังสินค้าที่ใช้ในการจัดส่ง
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">ตำแหน่งรถ</h3>
                  <p className="text-sm text-muted-foreground">ตั้งค่า → ตำแหน่งรถ</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                จัดการตำแหน่งรถสำหรับการวางแผนจัดส่ง
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">รหัสขนส่ง</h3>
                  <p className="text-sm text-muted-foreground">ตั้งค่า → รหัสขนส่ง</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                จัดการรหัสและชื่อบริษัทขนส่ง
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">พนักงานขาย</h3>
                  <p className="text-sm text-muted-foreground">ตั้งค่า → พนักงานขาย</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                จัดการรหัสและชื่อพนักงานขายประจำลูกค้า
              </p>
            </Card>
          </div>

          <Card className="p-6 bg-muted/30">
            <h3 className="font-semibold mb-2">วิธีเพิ่มข้อมูล</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">1.</span>
                <span>เลือกเมนู ตั้งค่า → เลือกประเภทข้อมูลที่ต้องการ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">2.</span>
                <span>คลิกปุ่ม "เพิ่ม..."</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">3.</span>
                <span>กรอกรหัสและชื่อ แล้วบันทึก</span>
              </li>
            </ul>
          </Card>
        </div>
      ),
    },
    {
      id: 'reports',
      title: 'รายงาน',
      icon: <History className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">รายงานและประวัติ</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">ประวัติ PO</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                ดูประวัติการดำเนินการทั้งหมดของ PO แต่ละรายการ
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• นำเข้าเอกสาร</li>
                <li>• แก้ไขข้อมูล</li>
                <li>• ยืนยันเอกสาร</li>
                <li>• ส่งออก Excel</li>
              </ul>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">ประวัติส่งออก</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                ดูประวัติการส่งออกไฟล์ Excel ทั้งหมด
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• วันที่ส่งออก</li>
                <li>• ชื่อไฟล์</li>
                <li>• จำนวน PO ที่ส่งออก</li>
                <li>• ผู้ส่งออก</li>
              </ul>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">ดูประวัติการแก้ไข PO</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>ในหน้าตรวจสอบเอกสาร คลิกปุ่ม "ประวัติการแก้ไข"</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>จะแสดงรายละเอียดการเปลี่ยนแปลงทั้งหมด พร้อมชื่อผู้แก้ไข</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-1 text-primary" />
                <span>หรือคลิกไอคอนประวัติในรายการ PO</span>
              </li>
            </ul>
          </Card>
        </div>
      ),
    },
    {
      id: 'users',
      title: 'จัดการผู้ใช้',
      icon: <Users className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">การจัดการผู้ใช้งาน</h2>
          <p className="text-muted-foreground">
            สำหรับผู้ดูแลระบบ (Admin) เท่านั้น
          </p>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">บทบาทผู้ใช้งาน</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Badge className="bg-red-500/10 text-red-600 border-red-200">Admin</Badge>
                <span className="text-muted-foreground">เข้าถึงทุกฟังก์ชัน รวมถึงการจัดการผู้ใช้</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Moderator</Badge>
                <span className="text-muted-foreground">แก้ไขข้อมูล, Mapping, ส่งออก</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Badge className="bg-gray-500/10 text-gray-600 border-gray-200">User</Badge>
                <span className="text-muted-foreground">ดูข้อมูลเท่านั้น</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">การอนุมัติผู้ใช้ใหม่</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">1.</span>
                <span>ผู้ใช้ใหม่สมัครสมาชิก</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">2.</span>
                <span>Admin จะได้รับการแจ้งเตือน</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">3.</span>
                <span>ไปที่ ตั้งค่า → ผู้ใช้งาน เพื่ออนุมัติและกำหนดบทบาท</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-yellow-500/5 border-yellow-200">
            <h3 className="font-semibold mb-2 text-yellow-700">⚠️ หมายเหตุ</h3>
            <p className="text-muted-foreground">
              ผู้ใช้คนแรกที่สมัครจะได้รับบทบาท Admin โดยอัตโนมัติและได้รับการอนุมัติทันที
            </p>
          </Card>
        </div>
      ),
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout title="คู่มือการใช้งาน" subtitle="วิธีใช้งานระบบจัดการใบสั่งซื้อ">
      <div className="flex gap-6">
        {/* Sidebar */}
        <Card className="w-64 shrink-0 p-4 h-fit sticky top-4 print:hidden">
          <h3 className="font-semibold mb-4">หัวข้อ</h3>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {section.icon}
                {section.title}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-4 border-t">
            <Button onClick={handlePrint} variant="outline" className="w-full gap-2">
              <Printer className="w-4 h-4" />
              พิมพ์คู่มือ
            </Button>
          </div>
        </Card>

        {/* Content */}
        <div className="flex-1">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="pr-4">
              {sections.find((s) => s.id === activeSection)?.content}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
        }
      `}</style>
    </MainLayout>
  );
}
