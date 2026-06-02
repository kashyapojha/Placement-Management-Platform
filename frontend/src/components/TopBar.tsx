import React, { useState } from 'react';
import { 
  Bell, 
  ChevronDown, 
  Check, 
  Shield, 
  Building2, 
  GraduationCap, 
  LogOut,
  Sparkles,
  Inbox
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';

interface TopBarProps {
  currentRole: UserRole;
  currentUser: UserProfile;
  onLogout: () => void;
  unreceivedCount: number;
  triggerToast: (title: string, text: string, type: 'success' | 'info' | 'error') => void;
}

export default function TopBar({
  currentRole,
  currentUser,
  onLogout,
  unreceivedCount,
  triggerToast
}: TopBarProps) {
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Generically formatted system notification logs
  const systemNotifications = [
    { id: 'n1', text: 'Application reviewed stage updated to "Applied"', time: 'Just now', read: false },
    { id: 'n2', text: 'Database transactions securely persisted in MongoDB', time: '10m ago', read: false },
    { id: 'n3', text: 'Career coordinating services initialized', time: '1h ago', read: true }
  ];

  return (
    <header className="h-16 bg-white border-b border-[#F1F0EC] px-6 flex items-center justify-between relative select-none">
      
      {/* Brand Context Header */}
      <div className="flex items-center gap-3 text-left">
        <h2 className="text-xs text-[#64748B] font-sans">
          Welcome back, <span className="font-semibold text-[#1A1C1E]">{currentUser.name}</span>
        </h2>
      </div>

      {/* Action Controls - Notifications, User Profile Badge, Logout button */}
      <div className="flex items-center gap-4">
        
        {/* User Context Card (Static Role Display) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F8F6] border border-[#E5E2DE] rounded-lg text-xs font-semibold text-editorial-light">
          {currentRole === 'Admin' && <Shield size={13} className="text-[#0D9488]" />}
          {currentRole === 'Company' && <Building2 size={13} className="text-[#0D9488]" />}
          {currentRole === 'Student' && <GraduationCap size={13} className="text-[#0D9488]" />}
          <span className="font-sans leading-none">{currentRole} Mode</span>
        </div>

        {/* Dynamic Notification Bell */}
        <div className="relative">
          <button
            id="notification-bell"
            onClick={() => {
              setNotifDropdownOpen(!notifDropdownOpen);
            }}
            className="p-2 text-gray-655 hover:text-editorial-light hover:bg-[#F9F8F6] rounded-lg relative cursor-pointer transition-colors"
          >
            <Bell size={18} />
            {unreceivedCount > 0 && (
              <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-editorial-light text-white rounded-full text-[8px] font-bold flex items-center justify-center animate-pulse">
                {unreceivedCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E2DE] rounded-xl shadow-lg z-50 py-2 outline-none">
              <div className="px-4 py-2 border-b border-[#F1F0EC] flex items-center justify-between">
                <span className="text-sm font-semibold text-editorial font-serif">Notifications</span>
                <span className="text-[10px] font-mono text-[#94A3B8] bg-[#F9F8F6] py-0.5 px-2 rounded border border-[#E5E2DE]">
                  Real-time Status
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#F1F0EC]">
                {systemNotifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-[#FDFCFB] transition-colors flex flex-col gap-1 text-left">
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-[#1A1C1E] font-sans leading-normal pr-3">{n.text}</p>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 bg-editorial-light rounded-full shrink-0 mt-1 animate-ping" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#94A3B8] font-mono">{n.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-[#F1F0EC] text-center bg-[#F9F8F6]">
                <button
                  onClick={() => {
                    setNotifDropdownOpen(false);
                    triggerToast('Clean Sweep', 'Notifications marked as read.', 'info');
                  }}
                  className="text-[11px] font-semibold text-[#0D9488] hover:underline cursor-pointer"
                >
                  Clear notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Circle */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#F1F0EC]">
          {currentUser.avatarUrl ? (
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.name} 
              className="h-8 w-8 rounded-full object-cover shadow-inner select-none border border-[#E5E2DE]"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-[#0D9488] text-white font-semibold flex items-center justify-center font-serif shadow-inner select-none">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div className="hidden lg:flex flex-col select-none text-left">
            <span className="text-xs font-semibold text-[#1A1C1E] leading-none">{currentUser.name}</span>
            <span className="text-[10px] text-[#94A3B8] mt-0.5 max-w-[120px] truncate">{currentUser.email}</span>
          </div>
        </div>

        {/* Premium Sign Out Button */}
        <button
          onClick={onLogout}
          id="logout-header-btn"
          title="Sign out of portal session"
          className="p-2 text-[#94A3B8] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
        >
          <LogOut size={17} />
        </button>

      </div>
    </header>
  );
}
