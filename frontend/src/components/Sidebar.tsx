import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Activity, 
  User, 
  Mail, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  currentRole: UserRole;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  currentRole
}: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'listings', label: 'Internships', icon: Briefcase },
    { id: 'tracker', label: 'Tracker', icon: Activity },
    { id: 'profile', label: 'My Documents', icon: User },
    { id: 'messages', label: 'Inbox Messages', icon: Mail },
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck }
  ];

  return (
    <aside 
      id="sidebar-container"
      className={`h-screen bg-sidebar-bg border-r border-[#E5E2DE] flex flex-col justify-between transition-all duration-300 relative select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#F1F0EC] justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0D9488] rounded-md flex items-center justify-center text-white font-bold">
                I
              </div>
              <span className="font-serif text-xl tracking-tight text-[#0D2D2D]">Incipio.</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-[#0D9488] rounded-md flex items-center justify-center text-white font-bold mx-auto">
              I
            </div>
          )}

          {/* Inline Toggle Button (Hover State) */}
          {!collapsed && (
            <button
              id="sidebar-collapse-btn-desktop"
              onClick={() => setCollapsed(true)}
              className="p-1 rounded hover:bg-cream-accent/60 text-[#64748B] hover:text-editorial cursor-pointer transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={15} />
            </button>
          )}
        </div>

        {/* User Context Badge (Sidebar Interior) */}
        {!collapsed && (
          <div className="mx-4 mt-5 p-3 rounded-xl bg-[#FDFCFB] border border-[#E5E2DE] flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-editorial-light animate-pulse inline-block" />
              <span className="text-[10px] font-mono tracking-wider text-[#64748B] uppercase">
                Active Environment
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1A1C1E]">
                Mode: <span className="text-editorial font-serif italic font-semibold">{currentRole}</span>
              </p>
              <p className="text-[10px] text-[#64748B] mt-0.5">
                {currentRole === 'Admin' && 'Academic Overseer System'}
                {currentRole === 'Company' && 'Recruitment & Offers Hub'}
                {currentRole === 'Student' && 'Applicant Career Tracker'}
                {currentRole === 'Faculty' && 'Faculty Verification Desk'}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Map */}
        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            
            // Visual alert if Admin views are clicked by students
            const isRestricted = item.id === 'admin' && currentRole !== 'Admin';

            return (
              <button
                id={`sidebar-nav-${item.id}`}
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative group cursor-pointer border ${
                  isActive
                    ? 'bg-white border-[#E5E2DE] shadow-sm text-editorial-light font-semibold'
                    : 'text-[#64748B] hover:text-editorial-light hover:bg-[#F1F0EC]/65 border-transparent'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Icon size={18} className={isActive ? 'text-editorial-light' : 'text-[#64748B] group-hover:text-editorial-light'} />
                </div>
                
                {!collapsed && (
                  <span className="truncate flex-1 text-left">
                    {item.label}
                  </span>
                )}

                {/* Restricted Lock Icon badge */}
                {!collapsed && isRestricted && (
                  <span className="ml-auto text-[10px] bg-amber-50 text-amber-700 border border-amber-200 py-0.5 px-1.5 rounded-md font-mono flex items-center gap-0.5">
                    View
                  </span>
                )}

                {/* Micro tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-16 bg-editorial text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md font-sans whitespace-nowrap z-50">
                    {item.label} {isRestricted ? '(Read Mode Only)' : ''}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer / Collapse Controller */}
      <div className="p-4 border-t border-[#F1F0EC] bg-transparent">
        {collapsed ? (
          <button
            id="sidebar-expand-btn"
            onClick={() => setCollapsed(false)}
            className="w-full h-10 rounded-lg text-gray-500 hover:text-editorial-light hover:bg-cream-accent flex items-center justify-center transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronRight size={18} />
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-[#F1F0EC] rounded-xl border border-[#E5E2DE]">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Weekly Goal</p>
              <div className="w-full bg-[#E5E2DE] h-1.5 rounded-full mb-2">
                <div className="bg-[#0D9488] h-1.5 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-[11px] text-[#64748B]">8 of 12 apps sent</p>
            </div>
            
            <div className="flex items-center gap-2.5 p-1">
              <span className="h-7 w-7 rounded-full bg-editorial-light/10 flex items-center justify-center text-editorial-light">
                <Sparkles size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">Academic Term</p>
                <p className="text-[10px] text-gray-500 font-mono">Summer 2026</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

