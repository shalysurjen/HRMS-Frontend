import api from "@/services/apiClient";
import type { AppraisalCycle, AppraisalDetail, AppraisalSummary, AnswerDTO } from "@/features/appraisal/types/appraisal";

/**
 * appraisalService
 *
 * Flow:
 *  Employee → saveDraft / submit → backend assigns firstApproverId (reportingManager)
 *  L1 (Manager) → addRemarks(approve=true) → L1_APPROVED → goes to L2 (finalApproverId)
 *  L2 (COO/CEO) → addRemarks(publish=true) → PUBLISHED → employee sees result
 *  Admin/HR    → getAllAppraisals() / exportExcel() / exportPdf()
 */
export const appraisalService = {

  getCycles: async (): Promise<AppraisalCycle[]> => {
    const res = await api.get("/v1/appraisal/cycles");
    return res.data;
  },

  // ── Employee: get or create their own appraisal ──────────────────────────
  getOrCreate: async (employeeId: string, cycleId: number): Promise<AppraisalDetail> => {
    const res = await api.get(`/v1/appraisal/employee/${employeeId}/cycle/${cycleId}`);
    return res.data;
  },

  // ── Employee: save draft (not submitted yet) ─────────────────────────────
  saveDraft: async (employeeId: string, cycleId: number, answers: AnswerDTO[]): Promise<AppraisalDetail> => {
    const res = await api.post("/v1/appraisal/save", { employeeId, cycleId, answers, submit: false });
    return res.data;
  },

  // ── Employee: final submit → goes to their reportingManager (L1) ─────────
  submit: async (employeeId: string, cycleId: number, answers: AnswerDTO[]): Promise<AppraisalDetail> => {
    const res = await api.post("/v1/appraisal/save", { employeeId, cycleId, answers, submit: true });
    return res.data;
  },

  // ── Employee: view their PUBLISHED result (with L1 + L2 remarks) ─────────
  getPublished: async (employeeId: string, cycleId: number): Promise<AppraisalDetail> => {
    const res = await api.get(`/v1/appraisal/employee/${employeeId}/cycle/${cycleId}/published`);
    return res.data;
  },

  // ── Employee: past appraisal history ─────────────────────────────────────
  getHistory: async (employeeId: string): Promise<AppraisalSummary[]> => {
    const res = await api.get(`/v1/appraisal/employee/${employeeId}/history`);
    return res.data;
  },

  // ── Approver: get their L1 pending queue ─────────────────────────────────
  getPendingL1: async (approverId: string): Promise<AppraisalSummary[]> => {
    const res = await api.get(`/v1/appraisal/approver/l1/${approverId}/pending`);
    return res.data;
  },

  // ── Approver: get their L2 pending queue ─────────────────────────────────
  getPendingL2: async (approverId: string): Promise<AppraisalSummary[]> => {
    const res = await api.get(`/v1/appraisal/approver/l2/${approverId}/pending`);
    return res.data;
  },

  // ── Approver: combined L1 + L2 pending (for MANAGER/CTO etc.) ───────────
  getPendingApprover: async (approverId: string): Promise<AppraisalSummary[]> => {
    const res = await api.get(`/v1/appraisal/approver/${approverId}/pending`);
    return res.data;
  },

  // ── Approver: full detail of a single appraisal ──────────────────────────
  getDetail: async (appraisalId: number): Promise<AppraisalDetail> => {
    const res = await api.get(`/v1/appraisal/${appraisalId}/detail`);
    return res.data;
  },

  // ── Approver: submit remarks + decision ──────────────────────────────────
  addRemarks: async (appraisalId: number, payload: any): Promise<AppraisalDetail> => {
    const res = await api.post(`/v1/appraisal/${appraisalId}/remarks`, payload);
    return res.data;
  },

  // ── Admin / HR: all appraisals (optionally filter by cycle) ──────────────
  getAllAppraisals: async (cycleId?: number): Promise<AppraisalSummary[]> => {
    const res = await api.get("/v1/appraisal/admin/all", { params: cycleId ? { cycleId } : {} });
    return res.data;
  },

  // ── Employee: download their own published PDF ───────────────────────────
  exportEmployeePdf: async (employeeId: string, cycleId: number): Promise<void> => {
    const res = await api.get(
      `/v1/appraisal/employee/${employeeId}/cycle/${cycleId}/export/pdf`,
      { responseType: "blob" }
    );
    const url  = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href  = url;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    link.setAttribute("download", `my_appraisal_${today}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // ── Employee: download their own published Excel ─────────────────────────
  exportEmployeeExcel: async (employeeId: string, cycleId: number): Promise<void> => {
    const res = await api.get(
      `/v1/appraisal/employee/${employeeId}/cycle/${cycleId}/export/excel`,
      { responseType: "blob" }
    );
    const url  = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href  = url;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    link.setAttribute("download", `my_appraisal_${today}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // ── Admin / HR: Excel export — triggers browser file download ────────────
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
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    link.setAttribute("download", `appraisal_export_${today}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // ── Admin / HR: PDF export — triggers browser file download ─────────────
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
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    link.setAttribute("download", `appraisal_export_${today}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // ── Approver: save draft remarks without changing appraisal status ────────
  saveDraftRemarks: async (appraisalId: number, payload: any): Promise<void> => {
    await api.post(`/v1/appraisal/${appraisalId}/remarks/draft`, payload);
  },

};