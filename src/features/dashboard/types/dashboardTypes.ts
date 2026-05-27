import type { EmployeeData } from "@/features/employee/types";
import type { EmployeeOnLeave, TeamMemberOnLeave, TeamPendingLeave } from "@/features/leave/types/leave/leaveTypes";

export type OnboardingStage = 'PENDING' | 'COMPLETED' | 'IN_PROGRESS';

export interface TeamMember {
  employeeId: string;
  employeeName: string;
  email: string;
  yearlyBalance: number;
  carryForwardBalance: number;
  compOffBalance: number;
}


export interface TeamStructure {
  managerId: number;
  managerName: string;
  teamMemberCount: number;
  teamMembers: TeamMember[];
}

export interface OnboardingEmployee {
  employeeId: string;
  employeeName: string;
  email: string;
  joiningDate: string;
  biometricStatus: string;
  vpnStatus: string;
  daysInOnboarding: number;
}



export interface ManagerApprovalStat {
  rejectedCount: number;
  managerId: number;
  managerName: string;
  teamSize: number;
  approvalsThisYear: number;
  pendingRequests: number;
  approvalRate: number;
  lastApprovalData: number;
}

export interface DashboardResponse {
  currentYear: number;
  lastUpdated: string;
  totalEmployees: number;
  activeEmployees: number;
  employeesOnLeaveToday: number;
  totalPendingLeaves: number;
  totalApprovedLeaves: number;
  newEmployeesCount: number;
  pendingBiometricCount: number;
  pendingVPNCount: number;
  totalManagersWithApprovals: number;
  teamStructure: TeamStructure[];
  onboardingPendingList: OnboardingEmployee[];
  employeesOnLeave: EmployeeOnLeave[];
  managerApprovalStats: ManagerApprovalStat[];
}



export interface ManagerDashBoardResponse {
  personalStats: EmployeeData;
  teamSize: number;
  teamPendingRequestCount: number;
  teamOnLeaveCount: number;
  pendingTeamRequests: TeamPendingLeave[];
  teamOnLeaveToday: TeamMemberOnLeave[];
}

export interface AdminDashBoardResponse {
  // Admin's Personal View (Consistency)
  personalStats: EmployeeData;

  // Metadata
  currentYear: number;
  lastUpdated: string; // or Date

  // Compliance & Audit Metrics
  totalEmployees: number;
  totalManagers: number;
  newEmployeesPendingOnboarding: number;
  totalPendingLeaves: number;
  totalRejectedLeaves: number;

  // Organization-wide Leave Statistics
  totalLeaveDaysUsedYTD: number;
  totalCarryForwardBalance: number;
  totalCompOffBalance: number;
  averageLossOfPayPercentage: number;

  // Detailed Data Lists
  leaveTypeUsage: GlobalLeaveTypeUsage[];
  recentRejections: RejectedLeaveAudit[];
  complianceIssues: EmployeeCompliance[];
  newEmployeesStatus: OnboardingStatus[];
}

export interface GlobalLeaveTypeUsage {
  leaveType: string; // e.g., "SICK", "VACATION"
  totalAllocated: number;
  totalUsed: number;
  totalBalance: number;
  countOfApplications: number;
  averagePerEmployee: number;
}

export interface RejectedLeaveAudit {
  leaveId: number;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  rejectedBy: number;
  rejectedByName: string;
  rejectedAt: string;
}

export interface EmployeeCompliance {
  employeeId: string;
  employeeName: string;
  issue: string; // e.g., "Negative Balance Detected"
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  detectedDate: string;
  recommendation: string;
}

export interface OnboardingStatus {
  employeeId: string;
  employeeName: string;
  email: string;
  joiningDate: string;
  daysInCompany: number;
  biometricStatus: string; // Matches your Java BiometricVpnStatus enum
  vpnStatus: string;
  onboardingComplete: boolean;
  completionDate?: string;
}