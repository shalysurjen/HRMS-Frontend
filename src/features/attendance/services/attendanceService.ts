import type { AdminAttendanceExportRequest, AttendanceExportRequest, AttendanceRecord, TeamAttendancePage, TeamCalendarResponse } from "@/features/attendance/types";
import api from "@/services/apiClient";


// this function is an helper to download reports
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
        // console.log("employee calender" + response);
        return response.data;
    },
    getTeamCalendar: async (id: string): Promise<TeamCalendarResponse> => {
        const response = await api.get<TeamCalendarResponse>(
            `/v1/dashboard/team-calendar/${id}`
        );
        // console.log("team calanedr " + response);

        return response.data;
    },

    getAttendance: async (
        employeeId: string,
        year?: number,
        month?: number
    ): Promise<AttendanceRecord[]> => {
        const res = await api.get(`/v1/attendance/employee/${employeeId}`, {
            params: {
                year,
                month: month !== undefined ? month + 1 : undefined
            }
        });
        return res.data;
    },
    getTeamAttendanceReport: async (
        reportingId: string,
        params: {
            fromDate?: string;
            toDate?: string;
            status?: string;
            page?: number;
            size?: number;
        }
    ): Promise<TeamAttendancePage> => {
        const response = await api.get(`/v1/attendance/team/${reportingId}`, {
            params: {
                ...params,
            }
        });
        return response.data;
    },
    getEmployeeAttendanceByRange: async (
        empId: string,
        params: {
            fromDate?: string;
            toDate?: string;
            page?: number;
            size?: number;
        }
    ): Promise<{
        content: AttendanceRecord[], totalPages: number, totalElements: number, size: number,
        number: number
    }> => {
        const response = await api.get(`/v1/attendance/${empId}`, {
            params
        });

        return response.data;
    },
    getAllEmployeeAttendanceByRange: async (
        params: {
            fromDate?: string;
            toDate?: string;
            page?: number;
            size?: number;
        }
    ): Promise<{ content: AttendanceRecord[], totalPages: number, totalElements: number }> => {
        const response = await api.get(`/v1/attendance/all`, {
            params
        });

        return response.data;
    },

    downloadAttendanceExcel: async (
        empId: string,
        params: {
            fromDate?: string; // Optional
            toDate?: string;   // Optional
        }
    ): Promise<void> => {
        const response = await api.get(`/v1/attendance/download/excel/${empId}`, {
            params: {// Mapping frontend empId to backend employeeId param
                ...params
            },
            responseType: 'blob', // CRITICAL: Tells axios to treat response as binary
        });

        // Create a URL for the downloaded file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Set suggested filename
        const dateStr = params.fromDate || new Date().toISOString().split('T')[0];
        link.setAttribute('download', `Attendance_${empId}_${dateStr}.xlsx`);

        // Append to body, click to trigger download, then clean up
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    downloadTeamAttendance: async (managerId: string, payload: AttendanceExportRequest) => {
        const response = await api.post(`/v1/attendance/download/team/${managerId}`, payload, {
            responseType: 'blob',
        });
        handleDownload(response.data, `Team_Attendance_${managerId}_${payload.fromDate || 'report'}.xlsx`);
    },

    // NEW: Download Selection Report (POST)
    downloadSelectedEmployees: async (payload: AttendanceExportRequest) => {
        const response = await api.post(`/v1/attendance/download/selection`, payload, {
            responseType: 'blob',
        });
        handleDownload(response.data, `Attendance_Selection_${payload.fromDate || 'report'}.xlsx`);
    },
    downloadAllEmployeesAttendanceReport: async (payload: AdminAttendanceExportRequest) => {
        const response = await api.get(`/v1/attendance/download/all`, {
            // Wrap your payload in 'params' so it is sent as query string parameters (?fromDate=...)
            params: payload,
            responseType: 'blob',
        });

        handleDownload(response.data, `Attendance_Selection_${payload.fromDate || 'report'}.xlsx`);
    },
}