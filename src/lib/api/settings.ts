import { supabase } from '@/integrations/supabase/client';

// ============ WAREHOUSES ============
export async function fetchWarehouses() {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .order('code', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createWarehouse(warehouse: { code: string; name: string; active?: boolean }) {
  const { data, error } = await supabase
    .from('warehouses')
    .insert(warehouse)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateWarehouse(id: string, updates: { code?: string; name?: string; active?: boolean }) {
  const { data, error } = await supabase
    .from('warehouses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteWarehouse(id: string) {
  const { error } = await supabase
    .from('warehouses')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============ VEHICLE POSITIONS ============
export async function fetchVehiclePositions() {
  const { data, error } = await supabase
    .from('vehicle_positions')
    .select('*')
    .order('code', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createVehiclePosition(position: { code: string; name: string; active?: boolean }) {
  const { data, error } = await supabase
    .from('vehicle_positions')
    .insert(position)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateVehiclePosition(id: string, updates: { code?: string; name?: string; active?: boolean }) {
  const { data, error } = await supabase
    .from('vehicle_positions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteVehiclePosition(id: string) {
  const { error } = await supabase
    .from('vehicle_positions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============ TRANSPORT CODES ============
export async function fetchTransportCodes() {
  const { data, error } = await supabase
    .from('transport_codes')
    .select('*')
    .order('code', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createTransportCode(transport: { code: string; name: string; active?: boolean }) {
  const { data, error } = await supabase
    .from('transport_codes')
    .insert(transport)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateTransportCode(id: string, updates: { code?: string; name?: string; active?: boolean }) {
  const { data, error } = await supabase
    .from('transport_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteTransportCode(id: string) {
  const { error } = await supabase
    .from('transport_codes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
