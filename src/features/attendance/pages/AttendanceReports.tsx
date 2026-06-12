import { useCalendar } from "@/features/attendance/hooks/useCalendar";
import { useEmployee } from "@/features/employee/hooks/useEmployee";
import type { EmployeeEntity } from "@/features/employee/types";
import type { AttendanceDetailedRow } from "@/features/attendance/types";
import { useAuth } from "@/shared/auth/useAuth";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    FaArrowLeft,
    FaFileExport,
    FaListAlt,
    FaFileExcel
} from "react-icons/fa";
import LeaveExportPage from "@/features/leave/pages/LeaveExportPage";
import { attendanceService } from "@/features/attendance/services/attendanceService";

type ActiveTab = "detailed" | "leave";

// Status badge
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const u = (status || "").toUpperCase();
    let cls = "bg-slate-100 text-slate-600";
    if (u === "APPROVED" || u === "PRESENT")       cls = "bg-emerald-50 text-emerald-700";
    else if (u === "ABSENT")                         cls = "bg-rose-50 text-rose-700";
    else if (u.includes("LEVEL 1"))                  cls = "bg-amber-50 text-amber-700";
    else if (u === "LEVEL 2 PENDING")                cls = "bg-orange-50 text-orange-700";
    else if (u === "LEVEL 2 REJECTED")               cls = "bg-red-100 text-red-800";
    else if (u === "REJECTED")                       cls = "bg-red-50 text-red-700";
    else if (u === "LEAVE")                          cls = "bg-violet-50 text-violet-700";
    else if (u === "WFH")                            cls = "bg-blue-50 text-blue-700";
    else if (u === "LOP")                            cls = "bg-pink-50 text-pink-700";
    else if (u === "WEEKEND" || u === "HOLIDAY")     cls = "bg-slate-100 text-slate-500";
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cls}`}>
            {status || "—"}
        </span>
    );
};

const AttendanceReports: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const isCfo   = user?.role === "CFO";
    const isManager = !isAdmin && !isCfo;

    const [activeTab, setActiveTab] = useState<ActiveTab>("detailed");
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().split("T")[0].substring(0, 8) + "01",
        to:   new Date().toISOString().split("T")[0],
    });

    const {
        fetchTeamAttendanceReport,
        downloadSelectedReport,
        teamAttendanceReport,
        downloadAttendanceExcel,
        downloadAllAttendanceReport,
    } = useCalendar();

    const { getEmployees, getTeamMembers } = useEmployee();
    const [employees,            setEmployees]            = useState<EmployeeEntity[]>([]);
    const [selectedEmployeeId,   setSelectedEmployeeId]   = useState<string | null>(null);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");
    const [activePunches,        setActivePunches]        = useState<{ time: string; type: string }[] | null>(null);
    const [selectedIds,          setSelectedIds]          = useState<string[]>([]);
    const [page,                 setPage]                 = useState(0);
    const [listTotalPages,       setListTotalPages]       = useState(0);
    const SIZE = 10;

    // Employee name filter
    const [empNameFilter, setEmpNameFilter] = useState("");

    // Detailed rows state
    const [detailedRows,       setDetailedRows]       = useState<AttendanceDetailedRow[]>([]);
    const [detailedTotalPages, setDetailedTotalPages] = useState(0);
    const [detailedLoading,    setDetailedLoading]    = useState(false);

    // ── Load employees (Admin / CFO) ──────────────────────────────
    useEffect(() => {
        if (!isAdmin && !isCfo) return;
        const load = async () => {
            try {
                const result = await getEmployees({ page: 0, size: 200 });
                if (result?.content) {
                    setEmployees(result.content);
                    setListTotalPages(result.totalPages || 0);
                }
            } catch (err) { console.error("Failed to fetch employees", err); }
        };
        load();
    }, [isAdmin, isCfo, getEmployees]);

    // ── Load team members (Manager) ───────────────────────────────
    useEffect(() => {
        if (!isManager || !user?.id) return;
        const loadTeam = async () => {
            try {
                const members = await getTeamMembers(user.id);
                if (members) {
                    setEmployees(members.map((m: any) => ({
                        empId: m.employeeId || m.empId,
                        name:  m.employeeName || m.name,
                    })) as EmployeeEntity[]);
                }
            } catch (err) { console.error("Failed to fetch team members", err); }
        };
        loadTeam();
    }, [isManager, user?.id, getTeamMembers]);

    // ── Fetch detailed rows when employee selected ────────────────
    const fetchDetailed = useCallback(async () => {
        if (!selectedEmployeeId) return;
        setDetailedLoading(true);
        try {
            const data = await attendanceService.getDetailedAttendance(selectedEmployeeId, {
                fromDate: dateRange.from,
                toDate:   dateRange.to,
                page,
                size: SIZE,
            });
            setDetailedRows(data.content || []);
            setDetailedTotalPages(data.totalPages || 0);
        } catch (err) {
            console.error("Detailed fetch failed", err);
        } finally {
            setDetailedLoading(false);
        }
    }, [selectedEmployeeId, dateRange, page]);

    useEffect(() => {
        if (activeTab === "detailed" && selectedEmployeeId) fetchDetailed();
    }, [activeTab, selectedEmployeeId, dateRange, page, fetchDetailed]);

    // ── Load team attendance for manager list view ────────────────
    useEffect(() => {
        if (!selectedEmployeeId && isManager && user?.id && activeTab === "detailed") {
            fetchTeamAttendanceReport(user.id, {
                fromDate: dateRange.from,
                toDate:   dateRange.to,
                page,
                size: SIZE,
            });
        }
    }, [selectedEmployeeId, isManager, user?.id, activeTab, dateRange, page, fetchTeamAttendanceReport]);

    useEffect(() => { setPage(0); }, [selectedEmployeeId]);

    // ── Resolve selected employee name ────────────────────────────
    useEffect(() => {
        if (!selectedEmployeeId) { setSelectedEmployeeName(""); return; }
        const emp = employees.find((e) => e.empId === selectedEmployeeId);
        if (emp) setSelectedEmployeeName(emp.name);
    }, [selectedEmployeeId, employees]);

    // ── Helpers ───────────────────────────────────────────────────
    const parsePunchRecords = (records: string) => {
        if (!records) return [];
        return records.split(",").filter((r) => r.trim() !== "").map((record) => {
            const parts = record.split(":");
            const time  = `${parts[0]}:${parts[1]}`;
            const type  = parts[2]?.includes("in") ? "IN" : "OUT";
            return { time, type };
        });
    };

    // For CF/GL/SL/WFH/LOP: show as integer if whole number, show 0.5 if half day
    const fmtDays = (val: number | null | undefined) => {
        if (val == null || val === 0) return "—";
        return val % 1 === 0 ? String(Math.round(val)) : val.toFixed(1);
    };

    // Employee name filter applied to list
    const filteredEmployees = useMemo(() => {
        const base = (isAdmin || isCfo)
            ? employees
            : (teamAttendanceReport || []).map((r: any) => ({
                empId: r.employeeId,
                name:  r.employeeName,
            })) as EmployeeEntity[];

        if (!empNameFilter.trim()) return base;
        return base.filter((e) =>
            e.name.toLowerCase().includes(empNameFilter.trim().toLowerCase())
        );
    }, [employees, teamAttendanceReport, isAdmin, isCfo, empNameFilter]);

    const toggleEmployee  = (empId: string) =>
        setSelectedIds((prev) =>
            prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]);

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredEmployees.length) setSelectedIds([]);
        else setSelectedIds(filteredEmployees.map((e) => e.empId));
    };

    const handleDetailedExport = async () => {
        try {
            if (selectedEmployeeId) {
                // Individual employee detail view — use existing single-employee export
                await attendanceService.downloadDetailedAttendance(selectedEmployeeId, { fromDate: dateRange.from, toDate: dateRange.to });
            } else {
                // List view — use new bulk detailed export (new 15-column format)
                // If specific employees are checked use those, otherwise export all
                const ids = selectedIds.length > 0
                    ? selectedIds
                    : employees.map((e) => e.empId);
                await attendanceService.downloadBulkDetailedAttendance({
                    empIds:   ids,
                    fromDate: dateRange.from,
                    toDate:   dateRange.to,
                });
            }
        } catch (error) { console.error("Export failed", error); }
    };

    const activeTotalPages = selectedEmployeeId ? detailedTotalPages : listTotalPages;

    // ═══════════════════════════════════════════════════════════
    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {selectedEmployeeId && activeTab === "detailed" && (
                            <button
                                onClick={() => { setSelectedEmployeeId(null); setDetailedRows([]); }}
                                className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all text-slate-600"
                            >
                                <FaArrowLeft size={16} />
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {selectedEmployeeId && activeTab === "detailed" ? selectedEmployeeName : "Attendance Reports"}
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">
                                {selectedEmployeeId && activeTab === "detailed" ? "Individual Attendance History" : "Overview of team attendance logs"}
                            </p>
                        </div>
                    </div>
                    {activeTab !== "leave" && (
                        <button
                            onClick={handleDetailedExport}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-sm shadow-indigo-200 transition-all active:scale-95"
                        >
                            <FaFileExport size={14} /> Export Report
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
                    <button
                        onClick={() => { setActiveTab("detailed"); setSelectedEmployeeId(null); setDetailedRows([]); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "detailed" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                    >
                        <FaListAlt size={13} /> Detailed Logs
                    </button>
                    <button
                        onClick={() => setActiveTab("leave")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "leave" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                    >
                        <FaFileExcel size={13} /> Leave Export
                    </button>
                </div>

                {/* Date filter + Employee name filter */}
                {activeTab !== "leave" && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From Date</label>
                            <input
                                type="date" value={dateRange.from}
                                onChange={(e) => { setDateRange((p) => ({ ...p, from: e.target.value })); setPage(0); }}
                                className="border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To Date</label>
                            <input
                                type="date" value={dateRange.to}
                                onChange={(e) => { setDateRange((p) => ({ ...p, to: e.target.value })); setPage(0); }}
                                className="border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                            />
                        </div>

                        {/* Employee name filter — only on list view (no employee selected) */}
                        {activeTab === "detailed" && !selectedEmployeeId && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee Name</label>
                                <input
                                    type="text"
                                    placeholder="Search employee..."
                                    value={empNameFilter}
                                    onChange={(e) => setEmpNameFilter(e.target.value)}
                                    className="border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none w-52"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Detailed Logs Tab */}
                {activeTab === "detailed" && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">

                            {/* LIST VIEW — employee not yet selected */}
                            {!selectedEmployeeId && (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50">
                                        <tr className="border-b border-slate-200">
                                            {(isAdmin || isCfo) && (
                                                <th className="px-6 py-4 w-10">
                                                    <input
                                                        type="checkbox"
                                                        onChange={toggleSelectAll}
                                                        checked={selectedIds.length > 0 && selectedIds.length === filteredEmployees.length}
                                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                </th>
                                            )}
                                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee Name</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredEmployees.map((row, i) => (
                                            <tr
                                                key={i}
                                                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                                onClick={() => { setSelectedEmployeeId(row.empId); setPage(0); }}
                                            >
                                                {(isAdmin || isCfo) && (
                                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(row.empId)}
                                                            onChange={() => toggleEmployee(row.empId)}
                                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs ring-1 ring-indigo-100">
                                                            {(row.name || "").charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                            {row.name}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredEmployees.length === 0 && (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-16 text-center text-slate-400 text-sm">
                                                    No employees found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {/* DETAIL VIEW — 13-column table after employee selected */}
                            {selectedEmployeeId && (
                                <>
                                    {detailedLoading ? (
                                        <div className="flex items-center justify-center py-20 text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                                                <span className="text-sm font-medium">Loading attendance...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead className="bg-slate-50/50">
                                                <tr className="border-b border-slate-200">
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Emp ID</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Emp Name</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider whitespace-nowrap">Check In</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-rose-500 uppercase tracking-wider whitespace-nowrap">Check Out</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Work Hours</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-indigo-500 uppercase tracking-wider whitespace-nowrap text-center">CF Leave (Days)</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-violet-500 uppercase tracking-wider whitespace-nowrap text-center">GL (Days)</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-pink-500 uppercase tracking-wider whitespace-nowrap text-center">SL (Days)</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap text-center">WFH (Days)</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-cyan-500 uppercase tracking-wider whitespace-nowrap text-center">Permission (Hrs)</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-orange-500 uppercase tracking-wider whitespace-nowrap text-center">LOP (Days)</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Attendance Status</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Application Status</th>
                                                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Timeline</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {detailedRows.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={15} className="px-6 py-16 text-center text-slate-400 text-sm">
                                                            No attendance records found for the selected date range.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    detailedRows.map((row, i) => (
                                                        <tr key={i} className={`hover:bg-indigo-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                                                            {/* Emp ID */}
                                                            <td className="px-4 py-3 text-xs font-mono font-bold text-slate-500 whitespace-nowrap">
                                                                {row.empId}
                                                            </td>
                                                            {/* Emp Name */}
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs ring-1 ring-indigo-100 shrink-0">
                                                                        {(row.empName || "").charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="font-semibold text-slate-800">{row.empName}</span>
                                                                </div>
                                                            </td>
                                                            {/* Date */}
                                                            <td className="px-4 py-3 text-sm text-slate-600 font-medium whitespace-nowrap">{row.date}</td>
                                                            {/* Check In */}
                                                            <td className="px-4 py-3 font-bold text-emerald-600 font-mono whitespace-nowrap">
                                                                {row.checkIn || "—"}
                                                            </td>
                                                            {/* Check Out */}
                                                            <td className="px-4 py-3 font-bold text-rose-600 font-mono whitespace-nowrap">
                                                                {row.checkOut || "—"}
                                                            </td>
                                                            {/* Work Hours */}
                                                            <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
                                                                {row.workHours || "—"}
                                                            </td>
                                                            {/* CF Leave */}
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-xs font-bold ${row.cfLeaveDays ? "text-indigo-600" : "text-slate-300"}`}>
                                                                    {fmtDays(row.cfLeaveDays)}
                                                                </span>
                                                            </td>
                                                            {/* GL */}
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-xs font-bold ${row.glDays ? "text-violet-600" : "text-slate-300"}`}>
                                                                    {fmtDays(row.glDays)}
                                                                </span>
                                                            </td>
                                                            {/* SL */}
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-xs font-bold ${row.slDays ? "text-pink-600" : "text-slate-300"}`}>
                                                                    {fmtDays(row.slDays)}
                                                                </span>
                                                            </td>
                                                            {/* WFH */}
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-xs font-bold ${row.wfhDays ? "text-blue-600" : "text-slate-300"}`}>
                                                                    {fmtDays(row.wfhDays)}
                                                                </span>
                                                            </td>
                                                            {/* Permission Hours */}
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-xs font-bold ${row.permissionHours ? "text-cyan-600" : "text-slate-300"}`}>
                                                                    {row.permissionHours || "—"}
                                                                </span>
                                                            </td>
                                                            {/* LOP */}
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-xs font-bold ${row.lopDays ? "text-orange-600" : "text-slate-300"}`}>
                                                                    {fmtDays(row.lopDays)}
                                                                </span>
                                                            </td>
                                                            {/* Attendance Status */}
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <StatusBadge status={row.attendanceStatus} />
                                                            </td>
                                                            {/* Application Status */}
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                {row.approvalStatus
                                                                    ? <StatusBadge status={row.approvalStatus} />
                                                                    : <span className="text-slate-300 text-xs">—</span>
                                                                }
                                                            </td>
                                                            {/* Timeline */}
                                                            <td className="px-4 py-3">
                                                                <button
                                                                    onClick={() => setActivePunches(parsePunchRecords(row.punchRecords || ""))}
                                                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide px-3 py-1 bg-indigo-50 rounded-md transition-all"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Page {page + 1} of {activeTotalPages || 1}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                                    className="px-3 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={page >= (activeTotalPages || 1) - 1}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-3 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leave Export Tab */}
                {activeTab === "leave" && <LeaveExportPage />}

            </div>

            {/* Punch Timeline Drawer */}
            {activePunches && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setActivePunches(null)} />
                    <div className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col border-l border-slate-200">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-base">Punch Timeline</h3>
                            <button onClick={() => setActivePunches(null)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            {activePunches.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-10">No punch records available.</p>
                            ) : (
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
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceReports;
