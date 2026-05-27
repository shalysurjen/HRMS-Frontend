import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  HiChevronDoubleLeft, HiChevronDoubleRight,
  HiOutlineBriefcase,
  HiOutlineClock, HiOutlineHome,
  HiOutlineMoon,
  HiOutlineShieldCheck
} from "react-icons/hi2";
import { TbAccessPoint } from "react-icons/tb";

// Import your form components
import LeaveApplicationForm from "@/features/leave/components/LeaveApplicationForm";
import ODRequestForm from "@/features/leave/components/ODRequestForm";
import WFHRequestForm from "@/features/leave/components/WfhRequestForm";
import AccessRequestForm from "./AccessRequestForm";
import PermissionRequestForm from "./PermissionRequestForm";
type RequestType = "LEAVE" | "OD" | "WFH" | "MEETING" | "OVERTIME" | "ACCESS" | "PERMISSION";

const RequestCenter = () => {
  const [activeTab, setActiveTab] = useState<RequestType>("LEAVE");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive check correctly
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(false); // Never collapse on mobile
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { id: "LEAVE", label: "Leave", icon: <HiOutlineClock size={18} />, description: "Annual, Sick" },
    { id: "OD", label: "OD", icon: <HiOutlineBriefcase size={18} />, description: "On-Duty" },
    { id: "ACCESS", label: "Access", icon: <TbAccessPoint size={18} />, description: "VPN / Bio" },
    { id: "WFH", label: "WFH", icon: <HiOutlineHome size={18} />, description: "Home" },
    { id: "OVERTIME", label: "Overtime", icon: <HiOutlineMoon size={18} />, description: "Extra Credit" },
    { id: "PERMISSION", label: "Permission", icon: <HiOutlineShieldCheck size={18} />, description: "Short Leave" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 md:py-8 md:px-6">
      {/* LAYOUT ENGINE:
          Mobile: flex-col (Aside top, Main bottom)
          Desktop: md:grid (Aside left, Main right)
      */}
      <div className="flex flex-col md:grid md:grid-cols-[auto_1fr] gap-4 md:gap-8 items-start">

        {/* SIDEBAR / MOBILE TOP NAV */}
        <motion.aside
          initial={false}
          animate={{
            width: isMobile ? "100%" : (isCollapsed ? "80px" : "260px")
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full md:sticky md:top-24 z-30"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-2 md:p-3 shadow-sm">

            {/* Desktop Toggle Header: Completely hidden on mobile */}
            <div className="hidden md:flex items-center justify-between mb-4 px-4 pt-2">
              {!isCollapsed && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menu</span>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
              >
                {isCollapsed ? <HiChevronDoubleRight size={16} /> : <HiChevronDoubleLeft size={16} />}
              </button>
            </div>

            {/* Navigation List
                Mobile: Horizontal Row (Swipeable)
                Desktop: Vertical Column
            */}
            <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as RequestType)}
                    className={`flex items-center gap-3 p-3 md:p-3.5 rounded-xl transition-all whitespace-nowrap min-w-fit md:min-w-0
                      ${isActive
                        ? "bg-brand text-white shadow-lg shadow-indigo-100"
                        : "text-slate-600 hover:bg-slate-50 bg-slate-50/50 md:bg-transparent"
                      }
                      ${isCollapsed ? "md:justify-center" : "md:justify-start"}
                    `}
                  >
                    <div className={`${isActive ? "text-white" : "text-indigo-500"} shrink-0`}>
                      {item.icon}
                    </div>

                    {/* Label handling */}
                    <div className={`text-left ${isCollapsed ? "md:hidden" : "block"}`}>
                      <p className="text-xs md:text-sm font-bold">{item.label}</p>
                      <p className="hidden md:block text-[9px] font-medium opacity-70 uppercase tracking-tighter">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.aside>

        {/* FORM CONTENT AREA */}
        <main className="w-full min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl shadow-sm min-h-100 overflow-hidden"
            >
              <div className="p-4 md:p-8">
                {activeTab === "LEAVE" && <LeaveApplicationForm />}
                {activeTab === "OD" && <ODRequestForm />}
                {activeTab === "ACCESS" && <AccessRequestForm />}
                {activeTab === "WFH" && <WFHRequestForm />}
                {activeTab === "PERMISSION" && <PermissionRequestForm />}

                {/* Status for building modules */}
                {(activeTab === "OVERTIME") && (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <HiOutlineMoon size={32} className="opacity-20" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-sm">Under Construction</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] mt-1">Coming soon to WeHRM</p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
};

export default RequestCenter;