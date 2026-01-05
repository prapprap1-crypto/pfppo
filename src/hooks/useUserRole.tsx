import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<'admin' | 'moderator' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchRole = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data } = await supabase.rpc('get_user_role', { _user_id: user.id });
      setRole(data as 'admin' | 'moderator' | 'user' | null);
    } catch (error) {
      console.error('Error fetching role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator' || role === 'admin';

  return { role, loading, isAdmin, isModerator, refetchRole: fetchRole };
}
