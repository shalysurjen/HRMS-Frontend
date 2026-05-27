import api from "@/services/apiClient";

export interface WfhRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  startDateHalfDayType: "FIRST_HALF" | "SECOND_HALF" | null;
  endDateHalfDayType: "FIRST_HALF" | "SECOND_HALF" | null;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  rejectionReason?: string;
  requiredApprovalLevels: number;
  currentApprovalLevel: "FIRST_APPROVER" | "SECOND_APPROVER" | null;
  currentApproverId: string | null;
  firstApproverId: string | null;
  firstApproverDecision: "PENDING" | "APPROVED" | "REJECTED" | null;
  firstApproverDecidedAt: string | null;
  secondApproverId: string | null;
  secondApproverDecision: "PENDING" | "APPROVED" | "REJECTED" | null;
  secondApproverDecidedAt: string | null;
  approvedBy: string | null;
  approvedRole: string | null;
  approvedAt: string | null;
  attachmentFileName: string | null;
  attachmentOriginalName: string | null;
  attachmentContentType: string | null;
  attachmentSize: number | null;
  createdAt: string;
  createdBy: string;
}

export const wfhService = {

  // Apply for WFH (multipart/form-data)
  applyWfh: async (data: FormData): Promise<WfhRecord> => {
    const response = await api.post("/wfh", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Get all WFH applications for the logged-in employee
  getMyApplications: async (empId: string): Promise<WfhRecord[]> => {
    const response = await api.get(`/wfh/employee/${empId}`);
    return response.data;
  },

  // Get total approved + pending WFH days
  getTotalDays: async (empId: string): Promise<number> => {
    const response = await api.get(`/wfh/employee/${empId}/total-days`);
    return response.data;
  },

  // Get pending WFH requests for an approver
  getPendingForApprover: async (approverId: string): Promise<WfhRecord[]> => {
    const response = await api.get(`/wfh/approver/${approverId}/pending`);
    return response.data;
  },

  // Approve
  approveWfh: async (
    wfhId: number,
    approverId: string,
    comments: string
  ): Promise<WfhRecord> => {
    const response = await api.put(`/wfh/${wfhId}/approve`, null, {
      params: { approverId, comments },
    });
    return response.data;
  },

  // Reject
  rejectWfh: async (
    wfhId: number,
    approverId: string,
    comments: string
  ): Promise<WfhRecord> => {
    const response = await api.put(`/wfh/${wfhId}/reject`, null, {
      params: { approverId, comments },
    });
    return response.data;
  },

  // Edit / update a pending WFH request (multipart/form-data)
  editWfh: async (wfhId: number, data: FormData): Promise<WfhRecord> => {
    const response = await api.put(`/wfh/${wfhId}/update`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Cancel
  cancelWfh: async (wfhId: number, empId: string): Promise<WfhRecord> => {
    const response = await api.put(`/wfh/${wfhId}/cancel`, null, {
      params: { empId },
    });
    return response.data;
  },

  // Download / preview attachment — returns a Blob
  downloadAttachment: async (wfhId: number): Promise<Blob> => {
    const response = await api.get(`/wfh/${wfhId}/attachment`, {
      responseType: "blob",
    });
    return response.data;
  },
};
