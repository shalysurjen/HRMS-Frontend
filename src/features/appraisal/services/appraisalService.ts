// src/features/appraisal/services/appraisalService.ts
import api from "@/services/apiClient";
import type {
  AppraisalCycle,
  AppraisalDetail,
  AppraisalSummary,
  AnswerDTO,
} from "@/features/appraisal/types/appraisal";

export const appraisalService = {

  getCycles: async (): Promise<AppraisalCycle[]> => {
    const res = await api.get("/v1/appraisal/cycles");
    return res.data;
  },

  // ── Admin: toggle isActive / isOpen on a cycle ────────────────────────────
  toggleCycleField: async (
    cycleId: number,
    field: "isActive" | "isOpen",
    value: boolean
  ): Promise<AppraisalCycle> => {
    const res = await api.patch(`/v1/appraisal/admin/cycles/${cycleId}/toggle`, {
      field,
      value,
    });
    return res.data;
  },

  // ── Employee ──────────────────────────────────────────────────────────────
  getOrCreate: async (employeeId: string, cycleId: number): Promise<AppraisalDetail> => {
    const res = await api.get(`/v1/appraisal/employee/${employeeId}/cycle/${cycleId}`);
    return res.data;
  },

  saveDraft: async (employeeId: string, cycleId: number, answers: AnswerDTO[]): Promise<AppraisalDetail> => {
    const res = await api.post("/v1/appraisal/save", { employeeId, cycleId, answers, submit: false });
    return res.data;
  },

  submit: async (employeeId: string, cycleId: number, answers: AnswerDTO[]): Promise<AppraisalDetail> => {
    const res = await api.post("/v1/appraisal/save", { employeeId, cycleId, answers, submit: true });
    return res.data;
  },

  getPublished: async (employeeId: string, cycleId: number): Promise<AppraisalDetail> => {
    const res = await api.get(`/v1/appraisal/employee/${employeeId}/cycle/${cycleId}/published`);
    return res.data;
  },

  getHistory: async (employeeId: string): Promise<AppraisalSummary[]> => {
    const res = await api.get(`/v1/appraisal/employee/${employeeId}/history`);
    return res.data;
  },

  // ── Approver ──────────────────────────────────────────────────────────────
  getPendingL1: async (approverId: string): Promise<AppraisalSummary[]> => {
    const res = await api.get(`/v1/appraisal/approver/l1/${approverId}/pending`);
    return res.data;
  },

  getPendingL2: async (approverId: string): Promise<AppraisalSummary[]> => {
    const res = await api.get(`/v1/appraisal/approver/l2/${approverId}/pending`);
    return res.data;
  },

  getPendingApprover: async (approverId: string): Promise<AppraisalSummary[]> => {
    const res = await api.get(`/v1/appraisal/approver/${approverId}/pending`);
    return res.data;
  },

  // FIX: Use this for the dashboard — returns L1 pending + ALL L2 records (including
  // SUBMITTED view-only) so the frontend can bucket into PENDING / VIEW_ONLY tabs correctly.
  getAllForApprover: async (approverId: string): Promise<AppraisalSummary[]> => {
    const res = await api.get(`/v1/appraisal/approver/${approverId}/all`);
    return res.data;
  },

  getDetail: async (appraisalId: number): Promise<AppraisalDetail> => {
    const res = await api.get(`/v1/appraisal/${appraisalId}/detail`);
    return res.data;
  },

  // FIX: Called when L1 opens a SUBMITTED form — transitions to UNDER_REVIEW
  markUnderReview: async (appraisalId: number, approverId: string): Promise<void> => {
    await api.post(`/v1/appraisal/${appraisalId}/mark-under-review?approverId=${approverId}`);
  },

  // FIX: Called when L2 clicks "Start Review" on VIEW_ONLY record → L2_UNDER_REVIEW → Pending tab
  markL2UnderReview: async (appraisalId: number, approverId: string): Promise<void> => {
    await api.post(`/v1/appraisal/${appraisalId}/mark-l2-under-review?approverId=${approverId}`);
  },

  addRemarks: async (appraisalId: number, payload: any): Promise<AppraisalDetail> => {
    const res = await api.post(`/v1/appraisal/${appraisalId}/remarks`, payload);
    return res.data;
  },

  saveDraftRemarks: async (appraisalId: number, payload: any): Promise<void> => {
    await api.post(`/v1/appraisal/${appraisalId}/remarks/draft`, payload);
  },

  // ── Admin / HR ────────────────────────────────────────────────────────────
  getAllAppraisals: async (cycleId?: number): Promise<AppraisalSummary[]> => {
    const res = await api.get("/v1/appraisal/admin/all", {
      params: cycleId ? { cycleId } : {},
    });
    return res.data;
  },

  exportExcel: async (cycleId?: number, statusFilter?: string): Promise<void> => {
    const params = new URLSearchParams();
    if (cycleId) params.append("cycleId", String(cycleId));
    if (statusFilter && statusFilter !== "ALL") params.append("statusFilter", statusFilter);
    const res = await api.get(`/v1/appraisal/admin/export?${params.toString()}`, {
      responseType: "blob",
    });
    const url  = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href  = url;
    link.setAttribute("download", `appraisal_export_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportPdf: async (cycleId?: number, statusFilter?: string): Promise<void> => {
    const params = new URLSearchParams();
    if (cycleId) params.append("cycleId", String(cycleId));
    if (statusFilter && statusFilter !== "ALL") params.append("statusFilter", statusFilter);
    const res = await api.get(`/v1/appraisal/admin/export/pdf?${params.toString()}`, {
      responseType: "blob",
    });
    const url  = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href  = url;
    link.setAttribute("download", `appraisal_export_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportEmployeePdf: async (employeeId: string, cycleId: number): Promise<void> => {
    const res = await api.get(
      `/v1/appraisal/employee/${employeeId}/cycle/${cycleId}/export/pdf`,
      { responseType: "blob" }
    );
    const url  = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href  = url;
    link.setAttribute("download", `my_appraisal_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportEmployeeExcel: async (employeeId: string, cycleId: number): Promise<void> => {
    const res = await api.get(
      `/v1/appraisal/employee/${employeeId}/cycle/${cycleId}/export/excel`,
      { responseType: "blob" }
    );
    const url  = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href  = url;
    link.setAttribute("download", `my_appraisal_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
