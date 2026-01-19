export type POStatus = 'NEW' | 'IMPORTED' | 'NEED_REVIEW' | 'VERIFIED' | 'EXPORTED' | 'ERROR';

export interface POHeader {
  id: string;
  poNumber: string;
  customerName?: string;
  vendorCustomerCode?: string;
  vendorCustomerName?: string;
  isCustomerMapped?: boolean;
  supplierCode: string;
  supplierName: string;
  branch: string;
  documentDate: string;
  dueDate: string;
  netTotal: number;
  vat: number;
  grandTotal: number;
  status: POStatus;
  sourceFile: string;
  createdAt: string;
  updatedAt: string;
}

export interface POItem {
  id: string;
  poId: string;
  customerProductCode: string;
  customerDescription: string;
  vendorProductCode: string | null;
  vendorDescription: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  unit: string;
  deliveryDate: string;
  isMapped: boolean;
}

export interface ProductMapping {
  id: string;
  customerCode: string;
  customerDesc: string;
  vendorCode: string;
  vendorDesc: string;
  unit: string;
  active: boolean;
  createdAt: string;
}

export interface CustomerMapping {
  id: string;
  customerName: string;
  vendorCustomerCode: string;
  vendorCustomerName: string;
  active: boolean;
  createdAt: string;
  branches?: CustomerBranchMapping[];
}

export interface CustomerBranchMapping {
  id: string;
  customerMappingId: string;
  branch: string;
  vendorBranchCode: string;
  vendorBranchName: string;
  active: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalPOs: number;
  newPOs: number;
  importedPOs: number;
  needReviewPOs: number;
  verifiedPOs: number;
  exportedPOs: number;
  errorPOs: number;
  unmappedProducts: number;
}

export const STATUS_LABELS: Record<POStatus, string> = {
  NEW: 'พบไฟล์ใหม่',
  IMPORTED: 'นำเข้าสำเร็จ',
  NEED_REVIEW: 'รอตรวจสอบ',
  VERIFIED: 'ตรวจสอบสำเร็จ',
  EXPORTED: 'นำออกเรียบร้อย',
  ERROR: 'วิเคราะห์ไม่สำเร็จ',
};

export const STATUS_CLASSES: Record<POStatus, string> = {
  NEW: 'status-new',
  IMPORTED: 'status-imported',
  NEED_REVIEW: 'status-need-review',
  VERIFIED: 'status-verified',
  EXPORTED: 'status-exported',
  ERROR: 'status-error',
};
