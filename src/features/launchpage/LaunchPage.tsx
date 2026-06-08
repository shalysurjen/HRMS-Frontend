import logo from "@/assets/images/LogoWeHRM2.png";
import CalendarSVG from "@/assets/svg/calendar-svg.svg";
import moneySVG from "@/assets/svg/money-svg.svg";
import { FaChartBar } from "react-icons/fa";
import { useNotifications } from "@/features/notification/hooks/useNotification";
import type { FlashNews } from "@/features/notification/types";
import { useAuth } from "@/shared/auth/useAuth";
import { useAuthenticatedImage } from "@/shared/hooks/useAuthenticatedImage";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { FaChevronDown, FaSignOutAlt, FaUserCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getPolicies, viewPolicy } from "@/features/dashboard/admin/services/policyService";

const LaunchPage: React.FC = () => {
  const { user, contextLogout: logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { imageUrl, isLoading: imageLoading } = useAuthenticatedImage(user?.passportPhotoPath);
 const [policies, setPolicies] = useState<{ title: string; id: number }[]>([]);
  // Notification Hook & States
  const { fetchFlashNews } = useNotifications();
  const [flashNews, setFlashNews] = useState<FlashNews[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingNews, setLoadingNews] = useState(true);

  const userRole = user?.role;
  const basePathMap = {
    EMPLOYEE:    "/employee",
    MANAGER:     "/manager",
    TEAM_LEADER: "/manager",
    HR:          "/hr",
    ADMIN:       "/admin",
    CFO:         "/cfo",
    COO:         "/manager",
    CEO:         "/manager",
    CTO:         "/manager",
  };

  const basePath = basePathMap[userRole as keyof typeof basePathMap] || "/employee";

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleNavigate = (path: string) => {
    navigate(`${basePath}/${path}`);
  };

  const goToProfile = () => {
    navigate("/profile");
    setIsProfileOpen(false);
  };

  // 1. Fetch News Data
  // 1. Fetch News Data
  useEffect(() => {
    const loadNews = async () => {
      setLoadingNews(true);
      try {
        const response = await fetchFlashNews();

        // Look at your console log: the actual news is inside response.data
        // We check for both possibilities to be safe
        const actualData = response;

        if (actualData && Array.isArray(actualData)) {
          const sorted = [...actualData].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setFlashNews(sorted);
        } else {
          console.warn("Could not find array in response:", response);
          setFlashNews([]);
        }
      } catch (err) {
        console.error("News fetch failed", err);
      } finally {
        setLoadingNews(false);
      }
    };
    loadNews();
  }, [fetchFlashNews]);

  // 2. Handle Auto-Rotation
  useEffect(() => {
    if (flashNews.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % flashNews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [flashNews]);

  // COO only → appraisal reviews dashboard; everyone else → self-appraisal
  const appraisalPath = userRole === "COO"
    ? `${basePath}/appraisal-reviews`
    : `${basePath}/self-appraisal`;

  const systems = [
    {
      title: "Leave System",
      desc: "Apply for leaves, view balances, and track approvals.",
      icon: CalendarSVG,
      color: "bg-brand/10",
      path: `${basePath}/dashboard`,
      iconType: "img" as const,
    },
    {
      title: "Payroll System",
      desc: "View payslips, tax documents, and payment history.",
      icon: moneySVG,
      color: "bg-emerald-500/10",
      path: `${basePath}/dashboard`,
      iconType: "img" as const,
    },
    {
      title: "Appraisal System",
      desc: "View and manage performance appraisals, ratings, and feedback.",
      icon: null,
      color: "bg-violet-500/10",
      path: appraisalPath,
      iconType: "component" as const,
    },
  ];
useEffect(() => {
  const loadPolicies = async () => {
    try {
      const data = await getPolicies();

      // ✅ Group + keep latest version (highest id)
      const grouped = new Map<string, any>();

      data.forEach((p: any) => {
        if (!grouped.has(p.name) || grouped.get(p.name).id < p.id) {
          grouped.set(p.name, p);
        }
      });

      // ✅ IMPORTANT: include file URL
    const formatted = Array.from(grouped.values()).map((p: any) => ({
  title: p.name,
  id: p.id,   // ✅ use ID instead
}));

      setPolicies(formatted);
    } catch (err) {
      console.error("Failed to load policies", err);
    }
  };

  loadPolicies();
}, []);

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-slate-900 font-sans selection:bg-brand selection:text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-160 h-160 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-20 w-100 h-100 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="bg-brand overflow-hidden relative z-60 shadow-lg shadow-brand/20 py-2.5 border-b border-white/10"
        >
          <div className="flex whitespace-nowrap overflow-hidden group">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="flex items-center gap-12 min-w-full"
            >
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 text-white">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  <p className="text-[11px] md:text-xs font-black tracking-[0.15em]">
                    IMPORTANT UPDATE:
                    <span className="opacity-90 font-medium ml-2">
                      Users can edit profile details from
                      <span className="bg-white/20 px-2 py-0.5 rounded mx-1 text-white">06.04.2026</span>
                      to
                      <span className="bg-white/20 px-2 py-0.5 rounded mx-1 text-white">22.04.2026</span>.
                    </span>
                  </p>
                  <button
                    onClick={goToProfile}
                    className="bg-white text-brand px-3 py-1 rounded-full text-[10px] font-black uppercase hover:bg-slate-100 transition-colors pointer-events-auto"
                  >
                    Edit Now
                  </button>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 transition-all border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate("/")}>
            <img src={logo} alt="logo" className="h-15 w-15 object-contain transition-transform group-hover:scale-110" />
            <span className="text-xl font-black text-slate-800 tracking-tight">
              WeNxt <span className="text-brand">Technologies</span>
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Logged in as</p>
              <p className="text-sm font-black text-slate-700">
                {user?.name} <span className="text-brand/40 font-medium ml-1">({user?.role})</span>
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-3 p-1.5 rounded-2xl transition-all duration-300 ${isProfileOpen ? "bg-white shadow-md" : "hover:bg-white/50"}`}
              >
                <div className="w-10 h-10 min-w-10 rounded-full bg-brand text-white flex items-center justify-center font-black shadow-lg shadow-brand/20 overflow-hidden">
                  {imageLoading ? (
                    <div className="w-full h-full animate-pulse bg-white/20" />
                  ) : imageUrl ? (
                    <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || "U"
                  )}
                </div>
                <FaChevronDown className={`text-[10px] text-slate-400 transition-transform duration-500 mr-1 ${isProfileOpen ? "rotate-180 text-brand" : ""}`} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-56 bg-white rounded-3xl shadow-2xl p-2 z-50 border border-slate-100"
                    >
                      <button onClick={goToProfile} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-brand/5 hover:text-brand rounded-2xl transition-all">
                        <FaUserCog className="text-lg opacity-70" /> Profile
                      </button>
                      <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all mt-1">
                        <FaSignOutAlt className="text-lg opacity-70" /> Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full p-6 gap-8 relative z-10">
        <aside className="w-80 hidden lg:flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-brand p-6 rounded-2xl text-white shadow-xl shadow-brand/20">
            <p className="text-[10px] uppercase font-bold opacity-70 mb-2 tracking-widest">Thought of the Day</p>
            <p className="italic text-lg font-medium leading-tight">"Insurtech isn't just about code; it's about engineering trust."</p>
          </motion.div>

          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-400 uppercase text-[10px] tracking-widest">⚖️ Policy Center</h3>
<ul className="space-y-1">
  {policies.map((policy, i) => (
    <li key={i}>
      <button
        onClick={() => viewPolicy(policy.id)}  // ✅ simple & correct
        className="w-full flex items-center justify-between p-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-white hover:text-brand transition-all text-left group"
      >
        <span>{policy.title}</span>
        <span className="opacity-0 group-hover:opacity-100">→</span>
      </button>
    </li>
  ))}
</ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-48 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2 text-slate-400 uppercase text-[10px] tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand/40 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                </span>
                Live Updates
              </h3>

              <div className="flex gap-1">
                {flashNews.slice(0, 5).map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'bg-brand w-4' : 'bg-slate-200 w-1'}`} />
                ))}
              </div>
            </div>

            <div className="relative flex-1">
              {loadingNews ? (
                <div className="space-y-3">
                  <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-slate-100 animate-pulse rounded w-full" />
                </div>
              ) : flashNews.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col justify-between"
                  >
                    <p className="text-sm text-slate-800 font-bold leading-relaxed">
                      {flashNews[currentIndex].message}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-4 font-black uppercase tracking-wider">
                      {formatTimeAgo(flashNews[currentIndex].createdAt)}
                    </p>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <p className="text-sm text-slate-400 italic text-center py-4">No updates today.</p>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Welcome back, <span className="text-brand">{user?.name.split(' ')[0]}!</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Which system would you like to access today?</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systems.map((sys, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(sys.path)}
                className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-brand/10 hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-bl-full translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500" />
                <div className={`${sys.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
                  {sys.iconType === "img" ? (
                    <img src={sys.icon!} className="w-8 h-8" alt={sys.title} />
                  ) : (
                    <FaChartBar className="w-8 h-8 text-violet-500" style={{ width: 32, height: 32 }} />
                  )}
                </div>
                <h3 className="text-2xl font-black mb-2 text-slate-800 group-hover:text-brand transition-colors">{sys.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{sys.desc}</p>
                <div className="mt-8 flex items-center text-brand font-bold text-xs uppercase tracking-widest">
                  Launch System <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LaunchPage;