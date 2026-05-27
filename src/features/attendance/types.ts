export interface TeamMemberBalance {
  employeeId: string;
  employeeName: string;
  totalAllocated: number | null;
  totalUsed: number | null;
  totalRemaining: number | null;
  compOffBalance: number | null;
  lopPercentage: number | null;
  totalWorkingDays: number | null;
}

export type TeamCalendarResponse = Record<string, TeamMemberBalance[]>;


export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: string;
  punchRecords: string | null;
}


export interface TeamAttendancePage {
  content: AttendanceRecord[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface AttendanceExportRequest {
  empIds: string[];
  fromDate?: string;
  toDate?: string;
}
export interface AdminAttendanceExportRequest {
  fromDate?: string;
  toDate?: string;
}

