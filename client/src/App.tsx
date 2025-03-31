import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import TablePage from "@/pages/table-page";
import ViewPage from "@/pages/view-page";
import SqlEditorPage from "@/pages/sql-editor-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Sidebar, MobileSidebarTrigger } from "@/components/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Close mobile menu when transitioning from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - fixed on desktop, slide-in on mobile */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 transform bg-[#1e293b]
          ${isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'} 
          md:relative md:translate-x-0
        `}
      >
        <Sidebar 
          isMobile={isMobile} 
          setMobileOpen={setIsMobileMenuOpen} 
        />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {isMobile && (
          <header className="bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center px-4 py-3">
              <MobileSidebarTrigger onClick={() => setIsMobileMenuOpen(true)} />
              <div className="text-xl font-semibold text-slate-800">AdminWEB</div>
            </div>
          </header>
        )}
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
      
      {/* Modal backdrop for mobile menu */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute path="/" component={() => (
        <AppLayout>
          <HomePage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/tables/:tableType" component={() => (
        <AppLayout>
          <TablePage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/views/:viewType" component={() => (
        <AppLayout>
          <ViewPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/sql-editor" component={() => (
        <AppLayout>
          <SqlEditorPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/export" component={() => (
        <AppLayout>
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Export Data</h1>
            <p>Use the export buttons on each table or view to download data in CSV or JSON format.</p>
          </div>
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/settings" component={() => (
        <AppLayout>
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p>Application settings will be available here in future updates.</p>
          </div>
        </AppLayout>
      )} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
