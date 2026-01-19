import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Building2, MapPin, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  createCustomerMapping, 
  createCustomerBranchMapping, 
  createProductMapping,
  findCustomerMappingByName 
} from '@/lib/api/database';

interface QuickCustomerMappingDialogProps {
  customerName: string;
  onSuccess: () => void;
}

export function QuickCustomerMappingDialog({ customerName, onSuccess }: QuickCustomerMappingDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendorCode, setVendorCode] = useState('');
  const [vendorName, setVendorName] = useState('');

  const handleSubmit = async () => {
    if (!vendorCode || !vendorName) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบ',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createCustomerMapping({
        customer_name: customerName,
        vendor_customer_code: vendorCode,
        vendor_customer_name: vendorName,
        active: true,
      });

      toast({
        title: 'เพิ่ม Mapping ลูกค้าสำเร็จ',
        description: `${customerName} → ${vendorName}`,
      });

      setOpen(false);
      setVendorCode('');
      setVendorName('');
      onSuccess();
    } catch (error) {
      console.error('Error creating customer mapping:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้าง mapping ได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Quick Mapping
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Quick Mapping ลูกค้า
          </DialogTitle>
          <DialogDescription>
            เพิ่ม mapping สำหรับ "{customerName}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>ชื่อลูกค้า (จาก PO)</Label>
            <Input value={customerName} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendorCode">รหัสลูกค้า Vendor *</Label>
            <Input
              id="vendorCode"
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value)}
              placeholder="เช่น C001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendorName">ชื่อลูกค้า Vendor *</Label>
            <Input
              id="vendorName"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="เช่น บริษัท ABC จำกัด"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface QuickBranchMappingDialogProps {
  customerName: string;
  branch: string;
  onSuccess: () => void;
}

export function QuickBranchMappingDialog({ customerName, branch, onSuccess }: QuickBranchMappingDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendorCode, setVendorCode] = useState('');
  const [vendorName, setVendorName] = useState('');

  const handleSubmit = async () => {
    if (!vendorCode || !vendorName) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบ',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // First find the customer mapping
      const customerMapping = await findCustomerMappingByName(customerName);
      if (!customerMapping) {
        toast({
          title: 'ไม่พบ Mapping ลูกค้า',
          description: 'กรุณาสร้าง mapping ลูกค้าก่อน',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      await createCustomerBranchMapping({
        customer_mapping_id: customerMapping.id,
        branch: branch,
        vendor_branch_code: vendorCode,
        vendor_branch_name: vendorName,
        active: true,
      });

      toast({
        title: 'เพิ่ม Mapping สาขาสำเร็จ',
        description: `${branch} → ${vendorName}`,
      });

      setOpen(false);
      setVendorCode('');
      setVendorName('');
      onSuccess();
    } catch (error) {
      console.error('Error creating branch mapping:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้าง mapping ได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Quick Mapping
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Quick Mapping สาขา
          </DialogTitle>
          <DialogDescription>
            เพิ่ม mapping สำหรับสาขา "{branch}" ของลูกค้า "{customerName}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ชื่อลูกค้า</Label>
              <Input value={customerName} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>สาขา (จาก PO)</Label>
              <Input value={branch} disabled className="bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchVendorCode">รหัสสาขา Vendor *</Label>
            <Input
              id="branchVendorCode"
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value)}
              placeholder="เช่น B001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchVendorName">ชื่อสาขา Vendor *</Label>
            <Input
              id="branchVendorName"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="เช่น สาขาสำนักงานใหญ่"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface QuickProductMappingDialogProps {
  customerCode: string;
  customerDesc: string;
  unit: string;
  onSuccess: () => void;
}

export function QuickProductMappingDialog({ customerCode, customerDesc, unit, onSuccess }: QuickProductMappingDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendorCode, setVendorCode] = useState('');
  const [vendorDesc, setVendorDesc] = useState('');

  const handleSubmit = async () => {
    if (!vendorCode || !vendorDesc) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบ',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createProductMapping({
        customer_code: customerCode,
        customer_desc: customerDesc,
        vendor_code: vendorCode,
        vendor_desc: vendorDesc,
        unit: unit,
        active: true,
      });

      toast({
        title: 'เพิ่ม Mapping สินค้าสำเร็จ',
        description: `${customerCode} → ${vendorCode}`,
      });

      setOpen(false);
      setVendorCode('');
      setVendorDesc('');
      onSuccess();
    } catch (error) {
      console.error('Error creating product mapping:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้าง mapping ได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
          <Plus className="w-3 h-3" />
          Map
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Quick Mapping สินค้า
          </DialogTitle>
          <DialogDescription>
            เพิ่ม mapping สำหรับ "{customerCode}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>รหัสสินค้าลูกค้า</Label>
            <Input value={customerCode} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>รายละเอียดสินค้าลูกค้า</Label>
            <Input value={customerDesc} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="productVendorCode">รหัสสินค้า Vendor *</Label>
            <Input
              id="productVendorCode"
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value)}
              placeholder="เช่น P001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="productVendorDesc">รายละเอียดสินค้า Vendor *</Label>
            <Input
              id="productVendorDesc"
              value={vendorDesc}
              onChange={(e) => setVendorDesc(e.target.value)}
              placeholder="เช่น สินค้า ABC"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
