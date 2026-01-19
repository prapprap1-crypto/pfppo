import { useState, useEffect, useCallback } from 'react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, Building2, MapPin, Package, Loader2, Search, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  createCustomerMapping, 
  createCustomerBranchMapping, 
  createProductMapping,
  findCustomerMappingByName,
  fetchProductMappings
} from '@/lib/api/database';
import { cn } from '@/lib/utils';

interface VendorProduct {
  id: string;
  vendor_code: string;
  vendor_desc: string;
}

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load existing vendor products for autocomplete
  const loadVendorProducts = useCallback(async () => {
    if (vendorProducts.length > 0) return; // Already loaded
    
    setLoadingProducts(true);
    try {
      const mappings = await fetchProductMappings();
      // Get unique vendor products
      const uniqueProducts = new Map<string, VendorProduct>();
      (mappings || []).forEach((m: any) => {
        if (m.vendor_code && !uniqueProducts.has(m.vendor_code)) {
          uniqueProducts.set(m.vendor_code, {
            id: m.id,
            vendor_code: m.vendor_code,
            vendor_desc: m.vendor_desc || '',
          });
        }
      });
      setVendorProducts(Array.from(uniqueProducts.values()));
    } catch (error) {
      console.error('Error loading vendor products:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, [vendorProducts.length]);

  // Load products when dialog opens
  useEffect(() => {
    if (open) {
      loadVendorProducts();
    }
  }, [open, loadVendorProducts]);

  const handleSelectProduct = (product: VendorProduct) => {
    setVendorCode(product.vendor_code);
    setVendorDesc(product.vendor_desc);
    setSearchOpen(false);
  };

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
          
          {/* Vendor Product Search */}
          <div className="space-y-2">
            <Label>ค้นหาสินค้า Vendor</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-between"
                >
                  {vendorCode ? (
                    <span className="truncate">{vendorCode} - {vendorDesc}</span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      ค้นหาหรือเลือกสินค้า Vendor...
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="พิมพ์รหัสหรือชื่อสินค้า..." />
                  <CommandList>
                    <CommandEmpty>
                      {loadingProducts ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          กำลังโหลด...
                        </div>
                      ) : (
                        <div className="py-4 text-center text-sm">
                          ไม่พบสินค้า - กรอกข้อมูลด้านล่าง
                        </div>
                      )}
                    </CommandEmpty>
                    <CommandGroup heading="สินค้า Vendor ที่มีอยู่">
                      {vendorProducts.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={`${product.vendor_code} ${product.vendor_desc}`}
                          onSelect={() => handleSelectProduct(product)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              vendorCode === product.vendor_code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{product.vendor_code}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[280px]">
                              {product.vendor_desc}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                หรือกรอกเอง
              </span>
            </div>
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
