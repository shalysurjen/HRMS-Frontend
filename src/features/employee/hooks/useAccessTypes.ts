// ─── useAccessTypes.ts ────────────────────────────────────────────
// Custom hook — fetches access types from backend dynamically.
// Backend: GET /access-types/available
// Response: AccessTypeConfig[]
// Frontend NEVER hardcodes "VPN" or any type — fully config-driven.

import { useEffect, useState } from "react";
import api from "@/services/apiClient";

export interface AccessTypeConfig {
  type: string;           // e.g. "VPN", "BIOMETRIC", "SHARED_FOLDER"
  label: string;          // e.g. "VPN Access (Remote Work)"
  description: string;    // Short description shown in UI
  enabled: boolean;       // Backend controls this — false = hidden in UI
  rolesAllowed: string[]; // e.g. ["MANAGER", "ADMIN"]
  icon: string;           // Icon key — maps to icon in frontend
}

interface UseAccessTypesReturn {
  accessTypes: AccessTypeConfig[];
  loading: boolean;
  error: string | null;
}

export const useAccessTypes = (userRole: string | undefined): UseAccessTypesReturn => {
  const [accessTypes, setAccessTypes] = useState<AccessTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userRole) return;

    const fetchTypes = async () => {
      try {
        setLoading(true);
        // Backend returns ALL types — frontend filters by enabled + rolesAllowed
        const response = await api.get<AccessTypeConfig[]>("/access-types/available");
        const all = response.data;

        // Filter: enabled = true AND user's role is in rolesAllowed
        const filtered = all.filter(
          t => t.enabled && t.rolesAllowed.includes(userRole.toUpperCase())
        );

        setAccessTypes(filtered);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load access types");
      } finally {
        setLoading(false);
      }
    };

    fetchTypes();
  }, [userRole]);

  return { accessTypes, loading, error };
};