import { payrollService } from "@/features/payroll/services/payrollService";
import { useState } from "react";

export const usePayroll = () => {
    
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      
      
        const [payslip, setPayslip] = useState<any>(null);
        // const [history, setHistory] = useState<any[]>([]);

      const fetchPayslip = async (year: number, month: number) => {
        try {
          setLoading(true);
          const res = await payrollService.getMyPayslip(year, month);
          setPayslip(res.data);
    
        } catch (e) {
          setPayslip(null);
          setError("Payslip not found");
        } finally {
          setLoading(false);
        }
      }; 
    
      const downloadHistory = async (year: number, month: number) => {
        await payrollService.downloadPayslip(year, month);
      };

      return {
        loading,
        error,
        setError,
        fetchPayslip,
        payslip,
        downloadHistory,

      }
}