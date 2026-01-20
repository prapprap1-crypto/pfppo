import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

export type POAction = 
  | 'imported'      // นำเข้า PDF
  | 'verified'      // ยืนยันความถูกต้อง
  | 'exported'      // ส่งออก Excel
  | 'deleted'       // ลบ PO
  | 'edited'        // แก้ไขข้อมูล
  | 'mapping_updated'; // อัปเดต mapping

export interface POActionDetails {
  field_name?: string;
  old_value?: string;
  new_value?: string;
  file_name?: string;
  source_file?: string;
  mapping_type?: string;
  description?: string;
}

const ACTION_LABELS: Record<POAction, string> = {
  imported: 'นำเข้าเอกสาร',
  verified: 'ยืนยันความถูกต้อง',
  exported: 'ส่งออก Excel',
  deleted: 'ลบเอกสาร',
  edited: 'แก้ไขข้อมูล',
  mapping_updated: 'อัปเดต Mapping',
};

export const getActionLabel = (action: string): string => {
  return ACTION_LABELS[action as POAction] || action;
};

export function usePOActionLog() {
  const { user } = useAuth();

  const logAction = async (
    poId: string,
    action: POAction,
    details?: POActionDetails
  ) => {
    try {
      const { error } = await supabase
        .from('po_action_logs')
        .insert({
          po_id: poId,
          user_id: user?.id || null,
          action,
          details: details ? (details as unknown as Json) : null,
        });

      if (error) {
        console.error('Error logging PO action:', error);
      }
    } catch (error) {
      console.error('Error logging PO action:', error);
    }
  };

  const logBulkAction = async (
    poIds: string[],
    action: POAction,
    details?: POActionDetails
  ) => {
    try {
      const records = poIds.map(poId => ({
        po_id: poId,
        user_id: user?.id || null,
        action,
        details: details ? (details as unknown as Json) : null,
      }));

      const { error } = await supabase
        .from('po_action_logs')
        .insert(records);

      if (error) {
        console.error('Error logging bulk PO actions:', error);
      }
    } catch (error) {
      console.error('Error logging bulk PO actions:', error);
    }
  };

  return { logAction, logBulkAction };
}
