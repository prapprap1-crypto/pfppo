import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createPOHeader, createPOItems, autoCreateMappingsForItems, findMappingsForCodes, findCustomerMappingByName, autoCreateCustomerMapping, autoCreateBranchMapping } from '@/lib/api/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface FileUploadZoneProps {
  onFilesSelected?: (files: File[]) => void;
  onUploadComplete?: () => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  className?: string;
}

type FileStatus = 'pending' | 'processing' | 'success' | 'error';
type ProcessingStep = 'converting' | 'parsing' | 'saving' | 'done';

interface ExtractedPOData {
  po_number: string;
  customer_name?: string;
  supplier_code: string;
  supplier_name: string;
  branch: string;
  document_date: string;
  due_date: string;
  net_total: number;
  vat: number;
  grand_total: number;
  items: Array<{
    customer_product_code: string;
    customer_description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    amount: number;
    delivery_date: string;
  }>;
}

interface UploadedFile {
  file: File;
  status: FileStatus;
  error?: string;
  step?: ProcessingStep;
  progress?: number;
  extractedData?: ExtractedPOData;
}

const STEP_LABELS: Record<ProcessingStep, string> = {
  converting: 'กำลังแปลงไฟล์...',
  parsing: 'กำลังวิเคราะห์ด้วย AI...',
  saving: 'กำลังบันทึกข้อมูล...',
  done: 'เสร็จสิ้น'
};

const STEP_PROGRESS: Record<ProcessingStep, number> = {
  converting: 20,
  parsing: 60,
  saving: 90,
  done: 100
};

export function FileUploadZone({ 
  onFilesSelected, 
  onUploadComplete,
  accept = { 'application/pdf': ['.pdf'] },
  maxFiles = 10,
  className 
}: FileUploadZoneProps) {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<ExtractedPOData | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        status: 'pending' as FileStatus,
        progress: 0
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "เพิ่มไฟล์สำเร็จ",
        description: `เพิ่ม ${acceptedFiles.length} ไฟล์เพื่อวิเคราะห์`,
      });
      onFilesSelected?.(acceptedFiles);
    }
  }, [onFilesSelected, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const updateFileState = (index: number, updates: Partial<UploadedFile>) => {
    setUploadedFiles(prev => 
      prev.map((f, idx) => idx === index ? { ...f, ...updates } : f)
    );
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0 || isProcessing) return;

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < uploadedFiles.length; i++) {
      const { file, status } = uploadedFiles[i];
      
      if (status !== 'pending') continue;

      // Step 1: Converting
      updateFileState(i, { 
        status: 'processing', 
        step: 'converting', 
        progress: STEP_PROGRESS.converting 
      });

      try {
        // Convert PDF to base64
        const pdfBase64 = await fileToBase64(file);

        // Step 2: Parsing with AI
        updateFileState(i, { 
          step: 'parsing', 
          progress: STEP_PROGRESS.parsing 
        });

        // Call edge function to parse PDF
        const { data, error } = await supabase.functions.invoke('parse-po-pdf', {
          body: { pdfBase64, fileName: file.name }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Failed to parse PDF');

        const extractedData = data.data as ExtractedPOData;
        console.log('Extracted PO data:', extractedData);

        // Step 3: Saving to database and uploading PDF
        updateFileState(i, { 
          step: 'saving', 
          progress: STEP_PROGRESS.saving,
          extractedData 
        });

        // Get current user for folder path
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Upload PDF to storage bucket - use only ASCII characters for filename
        const safeFileName = `${extractedData.po_number}_${Date.now()}.pdf`;
        const filePath = `${user.id}/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('po-files')
          .upload(filePath, file, { contentType: 'application/pdf' });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          // Continue even if storage upload fails
        }

        // Find customer mapping if customer_name exists
        let customerMapping = null;
        if (extractedData.customer_name) {
          customerMapping = await findCustomerMappingByName(extractedData.customer_name);
        }

        // Save to database
        const poHeader = await createPOHeader({
          po_number: extractedData.po_number,
          customer_name: extractedData.customer_name || null,
          vendor_customer_code: customerMapping?.vendor_customer_code || '',
          vendor_customer_name: customerMapping?.vendor_customer_name || '',
          is_customer_mapped: !!customerMapping && !!customerMapping.vendor_customer_code,
          supplier_code: extractedData.supplier_code,
          supplier_name: extractedData.supplier_name,
          branch: extractedData.branch,
          document_date: extractedData.document_date,
          due_date: extractedData.due_date,
          net_total: extractedData.net_total,
          vat: extractedData.vat,
          grand_total: extractedData.grand_total,
          source_file: uploadError ? null : filePath,
          status: 'NEED_REVIEW'
        });

        if (poHeader && extractedData.items?.length > 0) {
          // First, fetch existing mappings for all customer codes
          const customerCodes = extractedData.items.map(item => item.customer_product_code);
          const existingMappings = await findMappingsForCodes(customerCodes);
          
          // Create a map for quick lookup
          const mappingMap = new Map(
            existingMappings.map(m => [m.customer_code, m])
          );

          const items = extractedData.items.map((item) => {
            const mapping = mappingMap.get(item.customer_product_code);
            return {
              po_id: poHeader.id,
              customer_product_code: item.customer_product_code,
              customer_description: item.customer_description,
              vendor_product_code: mapping?.vendor_code || '',
              vendor_description: mapping?.vendor_desc || '',
              quantity: item.quantity,
              unit: item.unit || 'ลัง',
              unit_price: item.unit_price,
              amount: item.amount,
              delivery_date: item.delivery_date,
              is_mapped: !!mapping && !!mapping.vendor_code
            };
          });

          await createPOItems(items);

          // Auto-create mappings for unmapped products
          try {
            const createdMappings = await autoCreateMappingsForItems(
              extractedData.items.map(item => ({
                customer_product_code: item.customer_product_code,
                customer_description: item.customer_description,
                unit: item.unit
              }))
            );
            if (createdMappings && createdMappings.length > 0) {
              console.log(`Auto-created ${createdMappings.length} new product mappings`);
            }
          } catch (mappingError) {
            console.error('Error auto-creating mappings:', mappingError);
          }

          // Auto-create customer mapping if not exists
          if (extractedData.customer_name) {
            try {
              const createdCustomerMapping = await autoCreateCustomerMapping(extractedData.customer_name);
              
              // Auto-create branch mapping if we have branch info
              if (extractedData.branch) {
                // Get customer mapping ID (either from newly created or existing)
                let customerMappingId = createdCustomerMapping?.id;
                if (!customerMappingId && customerMapping) {
                  customerMappingId = customerMapping.id;
                }
                
                if (customerMappingId) {
                  await autoCreateBranchMapping(customerMappingId, extractedData.branch);
                  console.log(`Auto-created branch mapping for: ${extractedData.branch}`);
                }
              }
            } catch (customerMappingError) {
              console.error('Error auto-creating customer/branch mapping:', customerMappingError);
            }
          }
        }

        // Step 4: Done
        updateFileState(i, { 
          status: 'success', 
          step: 'done', 
          progress: STEP_PROGRESS.done 
        });
        successCount++;

      } catch (error) {
        console.error('Error processing file:', file.name, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        updateFileState(i, { 
          status: 'error', 
          error: errorMessage,
          progress: 0 
        });
        errorCount++;
      }
    }

    setIsProcessing(false);

    if (successCount > 0) {
      toast({
        title: "วิเคราะห์สำเร็จ",
        description: `นำเข้า ${successCount} PO สำเร็จ${errorCount > 0 ? `, ${errorCount} ไฟล์มีปัญหา` : ''}`,
      });
      onUploadComplete?.();
    } else if (errorCount > 0) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถวิเคราะห์ ${errorCount} ไฟล์ได้`,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <FileText className="w-4 h-4 text-primary" />;
    }
  };

  const pendingCount = uploadedFiles.filter(f => f.status === 'pending').length;
  const processingFile = uploadedFiles.find(f => f.status === 'processing');
  const totalProgress = uploadedFiles.length > 0 
    ? uploadedFiles.reduce((acc, f) => acc + (f.progress || 0), 0) / uploadedFiles.length 
    : 0;

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragActive 
            ? 'border-accent bg-accent/5' 
            : 'border-border hover:border-accent/50 hover:bg-muted/30'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
            isDragActive ? 'bg-accent/20' : 'bg-muted'
          )}>
            <Upload className={cn(
              'w-8 h-8',
              isDragActive ? 'text-accent' : 'text-muted-foreground'
            )} />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {isDragActive ? 'วางไฟล์ที่นี่' : 'ลากไฟล์มาวางที่นี่'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              หรือคลิกเพื่อเลือกไฟล์ PDF (สูงสุด {maxFiles} ไฟล์)
            </p>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      {isProcessing && (
        <div className="bg-card rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">ความคืบหน้าโดยรวม</span>
            <span className="text-sm text-muted-foreground">{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
          {processingFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{processingFile.step ? STEP_LABELS[processingFile.step] : 'กำลังประมวลผล...'}</span>
              <span className="text-foreground font-medium">{processingFile.file.name}</span>
            </div>
          )}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="bg-card rounded-xl border p-4">
          <h4 className="text-sm font-medium mb-3">ไฟล์ที่เลือก ({uploadedFiles.length})</h4>
          <div className="space-y-3">
            {uploadedFiles.map((uploadedFile, index) => (
              <div 
                key={`${uploadedFile.file.name}-${index}`}
                className={cn(
                  "p-3 rounded-lg transition-all",
                  uploadedFile.status === 'error' ? 'bg-destructive/10' :
                  uploadedFile.status === 'success' ? 'bg-green-500/10' :
                  uploadedFile.status === 'processing' ? 'bg-primary/5 border border-primary/20' :
                  'bg-muted/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(uploadedFile.status)}
                    <span className="text-sm font-medium truncate max-w-48">{uploadedFile.file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({(uploadedFile.file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedFile.status === 'success' && uploadedFile.extractedData && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => setSelectedPreview(uploadedFile.extractedData!)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        ดูผลลัพธ์
                      </Button>
                    )}
                    {uploadedFile.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Individual Progress Bar */}
                {uploadedFile.status === 'processing' && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {uploadedFile.step ? STEP_LABELS[uploadedFile.step] : 'กำลังประมวลผล...'}
                      </span>
                      <span className="font-medium">{uploadedFile.progress || 0}%</span>
                    </div>
                    <Progress value={uploadedFile.progress || 0} className="h-1.5" />
                  </div>
                )}

                {/* Success Summary */}
                {uploadedFile.status === 'success' && uploadedFile.extractedData && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      PO: {uploadedFile.extractedData.po_number}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {uploadedFile.extractedData.items?.length || 0} รายการ
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      ฿{uploadedFile.extractedData.grand_total?.toLocaleString() || 0}
                    </Badge>
                  </div>
                )}

                {/* Error Message */}
                {uploadedFile.status === 'error' && uploadedFile.error && (
                  <p className="mt-2 text-xs text-destructive">{uploadedFile.error}</p>
                )}
              </div>
            ))}
          </div>
          {pendingCount > 0 && (
            <Button 
              className="w-full mt-4 bg-accent hover:bg-accent/90"
              onClick={processFiles}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังวิเคราะห์...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  เริ่มวิเคราะห์ไฟล์ทั้งหมด ({pendingCount})
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!selectedPreview} onOpenChange={() => setSelectedPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ผลการวิเคราะห์ PO</DialogTitle>
          </DialogHeader>
          {selectedPreview && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">เลข PO:</span>
                    <span className="font-medium">{selectedPreview.po_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">รหัสผู้จำหน่าย:</span>
                    <span className="font-medium">{selectedPreview.supplier_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ผู้จำหน่าย:</span>
                    <span className="font-medium truncate max-w-32">{selectedPreview.supplier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">สาขา:</span>
                    <span className="font-medium truncate max-w-32">{selectedPreview.branch}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">วันที่เอกสาร:</span>
                    <span className="font-medium">{selectedPreview.document_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">วันครบกำหนด:</span>
                    <span className="font-medium">{selectedPreview.due_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ยอดสุทธิ:</span>
                    <span className="font-medium">฿{selectedPreview.net_total?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT:</span>
                    <span className="font-medium">฿{selectedPreview.vat?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ยอดรวม:</span>
                    <span className="font-bold text-primary">฿{selectedPreview.grand_total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              {selectedPreview.items && selectedPreview.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-3 py-2 text-sm font-medium">
                    รายการสินค้า ({selectedPreview.items.length} รายการ)
                  </div>
                  <div className="divide-y max-h-64 overflow-y-auto">
                    {selectedPreview.items.map((item, idx) => (
                      <div key={idx} className="px-3 py-2 text-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{item.customer_product_code}</p>
                            <p className="text-muted-foreground text-xs">{item.customer_description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">฿{item.amount?.toLocaleString()}</p>
                            <p className="text-muted-foreground text-xs">
                              {item.quantity} {item.unit} × ฿{item.unit_price?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
