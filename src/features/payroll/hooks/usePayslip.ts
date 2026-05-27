import { useCallback, useState } from 'react';
import { PayslipService } from '../services/payslipService';
import type { Payslip, PayslipCreateRequest, PayslipUpdateRequest } from '@/features/payroll/payrollTypes';

export function usePayslip() {

  const [payrollData, setPayrollData] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayslip = useCallback(async (data: PayslipCreateRequest) => {
    try {
      setLoading(true);
      const result = await PayslipService.createPayslip(data);
      setPayrollData(prev => [result, ...prev]);
      return result;
    } catch {
      setError('Failed to create payslip');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Update Payslip ───────────────────────────────
  const updatePayslip = useCallback(async (data: PayslipUpdateRequest) => {
    try {
      setLoading(true);
      const result = await PayslipService.updatePayslip(data);
      return result;
    } catch {
      setError('Failed to update payslip');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Delete Payslip ───────────────────────────────
  const deletePayslip = useCallback(async (employeeId: string, year: number, month: number) => {
    try {
      setLoading(true);
      await PayslipService.deletePayslip(employeeId, year, month);
      // Remove from local state
      setPayrollData(prev => prev.filter(p =>
        !(p.employeeId === employeeId && p.year === year && p.month === month)
      ));
      return true;
    } catch {
      setError('Failed to delete payslip');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Generate Payroll (all employees) ────────────
  const generatePayroll = useCallback(async (year: number, month: number) => {
    try {
      setLoading(true);
      await PayslipService.generatePayroll(year, month);
      // Fetch updated data
      const data = await PayslipService.getPayrollData(year, month);
      setPayrollData(data);
      return { success: true };
    } catch {
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Prepare Payroll (copy from previous month) ──
  const preparePayroll = useCallback(async (year: number, month: number) => {
    try {
      setLoading(true);
      await PayslipService.preparePayroll(year, month);
      const data = await PayslipService.getPayrollData(year, month);
      setPayrollData(data);
      return { success: true };
    } catch {
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch Payroll Data ───────────────────────────
  const fetchPayrollData = useCallback(async (year: number, month: number, highlightId?: string) => {
    try {
      setLoading(true);
      const data = await PayslipService.getPayrollData(year, month);
      // New employee first-a varaum mathiri sort
      if (highlightId) {
        const sorted = [
          ...data.filter(p => p.employeeId === highlightId),
          ...data.filter(p => p.employeeId !== highlightId),
        ];
        setPayrollData(sorted);
      } else {
        setPayrollData(data);
      }
      return data;
    } catch {
      setPayrollData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Export CSV ───────────────────────────────────
  const exportCSV = useCallback(async (year: number, month: number) => {
    try {
      const csvData = await PayslipService.exportPayrollCSV(year, month);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_${year}_${month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch {
      setError('Failed to export CSV');
      return false;
    }
  }, []);

  return {
    payrollData,
    loading,
    error,
    setError,
    createPayslip,
    updatePayslip,
    deletePayslip,
    generatePayroll,
    preparePayroll,
    fetchPayrollData,
    exportCSV,
  };
}