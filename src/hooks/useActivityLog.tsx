import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ActivityAction = 
  | 'login'
  | 'logout'
  | 'password_changed'
  | 'profile_updated'
  | 'avatar_uploaded'
  | 'po_created'
  | 'po_updated'
  | 'po_deleted'
  | 'po_exported'
  | 'mapping_created'
  | 'mapping_updated'
  | 'mapping_deleted'
  | 'role_changed'
  | 'user_deleted';

export interface ActivityLogEntry {
  action: ActivityAction;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
}

export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = async (entry: ActivityLogEntry) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: entry.action,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id,
          details: entry.details
        });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return { logActivity };
}

export const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    login: 'เข้าสู่ระบบ',
    logout: 'ออกจากระบบ',
    password_changed: 'เปลี่ยนรหัสผ่าน',
    profile_updated: 'อัปเดตโปรไฟล์',
    avatar_uploaded: 'อัปโหลดรูปโปรไฟล์',
    po_created: 'สร้าง PO ใหม่',
    po_updated: 'อัปเดต PO',
    po_deleted: 'ลบ PO',
    po_exported: 'ส่งออก PO',
    mapping_created: 'สร้าง Mapping ใหม่',
    mapping_updated: 'อัปเดต Mapping',
    mapping_deleted: 'ลบ Mapping',
    role_changed: 'เปลี่ยนบทบาทผู้ใช้',
    user_deleted: 'ลบผู้ใช้'
  };
  return labels[action] || action;
};
