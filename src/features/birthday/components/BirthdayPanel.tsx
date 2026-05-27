import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import { birthdayService } from "../services/birthdayService";
import type { BirthdayEmployee } from "../types/birthdayTypes";
import SendWishModal from "./SendWishModal";

interface Props {
  currentUserId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const AV_COLORS = [
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
];

const getAv = (i: number) => AV_COLORS[i % AV_COLORS.length];

const rolePathMap: Record<string, string> = {
  EMPLOYEE: "/employee/birthday",
  MANAGER: "/manager/birthday",
  TEAM_LEADER: "/manager/birthday",
  CTO: "/manager/birthday",
  COO: "/manager/birthday",
  HR: "/hr/birthday",
  ADMIN: "/admin/birthday",
  CFO: "/cfo/birthday",
};

const BirthdayPanel = ({ currentUserId, isOpen, onClose }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [todays, setTodays] = useState<BirthdayEmployee[]>([]);
  const [weekly, setWeekly] = useState<BirthdayEmployee[]>([]);
  const [wishedIds, setWishedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<BirthdayEmployee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setLoading(true);
      try {
        const [t, w] = await Promise.all([
          birthdayService.getTodayBirthdays(),
          birthdayService.getWeeklyBirthdays(),
        ]);

        setTodays(t);

        const todayIds = new Set(t.map(e => e.id));
        setWeekly(w.filter(e => !todayIds.has(e.id)));

        const checks = currentUserId
          ? await Promise.all(t.map(e => birthdayService.checkAlreadyWished(e.id, currentUserId)))
          : t.map(() => false);

        const w2 = new Set<string>();
        t.forEach((e, i) => { if (checks[i]) w2.add(e.id); });
        setWishedIds(w2);

      } catch (e) {
        console.error("Birthday panel load failed", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, currentUserId]);

  const handleWishSent = (id: string) => {
    setWishedIds(prev => new Set(prev).add(id));
  };

  const handleViewFull = () => {
    const role = user?.role?.toUpperCase() ?? "EMPLOYEE";
    const path = rolePathMap[role] ?? "/employee/birthday";
    navigate(path);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="bp"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-shrink-0 bg-white border-l border-slate-100 overflow-hidden h-full"
            style={{ minWidth: 0, maxWidth: 280 }}
          >
            <div className="w-[280px] h-full overflow-y-auto p-4 flex flex-col gap-3">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">Birthdays today</span>
                  <span className="text-[10px] bg-pink-50 text-pink-600 border border-pink-100 rounded-full px-2 py-0.5 font-bold">
                    {todays.length}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 text-xs"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400">Send a wish to your colleagues</p>

              {/* Today list */}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-slate-100 rounded w-2/3" />
                        <div className="h-2 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : todays.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🎂</p>
                  <p className="text-xs text-slate-400">No birthdays today</p>
                </div>
) : (
  <div className="space-y-2">

    {/* உன் Birthday — top-ல தனியா */}
    {todays.filter(e => e.employeeCode === currentUserId).map((emp) => (
      <div key={emp.id} className="bg-pink-50 border border-pink-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 bg-pink-200 text-pink-800">
          {emp.firstName[0]}{emp.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-slate-900 truncate">{emp.firstName} {emp.lastName}</p>
          <p className="text-[10px] font-black text-slate-400 truncate">{emp.employeeCode}</p>
        </div>
        <span className="text-[10px] bg-pink-200 text-pink-800 border border-pink-300 rounded-lg px-2 py-1 whitespace-nowrap font-bold">
          🎂 You!
        </span>
      </div>
    ))}

    {/* மத்தவங்க — கீழே */}
    {todays.filter(e => e.employeeCode !== currentUserId).map((emp, idx) => (
      <div key={emp.id} className="flex items-center gap-2.5 py-2.5 border-b border-slate-50 last:border-b-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${getAv(idx)}`}>
          {emp.firstName[0]}{emp.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-slate-900 truncate">{emp.firstName} {emp.lastName}</p>
          <p className="text-[10px] font-black text-slate-400 truncate">{emp.employeeCode}</p>
        </div>
        {wishedIds.has(emp.id) ? (
          <span className="text-[10px] text-slate-400 border border-slate-100 rounded-lg px-2 py-1 whitespace-nowrap">
            Wished ✓
          </span>
        ) : (
          <button
            onClick={() => setSelected(emp)}
            className="text-[10px] bg-pink-50 text-pink-600 border border-pink-100 rounded-lg px-2 py-1 hover:bg-pink-100 font-bold whitespace-nowrap"
          >
            Wish 🎁
          </button>
        )}
      </div>
    ))}

  
                </div>
              )}

              {/* Upcoming this week */}
              {weekly.length > 0 && (
                <>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Upcoming this week
                  </p>
                  <div className="space-y-1">
                    {weekly.slice(0, 3).map((emp, idx) => (
                      <div key={emp.id} className="flex items-center gap-2.5 py-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${getAv(idx + 2)}`}>
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{emp.firstName} {emp.lastName} - {emp.employeeCode}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(emp.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* View full page */}
              <button
                onClick={handleViewFull}
                className="w-full mt-2 py-2 text-xs text-slate-400 border border-slate-100 rounded-xl hover:bg-slate-50 font-bold"
              >
                View full birthday page →
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selected && (
        <SendWishModal
          employee={selected}
          currentUserId={currentUserId}
          onClose={() => setSelected(null)}
          onWishSent={handleWishSent}
        />
      )}
    </>
  );
};

export default BirthdayPanel;
