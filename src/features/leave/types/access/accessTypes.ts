import type { AccessType, LeaveDecision, LeaveType } from "@/features/leave/types";

export type BiometricVpnStatus = 'PENDING' | 'PROVIDED';



export type accessManagerDecision = 'APPROVED' | 'REJECTED';
export interface AccessResponse {
  id: number;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeDesignation: string;
  accessType: AccessType;
  status: string;
  reason: string;
  submittedAt: string;
  createdAt: string;
  managerDecision?: accessManagerDecision;
  managerRemarks?: string;
  managerDecisionAt?: string;
  managerName?: string;
}

export interface AccessRequest {
  accessType : string;
  reason : string;
  startDate: string,
  endDate: string,
}


export interface ManagerAccessDecision{
  decision : LeaveDecision,
  remarks : string;
  managerId : string;
}
export interface AdminAccessDecision {
  decision : LeaveDecision,
  remarks? : string;
}




export interface PendingOnboardingResponse {
  id: number;
  employeeId : number;
  employeeName: string;
  employeeEmail: string;
  employeeDesignation : string;
  accessType : LeaveType ;
  status :  string;
  reason : string;
  createdAt : string;
  managerDecision : LeaveDecision;
  managerRemarks : string;
  managerDecisionAt : string;
  managerName : string;

}