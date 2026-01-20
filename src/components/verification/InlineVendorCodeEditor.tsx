import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, Pencil, X, Loader2, Search, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePOActionLog } from '@/hooks/usePOActionLog';
import { fetchProductMappings, createProductMapping, updatePOItem } from '@/lib/api/database';
import { findSimilarMatches, getSimilarityColor } from '@/lib/utils/similarity';
import { cn } from '@/lib/utils';

interface ProductMapping {
  id: string;
  customer_code: string;
  customer_desc: string;
  vendor_code: string;
  vendor_desc: string;
}

interface InlineVendorCodeEditorProps {
  itemId: string;
  poId: string;
  customerCode: string;
  customerDesc: string;
  currentVendorCode: string | null;
  currentVendorDesc: string | null;
  unit: string;
  isMapped: boolean;
  onSuccess: () => void;
  canEdit: boolean;
}

export function InlineVendorCodeEditor({
  itemId,
  poId,
  customerCode,
  customerDesc,
  currentVendorCode,
  currentVendorDesc,
  unit,
  isMapped,
  onSuccess,
  canEdit,
}: InlineVendorCodeEditorProps) {
  const { toast } = useToast();
  const { logAction } = usePOActionLog();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendorCode, setVendorCode] = useState(currentVendorCode || '');
  const [vendorDesc, setVendorDesc] = useState(currentVendorDesc || '');
  const [searchOpen, setSearchOpen] = useState(false);
  const [allMappings, setAllMappings] = useState<ProductMapping[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);

  useEffect(() => {
    setVendorCode(currentVendorCode || '');
    setVendorDesc(currentVendorDesc || '');
  }, [currentVendorCode, currentVendorDesc]);

  const loadMappings = useCallback(async () => {
    if (allMappings.length > 0) return;
    
    setLoadingMappings(true);
    try {
      const mappings = await fetchProductMappings();
      setAllMappings((mappings || []).map((m: any) => ({
        id: m.id,
        customer_code: m.customer_code || '',
        customer_desc: m.customer_desc || '',
        vendor_code: m.vendor_code || '',
        vendor_desc: m.vendor_desc || '',
      })));
    } catch (error) {
      console.error('Error loading mappings:', error);
    } finally {
      setLoadingMappings(false);
    }
  }, [allMappings.length]);

  useEffect(() => {
    if (isEditing) {
      loadMappings();
    }
  }, [isEditing, loadMappings]);

  // Find similar mappings
  const similarMappings = useMemo(() => {
    if (allMappings.length === 0) return [];
    
    const codeMatches = findSimilarMatches<ProductMapping>(
      customerCode,
      allMappings,
      (m) => m.customer_code,
      50
    );
    
    const descMatches = findSimilarMatches<ProductMapping>(
      customerDesc,
      allMappings,
      (m) => m.customer_desc,
      40
    );

    // Merge and deduplicate
    const allMatches = new Map<string, { item: ProductMapping; similarity: number; matchType: 'code' | 'desc' }>();
    
    codeMatches.forEach(m => {
      allMatches.set(m.item.id, { ...m, matchType: 'code' });
    });
    
    descMatches.forEach(m => {
      if (!allMatches.has(m.item.id)) {
        allMatches.set(m.item.id, { ...m, matchType: 'desc' });
      }
    });

    return Array.from(allMatches.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  }, [customerCode, customerDesc, allMappings]);

  // Unique vendor products for search
  const uniqueVendorProducts = useMemo(() => {
    const unique = new Map<string, ProductMapping>();
    allMappings.forEach(m => {
      if (m.vendor_code && !unique.has(m.vendor_code)) {
        unique.set(m.vendor_code, m);
      }
    });
    return Array.from(unique.values());
  }, [allMappings]);

  const handleSelectMapping = (mapping: ProductMapping) => {
    setVendorCode(mapping.vendor_code);
    setVendorDesc(mapping.vendor_desc);
    setSearchOpen(false);
  };

  const handleSave = async () => {
    if (!vendorCode.trim()) {
      toast({
        title: 'กรุณากรอกรหัสสินค้า',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Update the PO item
      await updatePOItem(itemId, {
        vendor_product_code: vendorCode.trim(),
        vendor_description: vendorDesc.trim(),
        is_mapped: true,
      });

      // Check if we need to create a new mapping
      const existingMapping = allMappings.find(
        m => m.customer_code === customerCode
      );

      if (!existingMapping) {
        // Create new product mapping
        await createProductMapping({
          customer_code: customerCode,
          customer_desc: customerDesc,
          vendor_code: vendorCode.trim(),
          vendor_desc: vendorDesc.trim(),
          unit,
          active: true,
        });

        toast({
          title: 'สร้าง Mapping สินค้าใหม่',
          description: `${customerCode} → ${vendorCode}`,
        });
      }

      // Log the action
      await logAction(poId, 'edited', {
        description: `แก้ไขรหัส Vendor สินค้า ${customerCode}`,
        changes: [
          `รหัส Vendor: ${currentVendorCode || '-'} → ${vendorCode}`,
          `รายละเอียด: ${currentVendorDesc || '-'} → ${vendorDesc}`,
        ],
      });

      toast({
        title: 'บันทึกสำเร็จ',
        description: `อัปเดตรหัส Vendor เป็น ${vendorCode}`,
      });

      setIsEditing(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving vendor code:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกข้อมูลได้',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setVendorCode(currentVendorCode || '');
    setVendorDesc(currentVendorDesc || '');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-1 group">
        {currentVendorCode ? (
          <span className="font-mono text-sm text-green-600">{currentVendorCode}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 min-w-[200px]">
      {/* Similar Mappings Suggestions */}
      {similarMappings.length > 0 && (
        <div className="p-2 bg-muted/50 rounded border space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-yellow-500" />
            <span>แนะนำ:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {similarMappings.slice(0, 3).map((match) => (
              <Badge
                key={match.item.id}
                variant="outline"
                className={cn(
                  "cursor-pointer hover:bg-accent text-xs",
                  getSimilarityColor(match.similarity)
                )}
                onClick={() => handleSelectMapping(match.item)}
              >
                {match.item.vendor_code}
                <span className="ml-1 opacity-60">{match.similarity}%</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Vendor Code Input with Search */}
      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value)}
              placeholder="รหัส Vendor"
              className="pr-8 text-sm h-8"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-3 h-3" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="ค้นหาสินค้า Vendor..." />
            <CommandList>
              <CommandEmpty>
                {loadingMappings ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  'ไม่พบสินค้า'
                )}
              </CommandEmpty>
              <CommandGroup heading="สินค้า Vendor">
                {uniqueVendorProducts.slice(0, 20).map((product) => (
                  <CommandItem
                    key={product.id}
                    value={`${product.vendor_code} ${product.vendor_desc}`}
                    onSelect={() => handleSelectMapping(product)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm">{product.vendor_code}</p>
                      <p className="text-xs text-muted-foreground truncate">{product.vendor_desc}</p>
                    </div>
                    {vendorCode === product.vendor_code && (
                      <Check className="w-4 h-4 ml-2 text-green-600" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Vendor Description */}
      <Input
        value={vendorDesc}
        onChange={(e) => setVendorDesc(e.target.value)}
        placeholder="รายละเอียด Vendor"
        className="text-sm h-8"
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-green-600 hover:text-green-700"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
