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

// ── New: one row per attendance date with all 13 columns ──────────────────────
export interface AttendanceDetailedRow {
  empId: string;
  empName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: string | null;
  cfLeaveDays: number | null;
  glDays: number | null;
  slDays: number | null;
  wfhDays: number | null;
  permissionHours: string | null;
  lopDays: number | null;
  attendanceStatus: string;
  approvalStatus: string;
  punchRecords: string | null;
}

export interface AttendanceDetailedPage {
  content: AttendanceDetailedRow[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
