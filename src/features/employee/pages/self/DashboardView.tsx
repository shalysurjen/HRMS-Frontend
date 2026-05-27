import { useEmployeeDashboard } from "@/features/dashboard/hooks";
import LeaveDetailsDrawer from "@/features/leave/components/LeaveDetailsDrawer";
import type { LeaveTypeBreakDown } from "@/features/leave/types";
import { useAuth } from "@/shared/auth/useAuth";
import { CustomLoader } from "@/shared/components";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState, type JSX } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaForward,
  FaHourglassHalf,
  FaPlus,
  FaStethoscope,
  FaTimesCircle,
  FaUmbrellaBeach,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import BirthdayPopupBanner from "@/features/birthday/components/BirthdayPopupBanner";
interface StatItem {
  title: string;
  used: number;
  total?: number;
  pendingCount?: number;
  balance?: number;
  icon: JSX.Element;
  color: string;
}

const DashboardView = () => {
  const { fetchDashboard, setError } = useEmployeeDashboard();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [monthly, setMonthly] = useState({
    annualAllocated: 0,
    annualUsed: 0,
    annualBalance: 0,
    sickAllocated: 0,
    sickUsed: 0,
    sickBalance: 0,
    totalBalance: 0,
  });

  const [stats, setStats] = useState<StatItem[]>([]);
  const [approved, setApproved] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<StatItem | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await fetchDashboard(user.id);
      const breakdown: LeaveTypeBreakDown[] = data.breakdown || [];

      const sick = breakdown.find((b) => b.leaveTypeName?.includes("SICK"));
      const annual = breakdown.find((b) => b.leaveTypeName?.includes("ANNUAL"));

      setMonthly({
        annualAllocated: data.monthlyAnnualAllocated || 0,
        annualUsed: data.monthlyAnnualUsed || 0,
        annualBalance: data.monthlyAnnualBalance || 0,
        sickAllocated: data.monthlySickAllocated || 0,
        sickUsed: data.monthlySickUsed || 0,
        sickBalance: data.monthlySickBalance || 0,
        totalBalance: data.monthlyTotalBalance || 0,
      });

      setStats([
        {
          title: "Annual Leave",
          used: annual?.usedDays ?? 0,
          total: annual?.allocatedDays ?? 0,
          pendingCount: annual?.pendingCount ?? 0,
          balance: annual?.remainingDays ?? 0,
          icon: <FaUmbrellaBeach />,
          color: "text-blue-500 bg-blue-50",
        },
        {
          title: "Sick Leave",
          used: sick?.usedDays ?? 0,
          total: sick?.allocatedDays ?? 0,
          pendingCount: sick?.pendingCount ?? 0,
          balance: sick?.remainingDays ?? 0,
          icon: <FaStethoscope />,
          color: "text-rose-500 bg-rose-50",
        },
        {
          title: "Carry Forward",
          used:
            (data.carryForwardTotal || 0) - (data.carryForwardRemaining || 0),
          total: data.carryForwardTotal,
          balance: data.carryForwardRemaining,
          icon: <FaForward />,
          color: "text-amber-500 bg-amber-50",
        },
        {
          title: "Comp Off",
          used: 0,
          total: data.compoffBalance,
          balance: data.compoffBalance,
          icon: <FaHourglassHalf />,
          color: "text-purple-500 bg-purple-50",
        },
      ]);

      setApproved(data.approvedCount);
      setRejected(data.rejectedCount);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchDashboard, setError]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleNavigate = (path: string) => {
    const roleBase =
      user?.role?.toLowerCase() === "admin" ? "/manager" : "/employee";
    navigate(`${roleBase}/${path}`);
  };

  if (loading) return <CustomLoader label="Loading your workspace..." />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto  space-y-8 bg-[#F9FAFB] min-h-screen"
    >
      <div>
    <BirthdayPopupBanner />   {/* ← இதை add பண்ணு */}
    {/* ... உங்கள் existing code ... */}
  </div>
      {/* SaaS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm  font-bold">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-white border border-gray-200 rounded-lg px-3 py-2 items-center gap-2 text-xs font-bold text-gray-500 shadow-sm">
            <FaCalendarAlt className="text-blue-600" />
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </div>
         
          <button
            onClick={() => handleNavigate("request-center")}
            className="bg-[#0052FF] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            <FaPlus /> Apply Leave
          </button>
        </div>
      </div>

      {/* MONTHLY HIGHLIGHTS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MonthlyCard
          label="Monthly - Annual Leave"
          val={monthly.annualBalance}
          sub={`Used ${monthly.annualUsed} of ${monthly.annualAllocated}`}
          color="bg-blue-600"
        />
        <MonthlyCard
          label="Monthly - Sick Leave"
          val={monthly.sickBalance}
          sub={`Used ${monthly.sickUsed} of ${monthly.sickAllocated}`}
          color="bg-rose-500"
        />
        <div className="bg-gray-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Total Monthly Balance
          </span>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black">{monthly.totalBalance}</h2>
            <span className="text-sm font-bold text-gray-400">
              Days Remaining
            </span>
          </div>
        </div>
      </section>

      {/* STATUS COUNTERS */}
      <div className="flex flex-wrap gap-4">
        <StatusBadge
          icon={<FaCheckCircle />}
          label="Approved"
          count={approved}
          color="text-emerald-600 bg-emerald-50"
        />
        <StatusBadge
          icon={<FaTimesCircle />}
          label="Rejected"
          count={rejected}
          color="text-rose-600 bg-rose-50"
        />
        <StatusBadge
          icon={<FaClock />}
          label="Pending"
          count={stats.reduce((a, b) => a + (b.pendingCount || 0), 0)}
          color="text-amber-600 bg-amber-50"
        />
      </div>

      {/* FLOATING ROW TABLE */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header row labels */}
        <div className="grid grid-cols-12 px-6 py-4 bg-brand/10 border-b border-gray-200 text-[16px] font-bold text-black tracking-wider">
          <div className="col-span-4">Leave Category</div>
          <div className="col-span-2 text-center">Allocated (Y)</div>
          <div className="col-span-2 text-center">Used</div>
          <div className="col-span-2 text-center">Balance</div>
          <div className="col-span-2 text-right pr-4">Pending</div>
        </div>

        {/* The Rows */}
        <div className="divide-y divide-gray-100">
          {stats.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ backgroundColor: "#F3F4F6" }}
              onClick={() => setSelectedCard(item)}
              className={`
          grid grid-cols-12 items-center px-6 py-4 transition-colors cursor-pointer group
          ${idx % 2 === 0 ? "bg-white" : "bg-gray-100/50"} 
        `}
            >
              {/* Category Column */}
              <div className="col-span-4 flex items-center gap-4">
                <div
                  className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm ${item.color}`}
                >
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700 text-sm">
                    {item.title}
                  </span>
                </div>
              </div>

              {/* Allocated Column */}
              <div className="col-span-2 text-center text-sm text-gray-600 font-medium">
                {item.total ?? "—"}
              </div>

              {/* Used Column */}
              <div className="col-span-2 text-center">
                <span className="text-sm font-semibold text-gray-700">
                  {item.used}
                </span>
              </div>

              {/* Balance Column */}
              <div className="col-span-2 text-center">
                <span className="text-sm font-bold text-blue-600">
                  {item.balance}
                </span>
              </div>

              {/* Pending Column */}
              <div className="col-span-2 flex justify-end items-center pr-4">
                {item.pendingCount ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                    {item.pendingCount}
                  </span>
                ) : (
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <LeaveDetailsDrawer
        open={!!selectedCard}
        stat={selectedCard}
        onClose={() => setSelectedCard(null)}
        onClick={() => handleNavigate("request-center")}
      />

      {/* <MyFloatingActionButton
        icon={<FaPlus />}
        onClick={() => handleNavigate('request-center')}
        title="Apply Leave"
      /> */}
    </motion.div>
  );
};

// --- Styled Sub-components ---

const MonthlyCard = ({ label, val, sub }: any) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
      {label}
    </span>
    <div className="flex justify-between items-end mt-2">
      <h3 className="text-3xl font-black text-gray-900">
        {val} <span className="text-xs font-bold text-gray-400">Days</span>
      </h3>
      <p className="text-[10px] font-bold text-gray-400 mb-1">{sub}</p>
    </div>
    {/* <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: '65%' }} />
    </div> */}
  </div>
);

const StatusBadge = ({ icon, label, count, color }: any) => (
  <div
    className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-transparent font-bold text-xs ${color} shadow-sm`}
  >
    <span className="opacity-70">{icon}</span>
    <span>
      {count} {label}
    </span>
  </div>
);

export default DashboardView;
