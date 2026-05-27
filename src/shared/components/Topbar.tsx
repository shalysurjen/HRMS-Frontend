import { useNotifications } from "@/features/notification/hooks/useNotification";
import { useAuth } from "@/shared/auth/useAuth";
import { useAuthenticatedImage } from "@/shared/hooks/useAuthenticatedImage";
import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaSignOutAlt,
  FaUserCog
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import BirthdayTopbarButton from "@/features/birthday/components/BirthdayTopbarButton";

interface TopbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
  onBirthdayToggle?: () => void;
  isBirthdayOpen?: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick, onLogout, onBirthdayToggle, isBirthdayOpen = false }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl, isLoading: imageLoading } = useAuthenticatedImage(user?.passportPhotoPath);
  const { notifications, unreadCount } = useNotifications(String(user?.id));

  // 1. Normalize Role (Matching Sidebar Logic)
  const userRole = user?.role?.toUpperCase();

  const basePathMap = {
    EMPLOYEE: "/employee",
    MANAGER: "/manager",
    TEAM_LEADER: "/manager",
    CTO: "/manager",
    COO: "/manager",
    HR: "/hr",
    ADMIN: "/admin",
    CFO: "/cfo",
  };

  const basePath = basePathMap[userRole as keyof typeof basePathMap] || "/employee";

  // 2. Navigation Helper
  const handleNavigate = (path: string) => {
    navigate(`${basePath}/${path}`);
    setIsNotifOpen(false);
    setIsProfileOpen(false);
  };

  const title = useMemo(() => {
    const path = location.pathname;
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("calendar")) return "Calendar";
    if (path.includes("requests")) return "Requests";
    if (path.includes("notifications")) return "Notifications";
    if (path.includes("employees")) return "Employees";
    if (path.includes("approvals")) return "Approvals";
    if (path.includes("profile")) return "Profile";
    if (path.includes("payroll")) return "Payroll";
    if (path.includes("payslip")) return "Payslip";
    if (path.includes("birthday")) return "Birthday";
    if (path.includes("attendance")) return "Attendance Reports";
    return "Dashboard";
  }, [location.pathname]);

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between bg-white/80 backdrop-blur-md px-4 md:px-6 py-3 border-b border-neutral-200 w-full">

      {/* LEFT */}

      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="md:hidden p-2.5 rounded-lg text-slate-500 active:bg-slate-100">
          <FaBars size={18} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-primary-500  truncate">
          {title}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* 🎂 BIRTHDAY */}
        <BirthdayTopbarButton
          onClick={() => { onBirthdayToggle?.(); setIsNotifOpen(false); setIsProfileOpen(false); }}
          isOpen={isBirthdayOpen}
        />

        {/* 🔔 NOTIFICATIONS */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className={`relative p-2.5 rounded-xl transition-all duration-300 ${isNotifOpen ? "bg-brand/10 text-brand shadow-inner" : "text-slate-400 hover:text-brand hover:bg-slate-50"
              }`}
          >
            <FaBell size={18} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white border border-white"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setIsNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute right-0 mt-4 w-80 bg-white border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden z-[70]"
                >
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">Notifications</span>
                    <button
                      onClick={() => handleNavigate("notifications")}
                      className="text-[9px] font-black uppercase text-brand"
                    >
                      View All
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications?.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNavigate("notifications")}
                        className="p-5 border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                      >
                        <p className="text-[10px] font-black uppercase text-slate-800">{n.eventType?.replace(/_/g, " ")}</p>
                        <p className="text-[11px] text-slate-500 italic">"{n.message}"</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 👤 PROFILE */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className={`flex items-center gap-3 p-1.5 rounded-2xl transition-all ${isProfileOpen ? "bg-white shadow-md" : ""}`}
          >
            <div className="w-10 h-10 min-w-10 rounded-full bg-brand text-white flex items-center justify-center font-black shadow-lg shadow-brand/20 transition-transform group-hover:scale-105 overflow-hidden">
              {imageLoading ? (
                <div className="w-full h-full animate-pulse bg-white/20" />
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Fallback to Initial if no image */
                user?.name?.charAt(0) || "U"
              )}
            </div>
            <FaChevronDown className={`text-[10px] transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-[80]" onClick={() => setIsProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-4 w-56 bg-white rounded-3xl shadow-2xl p-2 z-[90] border border-slate-100"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate("profile");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-brand/5 hover:text-brand rounded-2xl"
                  >
                    <FaUserCog className="text-lg opacity-70" />
                    Profile
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-2xl"
                  >
                    <FaSignOutAlt className="text-lg opacity-70" />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Topbar;