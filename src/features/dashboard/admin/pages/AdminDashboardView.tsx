import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FaUserShield, FaChartPie, FaPlus,
  FaUsers, FaHistory
} from "react-icons/fa";
import DashboardDrawer from "@/features/dashboard/components/DashBoardDrawer";
import { ManagerStatCardTeam } from "@/features/dashboard/manager/components";
import type { AdminDashBoardResponse } from "@/features/dashboard/types";
import { notify } from "@/features/notification/utils/notifications";
import { useAuth } from "@/shared/auth/useAuth";
import { CustomLoader, MyFloatingActionButton } from "@/shared/components";
import { useAdminDashboard } from "@/features/dashboard/hooks";
import { useNavigate } from "react-router-dom";

const AdminDashboardView: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { fetchAdminDashboard, loading: dashboardLoading } = useAdminDashboard();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<AdminDashBoardResponse>();
  const [drawerConfig, setDrawerConfig] = useState<{
    isOpen: boolean;
    type: 'PERSONAL' | 'SYSTEM' | null;
  }>({ isOpen: false, type: null });

  const loadAllData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetchAdminDashboard(user.id);
      if (response) {
        setDashboardData(response);
      }
    } catch (error) {
      console.error("Failed to sync Admin dashboard:", error);
      notify.error("Failed to fetch administrative data");
    }
  }, [user?.id, fetchAdminDashboard]);
   const userRole = user?.role?.toUpperCase();

   const basePathMap = {
    EMPLOYEE: "/employee",
    MANAGER: "/manager",
    TEAM_LEADER: "/manager",
    HR: "/hr",
    ADMIN: "/admin",
    CFO: "/admin",
  };

   const basePath = basePathMap[userRole as keyof typeof basePathMap] || "/employee";
  const handleNavigate = (path: string) => {
  // 1. If the path already starts with the basePath, don't append it again
  // 2. If the path is already absolute (starts with /), just use it
  const finalPath = path.startsWith('/') ? path : `${basePath}/${path}`;

  navigate(finalPath);
};

  useEffect(() => {
    if (!authLoading) loadAllData();
  }, [authLoading, loadAllData]);
  
  if (dashboardLoading || authLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <CustomLoader label="Syncing Admin Control Panel" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto pb-20">

      <DashboardDrawer
        isOpen={drawerConfig.isOpen}
        onClose={() => setDrawerConfig({ isOpen: false, type: null })}
        title={drawerConfig.type === 'PERSONAL' ? 'Admin Personal Ledger' : 'System Compliance Audit'}
        subtitle={drawerConfig.type === 'PERSONAL' ? user?.name || '' : `Year ${dashboardData?.currentYear}`}
      >
        {/* Reusing your Personal Stats logic from Manager View */}
        {drawerConfig.type === 'PERSONAL' ? (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 text-white rounded-sm   ">
              <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Status: Active</p>
              <p className="text-xs font-bold">You have {dashboardData?.personalStats.yearlyBalance} days remaining in your annual quota.</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400 border-b pb-2 tracking-widest">Balance Breakdown</h4>
              <div className="grid grid-cols-1 gap-3">
                {/* Reusing StatCard visual logic manually for drawer consistency */}
                {dashboardData?.personalStats.breakdown.map((item) => (
                  <div
                    key={item.leaveTypeName}
                    className="flex flex-col gap-2 p-4 border-2 border-slate-100 hover:border-slate-200 transition-all bg-white"
                  >
                    {/* Leave Type Title */}
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {item.leaveTypeName.replace('_', ' ')}
                    </span>

                    <div className="flex justify-between items-end">
                      {/* Left Side: Used / Total */}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Used / Total
                        </span>
                        <span className="text-lg font-black   text-slate-900">
                          {item.usedDays}d
                          <span className="text-slate-300 font-medium mx-1">/</span>
                          {item.allocatedDays}d
                        </span>
                      </div>

                      {/* Right Side: Remaining */}
                      <div className="text-right flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Remaining
                        </span>
                        <span className={`text-lg font-black   ${item.remainingDays <= 1 ? 'text-red-500' : 'text-indigo-600'}`}>
                          {item.remainingDays}d
                        </span>
                      </div>
                    </div>
                    {item.halfDayCount > 0 && (
                      <span className="text-[9px] font-bold text-slate-400">
                        Includes {item.halfDayCount} half-day{item.halfDayCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex justify-between items-center p-4 border-2 border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400">Comp-Off Bank</span>
                  <span className="text-lg font-black  ">{dashboardData?.personalStats.compoffBalance || 0}d</span>
                </div>
                <div className="flex justify-between items-center p-4 border-2 border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400">Carry Forward</span>
                  <span className="text-lg font-black  ">{dashboardData?.personalStats.carryForwardRemaining || 0}d</span>
                </div>
                <div className="flex flex-col gap-2 p-4 border-2 border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Monthly Stats</span>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Used / Total</span>
                      <span className="text-lg font-black   text-slate-900">
                        {dashboardData?.personalStats.monthlyAnnualUsed}d <span className="text-slate-300 font-medium">/</span> {dashboardData?.personalStats.monthlyAnnualAllocated}d
                      </span>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining</span>
                      <span className="text-lg font-black   text-indigo-600">
                        {dashboardData?.personalStats.monthlyAnnualBalance || 0}d
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-4 border-2 border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Yearly Stats</span>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Used / Total</span>
                      <span className="text-lg font-black   text-slate-900">
                        {dashboardData?.personalStats.yearlyUsed}d <span className="text-slate-300 font-medium">/</span> {dashboardData?.personalStats.yearlyAllocated}d
                      </span>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining</span>
                      <span className="text-lg font-black   text-indigo-600">
                        {dashboardData?.personalStats.yearlyBalance || 0}d
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 border-2 border-slate-100 bg-rose-50">
                  <span className="text-[10px] font-black uppercase text-rose-400">Loss of Pay (%)</span>
                  <span className="text-lg font-black   text-rose-600">{dashboardData?.personalStats.lossOfPayPercentage || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 border-2 border-red-500 bg-red-50">
              <p className="text-[10px] font-black uppercase text-red-400 mb-1">Critical Issues</p>
              <p className="text-3xl font-black   tracking-tighter text-red-600">
                {dashboardData?.complianceIssues?.length || 0} Alerts
              </p>
            </div>
            {/* Compliance List mapping */}
          </div>
        )}
      </DashboardDrawer>

      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-2 gap-4">
        <div>
          <p className="text-[20px] font-medium text-black  ">Welcome , <span className="font-bold">{user?.name}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleNavigate("employees")} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-900 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
            <FaUsers /> Employees
          </button>
        </div>
      </div>
      <section className="space-y-4 pt-4">
              {/* Header Area */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaChartPie className="text-indigo-600" size={14} />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    My Leave Credits
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerConfig({ isOpen: true, type: 'PERSONAL' })}
                  className="text-[9px] font-black uppercase text-indigo-600 hover:underline tracking-widest"
                >
                  View Details
                </button>
              </div>
      
              {/* Table Container */}
              <div className="w-full bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Leave Category
                      </th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Allocated
                      </th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Used
                      </th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                        Pending
                      </th>
                    </tr>
                  </thead>
      
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData?.personalStats.breakdown.map((leave, index) => {
                      const balance = leave.allocatedDays - leave.usedDays;
      
                      return (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                              {leave.leaveTypeName.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-medium text-slate-400">
                              {leave.allocatedDays} 
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-700">
                              {leave.usedDays} 
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-black ${balance <= 2 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                              {balance} 
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs font-bold text-indigo-600">
                              {leave.pendingCount! > 0 ? leave.pendingCount : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
      
                    {/* Highlighted Monthly Quota Row */}
                    <tr className="bg-indigo-50/30 border-t border-indigo-100">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-indigo-600 uppercase">
                          Current Month Quota
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-indigo-400 font-medium">
                        {dashboardData?.personalStats.monthlyAnnualAllocated!} 
                      </td>
                      <td className="px-6 py-4 text-xs text-indigo-900 font-bold">
                        {dashboardData?.personalStats.monthlyAnnualUsed} 
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-black text-indigo-700">
                          {dashboardData?.personalStats.monthlyAnnualAllocated! - dashboardData?.personalStats.monthlyAnnualUsed!} 
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
      

      {/* SYSTEM OVERVIEW STATS */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <FaUserShield className="text-red-600" size={14} />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Organization Health</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ManagerStatCardTeam label="Total Workforce" value={dashboardData?.totalEmployees || 0} iconType="team" onClick={() => onNavigate?.("Employee Directory")} />
          <ManagerStatCardTeam label="Pending Onboarding" value={dashboardData?.newEmployeesPendingOnboarding || 0} iconType="pending" colorClass="text-blue-600" />
          <ManagerStatCardTeam label="Total Managers" value={dashboardData?.totalManagers || 0} iconType="calendar" colorClass="text-amber-600" onClick={() => onNavigate?.("All Requests")} />
          {/* <ManagerStatCardTeam label="AVG LOP (%)" value={dashboardData?.averageLossOfPayPercentage?.toFixed(1) || 0} iconType="processed" colorClass="text-rose-600" /> */}
        </div>
      </section>

      {/* PERSONAL LEAVE CREDITS (ADMIN AS EMPLOYEE) */}


      {/* RECENT SYSTEM ACTIVITY / REJECTIONS */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <FaHistory className="text-slate-400" size={14} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Recent Audit Logs (Rejections)</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {dashboardData?.recentRejections && dashboardData.recentRejections.length > 0 ? (
            dashboardData.recentRejections.slice(0, 5).map((log) => (
              <div key={log.leaveId} className="bg-white border border-slate-200 p-4 rounded-sm flex justify-between items-center group hover:border-red-200">
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase">{log.employeeName}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{log.leaveType} • Rejected by {log.rejectedByName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-red-500  ">"{log.reason}"</p>
                  <p className="text-[8px] text-slate-300 uppercase mt-1">{new Date(log.rejectedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 border border-dashed border-slate-200 rounded-sm text-center">
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No recent rejection audits</p>
            </div>
          )}
        </div>
      </section>

      {!drawerConfig.isOpen && (
        <MyFloatingActionButton icon={<FaPlus />} onClick={() => handleNavigate("request-center")} title="New Request" />
      )}
    </motion.div>
  );
};

export default AdminDashboardView;