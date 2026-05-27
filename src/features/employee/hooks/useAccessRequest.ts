import { useState } from "react";
import api from "@/services/apiClient";
import type { AccessType } from "../components/AccessRequestForm";
// import type { AccessType } from "../hooks/useAccessTypes";

export const useAccessRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAccessRequest = async (
    payload: {
      accessType: AccessType["type"]; // ✅ strict type
      reason: string;
      startDate: string;
      endDate: string;
    },
    employeeId: string
  ): Promise<boolean> => {
    try {
      setLoading(true); // ✅ FIX

      await api.post("/access-request", {
        ...payload,
        employeeId,
      });

      return true; // ✅ FIX
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to create request";
      setError(message);
      return false;
    } finally {
      setLoading(false); // ✅ FIX
    }
  };

  return {
    createAccessRequest,
    loading,
    error,
    setError,
  };
};