import { dashboardService } from "@/features/dashboard/services/dashboardService";
import { useState, useCallback } from "react";

export const useManagerDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManagerDashboard = useCallback(async (id: string) => {
    setLoading(true);
    try {
      return await dashboardService.getManagerDashboard(id);
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchManagerDashboard };
};