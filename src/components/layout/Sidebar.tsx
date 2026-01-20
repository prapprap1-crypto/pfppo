import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  FileCheck, 
  Download,
  History,
  LogOut,
  FolderOpen,
  Users,
  UserCircle,
  Activity,
  Building2,
  PieChart,
  Settings,
  ChevronDown,
  ChevronRight,
  Warehouse,
  MapPinned,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const mainNavItems = [
  { path: '/', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { path: '/po-list', label: 'รายการ PO', icon: FileText },
  { path: '/verification', label: 'ตรวจสอบเอกสาร', icon: FileCheck },
  { path: '/mapping-dashboard', label: 'สรุป Mapping', icon: PieChart },
  { path: '/export', label: 'ส่งออก Excel', icon: Download },
  { path: '/export-history', label: 'ประวัติส่งออก', icon: History },
];

const settingsNavItems = [
  { path: '/mapping', label: 'Mapping สินค้า', icon: Layers },
  { path: '/customer-mapping', label: 'Mapping ลูกค้า', icon: Building2 },
  { path: '/settings/warehouses', label: 'คลังสินค้า', icon: Warehouse },
  { path: '/settings/vehicle-positions', label: 'ตำแหน่งจัดรถ', icon: MapPinned },
  { path: '/settings/transport-codes', label: 'รหัสขนส่ง', icon: Truck },
  { path: '/activity-log', label: 'ประวัติการใช้งาน', icon: Activity },
  { path: '/users', label: 'จัดการผู้ใช้', icon: Users },
  { path: '/profile', label: 'โปรไฟล์', icon: UserCircle },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(
    settingsNavItems.some(item => location.pathname === item.path)
  );

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">PO System</h1>
            <p className="text-xs text-sidebar-foreground/60">PDF Processing</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {/* Main Navigation */}
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn('nav-link', isActive && 'nav-link-active')}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Settings Collapsible */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger className="nav-link w-full justify-between group">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5" />
              <span>ตั้งค่า</span>
            </div>
            {settingsOpen ? (
              <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
            ) : (
              <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
            {settingsNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'nav-link text-sm py-2',
                    isActive && 'nav-link-active'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60 mb-2 truncate">
          {user?.email}
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          ออกจากระบบ
        </Button>
      </div>
    </aside>
  );
}
