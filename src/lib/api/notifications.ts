import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'password_changed' | 'login_alert' | 'role_changed' | 'account_approved' | 'custom';

interface SendNotificationParams {
  to: string;
  subject: string;
  type: NotificationType;
  data?: {
    userName?: string;
    newRole?: string;
    message?: string;
  };
}

export async function sendNotificationEmail(params: SendNotificationParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: params
    });

    if (error) {
      console.error('Error sending notification email:', error);
      return false;
    }

    console.log('Notification email sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}
