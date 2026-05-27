import { dashboardService } from "@/features/dashboard/services/dashboardService";
import { useState, useCallback } from "react";

export const useAdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminDashboard = useCallback(async (id: string) => {
    setLoading(true);
    try {
      return await dashboardService.getAdminDashboard(id);
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchAdminDashboard };
};