import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  CheckCircle2, 
  Download, 
  Map, 
  Settings,
  Users,
  History,
  BookOpen,
  Printer,
  FileDown,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';


// Import section components
import { OverviewSection } from '@/components/guide/OverviewSection';
import { ImportSection } from '@/components/guide/ImportSection';
import { VerificationSection } from '@/components/guide/VerificationSection';
import { MappingSection } from '@/components/guide/MappingSection';
import { ExportSection } from '@/components/guide/ExportSection';
import { MasterDataSection } from '@/components/guide/MasterDataSection';
import { ReportsSection } from '@/components/guide/ReportsSection';
import { UsersSection } from '@/components/guide/UsersSection';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

export default function UserGuide() {
  const [activeSection, setActiveSection] = useState('overview');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    toast.info('กำลังสร้างไฟล์ PDF...');

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const content = document.getElementById('guide-content');
      if (!content) throw new Error('Content not found');

      const canvas = await html2canvas(content, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save('คู่มือการใช้งาน-PO-Management.pdf');
      toast.success('ดาวน์โหลด PDF สำเร็จ!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้าง PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const sections: GuideSection[] = [
    { id: 'overview', title: 'ภาพรวมระบบ', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'import', title: 'นำเข้าเอกสาร', icon: <Upload className="w-5 h-5" /> },
    { id: 'verification', title: 'ตรวจสอบเอกสาร', icon: <CheckCircle2 className="w-5 h-5" /> },
    { id: 'mapping', title: 'Mapping ข้อมูล', icon: <Map className="w-5 h-5" /> },
    { id: 'export', title: 'ส่งออก Excel', icon: <Download className="w-5 h-5" /> },
    { id: 'master-data', title: 'ข้อมูลหลัก', icon: <Settings className="w-5 h-5" /> },
    { id: 'reports', title: 'รายงาน', icon: <History className="w-5 h-5" /> },
    { id: 'users', title: 'ผู้ใช้งาน', icon: <Users className="w-5 h-5" /> },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return <OverviewSection />;
      case 'import': return <ImportSection />;
      case 'verification': return <VerificationSection />;
      case 'mapping': return <MappingSection />;
      case 'export': return <ExportSection />;
      case 'master-data': return <MasterDataSection />;
      case 'reports': return <ReportsSection />;
      case 'users': return <UsersSection />;
      default: return <OverviewSection />;
    }
  };

  return (
    <MainLayout title="คู่มือการใช้งาน" subtitle="วิธีใช้งานระบบจัดการใบสั่งซื้อ">
      <div className="flex gap-6">
        <Card className="w-64 shrink-0 p-4 h-fit sticky top-4 print:hidden">
          <h3 className="font-semibold mb-4">หัวข้อ</h3>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {section.icon}
                {section.title}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-4 border-t space-y-2">
            <Button onClick={handleExportPdf} className="w-full gap-2" disabled={isExportingPdf}>
              {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {isExportingPdf ? 'กำลังสร้าง...' : 'ดาวน์โหลด PDF'}
            </Button>
            <Button onClick={() => window.print()} variant="outline" className="w-full gap-2">
              <Printer className="w-4 h-4" />
              พิมพ์คู่มือ
            </Button>
          </div>
        </Card>

        <div className="flex-1" id="guide-content">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="pr-4">{renderContent()}</div>
          </ScrollArea>
        </div>
      </div>
    </MainLayout>
  );
}
