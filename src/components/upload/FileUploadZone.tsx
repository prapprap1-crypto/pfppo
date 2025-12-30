import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createPOHeader, createPOItems } from '@/lib/api/database';

interface FileUploadZoneProps {
  onFilesSelected?: (files: File[]) => void;
  onUploadComplete?: () => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  className?: string;
}

type FileStatus = 'pending' | 'processing' | 'success' | 'error';

interface UploadedFile {
  file: File;
  status: FileStatus;
  error?: string;
}

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        status: 'pending' as FileStatus
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
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0 || isProcessing) return;

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < uploadedFiles.length; i++) {
      const { file, status } = uploadedFiles[i];
      
      if (status !== 'pending') continue;

      // Update status to processing
      setUploadedFiles(prev => 
        prev.map((f, idx) => idx === i ? { ...f, status: 'processing' as FileStatus } : f)
      );

      try {
        // Convert PDF to base64
        const pdfBase64 = await fileToBase64(file);

        // Call edge function to parse PDF
        const { data, error } = await supabase.functions.invoke('parse-po-pdf', {
          body: { pdfBase64, fileName: file.name }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Failed to parse PDF');

        const extractedData = data.data;
        console.log('Extracted PO data:', extractedData);

        // Save to database
        const poHeader = await createPOHeader({
          po_number: extractedData.po_number,
          supplier_code: extractedData.supplier_code,
          supplier_name: extractedData.supplier_name,
          branch: extractedData.branch,
          document_date: extractedData.document_date,
          due_date: extractedData.due_date,
          net_total: extractedData.net_total,
          vat: extractedData.vat,
          grand_total: extractedData.grand_total,
          source_file: file.name,
          status: 'NEW'
        });

        if (poHeader && extractedData.items?.length > 0) {
          const items = extractedData.items.map((item: any) => ({
            po_id: poHeader.id,
            customer_product_code: item.customer_product_code,
            customer_description: item.customer_description,
            quantity: item.quantity,
            unit: item.unit || 'ลัง',
            unit_price: item.unit_price,
            amount: item.amount,
            delivery_date: item.delivery_date,
            is_mapped: false
          }));

          await createPOItems(items);
        }

        setUploadedFiles(prev => 
          prev.map((f, idx) => idx === i ? { ...f, status: 'success' as FileStatus } : f)
        );
        successCount++;

      } catch (error) {
        console.error('Error processing file:', file.name, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setUploadedFiles(prev => 
          prev.map((f, idx) => idx === i ? { ...f, status: 'error' as FileStatus, error: errorMessage } : f)
        );
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

      {uploadedFiles.length > 0 && (
        <div className="bg-card rounded-xl border p-4">
          <h4 className="text-sm font-medium mb-3">ไฟล์ที่เลือก ({uploadedFiles.length})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div 
                key={`${uploadedFile.file.name}-${index}`}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg",
                  uploadedFile.status === 'error' ? 'bg-destructive/10' :
                  uploadedFile.status === 'success' ? 'bg-green-500/10' :
                  'bg-muted/50'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getStatusIcon(uploadedFile.status)}
                  <span className="text-sm font-medium truncate max-w-48">{uploadedFile.file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({(uploadedFile.file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
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
                {uploadedFile.status === 'error' && uploadedFile.error && (
                  <span className="text-xs text-destructive truncate max-w-32">{uploadedFile.error}</span>
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
    </div>
  );
}
