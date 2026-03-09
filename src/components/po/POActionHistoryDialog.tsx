import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  FileInput, 
  CheckCircle2, 
  FileSpreadsheet, 
  Trash2, 
  Pencil, 
  RefreshCw,
  Loader2,
  ArrowRight,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { getActionLabel, POActionDetails } from '@/hooks/usePOActionLog';

interface ActionLogItem {
  id: string;
  action: string;
  details: POActionDetails | null;
  created_at: string;
  user_id: string | null;
  user_name?: string;
  user_email?: string;
}

interface POActionHistoryDialogProps {
  poId: string;
  poNumber?: string;
}

export function POActionHistoryDialog({ poId, poNumber }: POActionHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ActionLogItem[]>([]);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, poId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('po_action_logs')
        .select('*')
        .eq('po_id', poId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set((data || []).map(log => log.user_id).filter(Boolean))] as string[];

      // Fetch profiles for those user IDs
      let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profiles) {
          profileMap = new Map(profiles.map(p => [p.id, p]));
        }
      }
      
      // Map database response to ActionLogItem with user info
      const mappedHistory: ActionLogItem[] = (data || []).map(item => {
        const profile = item.user_id ? profileMap.get(item.user_id) : null;
        return {
          id: item.id,
          action: item.action,
          details: item.details as POActionDetails | null,
          created_at: item.created_at,
          user_id: item.user_id,
          user_name: profile?.full_name || undefined,
          user_email: profile?.email || undefined,
        };
      });
      
      setHistory(mappedHistory);
    } catch (error) {
      console.error('Error loading action history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'imported':
        return <FileInput className="w-4 h-4" />;
      case 'verified':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'exported':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4" />;
      case 'edited':
        return <Pencil className="w-4 h-4" />;
      case 'mapping_updated':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'imported':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'verified':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'exported':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'deleted':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'edited':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'mapping_updated':
        return 'bg-cyan-500/10 text-cyan-600 border-cyan-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const renderDetails = (item: ActionLogItem) => {
    if (!item.details) return null;

    const details = item.details;

    if (item.action === 'edited' && details.field_name) {
      return (
        <div className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium">{details.field_name}:</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="line-through">{details.old_value || '-'}</span>
            <ArrowRight className="w-3 h-3" />
            <span className="font-medium text-foreground">{details.new_value}</span>
          </div>
        </div>
      );
    }

    if (item.action === 'exported' && details.file_name) {
      return (
        <div className="mt-1 text-sm text-muted-foreground">
          ไฟล์: {details.file_name}
        </div>
      );
    }

    if (item.action === 'mapping_updated' && details.mapping_type) {
      const typeLabels: Record<string, string> = {
        customer: 'ลูกค้า',
        branch: 'สาขา',
        product: 'สินค้า',
      };
      return (
        <div className="mt-1 text-sm text-muted-foreground">
          ประเภท: {typeLabels[details.mapping_type] || details.mapping_type}
        </div>
      );
    }

    if (details.description) {
      return (
        <div className="mt-1 text-sm text-muted-foreground">
          {details.description}
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <History className="w-4 h-4" />
          ประวัติ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            ประวัติการดำเนินการ
          </DialogTitle>
          <DialogDescription>
            {poNumber ? `รายการการดำเนินการของเอกสาร ${poNumber}` : 'รายการการดำเนินการของเอกสารนี้'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีประวัติการดำเนินการ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 rounded-lg border bg-muted/30 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`gap-1.5 ${getActionColor(item.action)}`}>
                      {getActionIcon(item.action)}
                      {getActionLabel(item.action)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  
                  {/* User info */}
                  {(item.user_name || item.user_email) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{item.user_name || item.user_email}</span>
                    </div>
                  )}
                  
                  {renderDetails(item)}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
