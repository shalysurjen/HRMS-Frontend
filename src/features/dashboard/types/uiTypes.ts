export interface DashboardStats {
  title: string;
  used: number;
  total: number;
  color: string;
  icon: string;
}

export interface ChartData {
  month: string;
  Casual: number;
  Sick: number;
  Earned: number;
}

export interface ApprovalRequest {
  id: number;
  initial: string;
  employee: string;
  dept: string;
  type: string;
  range: string;
  days: number;
  avatarColor?: string;
  appliedOn: string;
  balance: number;
  reason: string;
}


export interface AuditLog {
  action: string;
  target: string;
  actor: string;
  role: 'Manager' | 'Employee' | 'Admin' | 'System Admin';
  time: string;
  timestamp: string;
  status: 'success' | 'error' | 'security' | 'info';
  details: string;
  icon: React.ReactNode;
}