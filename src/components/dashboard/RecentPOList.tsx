import { POHeader, STATUS_LABELS, STATUS_CLASSES } from '@/types/po';
import { FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RecentPOListProps {
  poList: POHeader[];
}

export function RecentPOList({ poList }: RecentPOListProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  return (
    <div className="bg-card rounded-xl border">
      <div className="p-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">รายการ PO ล่าสุด</h3>
            <p className="text-sm text-muted-foreground">อัปเดตล่าสุด</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/po-list" className="flex items-center gap-1">
            ดูทั้งหมด
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <div className="divide-y">
        {poList.slice(0, 5).map((po, index) => (
          <div 
            key={po.id} 
            className="p-4 hover:bg-muted/30 transition-colors animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {po.poNumber.slice(-3)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{po.poNumber}</p>
                  <p className="text-sm text-muted-foreground">{po.supplierName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{formatCurrency(po.grandTotal)}</p>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className={cn('status-badge', STATUS_CLASSES[po.status])}>
                    {STATUS_LABELS[po.status]}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>📅 วันครบกำหนด: {formatDate(po.dueDate)}</span>
              <span>🏢 {po.branch}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
