import { dashboardService } from "@/features/dashboard/services/dashboardService";
import { useState, useCallback } from "react";

export const useTeamLeaderDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamLeaderDashboard = useCallback(async (employeeId: string) => {
    setLoading(true);
    try {
      return await dashboardService.getTeamLeaderDashboard(employeeId);
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchTeamLeaderDashboard };
};