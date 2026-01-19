import { AlertTriangle, Building2, MapPin, Package, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MappingStats {
  totalPOs: number;
  unmappedCustomer: number;
  unmappedBranch: number;
  unmappedProducts: number;
}

interface MappingAlertBannerProps {
  stats: MappingStats;
}

export function MappingAlertBanner({ stats }: MappingAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const hasIssues = stats.unmappedCustomer > 0 || stats.unmappedBranch > 0 || stats.unmappedProducts > 0;

  if (!hasIssues || dismissed) return null;

  return (
    <Alert className="bg-yellow-500/10 border-yellow-500/30 mb-4">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-yellow-700 font-medium">พบ PO ที่ยังไม่ได้ Mapping ครบถ้วน:</span>
          
          {stats.unmappedCustomer > 0 && (
            <div className="flex items-center gap-1.5 text-sm bg-yellow-500/20 px-2 py-1 rounded">
              <Building2 className="w-3.5 h-3.5 text-yellow-600" />
              <span className="text-yellow-700">ลูกค้า: {stats.unmappedCustomer} รายการ</span>
            </div>
          )}
          
          {stats.unmappedBranch > 0 && (
            <div className="flex items-center gap-1.5 text-sm bg-yellow-500/20 px-2 py-1 rounded">
              <MapPin className="w-3.5 h-3.5 text-yellow-600" />
              <span className="text-yellow-700">สาขา: {stats.unmappedBranch} รายการ</span>
            </div>
          )}
          
          {stats.unmappedProducts > 0 && (
            <div className="flex items-center gap-1.5 text-sm bg-orange-500/20 px-2 py-1 rounded">
              <Package className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-orange-700">สินค้า: {stats.unmappedProducts} รายการ</span>
            </div>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/20"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
