import type { LeaveType } from "@/features/leave/types/leave/leaveTypes";

export type ODStatus = 'PENDING_TEAM_LEADER' | 'PENDING_MANAGER' | 'PENDING_HR' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ODRequest {
  employeeId: string;
  employeeName?: string | null;
  reason: string;
  startDate: string;
  endDate: string;
}

export interface ODResponse {
  id: number;
  employeeId: string;
  employeeName?: string | null;
  reason: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  status: ODStatus;
  createdAt: string;
}


export interface MeetingRequest {
  title: string;
  startTime: string;
  endTime: string;
  type?: string;
  locationOrLink?: string;
  agenda?: string;
  priority?: string;
}