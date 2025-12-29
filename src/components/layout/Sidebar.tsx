import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  FileCheck, 
  Download, 
  Settings,
  FolderOpen 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { path: '/po-list', label: 'รายการ PO', icon: FileText },
  { path: '/mapping', label: 'Mapping สินค้า', icon: Layers },
  { path: '/verification', label: 'ตรวจสอบเอกสาร', icon: FileCheck },
  { path: '/export', label: 'ส่งออก Excel', icon: Download },
];

export function Sidebar() {
  const location = useLocation();

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
        {navItems.map((item) => {
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
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-sidebar-border">
        <Link to="/settings" className="nav-link">
          <Settings className="w-5 h-5" />
          <span>ตั้งค่า</span>
        </Link>
      </div>
    </aside>
  );
}
