import { attendanceService } from "@/features/attendance/services/attendanceService";
import type { AdminAttendanceExportRequest, AttendanceExportRequest, AttendanceRecord, TeamCalendarResponse } from "@/features/attendance/types";
import { wfhService } from "@/features/leave/services/wfhService";
import { useCallback, useState } from "react";



export const useCalendar = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamAttendanceReport, setTeamAttendanceReport] = useState<AttendanceRecord[]>([]);
  const [allEmployeesAttendanceReport, setAllEmployeesAttendanceReport] = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] = useState({ totalPages: 0, totalElements: 0, currentPage: 0 });
  const [attendanceReport, setAttendanceReport] = useState<AttendanceRecord[]>([]);

  const [teamCalendar, setTeamCalendar] =
    useState<TeamCalendarResponse>({});

  const [employeeCalendar, setEmployeeCalendar] =
    useState<TeamCalendarResponse>({});

  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  /*
  ========================
  TEAM LEAVE CALENDAR
  ========================
  */
  const fetchTeamSchedule = useCallback(
    async (employeeId: string) => {
      try {
        setLoading(true);

        const data =
          await attendanceService.getTeamCalendar(employeeId);

        setTeamCalendar(data || {});

        return data;
      } catch (err) {
        console.error("team calendar error", err);
        setError("Failed to fetch team calendar");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  ========================
  MY LEAVE CALENDAR (with WFH merged in)
  ========================
  */
  const fetchEmployeeCalendar = useCallback(
    async (employeeId: string) => {
      try {
        setLoading(true);

        const [leaveData, wfhData] = await Promise.all([
          attendanceService.getEmployeeCalendar(employeeId),
          wfhService.getMyApplications(employeeId).catch(() => []),
        ]);

        // Merge WFH records into the calendar map
        const merged: TeamCalendarResponse = { ...(leaveData || {}) };

        (wfhData || []).forEach((wfh: any) => {
          if (!wfh.startDate || !wfh.endDate) return;

          // Expand date range for multi-day WFH
          const start = new Date(wfh.startDate);
          const end = new Date(wfh.endDate);
          const cursor = new Date(start);

          while (cursor <= end) {
            const yyyy = cursor.getFullYear();
            const mm = String(cursor.getMonth() + 1).padStart(2, "0");
            const dd = String(cursor.getDate()).padStart(2, "0");
            const key = `${yyyy}-${mm}-${dd}`;

            const wfhEntry = {
              leaveTypeName: "WFH",
              status: wfh.status,
              startDate: wfh.startDate,
              endDate: wfh.endDate,
              employeeId: wfh.employeeId,
              employeeName: wfh.employeeName,
              id: wfh.id,
              isWfh: true,
            };

            if (!merged[key]) {
              merged[key] = [wfhEntry as any];
            } else {
              merged[key] = [...merged[key], wfhEntry as any];
            }

            cursor.setDate(cursor.getDate() + 1);
          }
        });

        setEmployeeCalendar(merged);
      } catch (err: any) {
        console.error("employee calendar error", err);
        setError(err.message || "Failed to fetch employee calendar");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  ========================
  ATTENDANCE CALENDAR
  ========================
  */
  // In your component

  const fetchAttendanceCalendar = useCallback(
    async (employeeId: string, year: number, month: number) => {
      try {
        setLoading(true);
        setError(null);

        const data: AttendanceRecord[] = await attendanceService.getAttendance(employeeId, year, month);

        // Transform Array -> Object { "2026-04-11": Record }
        const attendanceMap = data.reduce((acc, record) => {
          acc[record.date] = record;
          return acc;
        }, {} as Record<string, AttendanceRecord>);

        setAttendance(attendanceMap);
      } catch (err) {
        console.error("Attendance fetch error:", err);
        setError("Failed to fetch attendance records.");
      } finally {
        setLoading(false);
      }
    },
    []
  );
  const fetchTeamAttendanceReport = useCallback(
    async (reportingId: string, filters: { fromDate?: string; toDate?: string; status?: string; page?: number; size?: number }) => {
      try {
        setLoading(true);
        setError(null);

        const data = await attendanceService.getTeamAttendanceReport(reportingId, filters);

        setTeamAttendanceReport(data.content || []);
        setPagination({
          totalPages: data.totalPages,
          totalElements: data.totalElements,
          currentPage: data.number
        });

        return data;
      } catch (err: any) {
        console.error("Team attendance report error", err);
        setError(err.message || "Failed to fetch team attendance report");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchEmployeeAttendanceReport = useCallback(
    async (empId: string, filters: { fromDate?: string; toDate?: string; page?: number; size?: number }) => {
      try {
        setLoading(true);
        setError(null);

        const data = await attendanceService.getEmployeeAttendanceByRange(empId, filters);


        setAttendanceReport(data.content || []);
        setPagination({
          totalPages: data.totalPages,
          totalElements: data.totalElements,
          currentPage: filters.page || 0 ,
        });

        return data;
      } catch (err: any) {
        console.error("Employee report error:", err);
        setError(err.message || "Failed to fetch employee attendance report");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );
  const fetchAllEmployeeAttendanceReport = useCallback(
    async (filters: { fromDate?: string; toDate?: string; page?: number; size?: number }) => {
      try {
        setLoading(true);
        setError(null);

        const data = await attendanceService.getAllEmployeeAttendanceByRange(filters);

        setAllEmployeesAttendanceReport(data.content || []);
        setPagination({
          totalPages: data.totalPages,
          totalElements: data.totalElements,
          currentPage: filters.page || 0,
        });

        return data;
      } catch (err: any) {
        console.error("Employee report error:", err);
        setError(err.message || "Failed to fetch employee attendance report");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );
  const downloadAttendanceExcel = useCallback(
    async (empId: string, filters: { fromDate?: string; toDate?: string }) => {
      try {
        setLoading(true);
        setError(null);
        await attendanceService.downloadAttendanceExcel(empId, filters);
      } catch (err: any) {
        console.error("Excel download error:", err);
        setError(err.message || "Failed to download Excel report");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const downloadTeamReport = useCallback(
    async (managerId: string, payload: AttendanceExportRequest) => {
      try {
        setLoading(true);
        setError(null);
        await attendanceService.downloadTeamAttendance(managerId, payload);
      } catch (err: any) {
        console.error("Team report download error:", err);
        setError("Failed to download team report");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const downloadSelectedReport = useCallback(
    async (payload: AttendanceExportRequest) => {
      try {
        setLoading(true);
        setError(null);
        await attendanceService.downloadSelectedEmployees(payload);
      } catch (err: any) {
        console.error("Selection report download error:", err);
        setError("Failed to download selection report");
      } finally {
        setLoading(false);
      }
    },
    []
  );
  const downloadAllAttendanceReport = useCallback(
    async (payload: AdminAttendanceExportRequest) => {
      try {
        setLoading(true);
        setError(null);
        await attendanceService.downloadAllEmployeesAttendanceReport(payload);
      } catch (err: any) {
        console.error("Selection report download error:", err);
        setError("Failed to download selection report");
      } finally {
        setLoading(false);
      }
    },
    []
  );
  /*
  ========================
  EXPORT API
  ========================
  */
  return {
    loading,
    error,

    teamCalendar,
    employeeCalendar,
    attendance,
    fetchTeamSchedule,
    fetchEmployeeCalendar,
    fetchAttendanceCalendar,
    teamAttendanceReport,
    pagination,
    fetchTeamAttendanceReport,
    attendanceReport,
    fetchEmployeeAttendanceReport,
    downloadAttendanceExcel,
    fetchAllEmployeeAttendanceReport,
    allEmployeesAttendanceReport,
    downloadTeamReport,
    downloadSelectedReport,
    downloadAllAttendanceReport
  };
};