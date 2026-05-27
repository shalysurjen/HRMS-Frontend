import { dashboardService } from "@/features/dashboard/services/dashboardService";
import { useCallback, useState } from "react";

export const useEmployeeDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (employeeId: string) => {
    setLoading(true);
    try {
      return await dashboardService.getEmpDashboard(employeeId);
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error,setError, fetchDashboard };
};