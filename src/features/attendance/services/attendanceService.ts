import type {
    AdminAttendanceExportRequest,
    AttendanceDetailedPage,
    AttendanceExportRequest,
    AttendanceRecord,
    TeamAttendancePage,
    TeamCalendarResponse
} from "@/features/attendance/types";
import api from "@/services/apiClient";

// Helper to download blob as file
const handleDownload = (data: Blob, filename: string) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const attendanceService = {
    getEmployeeCalendar: async (employeeId: string): Promise<TeamCalendarResponse> => {
        const response = await api.get(`/v1/dashboard/employee/calendar/${employeeId}`);
        return response.data;
    },

    getTeamCalendar: async (id: string): Promise<TeamCalendarResponse> => {
        const response = await api.get<TeamCalendarResponse>(`/v1/dashboard/team-calendar/${id}`);
        return response.data;
    },

    getAttendance: async (
        employeeId: string,
        year?: number,
        month?: number
    ): Promise<AttendanceRecord[]> => {
        const res = await api.get(`/v1/attendance/employee/${employeeId}`, {
            params: { year, month: month !== undefined ? month + 1 : undefined }
        });
        return res.data;
    },

    getTeamAttendanceReport: async (
        reportingId: string,
        params: { fromDate?: string; toDate?: string; status?: string; page?: number; size?: number }
    ): Promise<TeamAttendancePage> => {
        const response = await api.get(`/v1/attendance/team/${reportingId}`, { params });
        return response.data;
    },

    getEmployeeAttendanceByRange: async (
        empId: string,
        params: { fromDate?: string; toDate?: string; page?: number; size?: number }
    ): Promise<{ content: AttendanceRecord[]; totalPages: number; totalElements: number; size: number; number: number }> => {
        const response = await api.get(`/v1/attendance/${empId}`, { params });
        return response.data;
    },

    getAllEmployeeAttendanceByRange: async (
        params: { fromDate?: string; toDate?: string; page?: number; size?: number }
    ): Promise<{ content: AttendanceRecord[]; totalPages: number; totalElements: number }> => {
        const response = await api.get(`/v1/attendance/all`, { params });
        return response.data;
    },

    // ── NEW: 13-column detailed rows for one employee ─────────────────────────
    getDetailedAttendance: async (
        empId: string,
        params: { fromDate?: string; toDate?: string; page?: number; size?: number }
    ): Promise<AttendanceDetailedPage> => {
        const response = await api.get(`/v1/attendance/detailed/${empId}`, { params });
        return response.data;
    },

    // ── NEW: Download 13-column detailed attendance Excel ─────────────────────
    downloadDetailedAttendance: async (
        empId: string,
        params: { fromDate?: string; toDate?: string }
    ): Promise<void> => {
        const response = await api.get(`/v1/attendance/detailed/${empId}/download`, {
            params,
            responseType: 'blob',
        });
        const from = params.fromDate || 'report';
        const to   = params.toDate   || '';
        handleDownload(response.data, `Attendance_${empId}_${from}_to_${to}.xlsx`);
    },

    downloadAttendanceExcel: async (
        empId: string,
        params: { fromDate?: string; toDate?: string }
    ): Promise<void> => {
        const response = await api.get(`/v1/attendance/download/excel/${empId}`, {
            params,
            responseType: 'blob',
        });
        const dateStr = params.fromDate || new Date().toISOString().split('T')[0];
        handleDownload(response.data, `Attendance_${empId}_${dateStr}.xlsx`);
    },

    downloadTeamAttendance: async (managerId: string, payload: AttendanceExportRequest) => {
        const response = await api.post(`/v1/attendance/download/team/${managerId}`, payload, {
            responseType: 'blob',
        });
        handleDownload(response.data, `Team_Attendance_${managerId}_${payload.fromDate || 'report'}.xlsx`);
    },

    downloadSelectedEmployees: async (payload: AttendanceExportRequest) => {
        const response = await api.post(`/v1/attendance/download/selection`, payload, {
            responseType: 'blob',
        });
        handleDownload(response.data, `Attendance_Selection_${payload.fromDate || 'report'}.xlsx`);
    },

    downloadAllEmployeesAttendanceReport: async (payload: AdminAttendanceExportRequest) => {
        const response = await api.get(`/v1/attendance/download/all`, {
            params: payload,
            responseType: 'blob',
        });
        handleDownload(response.data, `Attendance_Selection_${payload.fromDate || 'report'}.xlsx`);
    },

    downloadBulkDetailedAttendance: async (payload: {
        empIds: string[];
        fromDate: string;
        toDate: string;
    }): Promise<void> => {
        const response = await api.post(`/v1/attendance/detailed/download/bulk`, payload, {
            responseType: 'blob',
        });
        handleDownload(response.data, `Attendance_Report_${payload.fromDate}_to_${payload.toDate}.xlsx`);
    },
};
