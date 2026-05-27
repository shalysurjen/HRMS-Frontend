import type { Payslip, PayslipCreateRequest, PayslipUpdateRequest } from '@/features/payroll/payrollTypes';
import api from '@/services/apiClient';


export const PayslipService = {

  createPayslip: async (data: PayslipCreateRequest): Promise<Payslip> =>
    (await api.post<Payslip>('/v1/payslip/create', data)).data,


  updatePayslip: async (data: PayslipUpdateRequest): Promise<Payslip> =>
    (await api.put<Payslip>('/v1/payslip/update', data)).data,

  deletePayslip: async (employeeId: string, year: number, month: number): Promise<void> =>
    void (await api.delete(`/v1/payslip/${employeeId}/${year}/${month}`)),

  generatePayroll: async (year: number, month: number): Promise<void> =>
    void (await api.post(`/v1/payroll/generate?year=${year}&month=${month}`)),

  preparePayroll: async (year: number, month: number): Promise<void> =>
    void (await api.post(`/v1/payroll/prepare?year=${year}&month=${month}`)),


  getPayrollData: async (year: number, month: number): Promise<Payslip[]> =>
    (await api.get<Payslip[]>(`/v1/payslip/payroll/${year}/${month}`)).data,


  exportPayrollCSV: async (year: number, month: number): Promise<string> =>
    (await api.get<string>(`/v1/payslip/export/${year}/${month}`)).data,

  // getPrefill: async (employeeId: string, year: number, month: number): Promise<Payslip> =>
  //   (await api.get<Payslip>(`/v1/payslip/prefill?employeeId=${employeeId}&year=${year}&month=${month}`)).data,

};