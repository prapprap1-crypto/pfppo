import { AlertTriangle, Building2, MapPin, Package, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface UnmappedPOInfo {
  id: string;
  poNumber: string;
  customerName?: string;
  branch?: string;
}

interface MappingStats {
  totalPOs: number;
  unmappedCustomer: number;
  unmappedBranch: number;
  unmappedProducts: number;
  unmappedCustomerPOs?: UnmappedPOInfo[];
  unmappedBranchPOs?: UnmappedPOInfo[];
}

interface MappingAlertBannerProps {
  stats: MappingStats;
}

export function MappingAlertBanner({ stats }: MappingAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'customer' | 'branch' | 'product' | null>(null);

  const hasIssues = stats.unmappedCustomer > 0 || stats.unmappedBranch > 0 || stats.unmappedProducts > 0;

  if (!hasIssues || dismissed) return null;

  const toggleSection = (section: 'customer' | 'branch' | 'product') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Alert className="bg-yellow-500/10 border-yellow-500/30 mb-4">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-yellow-700 font-medium">พบ PO ที่ยังไม่ได้ Mapping ครบถ้วน:</span>
            
            {stats.unmappedCustomer > 0 && (
              <button
                onClick={() => toggleSection('customer')}
                className="flex items-center gap-1.5 text-sm bg-yellow-500/20 px-2 py-1 rounded hover:bg-yellow-500/30 transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-yellow-700">ลูกค้า: {stats.unmappedCustomer} รายการ</span>
                {expandedSection === 'customer' ? (
                  <ChevronUp className="w-3 h-3 text-yellow-600" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-yellow-600" />
                )}
              </button>
            )}
            
            {stats.unmappedBranch > 0 && (
              <button
                onClick={() => toggleSection('branch')}
                className="flex items-center gap-1.5 text-sm bg-yellow-500/20 px-2 py-1 rounded hover:bg-yellow-500/30 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-yellow-700">สาขา: {stats.unmappedBranch} รายการ</span>
                {expandedSection === 'branch' ? (
                  <ChevronUp className="w-3 h-3 text-yellow-600" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-yellow-600" />
                )}
              </button>
            )}
            
            {stats.unmappedProducts > 0 && (
              <button
                onClick={() => toggleSection('product')}
                className="flex items-center gap-1.5 text-sm bg-orange-500/20 px-2 py-1 rounded hover:bg-orange-500/30 transition-colors cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 text-orange-600" />
                <span className="text-orange-700">สินค้า: {stats.unmappedProducts} รายการ</span>
                {expandedSection === 'product' ? (
                  <ChevronUp className="w-3 h-3 text-orange-600" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-orange-600" />
                )}
              </button>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/20 shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Expanded detail sections */}
        {expandedSection === 'customer' && stats.unmappedCustomerPOs && stats.unmappedCustomerPOs.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-xs font-medium text-yellow-700 mb-2">PO ที่ลูกค้ายังไม่ได้ Mapping:</p>
            <div className="flex flex-wrap gap-2">
              {stats.unmappedCustomerPOs.map(po => (
                <Link
                  key={po.id}
                  to={`/verification/${po.id}`}
                  className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-800 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
                >
                  <span className="font-medium">{po.poNumber}</span>
                  {po.customerName && <span className="text-yellow-600">({po.customerName})</span>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {expandedSection === 'branch' && stats.unmappedBranchPOs && stats.unmappedBranchPOs.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-xs font-medium text-yellow-700 mb-2">PO ที่สาขายังไม่ได้ Mapping:</p>
            <div className="flex flex-wrap gap-2">
              {stats.unmappedBranchPOs.map(po => (
                <Link
                  key={po.id}
                  to={`/verification/${po.id}`}
                  className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-800 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
                >
                  <span className="font-medium">{po.poNumber}</span>
                  {po.branch && <span className="text-yellow-600">({po.branch})</span>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {expandedSection === 'product' && (
          <div className="mt-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <p className="text-xs text-orange-700">
              มีสินค้า {stats.unmappedProducts} รายการที่ยังไม่ได้ Mapping รหัสสินค้า
            </p>
            <Link
              to="/mapping"
              className="text-xs text-orange-700 font-medium hover:underline mt-1 inline-block"
            >
              → ไปหน้า Mapping สินค้า
            </Link>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
