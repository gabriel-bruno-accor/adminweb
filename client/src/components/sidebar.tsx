import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Database, 
  TableProperties, 
  Eye, 
  Terminal, 
  FileDown, 
  Settings, 
  LogOut, 
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  isMobile: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ isMobile, setMobileOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeMobileMenu = () => {
    if (isMobile && setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const MenuItem = ({ 
    href, 
    icon: Icon, 
    label, 
    isActive 
  }: { 
    href: string; 
    icon: React.ElementType; 
    label: string; 
    isActive: boolean;
  }) => (
    <div
      onClick={() => {
        window.history.pushState({}, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
        closeMobileMenu();
      }}
      className={cn(
        "flex items-center px-3 py-2 rounded-md hover:bg-slate-700 hover:text-white mb-1 cursor-pointer",
        isActive ? "bg-slate-700 text-white" : "text-slate-300"
      )}
    >
      <Icon className="h-5 w-5 mr-3" />
      <span>{label}</span>
    </div>
  );

  return (
    <div className="bg-slate-800 text-white h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-primary" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M17 9l-5 5-5-5"></path>
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
          <span className="text-xl font-semibold">AdminWEB</span>
        </div>
        {isMobile && (
          <button 
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>
      
      <div className="py-4 px-3 flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Database</div>
        <MenuItem 
          href="/" 
          icon={Database} 
          label="Dashboard" 
          isActive={location === "/"} 
        />
      
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-2">Tables</div>
        <MenuItem 
          href="/tables/hotel" 
          icon={TableProperties} 
          label="Hotel" 
          isActive={location === "/tables/hotel"} 
        />
        <MenuItem 
          href="/tables/subcro" 
          icon={TableProperties} 
          label="Subcro" 
          isActive={location === "/tables/subcro"} 
        />
        <MenuItem 
          href="/tables/user" 
          icon={TableProperties} 
          label="User" 
          isActive={location === "/tables/user"} 
        />
        
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-2">Views</div>
        <MenuItem 
          href="/views/hotel-maincro-subcro" 
          icon={Eye} 
          label="Hotel MainCro SubCro" 
          isActive={location === "/views/hotel-maincro-subcro"} 
        />
        <MenuItem 
          href="/views/user-maincro-subcro" 
          icon={Eye} 
          label="User MainCro SubCro" 
          isActive={location === "/views/user-maincro-subcro"} 
        />
        
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-2">Tools</div>
        <MenuItem 
          href="/sql-editor" 
          icon={Terminal} 
          label="SQL Query Editor" 
          isActive={location === "/sql-editor"} 
        />
        <MenuItem 
          href="/export" 
          icon={FileDown} 
          label="Export Data" 
          isActive={location === "/export"} 
        />
        <MenuItem 
          href="/settings" 
          icon={Settings} 
          label="Settings" 
          isActive={location === "/settings"} 
        />
      </div>
      
      {user && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold">
              <span>{user.username.substring(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <div className="text-sm font-medium">{user.username}</div>
              <div className="text-xs text-slate-400">{user.email}</div>
            </div>
            <div className="ml-auto">
              <button 
                className="text-slate-400 hover:text-white"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="md:hidden mr-4 text-slate-600 hover:text-slate-900"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
