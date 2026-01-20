import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, MapPin, Package, Loader2, Search, Check, Sparkles, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  createCustomerMapping, 
  createCustomerBranchMapping, 
  createProductMapping,
  findCustomerMappingByName,
  fetchProductMappings,
  fetchCustomerMappings,
  fetchAllCustomerBranchMappings,
  updateCustomerMapping,
  updateCustomerBranchMapping
} from '@/lib/api/database';
import { cn } from '@/lib/utils';
import { calculateSimilarity, findSimilarMatches, getSimilarityColor, type SimilarMatch } from '@/lib/utils/similarity';
import { supabase } from '@/integrations/supabase/client';

interface VendorProduct {
  id: string;
  vendor_code: string;
  vendor_desc: string;
  customer_code?: string;
  customer_desc?: string;
}

interface ProductMapping {
  id: string;
  customer_code: string;
  customer_desc: string;
  vendor_code: string;
  vendor_desc: string;
}

interface CustomerMapping {
  id: string;
  customer_name: string;
  vendor_customer_code: string;
  vendor_customer_name: string;
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
  const [allCustomerMappings, setAllCustomerMappings] = useState<CustomerMapping[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);

  // Load existing customer mappings
  const loadCustomerMappings = useCallback(async () => {
    if (allCustomerMappings.length > 0) return;
    
    setLoadingMappings(true);
    try {
      const mappings = await fetchCustomerMappings();
      setAllCustomerMappings((mappings || []).map((m: any) => ({
        id: m.id,
        customer_name: m.customer_name || '',
        vendor_customer_code: m.vendor_customer_code || '',
        vendor_customer_name: m.vendor_customer_name || '',
      })));
    } catch (error) {
      console.error('Error loading customer mappings:', error);
    } finally {
      setLoadingMappings(false);
    }
  }, [allCustomerMappings.length]);

  useEffect(() => {
    if (open) {
      loadCustomerMappings();
    }
  }, [open, loadCustomerMappings]);

  // Find similar customer mappings
  const similarMappings = useMemo(() => {
    if (!customerName || allCustomerMappings.length === 0) return [];
    
    const matches = findSimilarMatches<CustomerMapping>(
      customerName,
      allCustomerMappings,
      (m) => m.customer_name,
      50
    );
    
    return matches.slice(0, 5);
  }, [customerName, allCustomerMappings]);

  const handleSelectMapping = (mapping: CustomerMapping) => {
    setVendorCode(mapping.vendor_customer_code);
    setVendorName(mapping.vendor_customer_name);
  };

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
      // Check if mapping already exists
      const existingMapping = await findCustomerMappingByName(customerName);
      
      if (existingMapping) {
        // Update existing mapping
        await updateCustomerMapping(existingMapping.id, {
          vendor_customer_code: vendorCode,
          vendor_customer_name: vendorName,
        });
        
        toast({
          title: 'อัพเดท Mapping ลูกค้าสำเร็จ',
          description: `${customerName} → ${vendorName}`,
        });
      } else {
        // Create new mapping
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
      }

      // Auto-update all PO headers with this customer name that don't have vendor_customer_code yet
      const { data: posToUpdate, error: fetchError } = await supabase
        .from('po_headers')
        .select('id, customer_name')
        .is('vendor_customer_code', null);

      if (!fetchError && posToUpdate && posToUpdate.length > 0) {
        // Filter POs that match the customer name (fuzzy or exact)
        const matchingPOs = posToUpdate.filter(po => 
          po.customer_name === customerName || 
          calculateSimilarity(po.customer_name || '', customerName) >= 85
        );

        if (matchingPOs.length > 0) {
          const { error: updateError } = await supabase
            .from('po_headers')
            .update({
              vendor_customer_code: vendorCode,
              vendor_customer_name: vendorName,
              is_customer_mapped: true,
            })
            .in('id', matchingPOs.map(po => po.id));

          if (!updateError) {
            toast({
              title: 'อัพเดท PO อัตโนมัติ',
              description: `อัพเดท ${matchingPOs.length} PO ที่มีลูกค้า "${customerName}"`,
            });
          }
        }
      }

      setOpen(false);
      setVendorCode('');
      setVendorName('');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating customer mapping:', error);
      const errorMessage = error?.message?.includes('duplicate') 
        ? 'ลูกค้านี้มี mapping อยู่แล้ว' 
        : 'ไม่สามารถสร้าง mapping ได้';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
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
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>ชื่อลูกค้า (จาก PO)</Label>
            <Input value={customerName} disabled className="bg-muted" />
          </div>

          {/* Similar Customer Mappings Suggestions */}
          {similarMappings.length > 0 && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span>ลูกค้าที่คล้ายกัน (แนะนำ)</span>
              </div>
              <div className="space-y-2">
                {similarMappings.map((match) => (
                  <div
                    key={match.item.id}
                    className="flex items-center justify-between p-2 bg-background rounded border cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelectMapping(match.item)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{match.item.customer_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-xs font-medium">{match.item.vendor_customer_code}</span>
                        <span className="text-xs text-muted-foreground truncate">{match.item.vendor_customer_name}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={match.similarity >= 90 ? 'default' : match.similarity >= 70 ? 'secondary' : 'outline'}
                      className={cn("ml-2 shrink-0", getSimilarityColor(match.similarity))}
                    >
                      {match.similarity}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

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

interface BranchMapping {
  id: string;
  branch: string;
  vendor_branch_code: string | null;
  vendor_branch_name: string | null;
  customer_mapping_id: string;
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
  const [allBranchMappings, setAllBranchMappings] = useState<BranchMapping[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);

  // Load existing branch mappings
  const loadBranchMappings = useCallback(async () => {
    if (allBranchMappings.length > 0) return;
    
    setLoadingMappings(true);
    try {
      const mappings = await fetchAllCustomerBranchMappings();
      setAllBranchMappings((mappings || []).map((m: any) => ({
        id: m.id,
        branch: m.branch || '',
        vendor_branch_code: m.vendor_branch_code,
        vendor_branch_name: m.vendor_branch_name,
        customer_mapping_id: m.customer_mapping_id,
      })));
    } catch (error) {
      console.error('Error loading branch mappings:', error);
    } finally {
      setLoadingMappings(false);
    }
  }, [allBranchMappings.length]);

  useEffect(() => {
    if (open) {
      loadBranchMappings();
    }
  }, [open, loadBranchMappings]);

  // Find similar branch mappings
  const similarMappings = useMemo(() => {
    if (!branch || allBranchMappings.length === 0) return [];
    
    const matches = findSimilarMatches<BranchMapping>(
      branch,
      allBranchMappings.filter(m => m.vendor_branch_code), // Only show mapped branches
      (m) => m.branch,
      50
    );
    
    return matches.slice(0, 5);
  }, [branch, allBranchMappings]);

  const handleSelectMapping = (mapping: BranchMapping) => {
    setVendorCode(mapping.vendor_branch_code || '');
    setVendorName(mapping.vendor_branch_name || '');
  };

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

      // Check if branch mapping already exists
      const existingBranchMapping = allBranchMappings.find(
        m => m.customer_mapping_id === customerMapping.id && m.branch === branch
      );

      if (existingBranchMapping) {
        // Update existing mapping
        await updateCustomerBranchMapping(existingBranchMapping.id, {
          vendor_branch_code: vendorCode,
          vendor_branch_name: vendorName,
        });

        toast({
          title: 'อัพเดท Mapping สาขาสำเร็จ',
          description: `${branch} → ${vendorName}`,
        });
      } else {
        // Create new mapping
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
      }

      // Auto-update all PO headers with this branch that don't have vendor_branch_code yet
      const { data: posToUpdate, error: fetchError } = await supabase
        .from('po_headers')
        .select('id, branch, customer_name')
        .eq('branch', branch)
        .is('vendor_branch_code', null);

      if (!fetchError && posToUpdate && posToUpdate.length > 0) {
        // Filter POs that match the customer name (fuzzy or exact)
        const matchingPOs = posToUpdate.filter(po => 
          po.customer_name === customerName || 
          calculateSimilarity(po.customer_name || '', customerName) >= 85
        );

        if (matchingPOs.length > 0) {
          const { error: updateError } = await supabase
            .from('po_headers')
            .update({
              vendor_branch_code: vendorCode,
              vendor_branch_name: vendorName,
            })
            .in('id', matchingPOs.map(po => po.id));

          if (!updateError) {
            toast({
              title: 'อัพเดท PO อัตโนมัติ',
              description: `อัพเดท ${matchingPOs.length} PO ที่มีสาขา "${branch}"`,
            });
          }
        }
      }

      setOpen(false);
      setVendorCode('');
      setVendorName('');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating branch mapping:', error);
      const errorMessage = error?.message?.includes('duplicate') 
        ? 'สาขานี้มี mapping อยู่แล้ว' 
        : 'ไม่สามารถสร้าง mapping ได้';
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
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
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
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

          {/* Similar Branch Mappings Suggestions */}
          {similarMappings.length > 0 && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span>สาขาที่คล้ายกัน (แนะนำ)</span>
              </div>
              <div className="space-y-2">
                {similarMappings.map((match) => (
                  <div
                    key={match.item.id}
                    className="flex items-center justify-between p-2 bg-background rounded border cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelectMapping(match.item)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{match.item.branch}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-xs font-medium">{match.item.vendor_branch_code}</span>
                        <span className="text-xs text-muted-foreground truncate">{match.item.vendor_branch_name}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={match.similarity >= 90 ? 'default' : match.similarity >= 70 ? 'secondary' : 'outline'}
                      className={cn("ml-2 shrink-0", getSimilarityColor(match.similarity))}
                    >
                      {match.similarity}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

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
  const [allMappings, setAllMappings] = useState<ProductMapping[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load existing vendor products for autocomplete
  const loadVendorProducts = useCallback(async () => {
    if (vendorProducts.length > 0) return; // Already loaded
    
    setLoadingProducts(true);
    try {
      const mappings = await fetchProductMappings();
      // Store all mappings for similarity matching
      setAllMappings((mappings || []).map((m: any) => ({
        id: m.id,
        customer_code: m.customer_code || '',
        customer_desc: m.customer_desc || '',
        vendor_code: m.vendor_code || '',
        vendor_desc: m.vendor_desc || '',
      })));

      // Get unique vendor products
      const uniqueProducts = new Map<string, VendorProduct>();
      (mappings || []).forEach((m: any) => {
        if (m.vendor_code && !uniqueProducts.has(m.vendor_code)) {
          uniqueProducts.set(m.vendor_code, {
            id: m.id,
            vendor_code: m.vendor_code,
            vendor_desc: m.vendor_desc || '',
            customer_code: m.customer_code,
            customer_desc: m.customer_desc,
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

  // Find similar mappings based on customer code
  const similarMappings = useMemo(() => {
    if (!customerCode || allMappings.length === 0) return [];
    
    const matches = findSimilarMatches<ProductMapping>(
      customerCode,
      allMappings,
      (m) => m.customer_code,
      60 // minimum 60% similarity
    );
    
    return matches.slice(0, 5); // Top 5 matches
  }, [customerCode, allMappings]);

  // Find similar mappings based on customer description
  const similarDescMappings = useMemo(() => {
    if (!customerDesc || allMappings.length === 0) return [];
    
    const matches = findSimilarMatches<ProductMapping>(
      customerDesc,
      allMappings,
      (m) => m.customer_desc,
      50 // minimum 50% similarity
    );
    
    return matches.slice(0, 3); // Top 3 matches
  }, [customerDesc, allMappings]);

  const handleSelectProduct = (product: VendorProduct) => {
    setVendorCode(product.vendor_code);
    setVendorDesc(product.vendor_desc);
    setSearchOpen(false);
  };

  const handleSelectSimilarMapping = (mapping: ProductMapping) => {
    setVendorCode(mapping.vendor_code);
    setVendorDesc(mapping.vendor_desc);
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
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>รหัสสินค้าลูกค้า</Label>
            <Input value={customerCode} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>รายละเอียดสินค้าลูกค้า</Label>
            <Input value={customerDesc} disabled className="bg-muted" />
          </div>

          {/* Similar Mappings Suggestions */}
          {(similarMappings.length > 0 || similarDescMappings.length > 0) && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span>Mapping ที่คล้ายกัน (แนะนำ)</span>
              </div>
              
              {similarMappings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">จากรหัสสินค้า:</p>
                  {similarMappings.map((match) => (
                    <div
                      key={match.item.id}
                      className="flex items-center justify-between p-2 bg-background rounded border cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectSimilarMapping(match.item)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono">{match.item.customer_code}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-xs font-medium">{match.item.vendor_code}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {match.item.vendor_desc}
                        </p>
                      </div>
                      <Badge 
                        variant={match.similarity >= 90 ? 'default' : match.similarity >= 70 ? 'secondary' : 'outline'}
                        className={cn("ml-2 shrink-0", getSimilarityColor(match.similarity))}
                      >
                        {match.similarity}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {similarDescMappings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">จากรายละเอียด:</p>
                  {similarDescMappings.map((match) => (
                    <div
                      key={`desc-${match.item.id}`}
                      className="flex items-center justify-between p-2 bg-background rounded border cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectSimilarMapping(match.item)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{match.item.customer_desc}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-xs font-medium">{match.item.vendor_code}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={match.similarity >= 90 ? 'default' : match.similarity >= 70 ? 'secondary' : 'outline'}
                        className={cn("ml-2 shrink-0", getSimilarityColor(match.similarity))}
                      >
                        {match.similarity}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
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

// Edit Customer Name Dialog - สำหรับแก้ไขชื่อลูกค้าที่ AI อ่านผิด
interface EditCustomerNameDialogProps {
  poId: string;
  currentCustomerName: string;
  onSuccess: (newName: string) => void;
}

export function EditCustomerNameDialog({ poId, currentCustomerName, onSuccess }: EditCustomerNameDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState(currentCustomerName);
  const [allCustomerMappings, setAllCustomerMappings] = useState<CustomerMapping[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);

  // Reset name when dialog opens
  useEffect(() => {
    if (open) {
      setCustomerName(currentCustomerName);
      loadCustomerMappings();
    }
  }, [open, currentCustomerName]);

  const loadCustomerMappings = async () => {
    if (allCustomerMappings.length > 0) return;
    
    setLoadingMappings(true);
    try {
      const mappings = await fetchCustomerMappings();
      setAllCustomerMappings((mappings || []).map((m: any) => ({
        id: m.id,
        customer_name: m.customer_name || '',
        vendor_customer_code: m.vendor_customer_code || '',
        vendor_customer_name: m.vendor_customer_name || '',
      })));
    } catch (error) {
      console.error('Error loading customer mappings:', error);
    } finally {
      setLoadingMappings(false);
    }
  };

  // Find similar customer names from mappings
  const similarMappings = useMemo(() => {
    if (!customerName || allCustomerMappings.length === 0) return [];
    
    const matches = findSimilarMatches<CustomerMapping>(
      customerName,
      allCustomerMappings,
      (m) => m.customer_name,
      60
    );
    
    return matches.slice(0, 5);
  }, [customerName, allCustomerMappings]);

  const handleSelectSuggestion = (mapping: CustomerMapping) => {
    setCustomerName(mapping.customer_name);
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast({
        title: 'กรุณากรอกชื่อลูกค้า',
        variant: 'destructive',
      });
      return;
    }

    if (customerName === currentCustomerName) {
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('po_headers')
        .update({ 
          customer_name: customerName.trim(),
          is_customer_mapped: false, // Reset mapping status to allow re-match
          vendor_customer_code: null,
          vendor_customer_name: null,
        })
        .eq('id', poId);

      if (error) throw error;

      // Save edit history
      await supabase.from('po_edit_history').insert({
        po_id: poId,
        field_name: 'customer_name',
        old_value: currentCustomerName,
        new_value: customerName.trim(),
      });

      toast({
        title: 'แก้ไขชื่อลูกค้าสำเร็จ',
        description: `เปลี่ยนจาก "${currentCustomerName}" เป็น "${customerName}"`,
      });

      setOpen(false);
      onSuccess(customerName.trim());
    } catch (error) {
      console.error('Error updating customer name:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถแก้ไขชื่อลูกค้าได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1 hover:bg-primary/10" title="แก้ไขชื่อลูกค้า">
          <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            แก้ไขชื่อลูกค้า
          </DialogTitle>
          <DialogDescription>
            แก้ไขชื่อลูกค้าที่ AI อ่านมาผิด เพื่อให้สามารถจับคู่ Mapping ได้ถูกต้อง
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>ชื่อลูกค้าปัจจุบัน (จาก AI)</Label>
            <Input value={currentCustomerName} disabled className="bg-muted text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newCustomerName">ชื่อลูกค้าที่ถูกต้อง *</Label>
            <Input
              id="newCustomerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="กรอกชื่อลูกค้าที่ถูกต้อง"
              className="border-primary/50"
            />
          </div>

          {/* Similar Customer Names Suggestions */}
          {similarMappings.length > 0 && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span>ชื่อลูกค้าที่ใกล้เคียง (แนะนำ)</span>
              </div>
              <div className="space-y-2">
                {similarMappings.map((match) => (
                  <div
                    key={match.item.id}
                    className="flex items-center justify-between p-2 bg-background rounded border cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelectSuggestion(match.item)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate font-medium">{match.item.customer_name}</p>
                      {match.item.vendor_customer_code && (
                        <p className="text-xs text-muted-foreground">
                          รหัส: {match.item.vendor_customer_code}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant={match.similarity >= 90 ? 'default' : match.similarity >= 70 ? 'secondary' : 'outline'}
                      className={cn("ml-2 shrink-0", getSimilarityColor(match.similarity))}
                    >
                      {match.similarity}%
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                คลิกเพื่อใช้ชื่อที่แนะนำ
              </p>
            </div>
          )}
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

// ===== EditBranchNameDialog =====
interface EditBranchNameDialogProps {
  poId: string;
  currentBranch: string;
  onSuccess: (newBranch: string) => void;
}

export function EditBranchNameDialog({ poId, currentBranch, onSuccess }: EditBranchNameDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branchName, setBranchName] = useState(currentBranch);
  const [allBranchMappings, setAllBranchMappings] = useState<BranchMapping[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);

  useEffect(() => {
    if (open) {
      setBranchName(currentBranch);
    }
  }, [open, currentBranch]);

  // Load existing branch mappings
  const loadBranchMappings = useCallback(async () => {
    if (allBranchMappings.length > 0) return;
    
    setLoadingMappings(true);
    try {
      const mappings = await fetchAllCustomerBranchMappings();
      setAllBranchMappings((mappings || []).map((m: any) => ({
        id: m.id,
        branch: m.branch || '',
        vendor_branch_code: m.vendor_branch_code,
        vendor_branch_name: m.vendor_branch_name,
        customer_mapping_id: m.customer_mapping_id,
      })));
    } catch (error) {
      console.error('Error loading branch mappings:', error);
    } finally {
      setLoadingMappings(false);
    }
  }, [allBranchMappings.length]);

  useEffect(() => {
    if (open) {
      loadBranchMappings();
    }
  }, [open, loadBranchMappings]);

  // Find similar branch mappings - compare with original AI-extracted branch (currentBranch)
  const similarMappings = useMemo(() => {
    if (!currentBranch || allBranchMappings.length === 0) return [];
    
    // Get unique branches with mappings
    const uniqueBranches = new Map<string, BranchMapping>();
    allBranchMappings
      .filter(m => m.vendor_branch_code)
      .forEach(m => {
        if (!uniqueBranches.has(m.branch)) {
          uniqueBranches.set(m.branch, m);
        }
      });
    
    const matches = findSimilarMatches<BranchMapping>(
      currentBranch, // Always compare with original AI-extracted branch
      Array.from(uniqueBranches.values()),
      (m) => m.branch,
      50 // Lower threshold to show more suggestions
    );
    
    return matches.slice(0, 5);
  }, [currentBranch, allBranchMappings]);

  const handleSelectSuggestion = (mapping: BranchMapping) => {
    setBranchName(mapping.branch);
  };

  const handleSubmit = async () => {
    if (!branchName.trim()) {
      toast({
        title: 'กรุณากรอกชื่อสาขา',
        variant: 'destructive',
      });
      return;
    }

    if (branchName === currentBranch) {
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('po_headers')
        .update({ 
          branch: branchName.trim(),
        })
        .eq('id', poId);

      if (error) throw error;

      // Save edit history
      await supabase.from('po_edit_history').insert({
        po_id: poId,
        field_name: 'branch',
        old_value: currentBranch,
        new_value: branchName.trim(),
      });

      toast({
        title: 'แก้ไขชื่อสาขาสำเร็จ',
        description: `เปลี่ยนจาก "${currentBranch}" เป็น "${branchName}"`,
      });

      setOpen(false);
      onSuccess(branchName.trim());
    } catch (error) {
      console.error('Error updating branch name:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถแก้ไขชื่อสาขาได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1 hover:bg-primary/10" title="แก้ไขชื่อสาขา">
          <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            แก้ไขชื่อสาขา
          </DialogTitle>
          <DialogDescription>
            แก้ไขชื่อสาขาที่ AI อ่านมาผิด เพื่อให้สามารถจับคู่ Mapping ได้ถูกต้อง
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>ชื่อสาขา (จาก PO)</Label>
            <Input value={currentBranch} disabled className="bg-muted text-muted-foreground font-medium" />
            <p className="text-xs text-muted-foreground">ค่าที่ AI วิเคราะห์ได้จากเอกสาร PO</p>
          </div>

          {/* Comparison with existing mappings */}
          {similarMappings.length > 0 && (
            <div className="space-y-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                <Sparkles className="w-4 h-4" />
                <span>เปรียบเทียบกับ Mapping ที่มีอยู่</span>
              </div>
              <div className="space-y-2">
                {similarMappings.map((match) => (
                  <div
                    key={match.item.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      branchName === match.item.branch 
                        ? "bg-green-100 dark:bg-green-900/30 border-green-500 ring-2 ring-green-500/30" 
                        : "bg-background hover:bg-accent"
                    )}
                    onClick={() => handleSelectSuggestion(match.item)}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm truncate font-medium">{match.item.branch}</p>
                        {branchName === match.item.branch && (
                          <Badge variant="default" className="bg-green-600 text-white text-xs">เลือกแล้ว</Badge>
                        )}
                      </div>
                      {match.item.vendor_branch_code && (
                        <p className="text-xs text-muted-foreground">
                          รหัสสาขา (ผู้จำหน่าย): <span className="font-medium">{match.item.vendor_branch_code}</span>
                          <span className="mx-2">|</span>
                          ชื่อสาขา (ผู้จำหน่าย): <span className="font-medium">{match.item.vendor_branch_name}</span>
                        </p>
                      )}
                    </div>
                    <div className="ml-3 shrink-0 flex flex-col items-end gap-1">
                      <Badge 
                        variant={match.similarity >= 90 ? 'default' : match.similarity >= 70 ? 'secondary' : 'outline'}
                        className={cn(
                          match.similarity >= 90 ? 'bg-green-600' : 
                          match.similarity >= 70 ? 'bg-yellow-500' : 
                          'bg-orange-500',
                          'text-white'
                        )}
                      >
                        {match.similarity}% ตรงกัน
                      </Badge>
                      {match.similarity === 100 && (
                        <span className="text-xs text-green-600 font-medium">Exact Match</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                คลิกเพื่อเลือกสาขาที่ต้องการใช้ - ระบบจะอัปเดตชื่อสาขาให้ตรงกับ Mapping
              </p>
            </div>
          )}

          {similarMappings.length === 0 && !loadingMappings && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ไม่พบ Mapping สาขาที่ใกล้เคียง - อาจต้องเพิ่ม Mapping ใหม่ในหน้า Mapping ลูกค้า
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newBranchName">ชื่อสาขาที่จะใช้ *</Label>
            <Input
              id="newBranchName"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="กรอกชื่อสาขาที่ถูกต้อง หรือเลือกจากด้านบน"
              className="border-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              แก้ไขให้ตรงกับชื่อสาขาใน Mapping เพื่อให้ระบบจับคู่ได้อัตโนมัติ
            </p>
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
