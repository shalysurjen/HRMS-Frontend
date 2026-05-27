import { useState } from "react";
import axios from "axios";
import api from "@/services/apiClient";

export const usePayroll = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayroll = async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/payslip/my/${year}/${month}`);
      return res.data;
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to fetch payslip");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/payslip/history`);
      return res.data;
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to fetch history");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Download payslip PDF
  const downloadPayslip = async (year: number, month: number) => {
    try {
      const res = await axios.get(`/api/payslip/download/${year}/${month}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip_${month}_${year}.pdf`;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("Download failed:", e);
      setError("Failed to download PDF");
    }
  };

  return { fetchPayroll, fetchHistory, downloadPayslip, loading, error };
};