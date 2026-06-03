import logoWithName from "@/assets/images/bg-rm-logo-HRES.png";
import logo from "@/assets/images/wenxt-W-only-logo.png";
import { useAuth } from "@/shared/auth/useAuth";
import { useAuthenticatedImage } from "@/shared/hooks/useAuthenticatedImage";
import type { JSX } from "react";
import {
  FaBell,
  FaCalendarAlt,
  FaCalendarCheck,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaFileSignature,
  FaHistory,
  FaHome,
  FaMoneyBillWave,
  FaNewspaper,
  FaThLarge,
  FaClipboardList,
} from "react-icons/fa";
import { HiUserGroup } from "react-icons/hi";
import { HiUsers } from "react-icons/hi2";
import { MdPendingActions, MdVerifiedUser } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
}

// Tab type — roles always required, no hidden field
interface Tab {
  name: string;
  path: string;
  icon: JSX.Element;
  roles: string[];
}

function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl, isLoading: imageLoading } = useAuthenticatedImage(user?.passportPhotoPath);

  const userRole = user?.role?.toUpperCase() ?? "";
  const userName = user?.name;

  const basePathMap: Record<string, string> = {
    EMPLOYEE:    "/employee",
    MANAGER:     "/manager",
    CTO:         "/manager",
    COO:         "/manager",
    TEAM_LEADER: "/manager",
    HR:          "/hr",
    ADMIN:       "/admin",
    CFO:         "/cfo",
  };

  const basePath = basePathMap[userRole] || "/employee";

  // COO and CFO excluded from Self Appraisal — simply not added to roles array
  const tabs: Tab[] = [
    { name: "Home",               path: "portal",             icon: <FaHome />,               roles: ["EMPLOYEE","MANAGER","TEAM_LEADER","HR","ADMIN","COO","CTO","CFO","CEO"] },
    { name: "Dashboard",          path: "dashboard",          icon: <FaThLarge />,             roles: ["EMPLOYEE","MANAGER","TEAM_LEADER","HR","ADMIN","COO","CTO","CFO","CEO"] },
    { name: "Action Center",      path: "action-center",      icon: <MdPendingActions />,      roles: ["MANAGER","HR","CTO","COO","ADMIN"] },
    { name: "Calendar",           path: "calendar",           icon: <FaCalendarAlt />,         roles: ["MANAGER","TEAM_LEADER","ADMIN","HR","CTO","COO","EMPLOYEE"] },
    { name: "Team Members",       path: "team",               icon: <HiUserGroup />,           roles: ["MANAGER","TEAM_LEADER","ADMIN","HR","CTO","COO"] },
    { name: "Employees",          path: "employees",          icon: <HiUsers />,               roles: ["ADMIN","HR"] },
    { name: "Payroll",            path: "payroll",            icon: <HiUsers />,               roles: ["CFO"] },
    { name: "Low Balance",        path: "low-balance",        icon: <FaExclamationTriangle />, roles: ["HR"] },
    { name: "Verifications",      path: "verifications",      icon: <MdVerifiedUser />,        roles: ["HR"] },
    { name: "My Requests",        path: "requests",           icon: <FaHistory />,             roles: ["EMPLOYEE","MANAGER","ADMIN","CTO","COO"] },
    { name: "Request Center",     path: "request-center",     icon: <FaFileSignature />,       roles: ["EMPLOYEE","MANAGER","TEAM_LEADER","ADMIN","CTO","COO"] },
    { name: "Notifications",      path: "notifications",      icon: <FaBell />,                roles: ["EMPLOYEE","MANAGER","TEAM_LEADER","HR","ADMIN","COO","CTO","CFO","CEO"] },
    { name: "Flash News",         path: "flash-news",         icon: <FaNewspaper />,           roles: ["ADMIN"] },
    { name: "Policy Config",      path: "policies",           icon: <FaFileSignature />,       roles: ["ADMIN"] },
    { name: "Attendance Reports", path: "attendance-reports", icon: <FaCalendarCheck />,       roles: ["MANAGER","TEAM_LEADER","HR","ADMIN","COO","CTO","CFO","CEO"] },
    { name: "Pay Slip",           path: "payslip",            icon: <FaMoneyBillWave />,       roles: ["EMPLOYEE","MANAGER","TEAM_LEADER","HR","ADMIN","COO","CTO","CEO"] },
    // Self Appraisal — COO and CFO NOT in roles (they use Appraisal Reviews instead)
    { name: "Self Appraisal",     path: "self-appraisal",     icon: <FaClipboardList />,       roles: ["EMPLOYEE","MANAGER","TEAM_LEADER","HR","ADMIN","CTO"] },
    // Appraisal Reviews — for approvers + COO (view all) + CFO (view all)
    { name: "Appraisal Reviews",  path: "appraisal-reviews",  icon: <FaClipboardList />,       roles: ["MANAGER","COO","CFO","CTO"] },
  ];

  const visibleTabs = tabs.filter((tab) =>
    userRole ? tab.roles.includes(userRole) : false
  );

  const handleNavigate = (path: string) => {
    const finalPath = path === "portal" ? "/portal" : `${basePath}/${path}`;
    navigate(finalPath);
    if (window.innerWidth < 768) setIsOpen(false);
  };

  const sidebarWidth = isCollapsed ? "md:w-20" : "md:w-80";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-35 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-80 ${sidebarWidth} bg-white 
        p-4 border-r border-slate-100 flex flex-col
        transition-all duration-300 ease-in-out shadow-2xl shadow-slate-200/50
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* TOGGLE BUTTON */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-100 rounded-full items-center justify-center text-slate-400 hover:text-brand z-50 transition-colors"
        >
          {isCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
        </button>

        {/* LOGO */}
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} mb-10 px-2 py-3 rounded-2xl bg-slate-50/50 transition-all`}>
          <img src={isCollapsed ? logoWithName : logo} alt="logo" className="w-18 h-16 min-w-18 p-2 shrink-0 object-contain" />
          {!isCollapsed && (
            <div className="flex flex-col justify-center overflow-hidden">
              <span className="text-slate-900 text-xs font-black leading-tight uppercase tracking-tighter">WeNxt</span>
              <span className="text-brand text-[9px] font-bold uppercase tracking-widest whitespace-nowrap leading-tight">Technologies</span>
            </div>
          )}
        </div>

        {/* USER PROFILE */}
        <div
          onClick={() => handleNavigate("profile")}
          className={`group relative flex items-center ${isCollapsed ? "justify-center" : "gap-3"} p-3 mb-8 rounded-sm cursor-pointer transition-all hover:bg-slate-50`}
        >
          <div className="w-10 h-10 min-w-10 rounded-full bg-brand text-white flex items-center justify-center font-black shadow-lg shadow-brand/20 transition-transform group-hover:scale-105 overflow-hidden">
            {imageLoading ? (
              <div className="w-full h-full animate-pulse bg-white/20" />
            ) : imageUrl ? (
              <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              userName?.charAt(0) || "U"
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <p className="text-xs font-black text-slate-900 truncate">{userName}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{userRole}</p>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 pb-20">
          {!isCollapsed && (
            <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Core Management
            </p>
          )}

          <ul className="space-y-2">
            {visibleTabs.map((tab) => {
              const isActive = location.pathname === `${basePath}/${tab.path}`;
              return (
                <li
                  key={tab.path}
                  onClick={() => handleNavigate(tab.path)}
                  className={`group relative flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3.5 rounded-xl cursor-pointer transition-all
                    ${isActive
                      ? "bg-brand text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-brand"
                    }`}
                >
                  <span className={`text-lg transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-brand"}`}>
                    {tab.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="text-[14px] font-black tracking-tight whitespace-nowrap">
                      {tab.name}
                    </span>
                  )}
                  {isCollapsed && (
                    <div className="fixed left-20 scale-0 group-hover:scale-100 transition-all duration-200 origin-left 
                      bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg 
                      whitespace-nowrap z-[999] shadow-xl shadow-black/30 pointer-events-none
                      before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 
                      before:w-2 before:h-2 before:bg-slate-900 before:rotate-45">
                      {tab.name}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;