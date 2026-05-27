import { DashboardFilters, DepartmentChart, SummarySection } from '@/features/dashboard/components';
import DashboardSkeleton from '@/features/dashboard/components/Dashboardskeleton';
import { useHRDashboard } from '@/features/dashboard/hooks';
import { ManagerTrackingTable, MonitoringSection, OnboardingStats } from '@/features/dashboard/hr/components';
// import LowBalanceTable from '@/features/dashboard/hr/components/LowBalanceTable';
import { useCallback, useState } from 'react';

interface HRDashboardProps {
  userName?: string;
}

export default function HRDashboard({ userName = 'HR' }: HRDashboardProps) {
  const {
    data,
    departmentStats,
    loading,
    error,
    // reload,wwww
  } = useHRDashboard();



  const [filters, setFilters] = useState({
    month: '',
    year: '',
    department: '',
    leaveType: '',
    manager: '',
  });

  const updateFilter = useCallback((
    key: keyof typeof filters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ─── Skeleton Loading ─────────────────────────────────────────────
  if (loading) return <DashboardSkeleton />;

  // ─── Error ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-slate-500 text-sm font-medium">Loading HR Dashboard...</p>
          {/* <button
            onClick={reload}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button> */}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-8 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {userName}
        </h1>
        <p className="text-sm text-slate-500">HR analytics and workforce insights</p>
        {/* <span className="text-xs text-slate-400 mt-1">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </span> */}
      </div>

      {/* Filters */}
      <DashboardFilters filters={filters} updateFilter={updateFilter} />

      {/* Summary Cards */}
      <SummarySection
        totalEmployees={data.totalEmployees}
        activeEmployees={data.activeEmployees}
        employeesOnLeaveToday={data.employeesOnLeaveToday}
        totalPendingLeaves={data.totalPendingLeaves}
        totalApprovedLeaves={data.totalApprovedLeaves}
      />

      {/* Team Chart + Onboarding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-w-0 w-full">
          <DepartmentChart
            data={departmentStats}
            topDepartment={departmentStats[0]?.department}
          />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <OnboardingStats /// <reference path="" />

            newEmployeesCount={data.newEmployeesCount}
            pendingBiometricCount={data.pendingBiometricCount}
            pendingVPNCount={data.pendingVPNCount}
            onboardingList={data.onboardingPendingList}
          />
        </div>
      </div>

      {/* Low Balance Table */}
      {/* <LowBalanceTable
        data={lowBalanceData}
        loading={lowBalanceLoading}
        error={lowBalanceError}
      /> */}

      {/* Manager Tracking */}
      <ManagerTrackingTable
        totalManagers={data.totalManagersWithApprovals}
        managerStats={data.managerApprovalStats}
      />

      {/* Monitoring */}
      <MonitoringSection
        onboardingList={data.onboardingPendingList}
        employeesOnLeave={data.employeesOnLeave}
      />

      {/* Export */}  
      

    </div>
  );
}