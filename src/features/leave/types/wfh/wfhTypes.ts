export type WFHStatus = 'PENDING_TEAM_LEADER' | 'PENDING_MANAGER' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface WFHRequest {
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface WFHResponse {
  id: number;
  employeeId: string;
  employeeName?: string | null;
  reason: string;
  startDate: string;
  endDate: string;
  status: WFHStatus;
  createdAt: string;
}
