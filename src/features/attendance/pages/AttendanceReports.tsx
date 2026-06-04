import { useCalendar } from "@/features/attendance/hooks/useCalendar";
import { useEmployee } from "@/features/employee/hooks/useEmployee";
import type { EmployeeEntity } from "@/features/employee/types";
import type { AttendanceMonthlySummary } from "@/features/attendance/types";
import { useAuth } from "@/shared/auth/useAuth";
import React, { useEffect, useMemo, useState } from "react";
import {
    FaArrowLeft,
    FaFileExport,
    FaListAlt,
    FaChartBar,
    FaFileExcel
} from "react-icons/fa";
import { attendanceService } from "@/features/attendance/services/attendanceService";
import LeaveExportPage from "@/features/leave/pages/LeaveExportPage";

// ─── Tab type ────────────────────────────────────────────────
type ActiveTab = "detailed" | "summary" | "leave";

const AttendanceReports: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const isCfo = user?.role === "CFO";
    const isManager = !isAdmin && !isCfo;

    // ── Shared state ─────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<ActiveTab>("detailed");
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().split("T")[0].substring(0, 8) + "01",
        to: new Date().toISOString().split("T")[0],
    });

    // ── Detailed tab state ────────────────────────────────────
    const {
        fetchTeamAttendanceReport,
        fetchEmployeeAttendanceReport,
        downloadSelectedReport,
        teamAttendanceReport,
        attendanceReport,
        downloadAttendanceExcel,
        downloadAllAttendanceReport,
    } = useCalendar();

    const { getEmployees, getTeamMembers } = useEmployee();
    const [employees, setEmployees] = useState<EmployeeEntity[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("Loading...");
    const [activePunches, setActivePunches] = useState<{ time: string; type: string }[] | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [page, setPage] = useState(0);
    const [listTotalPages, setListTotalPages] = useState(0);
    const [attendanceTotalPages, setAttendanceTotalPages] = useState(0);
    const SIZE = 10;

    // ── Summary tab state ─────────────────────────────────────
    const [summaryData, setSummaryData] = useState<AttendanceMonthlySummary[]>([]);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);

    // ═══════════════════════════════════════════════════════════
    // LOAD EMPLOYEES (for detailed tab)
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        if (!isAdmin && !isCfo) return;
        const load = async () => {
            try {
                const result = await getEmployees({ page, size: 10 });
                if (result?.content) {
                    setEmployees(result.content);
                    setListTotalPages(result.totalPages || 0);
                }
            } catch (err) {
                console.error("Failed to fetch employees", err);
            }
        };
        load();
    }, [isAdmin, isCfo, getEmployees, page, selectedEmployeeId]);

    // LOAD TEAM MEMBERS for Manager summary
    useEffect(() => {
        if (!isManager || !user?.id) return;
        const loadTeam = async () => {
            try {
                const members = await getTeamMembers(user.id);
                if (members) {
                    const ids = members.map((m: any) => m.employeeId || m.empId).filter(Boolean);
                    setTeamMemberIds(ids);
                    setEmployees(members.map((m: any) => ({
                        empId: m.employeeId || m.empId,
                        name: m.employeeName || m.name,
                    })) as EmployeeEntity[]);
                }
            } catch (err) {
                console.error("Failed to fetch team members", err);
            }
        };
        loadTeam();
    }, [isManager, user?.id, getTeamMembers]);

    // ═══════════════════════════════════════════════════════════
    // LOAD SUMMARY DATA when tab switches or date changes
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        if (activeTab !== "summary") return;

        const loadSummary = async () => {
            setSummaryLoading(true);
            setSummaryError(null);
            try {
                if (isAdmin || isCfo) {
                    const data = await attendanceService.getMonthlySummaryAll({
                        fromDate: dateRange.from,
                        toDate: dateRange.to,
                    });
                    setSummaryData(data || []);
                } else {
                    // Manager: fetch team member IDs first, then summary
                    const ids = teamMemberIds.length > 0
                        ? teamMemberIds
                        : employees.map((e: any) => e.empId || e.employeeId).filter(Boolean);

                    if (ids.length === 0) return;

                    const data = await attendanceService.getMonthlySummaryTeam({
                        empIds: ids,
                        fromDate: dateRange.from,
                        toDate: dateRange.to,
                    });
                    setSummaryData(data || []);
                }
            } catch (err) {
                console.error("Summary fetch failed", err);
                setSummaryError("Failed to load summary. Please try again.");
            } finally {
                setSummaryLoading(false);
            }
        };
        loadSummary();
    }, [activeTab, dateRange, isAdmin, isCfo, teamMemberIds, employees]);

    // ═══════════════════════════════════════════════════════════
    // DETAILED TAB HELPERS
    // ═══════════════════════════════════════════════════════════
    const parsePunchRecords = (records: string) => {
        if (!records) return [];
        return records.split(",").filter((r) => r.trim() !== "").map((record) => {
            const parts = record.split(":");
            const time = `${parts[0]}:${parts[1]}`;
            const type = parts[2]?.includes("in") ? "IN" : "OUT";
            return { time, type };
        });
    };

    const getFirstPunch = (records: string) => {
        const list = records?.split(",").filter((r) => r.trim() !== "");
        if (!list || list.length === 0) return "-";
        const parts = list[0].split(":");
        return `${parts[0]}:${parts[1]}`;
    };

    const getLastPunch = (records: string) => {
        const list = records?.split(",").filter((r) => r.trim() !== "");
        if (!list || list.length === 0) return "-";
        const parts = list[list.length - 1].split(":");
        return `${parts[0]}:${parts[1]}`;
    };

    const dataToDisplay = useMemo(() => {
        if (selectedEmployeeId) return attendanceReport || [];
        const map = new Map();
        if (isAdmin || isCfo) {
            employees.forEach((e) => {
                if (!map.has(e.empId)) {
                    map.set(e.empId, { employeeId: e.empId, employeeName: e.name, isListView: true });
                }
            });
        } else {
            (teamAttendanceReport || []).forEach((item) => {
                if (!map.has(item.employeeId)) map.set(item.employeeId, item);
            });
        }
        return Array.from(map.values());
    }, [selectedEmployeeId, attendanceReport, isAdmin, isCfo, employees, teamAttendanceReport]);

    const toggleEmployee = (empId: string) =>
        setSelectedIds((prev) =>
            prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
        );

    const toggleSelectAll = () => {
        if (selectedIds.length === employees.length) setSelectedIds([]);
        else setSelectedIds(employees.map((e) => e.empId));
    };

    useEffect(() => {
        if (!selectedEmployeeId) { setSelectedEmployeeName(""); return; }
        if (isAdmin || isCfo) {
            const emp = employees.find((e) => e.empId === selectedEmployeeId);
            if (emp) setSelectedEmployeeName(emp.name);
        } else {
            const emp = teamAttendanceReport?.find((e) => e.employeeId === selectedEmployeeId);
            if (emp) setSelectedEmployeeName(emp.employeeName);
        }
    }, [selectedEmployeeId, isAdmin, isCfo, employees, teamAttendanceReport]);

    const handleDetailedExport = async () => {
        try {
            if (selectedEmployeeId) {
                await downloadAttendanceExcel(selectedEmployeeId, { fromDate: dateRange.from, toDate: dateRange.to });
            } else if (isAdmin || isCfo) {
                const isSelectAll = selectedIds.length === employees.length || selectedIds.length === 0;
                if (isSelectAll) {
                    await downloadAllAttendanceReport({ fromDate: dateRange.from, toDate: dateRange.to });
                } else {
                    await downloadSelectedReport({ empIds: selectedIds, fromDate: dateRange.from, toDate: dateRange.to });
                }
            } else {
                await downloadSelectedReport({
                    empIds: selectedIds.length > 0 ? selectedIds : employees.map((e) => e.empId),
                    fromDate: dateRange.from,
                    toDate: dateRange.to,
                });
            }
        } catch (error) {
            console.error("Export failed", error);
        }
    };

    const handleSummaryExport = async () => {
        try {
            if (isAdmin || isCfo) {
                await attendanceService.downloadMonthlySummaryAll({
                    fromDate: dateRange.from,
                    toDate: dateRange.to,
                });
            } else {
                const ids = teamMemberIds.length > 0
                    ? teamMemberIds
                    : employees.map((e: any) => e.empId || e.employeeId).filter(Boolean);
                await attendanceService.downloadMonthlySummaryTeam({
                    empIds: ids,
                    fromDate: dateRange.from,
                    toDate: dateRange.to,
                });
            }
        } catch (error) {
            console.error("Summary export failed", error);
        }
    };

    const formatWorkingHours = (timeStr: string) => {
        if (!timeStr || timeStr === "00:00:00") return "-";
        const [h, m] = timeStr.split(":");
        return `${parseInt(h)}h ${parseInt(m)}m`;
    };

    useEffect(() => {
        const loadData = async () => {
            const params = { fromDate: dateRange.from, toDate: dateRange.to, page, size: SIZE };
            try {
                if (selectedEmployeeId) {
                    const response = await fetchEmployeeAttendanceReport(selectedEmployeeId, params);
                    if (response) setAttendanceTotalPages(response.totalPages);
                } else if (!isAdmin && !isCfo) {
                    const response = await fetchTeamAttendanceReport(user!.id, params);
                    if (response) setAttendanceTotalPages(response.totalPages);
                }
            } catch (error) {
                console.error("Fetch failed", error);
            }
        };
        if (activeTab === "detailed") loadData();
    }, [selectedEmployeeId, dateRange, isAdmin, isCfo, fetchTeamAttendanceReport, fetchEmployeeAttendanceReport, user?.id, page, activeTab]);

    useEffect(() => { setPage(0); }, [selectedEmployeeId]);

    const activeTotalPages = selectedEmployeeId ? attendanceTotalPages : listTotalPages;

    // ═══════════════════════════════════════════════════════════
    // SUMMARY STAT CARD
    // ═══════════════════════════════════════════════════════════
    const StatPill = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${color}`}>
            {value} <span className="font-normal opacity-75">{label}</span>
        </span>
    );

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Header ─────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {selectedEmployeeId && activeTab === "detailed" && (
                            <button
                                onClick={() => setSelectedEmployeeId(null)}
                                className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all text-slate-600"
                            >
                                <FaArrowLeft size={16} />
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {selectedEmployeeId && activeTab === "detailed"
                                    ? selectedEmployeeName
                                    : "Attendance Reports"}
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">
                                {selectedEmployeeId && activeTab === "detailed"
                                    ? "Individual Attendance History"
                                    : activeTab === "summary"
                                    ? "Monthly attendance summary for validation & payroll"
                                    : "Overview of team attendance logs"}
                            </p>
                        </div>
                    </div>

                    {activeTab !== "leave" && (
                    <button
                        onClick={activeTab === "summary" ? handleSummaryExport : handleDetailedExport}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-sm shadow-indigo-200 transition-all active:scale-95"
                    >
                        <FaFileExport size={14} />
                        {activeTab === "summary" ? "Download Summary" : "Export Report"}
                    </button>
                    )}
                </div>

                {/* ── Tabs ───────────────────────────────────── */}
                <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
                    <button
                        onClick={() => { setActiveTab("detailed"); setSelectedEmployeeId(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === "detailed"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                        <FaListAlt size={13} /> Detailed Logs
                    </button>
                    <button
                        onClick={() => setActiveTab("summary")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === "summary"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                        <FaChartBar size={13} /> Monthly Summary
                    </button>
                    <button
                        onClick={() => setActiveTab("leave")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === "leave"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                        <FaFileExcel size={13} /> Leave Export
                    </button>
                </div>

                {/* ── Date Filter ────────────────────────────── */}
                {activeTab !== "leave" && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From Date</label>
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                            className="border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To Date</label>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                            className="border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                        />
                    </div>

                    {activeTab === "summary" && summaryData.length > 0 && (
                        <div className="ml-auto flex items-center gap-3 text-sm text-slate-500 font-medium">
                            <span className="bg-slate-100 px-3 py-1.5 rounded-lg">
                                {summaryData.length} employees
                            </span>
                        </div>
                    )}
                </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: DETAILED LOGS (existing logic preserved)
                ══════════════════════════════════════════════ */}
                {activeTab === "detailed" && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50">
                                    <tr className="border-b border-slate-200">
                                        {!selectedEmployeeId && (
                                            <th className="px-6 py-4 w-10">
                                                <input
                                                    type="checkbox"
                                                    onChange={toggleSelectAll}
                                                    checked={selectedIds.length > 0 && selectedIds.length === employees.length}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </th>
                                        )}
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee Name</th>
                                        {selectedEmployeeId && (
                                            <>
                                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Check In</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Check Out</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Work Hours</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Timeline</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {dataToDisplay?.map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                            {!selectedEmployeeId && (
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(row.employeeId)}
                                                        onChange={() => toggleEmployee(row.employeeId)}
                                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                </td>
                                            )}
                                            <td
                                                className={`px-6 py-4 text-sm font-medium ${!selectedEmployeeId ? "cursor-pointer group" : "text-slate-800"}`}
                                                onClick={() => !selectedEmployeeId && setSelectedEmployeeId(row.employeeId)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs ring-1 ring-indigo-100">
                                                        {(row.employeeName || selectedEmployeeName).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className={`text-slate-700 ${!selectedEmployeeId ? "group-hover:text-indigo-600 transition-colors" : ""}`}>
                                                        {row.employeeName || selectedEmployeeName}
                                                    </span>
                                                </div>
                                            </td>
                                            {selectedEmployeeId && (
                                                <>
                                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.date}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-emerald-600 font-mono">{getFirstPunch(row.punchRecords)}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-rose-600 font-mono">{getLastPunch(row.punchRecords)}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{formatWorkingHours(row.workingHours)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${row.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => setActivePunches(parsePunchRecords(row.punchRecords))}
                                                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide px-3 py-1 bg-indigo-50 rounded-md transition-all"
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {dataToDisplay.length > 0 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Page {page + 1} of {activeTotalPages || 1}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={page === 0}
                                            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                                            className="px-3 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            disabled={page >= activeTotalPages - 1}
                                            onClick={() => setPage((prev) => prev + 1)}
                                            className="px-3 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: MONTHLY SUMMARY
                ══════════════════════════════════════════════ */}
                {activeTab === "summary" && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

                        {/* Loading */}
                        {summaryLoading && (
                            <div className="flex items-center justify-center py-20 text-slate-400">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                                    <span className="text-sm font-medium">Loading summary...</span>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {summaryError && !summaryLoading && (
                            <div className="flex items-center justify-center py-16 text-rose-500 text-sm font-medium">
                                {summaryError}
                            </div>
                        )}

                        {/* Table */}
                        {!summaryLoading && !summaryError && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-slate-50/70">
                                        <tr className="border-b border-slate-200">
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Emp ID</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Employee</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Work Days</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider text-center whitespace-nowrap">Present</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-rose-500 uppercase tracking-wider text-center whitespace-nowrap">Absent</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-amber-500 uppercase tracking-wider text-center whitespace-nowrap">Half Day</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-blue-500 uppercase tracking-wider text-center whitespace-nowrap">WFH</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-violet-500 uppercase tracking-wider text-center whitespace-nowrap">Leave</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-orange-500 uppercase tracking-wider text-center whitespace-nowrap">LOP</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">Weekend</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">Holiday</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Total Hrs</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Avg Hrs/Day</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-emerald-500 uppercase tracking-wider text-center whitespace-nowrap">Earliest In</th>
                                            <th className="px-4 py-3.5 text-[11px] font-bold text-rose-400 uppercase tracking-wider text-center whitespace-nowrap">Latest Out</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {summaryData.length === 0 ? (
                                            <tr>
                                                <td colSpan={15} className="px-6 py-16 text-center text-slate-400 text-sm">
                                                    No attendance data found for the selected date range.
                                                </td>
                                            </tr>
                                        ) : (
                                            summaryData.map((row, i) => (
                                                <tr key={row.employeeId} className={`hover:bg-indigo-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                                                    <td className="px-4 py-3 text-xs font-mono text-slate-500 font-bold">{row.employeeId}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs ring-1 ring-indigo-100 shrink-0">
                                                                {row.employeeName?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-semibold text-slate-800 whitespace-nowrap">{row.employeeName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-slate-700">{row.totalWorkingDays}</td>

                                                    {/* Present */}
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-block w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold text-sm leading-8 text-center ring-1 ring-emerald-100">
                                                            {row.presentDays}
                                                        </span>
                                                    </td>

                                                    {/* Absent */}
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-block w-8 h-8 rounded-full font-bold text-sm leading-8 text-center ring-1 ${row.absentDays > 0 ? "bg-rose-50 text-rose-700 ring-rose-100" : "bg-slate-50 text-slate-400 ring-slate-100"}`}>
                                                            {row.absentDays}
                                                        </span>
                                                    </td>

                                                    {/* Half Day */}
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-block w-8 h-8 rounded-full font-bold text-sm leading-8 text-center ring-1 ${row.halfDays > 0 ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-slate-50 text-slate-400 ring-slate-100"}`}>
                                                            {row.halfDays}
                                                        </span>
                                                    </td>

                                                    {/* WFH */}
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-block w-8 h-8 rounded-full font-bold text-sm leading-8 text-center ring-1 ${row.wfhDays > 0 ? "bg-blue-50 text-blue-700 ring-blue-100" : "bg-slate-50 text-slate-400 ring-slate-100"}`}>
                                                            {row.wfhDays}
                                                        </span>
                                                    </td>

                                                    {/* Leave */}
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-block w-8 h-8 rounded-full font-bold text-sm leading-8 text-center ring-1 ${row.leaveDays > 0 ? "bg-violet-50 text-violet-700 ring-violet-100" : "bg-slate-50 text-slate-400 ring-slate-100"}`}>
                                                            {row.leaveDays}
                                                        </span>
                                                    </td>

                                                    {/* LOP */}
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-block w-8 h-8 rounded-full font-bold text-sm leading-8 text-center ring-1 ${row.lopDays > 0 ? "bg-orange-50 text-orange-700 ring-orange-100" : "bg-slate-50 text-slate-400 ring-slate-100"}`}>
                                                            {row.lopDays}
                                                        </span>
                                                    </td>

                                                    {/* Weekend */}
                                                    <td className="px-4 py-3 text-center text-slate-400 font-medium">{row.weekendCount}</td>

                                                    {/* Holiday */}
                                                    <td className="px-4 py-3 text-center text-slate-400 font-medium">{row.holidayCount}</td>

                                                    {/* Total Hours */}
                                                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 text-xs">{row.totalWorkingHours}</td>

                                                    {/* Avg Hours */}
                                                    <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600 text-xs">{row.avgWorkingHours}</td>

                                                    {/* Earliest In */}
                                                    <td className="px-4 py-3 text-center font-mono text-emerald-600 font-bold text-xs">{row.earliestCheckIn}</td>

                                                    {/* Latest Out */}
                                                    <td className="px-4 py-3 text-center font-mono text-rose-500 font-bold text-xs">{row.latestCheckOut}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Summary Footer */}
                                {summaryData.length > 0 && (
                                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-medium">
                                            Showing {summaryData.length} employees · {dateRange.from} to {dateRange.to}
                                        </span>
                                        <div className="flex gap-3">
                                            <StatPill label="Total Present" value={summaryData.reduce((a, r) => a + r.presentDays, 0)} color="bg-emerald-50 text-emerald-700" />
                                            <StatPill label="Total Absent" value={summaryData.reduce((a, r) => a + r.absentDays, 0)} color="bg-rose-50 text-rose-700" />
                                            <StatPill label="Total LOP" value={summaryData.reduce((a, r) => a + r.lopDays, 0)} color="bg-orange-50 text-orange-700" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

                {/* ══════════════════════════════════════════════
                    TAB: LEAVE EXPORT
                ══════════════════════════════════════════════ */}
                {activeTab === "leave" && (
                    <LeaveExportPage />
                )}

            {/* ── Punch Drawer ──────────────────────────────── */}
            {activePunches && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setActivePunches(null)} />
                    <div className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h3 className="font-bold text-slate-800 text-base">Punch Timeline</h3>
                            <button onClick={() => setActivePunches(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="space-y-3">
                                {activePunches.map((p, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border ${p.type === "IN" ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"}`}>
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${p.type === "IN" ? "text-emerald-700" : "text-rose-700"}`}>{p.type}</span>
                                            <span className="font-mono font-bold text-slate-800 text-sm mt-0.5">{p.time}</span>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${p.type === "IN" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceReports;
