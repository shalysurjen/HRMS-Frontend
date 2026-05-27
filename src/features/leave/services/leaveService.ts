import type { TeamMemberBalance } from "@/features/attendance/types";
import type { CompOffRequest, LeaveBalanceResponseV2, LeaveDecisionRequest, LeaveRecord, ODResponse, PendingLeaveApplicationApiResponse } from "@/features/leave/types";
import api from "@/services/apiClient";

export const leaveService = {
  submitLeaveRequest: async (data: FormData) => {
    const isMultipart = data instanceof FormData;
    const response = await api.post('/v1/leaves/apply', data, {
      headers: {
        'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json',
      },
    });
    return response.data;
  },

  updateLeave: async (id: number, data: any) => {
    const res = await api.put(
      `/v1/leaves/${id}`,
      null,
      {
        params: {
          employeeId: data.employeeId,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
          halfDayType: data.halfDayType
        }
      }
    );

    return res.data;
  },

  cancelLeave: async (id: number, employeeId: string): Promise<any> => {
    try {
      const res = await api.patch(
        `/v1/leaves/${id}/cancel`,
        null,
        {
          params: { employeeId }
        }
      );

      return res.data;
    } catch (error) {
      console.error(`Error cancelling leave ${id}:`, error);
      throw error;
    }
  },


  getMyLeaveHistory: async (employeeId: string): Promise<LeaveRecord[]> => {
    const response = await api.get(`/v1/leaves/employee/${employeeId}`);
    return response.data;
  },

  getMyODHistory: async (employeeId: string): Promise<ODResponse[]> => {
    const response = await api.get(`/v1/od/my/${employeeId}`);
    return response.data;
  },

  getLeaveApplicationByID: async (leaveId: number) => {
    const res = await api.get(`/v1/leaves/${leaveId}`);
    
    
    return res.data;
  },
  // getPendingApprovals: async (managerId: string): Promise<PendingLeaveApplicationApiResponse[]> => {
  //   const response = await api.get(`/v1/leave-approvals/pending/manager/${managerId}`);
  //   return response.data.content;
  // },

  getPendingApprovals: async (managerId: string) => {
    const response = await api.get(`/v1/leave-approvals/pending/manager/${managerId}`);
    
    
    return response.data.content || response.data;
  },

  getPendingApprovalsForTeamLeader: async (teamLeaderId: string): Promise<PendingLeaveApplicationApiResponse[]> => {
    const response = await api.get(`/v1/leave-approvals/pending/team-leader/${teamLeaderId}`);
    return response.data.content;
  },

  getPendingCompOffs: async (managerId: string) => {
    const response = await api.get(`/v1/compoff/pending/${managerId}/approvals`);
    return response.data.content;
  },

  getPendingODApprovalsForTeamLeader: async (teamLeaderId: string): Promise<ODResponse[]> => {

    const response = await api.get(`/v1/od/pending/teamleader/${teamLeaderId}`);

    return response.data;
  },
  getPendingODApprovals: async (managerId: string): Promise<ODResponse[]> => {
    const response = await api.get(`/v1/od/pending/manager/${managerId}`);
    return response.data;
  },

  updateDecision: async (
    decisionRequest: LeaveDecisionRequest
  ): Promise<void> => {
    await api.patch(
      "/v1/leave-approvals/decision",
      decisionRequest
    );
  },



  approveCompOff: async (
    compOffId: number
  ): Promise<void> => {

    await api.patch(
      `/v1/compoff/approve/${compOffId}`,

    );
  },
  rejectCompOff: async (compOffId: number, reason: string): Promise<void> => {
    await api.patch(
      `/v1/compoff/reject/${compOffId}`,
      null,
      {
        params: { reason }
      }
    );
  },
  getLeaveBalances: async (employeeId: string, year: number = 2026): Promise<LeaveBalanceResponseV2> => {
    const res = await api.get(`/v1/leave/balance/${employeeId}`, {
      params: { year }
    });

  
    return res.data;
  },
  submitCompOffRequest: async (payload: CompOffRequest) => {
    const response = await api.post('/v1/compoff/request', payload);
    return response.data;
  },
  getWeeklyLeaveSummary: async (managerId: string): Promise<LeaveRecord[]> => {
    const response = await api.get(`/v1/manager/${managerId}/team-leaves/week`);
    return response.data;
  },

  getTeamOnLeave: async (managerId: string): Promise<TeamMemberBalance[]> => {
    const response = await api.get(`/v1/dashboard/team-on-leave/${managerId}`);
    return response.data;
  },
}