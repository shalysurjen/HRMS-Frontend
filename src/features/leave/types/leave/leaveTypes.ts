export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type HalfDayLeaveType = "FIRST_HALF" | "SECOND_HALF";
export type LeaveType = 'SICK' | 'ANNUAL' | 'MATERNITY' | 'PATERNITY' | 'COMP_OFF' | 'ON_DUTY' ;
export type AccessType = 'VPN' | 'BIOMETRIC';

export type LeaveDecision = 'APPROVED' | 'REJECTED' | 'MEETING_REQUIRED';

export interface EmployeeOnLeave {
  employeeId: string;
  employeeName: string;
  leaveType: string;
  department?: string;
}

export interface LowBalanceEmployee {
  employeeId: number;
  employeeName: string;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  compOffBalance: number | null;
  lopPercentage: number | null;
  totalWorkingDays: number | null;
}

export interface LeaveRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  leaveTypeName: LeaveType;
  startDateHalfDayType: string | null;
  endDateHalfDayType: string | null;
  isAppointment: boolean | null;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  teamLeaderDecision: string | null;
  teamLeaderDecidedAt: string | null;
  managerDecision: string | null;
  managerDecidedAt: string | null;
  hrDecision: string | null;
  rejectionReason? : string | null;
  carryForwardUsed: number;
  compOffUsed: number;
  lossOfPayApplied: number;
  pendingLopDays: number | null;
  createdAt: string;
  escalated: boolean;
  escalatedAt: string | null;
  managerId: number;
  version: number;
  attachments: string[];
}



export interface PendingLeaveApplication {
  id: number;

  employeeId: string;
  employeeName: string;

  leaveType: LeaveType;

  halfDayType?: HalfDayLeaveType | null;
  startDateHalfDayType?: HalfDayLeaveType | null;
  endDateHalfDayType?: HalfDayLeaveType | null;

  isAppointment: boolean;
  appointment: boolean;

  year: number;

  startDate: string;
  endDate: string;
  days: number;

  reason: string;
  status: string;

  currentApprovalLevel: string;
  requiredApprovalLevels: number;

  teamLeaderId?: number;
  teamLeaderDecision?: string | null;
  teamLeaderDecidedAt?: string | null;

  managerId?: number;
  managerDecision?: string | null;
  managerDecidedAt?: string | null;

  hrId?: number;
  hrDecision?: string | null;
  hrDecidedAt?: string | null;
  hrDecidedBy?: number | null;

  approvedBy?: number | null;
  approvedRole?: string | null;
  approvedAt?: string | null;

  carryForwardUsed: number;
  compOffUsed: number;
  lossOfPayApplied: number;
  pendingLopDays?: number | null;

  createdAt: string;
  updatedAt: string;

  escalated: boolean;
  escalatedAt?: string | null;

  version: number;

  confirmLossOfPay?: boolean;
}
export interface Attachment {
  id: number;
  leaveApplicationId: number;
  fileName: number;
  fileUrl: number;
  fileType: number;
  fileSize: number;
  uploadedAt: number;
}

export interface PendingLeaveApplicationApiResponse {
  leaveApplication: PendingLeaveApplication;
  attachments?: Attachment[];
}


export interface LeaveDecisionRequest {
  leaveId: number;
  approverId: string;
  decision: LeaveDecision;
  comments?: string;
}


export interface LeaveTypeBreakDown {
  leaveTypeName: LeaveType;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  halfDayCount: number;
  pendingCount?: number;
}



interface LeaveTypeBreakdown {
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  pendingCount?: number;
}



interface MonthlyBalance {
  availableDays : number;
  employeeId : string;
  month : number;
  usedDays : number;
  remainingDays : number;
}

export interface LeaveBalanceResponseV2{
  annualLeaveBalance : MonthlyBalance;
  sickLeaveBalance : MonthlyBalance;
}


export interface LeaveBalanceResponse {
  employeeId: string;
  employeeName: string;
  year: number;
  // Total leave statistics
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;

  // Comp-Off stats
  compOffBalance: number;
  compOffEarned: number;
  compOffUsed: number;

  lopPercentage: number;

  // Carry Forward
  carriedFromLastYear: number;
  eligibleToCarry: number;

  // Monthly Stats
  currentMonthApproved: number;
  exceededMonthlyLimit: boolean;

  // Working Days
  totalWorkingDays: number;

  // Breakdown per leave type
  breakdown: LeaveTypeBreakdown[];
}




export type TeamPendingLeave = {
  leaveId: number;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  days: number;
  appliedAt: string;
}

export type TeamMemberOnLeave = {
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysRemaining: number;
}



export type CompOffEntry = {
  workedDate: string;
  plannedLeaveDate?: string | null;
  days: number;
};



export type CompOffRequest = {
  employeeId: string;
  entries: CompOffEntry[];
};



export type CompOffResponse = {
  compoffId: number;
  employeeId: string;
  employeeName: string;
  workedDate: string;
  status: 'PENDING' | 'REJECTED' | 'USED';
  days: number;
  createdAt: number;
}