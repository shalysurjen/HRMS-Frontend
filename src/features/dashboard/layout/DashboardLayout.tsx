import DashboardRoutes from "./DashboardRoutes";
import { useAuth } from "@/shared/auth/useAuth";
import { useState } from "react";
import { Sidebar, Topbar } from "@/shared/components";
import BirthdayPanel from "@/features/birthday/components/BirthdayPanel";

const DashboardLayout: React.FC = () => {
  const { contextLogout: logout, user } = useAuth();
  
  // Mobile drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Desktop collapse state - lifted from Sidebar to Layout
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isBirthdayOpen, setIsBirthdayOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ease-in-out
          ${isCollapsed ? "md:ml-20" : "md:ml-80"}`}
      >
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={logout}
          onBirthdayToggle={() => setIsBirthdayOpen(prev => !prev)}
          isBirthdayOpen={isBirthdayOpen}
        />

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
            <div className="max-w-7xl mx-auto w-full">
              <DashboardRoutes />
            </div>
          </main>
          <BirthdayPanel
currentUserId={user?.id ?? null}
            isOpen={isBirthdayOpen}
            onClose={() => setIsBirthdayOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;