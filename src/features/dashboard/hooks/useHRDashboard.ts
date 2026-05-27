import { dashboardService } from '@/features/dashboard/services/dashboardService';
import type { DashboardResponse } from '@/features/dashboard/types';
import type { LowBalanceEmployee } from '@/features/leave/types';
import { useCallback, useEffect, useState } from 'react';

export interface DepartmentStat {
  department: string;
  members: number;
}

interface HRDashboardState {
  data: DashboardResponse | null;
  departmentStats: DepartmentStat[];
  lowBalanceData: LowBalanceEmployee[];
  lowBalanceError: string | null;
  lowBalanceLoading: boolean;
  loading: boolean;
  error: string | null;
}

export function useHRDashboard() {
  const [state, setState] = useState<HRDashboardState>({
    data: null,
    departmentStats: [],
    lowBalanceData: [],
    lowBalanceError: null,
    lowBalanceLoading: true,
    loading: true,
    error: null,
  });

  const loadDashboard = useCallback(async (signal: AbortSignal) => {
    setState((prev) => ({ ...prev, loading: true, lowBalanceLoading: true, error: null }));

    try {
      // Main dashboard — must succeed
      const data = await dashboardService.getHrDashboard();

      const departmentStats: DepartmentStat[] = data.teamStructure.map((team) => ({
        department: team.managerName,
        members: team.teamMemberCount,
      }));

      // Low balance — fetch separately, failure won't crash dashboard
      let lowBalanceData: LowBalanceEmployee[] = [];
      let lowBalanceError: string | null = null;

      try {
        lowBalanceData = await dashboardService.getHRLowBalance(signal);
      } catch (err) {
        // Backend 500 — show empty table with error message, don't crash dashboard
        lowBalanceError = 'Low balance data unavailable — backend error';
        // console.warn('Low balance fetch failed:', err);
      }

      setState({
        data,
        departmentStats,
        lowBalanceData,
        lowBalanceError,
        lowBalanceLoading: false,
        loading: false,
        error: null,
      });

    } catch (err) {
      if (err instanceof Error && err.name === 'CanceledError') return;
      setState((prev) => ({
        ...prev,
        loading: false,
        lowBalanceLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load dashboard',
      }));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard]);

  return {
    ...state,
    reload: () => {
      const controller = new AbortController();
      loadDashboard(controller.signal);
    },
  };
}