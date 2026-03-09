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

// Fetch PO headers with pagination, optimized for performance
export interface FetchPOHeadersParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface FetchPOHeadersResult {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Status priority for sorting: lower number = higher priority
const STATUS_PRIORITY: Record<string, number> = {
  'NEED_REVIEW': 0,
  'IMPORTED': 1,
  'NEW': 2,
  'VERIFIED': 3,
  'EXPORTED': 4,
  'ERROR': 5,
};

export async function fetchPOHeadersPaginated({
  page = 1,
  pageSize = 20
}: FetchPOHeadersParams = {}): Promise<FetchPOHeadersResult> {
  // Fetch ALL data first to sort properly, then paginate
  // This ensures NEED_REVIEW items appear on page 1 even when filtered
  const { data: allData, error } = await supabase
    .from('po_headers')
    .select('*');
  
  if (error) throw error;
  
  // Sort all data by status priority first, then by PO number
  const sortedData = (allData || []).sort((a, b) => {
    const priorityA = STATUS_PRIORITY[a.status] ?? 99;
    const priorityB = STATUS_PRIORITY[b.status] ?? 99;
    
    if (priorityA !== priorityB) return priorityA - priorityB;
    
    // Then by PO number
    return a.po_number.localeCompare(b.po_number, 'th');
  });
  
  // Calculate pagination
  const totalCount = sortedData.length;
  const offset = (page - 1) * pageSize;
  const paginatedData = sortedData.slice(offset, offset + pageSize);
  
  return {
    data: paginatedData,
    total: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize)
  };
}

// Batch fetch branch mappings for multiple POs at once (avoids N+1 queries)
export async function batchFetchBranchMappings(
  poHeaders: Array<{ customer_name?: string | null; branch: string }>
): Promise<Map<string, { vendor_branch_code?: string; vendor_branch_name?: string }>> {
  const result = new Map<string, { vendor_branch_code?: string; vendor_branch_name?: string }>();
  
  if (poHeaders.length === 0) return result;
  
  // Get unique customer names
  const customerNames = [...new Set(poHeaders.map(h => h.customer_name).filter(Boolean))] as string[];
  
  if (customerNames.length === 0) return result;
  
  // Fetch all customer mappings at once
  const { data: customerMappings, error: cmError } = await supabase
    .from('customer_mappings')
    .select('id, customer_name')
    .in('customer_name', customerNames)
    .eq('active', true);
  
  if (cmError) throw cmError;
  if (!customerMappings || customerMappings.length === 0) return result;
  
  // Create lookup by customer name
  const customerMappingIds = customerMappings.map(cm => cm.id);
  const customerNameToId = new Map(customerMappings.map(cm => [cm.customer_name, cm.id]));
  
  // Fetch all branch mappings at once
  const { data: branchMappings, error: bmError } = await supabase
    .from('customer_branch_mappings')
    .select('customer_mapping_id, branch, vendor_branch_code, vendor_branch_name')
    .in('customer_mapping_id', customerMappingIds)
    .eq('active', true);
  
  if (bmError) throw bmError;
  
  // Create lookup: customerMappingId-branch -> branch mapping
  const branchLookup = new Map<string, { vendor_branch_code?: string; vendor_branch_name?: string }>();
  for (const bm of branchMappings || []) {
    const key = `${bm.customer_mapping_id}-${bm.branch}`;
    branchLookup.set(key, {
      vendor_branch_code: bm.vendor_branch_code || undefined,
      vendor_branch_name: bm.vendor_branch_name || undefined
    });
  }
  
  // Map each PO to its branch mapping
  for (const po of poHeaders) {
    if (!po.customer_name) continue;
    
    const customerMappingId = customerNameToId.get(po.customer_name);
    if (!customerMappingId) continue;
    
    const key = `${customerMappingId}-${po.branch}`;
    const branchMapping = branchLookup.get(key);
    
    // Use customer_name + branch as result key
    const resultKey = `${po.customer_name}|||${po.branch}`;
    if (branchMapping) {
      result.set(resultKey, branchMapping);
    }
  }
  
  return result;
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

// Check if PO number already exists
export async function checkDuplicatePO(poNumber: string): Promise<{ exists: boolean; existingPO?: any }> {
  const { data, error } = await supabase
    .from('po_headers')
    .select('id, po_number, branch, document_date, created_at')
    .eq('po_number', poNumber)
    .maybeSingle();
  
  if (error) throw error;
  return { exists: !!data, existingPO: data };
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
  customer_name?: string;
  vendor_customer_code?: string;
  vendor_customer_name?: string;
  is_customer_mapped?: boolean;
}) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check for duplicate PO
  const { exists, existingPO } = await checkDuplicatePO(poHeader.po_number);
  if (exists) {
    throw new Error(`PO ${poHeader.po_number} มีอยู่แล้วในระบบ (นำเข้าเมื่อ ${new Date(existingPO.created_at).toLocaleDateString('th-TH')})`);
  }

  const { data, error } = await supabase
    .from('po_headers')
    .insert({ ...poHeader, user_id: user.id })
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
  customer_name: string;
  vendor_customer_code: string;
  vendor_customer_name: string;
  is_customer_mapped: boolean;
  branch: string;
  vendor_branch_code: string | null;
  vendor_branch_name: string | null;
  remark: string | null;
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

// Refresh mappings for all items in a PO
export async function refreshPOMappings(poId: string) {
  // Fetch all items for this PO
  const items = await fetchPOItems(poId);
  if (!items || items.length === 0) return { updated: 0, total: 0 };

  // Get all customer codes
  const customerCodes = items.map(item => item.customer_product_code);
  
  // Fetch all mappings for these codes
  const { data: mappings, error: mappingError } = await supabase
    .from('product_mappings')
    .select('*')
    .in('customer_code', customerCodes)
    .eq('active', true);
  
  if (mappingError) throw mappingError;

  // Create mapping lookup
  const mappingMap = new Map(
    (mappings || []).map(m => [m.customer_code, m])
  );

  // Update each item with mapping data
  let updatedCount = 0;
  for (const item of items) {
    const mapping = mappingMap.get(item.customer_product_code);
    const newVendorCode = mapping?.vendor_code || '';
    const newVendorDesc = mapping?.vendor_desc || '';
    const newIsMapped = !!mapping && !!mapping.vendor_code;

    // Only update if there's a change
    if (
      item.vendor_product_code !== newVendorCode ||
      item.vendor_description !== newVendorDesc ||
      item.is_mapped !== newIsMapped
    ) {
      await updatePOItem(item.id, {
        vendor_product_code: newVendorCode,
        vendor_description: newVendorDesc,
        is_mapped: newIsMapped
      });
      updatedCount++;
    }
  }

  return { updated: updatedCount, total: items.length };
}

export async function updatePOItem(id: string, updates: Partial<{
  vendor_product_code: string;
  vendor_description: string;
  customer_product_code: string;
  customer_description: string;
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

// Find mappings for multiple customer codes at once
export async function findMappingsForCodes(customerCodes: string[]) {
  if (customerCodes.length === 0) return [];
  
  const { data, error } = await supabase
    .from('product_mappings')
    .select('*')
    .in('customer_code', customerCodes)
    .eq('active', true);
  
  if (error) throw error;
  return data || [];
}

// Check if customer code exists in product_mappings
export async function checkMappingExists(customerCode: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('product_mappings')
    .select('id')
    .eq('customer_code', customerCode)
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
}

// Auto-create mappings for unmapped products (no duplicate codes)
export async function autoCreateMappingsForItems(items: Array<{
  customer_product_code: string;
  customer_description: string;
  unit?: string;
}>) {
  const newMappings: Array<{
    customer_code: string;
    customer_desc: string;
    vendor_code: string;
    vendor_desc: string;
    unit: string;
    active: boolean;
  }> = [];
  
  // Track codes we've already processed to avoid duplicates within this batch
  const processedCodes = new Set<string>();
  
  for (const item of items) {
    const code = item.customer_product_code;
    
    // Skip if already processed in this batch
    if (processedCodes.has(code)) continue;
    processedCodes.add(code);
    
    // Check if mapping already exists in database
    const exists = await checkMappingExists(code);
    if (exists) continue;
    
    // Create new mapping with empty vendor info (to be filled later)
    newMappings.push({
      customer_code: code,
      customer_desc: item.customer_description || '',
      vendor_code: '', // Empty - to be mapped manually
      vendor_desc: '', // Empty - to be mapped manually
      unit: item.unit || 'ลัง',
      active: true
    });
  }
  
  if (newMappings.length === 0) return [];
  
  // Insert all new mappings at once
  const { data, error } = await supabase
    .from('product_mappings')
    .insert(newMappings)
    .select();
  
  if (error) throw error;
  return data;
}

// Customer Mappings
export async function fetchCustomerMappings() {
  const { data, error } = await supabase
    .from('customer_mappings')
    .select(`
      *,
      salespersons:salesperson_id(id, code, name)
    `)
    .order('customer_name', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createCustomerMapping(mapping: {
  customer_name: string;
  vendor_customer_code: string;
  vendor_customer_name: string;
  vat_type?: number;
  salesperson_id?: string | null;
  active?: boolean;
}) {
  const { data, error } = await supabase
    .from('customer_mappings')
    .insert(mapping)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCustomerMapping(id: string, updates: Partial<{
  customer_name: string;
  vendor_customer_code: string;
  vendor_customer_name: string;
  vat_type: number;
  salesperson_id: string | null;
  active: boolean;
}>) {
  const { data, error } = await supabase
    .from('customer_mappings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCustomerMapping(id: string) {
  const { error } = await supabase
    .from('customer_mappings')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function findCustomerMappingByName(customerName: string) {
  const { data, error } = await supabase
    .from('customer_mappings')
    .select('*')
    .eq('customer_name', customerName)
    .eq('active', true)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

// Find customer mapping with fuzzy matching (similarity threshold)
export async function findCustomerMappingByNameFuzzy(customerName: string, minSimilarity: number = 85): Promise<{ mapping: Awaited<ReturnType<typeof findCustomerMappingByName>>; similarity: number } | null> {
  if (!customerName) return null;
  
  // First try exact match
  const exactMatch = await findCustomerMappingByName(customerName);
  if (exactMatch && exactMatch.vendor_customer_code) {
    return { mapping: exactMatch, similarity: 100 };
  }
  
  // If no exact match, try fuzzy matching
  const allMappings = await fetchCustomerMappings();
  if (!allMappings || allMappings.length === 0) return null;
  
  // Import similarity function dynamically to avoid circular imports
  const { calculateSimilarity } = await import('@/lib/utils/similarity');
  
  let bestMatch: typeof allMappings[0] | null = null;
  let bestSimilarity = 0;
  
  for (const mapping of allMappings) {
    if (!mapping.active || !mapping.vendor_customer_code) continue;
    
    const similarity = calculateSimilarity(customerName, mapping.customer_name);
    if (similarity >= minSimilarity && similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = mapping;
    }
  }
  
  if (bestMatch) {
    return { mapping: bestMatch, similarity: bestSimilarity };
  }
  
  return null;
}

export async function checkCustomerMappingExists(customerName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('customer_mappings')
    .select('id')
    .eq('customer_name', customerName)
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
}

export async function autoCreateCustomerMapping(customerName: string) {
  if (!customerName) return null;
  
  const exists = await checkCustomerMappingExists(customerName);
  if (exists) return null;
  
  const { data, error } = await supabase
    .from('customer_mappings')
    .insert({
      customer_name: customerName,
      vendor_customer_code: '',
      vendor_customer_name: '',
      active: true
    })
    .select()
    .single();
  
  if (error) {
    // Ignore duplicate error
    if (error.code === '23505') return null;
    throw error;
  }
  return data;
}

// Refresh customer mapping for a PO (with fuzzy matching support)
export async function refreshPOCustomerMapping(poId: string, useFuzzyMatch: boolean = true) {
  const poHeader = await fetchPOHeaderById(poId);
  if (!poHeader || !poHeader.customer_name) return { updated: false, vendorCustomerName: '', fuzzyMatched: false, similarity: 0 };

  // Try exact match first, then fuzzy match if enabled
  let mapping = await findCustomerMappingByName(poHeader.customer_name);
  let fuzzyMatched = false;
  let similarity = 100;
  
  if (!mapping && useFuzzyMatch) {
    const fuzzyResult = await findCustomerMappingByNameFuzzy(poHeader.customer_name, 85);
    if (fuzzyResult) {
      mapping = fuzzyResult.mapping;
      similarity = fuzzyResult.similarity;
      fuzzyMatched = similarity < 100;
    }
  }
  
  if (!mapping) return { updated: false, vendorCustomerName: '', fuzzyMatched: false, similarity: 0 };

  const newVendorCode = mapping.vendor_customer_code || '';
  const newVendorName = mapping.vendor_customer_name || '';
  const newIsMapped = !!mapping && !!mapping.vendor_customer_code;

  if (
    poHeader.vendor_customer_code !== newVendorCode ||
    poHeader.vendor_customer_name !== newVendorName ||
    poHeader.is_customer_mapped !== newIsMapped
  ) {
    await updatePOHeader(poId, {
      vendor_customer_code: newVendorCode,
      vendor_customer_name: newVendorName,
      is_customer_mapped: newIsMapped
    });
    return { updated: true, vendorCustomerName: newVendorName, fuzzyMatched, matchedCustomerName: mapping.customer_name, similarity };
  }

  return { updated: false, vendorCustomerName: newVendorName, fuzzyMatched, similarity };
}

// Customer Branch Mappings
export async function fetchCustomerBranchMappings(customerMappingId: string) {
  const { data, error } = await supabase
    .from('customer_branch_mappings')
    .select('*')
    .eq('customer_mapping_id', customerMappingId)
    .order('branch', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function fetchAllCustomerBranchMappings() {
  const { data, error } = await supabase
    .from('customer_branch_mappings')
    .select(`
      *,
      warehouses:warehouse_id(id, code, name),
      vehicle_positions:vehicle_position_id(id, code, name),
      transport_codes:transport_code_id(id, code, name)
    `)
    .order('branch', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createCustomerBranchMapping(mapping: {
  customer_mapping_id: string;
  branch: string;
  vendor_branch_code?: string;
  vendor_branch_name?: string;
  warehouse_id?: string | null;
  vehicle_position_id?: string | null;
  transport_code_id?: string | null;
  active?: boolean;
}) {
  const { data, error } = await supabase
    .from('customer_branch_mappings')
    .insert(mapping)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCustomerBranchMapping(id: string, updates: Partial<{
  branch: string;
  vendor_branch_code: string;
  vendor_branch_name: string;
  warehouse_id: string | null;
  vehicle_position_id: string | null;
  transport_code_id: string | null;
  active: boolean;
}>) {
  const { data, error } = await supabase
    .from('customer_branch_mappings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCustomerBranchMapping(id: string) {
  const { error } = await supabase
    .from('customer_branch_mappings')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function findBranchMapping(customerName: string, branch: string, useFuzzy: boolean = false, minSimilarity: number = 85, vendorCustomerCode?: string) {
  // First find the customer mapping - try by vendor code first if available, then by name
  let customerMapping = null;
  
  if (vendorCustomerCode) {
    // Try to find by vendor customer code first (more reliable)
    const { data, error } = await supabase
      .from('customer_mappings')
      .select('*')
      .eq('vendor_customer_code', vendorCustomerCode)
      .eq('active', true)
      .maybeSingle();
    
    if (!error && data) {
      customerMapping = data;
    }
  }
  
  // If not found by vendor code, try by name
  if (!customerMapping) {
    customerMapping = await findCustomerMappingByName(customerName);
  }
  
  // If still not found, try fuzzy matching on name
  if (!customerMapping && useFuzzy && customerName) {
    const fuzzyResult = await findCustomerMappingByNameFuzzy(customerName, minSimilarity);
    if (fuzzyResult) {
      customerMapping = fuzzyResult.mapping;
    }
  }
  
  if (!customerMapping) return null;

  // Then find the branch mapping with exact match first
  const { data: exactMatch, error: exactError } = await supabase
    .from('customer_branch_mappings')
    .select('*')
    .eq('customer_mapping_id', customerMapping.id)
    .eq('branch', branch)
    .eq('active', true)
    .maybeSingle();
  
  if (exactError) throw exactError;
  
  if (exactMatch) {
    return { 
      customerMapping, 
      branchMapping: exactMatch, 
      fuzzyMatched: false,
      similarity: 100,
      matchedBranch: branch
    };
  }

  // If no exact match and fuzzy is enabled, try fuzzy matching
  if (useFuzzy && branch) {
    const { data: allBranches, error: allError } = await supabase
      .from('customer_branch_mappings')
      .select('*')
      .eq('customer_mapping_id', customerMapping.id)
      .eq('active', true);
    
    if (allError) throw allError;
    
    if (allBranches && allBranches.length > 0) {
      // Import similarity function dynamically to avoid circular dependencies
      const { calculateSimilarity } = await import('@/lib/utils/similarity');
      
      let bestMatch = null;
      let bestSimilarity = 0;
      
      for (const branchMapping of allBranches) {
        const similarity = calculateSimilarity(branch, branchMapping.branch);
        if (similarity >= minSimilarity && similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = branchMapping;
        }
      }
      
      if (bestMatch) {
        return {
          customerMapping,
          branchMapping: bestMatch,
          fuzzyMatched: true,
          similarity: bestSimilarity,
          matchedBranch: bestMatch.branch
        };
      }
    }
  }

  return { customerMapping, branchMapping: null, fuzzyMatched: false, similarity: 0, matchedBranch: null };
}

export async function autoCreateBranchMapping(customerMappingId: string, branch: string) {
  if (!branch) return null;
  
  // Check if already exists
  const { data: existing } = await supabase
    .from('customer_branch_mappings')
    .select('id')
    .eq('customer_mapping_id', customerMappingId)
    .eq('branch', branch)
    .maybeSingle();
  
  if (existing) return null;
  
  const { data, error } = await supabase
    .from('customer_branch_mappings')
    .insert({
      customer_mapping_id: customerMappingId,
      branch: branch,
      vendor_branch_code: '',
      vendor_branch_name: '',
      active: true
    })
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') return null; // Duplicate
    throw error;
  }
  return data;
}

// Export History
export async function createExportHistory(exportData: {
  exported_pos: string[];
  file_name: string;
}) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('export_history')
    .insert({ ...exportData, user_id: user.id })
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
