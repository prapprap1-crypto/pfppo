import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileUploadZoneProps {
  onFilesSelected?: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  className?: string;
}

export function FileUploadZone({ 
  onFilesSelected, 
  accept = { 'application/pdf': ['.pdf'] },
  maxFiles = 10,
  className 
}: FileUploadZoneProps) {
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      toast({
        title: "อัปโหลดสำเร็จ",
        description: `เพิ่ม ${acceptedFiles.length} ไฟล์เพื่อวิเคราะห์`,
      });
      onFilesSelected?.(acceptedFiles);
    }
  }, [onFilesSelected, toast]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = [...acceptedFiles];
    newFiles.splice(index, 1);
    onFilesSelected?.(newFiles);
  };

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

      {acceptedFiles.length > 0 && (
        <div className="bg-card rounded-xl border p-4">
          <h4 className="text-sm font-medium mb-3">ไฟล์ที่เลือก ({acceptedFiles.length})</h4>
          <div className="space-y-2">
            {acceptedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium truncate max-w-64">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button className="w-full mt-4 bg-accent hover:bg-accent/90">
            <Upload className="w-4 h-4 mr-2" />
            เริ่มวิเคราะห์ไฟล์ทั้งหมด
          </Button>
        </div>
      )}
    </div>
  );
}
