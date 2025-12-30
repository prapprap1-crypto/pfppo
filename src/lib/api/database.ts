import { supabase } from '@/integrations/supabase/client';

// PO Headers
export async function fetchPOHeaders() {
  const { data, error } = await supabase
    .from('po_headers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function fetchPOHeaderById(id: string) {
  const { data, error } = await supabase
    .from('po_headers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function createPOHeader(poHeader: {
  po_number: string;
  supplier_code: string;
  supplier_name: string;
  branch: string;
  document_date: string;
  due_date: string;
  net_total?: number;
  vat?: number;
  grand_total?: number;
  status?: string;
  source_file?: string;
  user_id: string;
}) {
  const { data, error } = await supabase
    .from('po_headers')
    .insert(poHeader)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePOHeader(id: string, updates: Partial<{
  status: string;
  net_total: number;
  vat: number;
  grand_total: number;
}>) {
  const { data, error } = await supabase
    .from('po_headers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// PO Items
export async function fetchPOItems(poId: string) {
  const { data, error } = await supabase
    .from('po_items')
    .select('*')
    .eq('po_id', poId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createPOItems(items: Array<{
  po_id: string;
  customer_product_code: string;
  customer_description?: string;
  vendor_product_code?: string;
  vendor_description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  amount: number;
  delivery_date?: string;
  is_mapped?: boolean;
}>) {
  const { data, error } = await supabase
    .from('po_items')
    .insert(items)
    .select();
  
  if (error) throw error;
  return data;
}

export async function updatePOItem(id: string, updates: Partial<{
  vendor_product_code: string;
  vendor_description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  is_mapped: boolean;
}>) {
  const { data, error } = await supabase
    .from('po_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Product Mappings
export async function fetchProductMappings() {
  const { data, error } = await supabase
    .from('product_mappings')
    .select('*')
    .order('customer_code', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createProductMapping(mapping: {
  customer_code: string;
  customer_desc: string;
  vendor_code: string;
  vendor_desc: string;
  unit?: string;
  active?: boolean;
}) {
  const { data, error } = await supabase
    .from('product_mappings')
    .insert(mapping)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProductMapping(id: string, updates: Partial<{
  customer_code: string;
  customer_desc: string;
  vendor_code: string;
  vendor_desc: string;
  unit: string;
  active: boolean;
}>) {
  const { data, error } = await supabase
    .from('product_mappings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteProductMapping(id: string) {
  const { error } = await supabase
    .from('product_mappings')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Find mapping for a customer code
export async function findMappingByCustomerCode(customerCode: string) {
  const { data, error } = await supabase
    .from('product_mappings')
    .select('*')
    .eq('customer_code', customerCode)
    .eq('active', true)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

// Export History
export async function createExportHistory(exportData: {
  user_id: string;
  exported_pos: string[];
  file_name: string;
}) {
  const { data, error } = await supabase
    .from('export_history')
    .insert(exportData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchExportHistory() {
  const { data, error } = await supabase
    .from('export_history')
    .select('*')
    .order('exported_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Dashboard Stats
export async function fetchDashboardStats() {
  const { data: poHeaders, error } = await supabase
    .from('po_headers')
    .select('status');
  
  if (error) throw error;

  const stats = {
    totalPOs: poHeaders?.length || 0,
    newPOs: poHeaders?.filter(p => p.status === 'NEW').length || 0,
    importedPOs: poHeaders?.filter(p => p.status === 'IMPORTED').length || 0,
    needReviewPOs: poHeaders?.filter(p => p.status === 'NEED_REVIEW').length || 0,
    verifiedPOs: poHeaders?.filter(p => p.status === 'VERIFIED').length || 0,
    exportedPOs: poHeaders?.filter(p => p.status === 'EXPORTED').length || 0,
    errorPOs: poHeaders?.filter(p => p.status === 'ERROR').length || 0,
  };

  // Get unmapped products count
  const { data: unmappedItems, error: itemsError } = await supabase
    .from('po_items')
    .select('id')
    .eq('is_mapped', false);
  
  if (!itemsError) {
    (stats as any).unmappedProducts = unmappedItems?.length || 0;
  }

  return stats;
}

// Parse PDF using AI
export async function parsePOPdf(pdfBase64: string, fileName: string) {
  const { data, error } = await supabase.functions.invoke('parse-po-pdf', {
    body: { pdfBase64, fileName },
  });
  
  if (error) throw error;
  return data;
}

// Upload PDF to storage
export async function uploadPOFile(userId: string, file: File) {
  const filePath = `${userId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('po-files')
    .upload(filePath, file);
  
  if (error) throw error;
  return data.path;
}
