import { useManagerDashboard } from "@/features/dashboard/hooks";
import { ManagerStatCardTeam } from "@/features/dashboard/manager/components";
import type { ManagerDashBoardResponse } from "@/features/dashboard/types";
import DetailedRequestModal from "@/features/leave/components/DetailedRequestModal";
import LeaveDetailsDrawer from "@/features/leave/components/LeaveDetailsDrawer";
import { useLeaveAction } from "@/features/leave/hooks/useLeaveActions";
import type { LeaveDecision, LeaveTypeBreakDown } from "@/features/leave/types";
import { notify } from "@/features/notification/utils/notifications";
import { useAuth } from "@/shared/auth/useAuth";
import { CommentDialog, CustomLoader } from "@/shared/components";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import {
  FaBriefcaseMedical,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaClock,
  FaForward,
  FaPlus,
  FaStethoscope,
  FaTimesCircle,
  FaUmbrellaBeach
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface StatItem {
  title: string;
  used: number;
  total?: number;
  pendingCount?: number;
  balance?: number;
  icon: JSX.Element;
  color: string;
}

const ManagerDashboardView: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { fetchManagerDashboard, loading: dashboardLoading } = useManagerDashboard();
  const { processApproval } = useLeaveAction();

  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<ManagerDashBoardResponse>();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [personalStats, setPersonalStats] = useState<StatItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<StatItem | null>(null);
  const requestsRef = useRef<HTMLDivElement>(null);

  const [detailModalReq, setDetailModalReq] = useState<any | null>(null);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    req: any;
    status: LeaveDecision | null
  }>({ isOpen: false, req: null, status: null });

  let roleBase = '';
  const handleNavigate = (path: string) => {
    if (user?.role === "EMPLOYEE") {
      roleBase = 'employee';
    } else {
      roleBase = '/manager';
    }
    // const roleBase = user?.role?.toLowerCase() === 'admin' ? '/manager' : '/employee';
    navigate(`${roleBase}/${path}`);
  };
  const loadAllData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetchManagerDashboard(user.id);
      if (response) {
        setDashboardData(response);
        setApprovals(response.pendingTeamRequests || []);

        // Transform breakdown into StatItem format for the table
        const breakdown: LeaveTypeBreakDown[] = response.personalStats?.breakdown || [];

        const mappedStats: StatItem[] = breakdown.map(b => {
          const isSick = b.leaveTypeName?.includes("SICK");
          const isAnnual = b.leaveTypeName?.includes("ANNUAL");

          return {
            title: b.leaveTypeName?.replace(/_/g, " ") || "General Leave",
            used: b.usedDays || 0,
            total: b.allocatedDays || 0,
            pendingCount: b.pendingCount || 0,
            balance: b.remainingDays || 0,
            icon: isSick ? <FaStethoscope /> : isAnnual ? <FaUmbrellaBeach /> : <FaBriefcaseMedical />,
            color: isSick ? "text-rose-500 bg-rose-50" : isAnnual ? "text-blue-500 bg-blue-50" : "text-indigo-500 bg-indigo-50"
          };
        });

        if (response.personalStats?.carryForwardTotal) {
          mappedStats.push({
            title: "Carry Forward",
            used: (response.personalStats.carryForwardTotal || 0) - (response.personalStats.carryForwardRemaining || 0),
            total: response.personalStats.carryForwardTotal,
            balance: response.personalStats.carryForwardRemaining,
            icon: <FaForward />,
            color: "text-amber-500 bg-amber-50"
          });
        }

        setPersonalStats(mappedStats);
      }
    } catch (error) {
      console.error("Failed to sync dashboard:", error);
      notify.error("Failed to fetch dashboard data");
    }
  }, [user?.id, fetchManagerDashboard]);

  useEffect(() => {
    if (!authLoading) loadAllData();
  }, [authLoading, loadAllData]);

  const executeDecision = async (req: any, status: LeaveDecision, commentText?: string) => {
    const targetId = req.leaveId || req.id;
    const success = await processApproval({
      leaveId: targetId,
      approverId: user!.id,
      decision: status,
      comments: commentText
    });

    if (success) {
      notify.leaveAction(status, req.employeeName || req.employee);
      setApprovals((prev) => prev.filter((item) => (item.leaveId || item.id) !== targetId));
      setDialogConfig({ isOpen: false, req: null, status: null });
      loadAllData(); // Refresh to update counters
    }
  };

  if (dashboardLoading || authLoading) return <CustomLoader label="Syncing Manager Portal" />;

  const stats = dashboardData?.personalStats;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 bg-[#F9FAFB] min-h-screen pb-20"
    >
      {/* SaaS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-500">Manager Overview</p>
          <h1 className="text-xl font-black text-gray-900">Welcome back, {user?.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-white border border-gray-200 rounded-lg px-3 py-2 items-center gap-2 text-xs font-bold text-gray-500 shadow-sm">
            <FaCalendarAlt className="text-blue-600" />
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button
            onClick={() => handleNavigate('request-center')}
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
          val={stats?.monthlyAnnualBalance || 0}
          sub={`Used ${stats?.monthlyAnnualUsed || 0} of ${stats?.monthlyAnnualAllocated || 0}`}
          color="bg-blue-600"
        />
        <MonthlyCard
          label="Monthly - Sick Leave"
          val={stats?.monthlySickBalance || 0}
          sub={`Used ${stats?.monthlySickUsed || 0} of ${stats?.monthlySickAllocated || 0}`}
          color="bg-rose-500"
        />
        <div className="bg-gray-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Monthly Balance</span>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black">{stats?.monthlyTotalBalance || 0}</h2>
            <span className="text-sm font-bold text-gray-400">Days Remaining</span>
          </div>
        </div>
      </section>

      {/* STATUS COUNTERS */}
      <div className="flex flex-wrap gap-4">
        <StatusBadge icon={<FaCheckCircle />} label="Approved" count={stats?.approvedCount || 0} color="text-emerald-600 bg-emerald-50" />
        <StatusBadge icon={<FaTimesCircle />} label="Rejected" count={stats?.rejectedCount || 0} color="text-rose-600 bg-rose-50" />
        <StatusBadge icon={<FaClock />} label="Pending" count={personalStats.reduce((a, b) => a + (b.pendingCount || 0), 0)} color="text-amber-600 bg-amber-50" />
      </div>

      {/* PERSONAL INVENTORY TABLE */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header row labels - Updated with bg-brand/10 and larger font */}
        <div className="grid grid-cols-12 px-6 py-4 bg-brand/10 border-b border-gray-200 text-[16px] font-bold text-black tracking-wider">
          <div className="col-span-4">Personal Leave Category</div>
          <div className="col-span-2 text-center">Allocated (Y)</div>
          <div className="col-span-2 text-center">Used</div>
          <div className="col-span-2 text-center">Balance</div>
          <div className="col-span-2 text-right pr-4">Pending</div>
        </div>

        {/* The Rows */}
        <div className="divide-y divide-gray-100">
          {personalStats.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ backgroundColor: "#F3F4F6" }}
              onClick={() => setSelectedCard(item)}
              className={`
          grid grid-cols-12 items-center px-6 py-4 transition-colors cursor-pointer group
          ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-100/50'} 
        `}
            >
              {/* Category Column */}
              <div className="col-span-4 flex items-center gap-4">
                <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700 text-sm">{item.title}</span>
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

      {/* TEAM GOVERNANCE CARDS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Team Intelligence</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <ManagerStatCardTeam label="Team Members" value={dashboardData?.teamSize || 0} iconType="team" onClick={() => handleNavigate('team')} />
          <ManagerStatCardTeam label="Pending Requests" value={approvals.length} iconType="pending" colorClass="text-amber-600" onClick={() => requestsRef.current?.scrollIntoView({ behavior: 'smooth' })} />
          <ManagerStatCardTeam label="Away Today" value={dashboardData?.teamOnLeaveCount || 0} iconType="calendar" colorClass="text-indigo-600" />
          <ManagerStatCardTeam label="Processed YTD" value={dashboardData?.personalStats?.approvedCount || 0} iconType="processed" colorClass="text-emerald-600" />
        </div>
      </section>

      {/* PENDING GOVERNANCE DECISIONS */}
      <section ref={requestsRef} className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pending Decisions</h3>
        </div>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {approvals.length > 0 ? (
              approvals.map((req) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 5 }}
                  key={req.leaveId}
                  onClick={() => setDetailModalReq({ ...req, id: req.leaveId })}
                  className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6 shadow-sm cursor-pointer transition-all hover:border-blue-200"
                >
                  <div className="w-12 h-12 bg-gray-900 rounded-xl text-white flex items-center justify-center font-black text-lg">
                    {(req.employeeName || "E").charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">{req.employeeName}</p>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
                      {req.leaveType?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex-2 bg-gray-50 p-3 rounded-xl text-xs text-gray-500 font-medium italic border border-gray-100">
                    "{req.reason || "No reason provided."}"
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-600">
                    <span className="text-[10px] font-black uppercase tracking-widest">Review</span>
                    <FaChevronRight size={10} />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-12 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Queue is empty</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Modals & Drawers */}
      <DetailedRequestModal
        isOpen={!!detailModalReq}
        // Passing the ID from the state object
        leaveId={detailModalReq?.leaveId || detailModalReq?.id}
        onClose={() => setDetailModalReq(null)}
        onAction={(status) => {
          const currentReq = detailModalReq;
          setDetailModalReq(null);
          setDialogConfig({ isOpen: true, req: currentReq, status });
        }}
      />

      <CommentDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig({ isOpen: false, req: null, status: null })}
        title={dialogConfig.status === 'REJECTED' ? 'Reject Leave Request' : 'Approve Request'}
        onSubmit={(comment: string) => executeDecision(dialogConfig.req, dialogConfig.status!, comment)}
      />

      <LeaveDetailsDrawer
        open={!!selectedCard}
        stat={selectedCard}
        onClose={() => setSelectedCard(null)}
        onClick={() => onNavigate?.('Request center')}
      />

      {/* <MyFloatingActionButton icon={<FaPlus />} onClick={() => onNavigate?.("Request center")} title="Apply Leave" /> */}
    </motion.div>
  );
};

const MonthlyCard = ({ label, val, sub }: any) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
    <div className="flex justify-between items-end mt-2">
      <h3 className="text-3xl font-black text-gray-900">{val} <span className="text-xs font-bold text-gray-400">Day(s) Remaining</span></h3>
      <p className="text-[10px] font-bold text-gray-400 mb-1">{sub}</p>
    </div>
  </div>
);

const StatusBadge = ({ icon, label, count, color }: any) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-transparent font-bold text-xs ${color} shadow-sm`}>
    <span className="opacity-70">{icon}</span>
    <span>{count} {label}</span>
  </div>
);

export default ManagerDashboardView;