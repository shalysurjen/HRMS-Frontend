import { useEmployee } from "@/features/employee/hooks/useEmployee";
import { leaveService } from "@/features/leave/services/leaveService";
import { useAuth } from "@/shared/auth/useAuth";
import React, { useEffect, useState } from "react";
import { FaFileExcel, FaSearch, FaFilter } from "react-icons/fa";
import { HiOutlineDocumentReport } from "react-icons/hi";

// ── Types ─────────────────────────────────────────────────────────
interface LeaveExportRow {
    applicationCreatedDate: string;
    employeeId: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    startOfTheDay: string;
    noOfDays: string;
    leaveYear: string;
    firstApprover: string;
    firstApprovalDate: string;
    firstApprovalDecision: string;
    secondApprover: string;
    secondApprovalDate: string;
    secondApprovalDecision: string;
}

// ── Helpers ───────────────────────────────────────────────────────
const decisionBadge = (decision: string) => {
    if (!decision || decision === "NULL") return <span className="text-slate-400 text-xs">—</span>;
    const color =
        decision === "APPROVED" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
        decision === "REJECTED" ? "bg-rose-50 text-rose-700 ring-rose-200" :
        "bg-amber-50 text-amber-700 ring-amber-200";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ring-1 ${color}`}>
            {decision}
        </span>
    );
};

const nullDisplay = (val: string) =>
    !val || val === "NULL" ? <span className="text-slate-300 text-xs">NULL</span> : val;

const leaveTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
        ANNUAL:    "bg-blue-50 text-blue-700",
        SICK:      "bg-rose-50 text-rose-700",
        WFH:       "bg-violet-50 text-violet-700",
        MATERNITY: "bg-pink-50 text-pink-700",
        PATERNITY: "bg-indigo-50 text-indigo-700",
        COMP_OFF:  "bg-amber-50 text-amber-700",
        ON_DUTY:   "bg-teal-50 text-teal-700",
    };
    const cls = colors[type] || "bg-slate-50 text-slate-600";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${cls}`}>
            {type}
        </span>
    );
};

// ── Component ─────────────────────────────────────────────────────
const LeaveExportPage: React.FC = () => {
    const { user } = useAuth();
    const { getTeamMembers } = useEmployee();

    const role = user?.role?.toUpperCase() ?? "";

    // Admin & HR → see ALL employees
    const isAdminOrHr = role === "ADMIN" || role === "HR";
    // CFO → see all (payroll access)
    const isCfo = role === "CFO";
    // Manager, Team Leader, CTO, COO → see their team only
    const isManager = !isAdminOrHr && !isCfo;

    // legacy aliases used below
    const isAdmin = isAdminOrHr;

    // ── State ────────────────────────────────────────────────────
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    const [fromDate, setFromDate] = useState(firstOfMonth);
    const [toDate, setToDate]     = useState(todayStr);
    const [rows, setRows]         = useState<LeaveExportRow[]>([]);
    const [loading, setLoading]   = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [teamIds, setTeamIds]   = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [leaveTypeFilter, setLeaveTypeFilter] = useState("ALL");
    const [fetched, setFetched]   = useState(false);

    // ── Load team IDs for managers ───────────────────────────────
    useEffect(() => {
        if (!isManager || !user?.id) return;
        getTeamMembers(String(user.id)).then((members) => {
            if (members && members.length > 0) {
                // TeamMember type has employeeId field
                const ids = members
                    .map((m: any) => m.employeeId ?? m.empId ?? m.id)
                    .filter(Boolean) as string[];
                setTeamIds(ids);
            }
        }).catch(console.error);
    }, [isManager, user?.id]);

    // ── Fetch preview data ───────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            let data: LeaveExportRow[];
            if (isAdmin || isCfo) {
                // ADMIN / HR / CFO → all employees
                data = await leaveService.getLeaveExportAll({ fromDate, toDate });
            } else {
                // MANAGER / TEAM_LEADER / CTO / COO → team only
                if (teamIds.length === 0) {
                    setRows([]);
                    setFetched(true);
                    setError("No team members found. Ensure your team is configured.");
                    return;
                }
                data = await leaveService.getLeaveExportForTeam({ empIds: teamIds, fromDate, toDate });
            }
            setRows(data || []);
            setFetched(true);
        } catch (err) {
            console.error(err);
            setError("Failed to load leave data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Download Excel ───────────────────────────────────────────
    const handleDownload = async () => {
        setDownloading(true);
        try {
            if (isAdmin || isCfo) {
                // ADMIN / HR / CFO → download all employees
                await leaveService.downloadLeaveExportAll({ fromDate, toDate });
            } else {
                // MANAGER / TEAM_LEADER / CTO / COO → download team only
                await leaveService.downloadLeaveExportTeam({ empIds: teamIds, fromDate, toDate });
            }
        } catch (err) {
            console.error(err);
            setError("Download failed. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    // ── Filtered rows ────────────────────────────────────────────
    const filtered = rows.filter((r) => {
        const matchSearch = !searchQuery ||
            r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchType = leaveTypeFilter === "ALL" || r.leaveType === leaveTypeFilter;
        return matchSearch && matchType;
    });

    const leaveTypes = ["ALL", ...Array.from(new Set(rows.map((r) => r.leaveType).filter(Boolean)))];

    // ── Render ───────────────────────────────────────────────────
    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-[1400px] mx-auto space-y-5">

                {/* ── Header ─────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
                            <HiOutlineDocumentReport className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Leave Export
                            </h1>
                            <p className="text-sm text-slate-500">
                                {isAdmin || isCfo
                                    ? "All employees · Monthly leave report"
                                    : `Your team (${teamIds.length} members) · Leave report`}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleDownload}
                        disabled={downloading || rows.length === 0}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {downloading ? (
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FaFileExcel size={14} />
                        )}
                        {downloading ? "Downloading..." : "Download Excel"}
                    </button>
                </div>

                {/* ── Filters ─────────────────────────────── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex flex-wrap items-end gap-4">

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                            />
                        </div>

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all active:scale-95 disabled:opacity-60"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <FaSearch size={13} />
                            )}
                            {loading ? "Loading..." : "Fetch Data"}
                        </button>

                        {/* Search + Type filter — show only after data loaded */}
                        {fetched && rows.length > 0 && (
                            <>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 ml-auto">
                                    <FaSearch size={12} className="text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search employee..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-transparent text-sm text-slate-700 outline-none w-44 placeholder-slate-400"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <FaFilter size={12} className="text-slate-400" />
                                    <select
                                        value={leaveTypeFilter}
                                        onChange={(e) => setLeaveTypeFilter(e.target.value)}
                                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
                                    >
                                        {leaveTypes.map((t) => (
                                            <option key={t} value={t}>{t === "ALL" ? "All Leave Types" : t}</option>
                                        ))}
                                    </select>
                                </div>

                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
                                    {filtered.length} records
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Error ───────────────────────────────── */}
                {error && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl px-5 py-3 text-sm text-rose-700 font-medium">
                        {error}
                    </div>
                )}

                {/* ── Empty / Not fetched ──────────────────── */}
                {!fetched && !loading && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                            <FaFileExcel size={24} className="text-indigo-400" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Select a date range and click Fetch Data</p>
                        <p className="text-slate-400 text-xs">Leave applications will appear here for preview before download</p>
                    </div>
                )}

                {/* ── Loading ──────────────────────────────── */}
                {loading && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                            <span className="text-sm text-slate-500 font-medium">Fetching leave data...</span>
                        </div>
                    </div>
                )}

                {/* ── Table — image exact columns ──────────── */}
                {fetched && !loading && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-teal-700">
                                        {[
                                            "Application\nCreated Date",
                                            "Employee ID",
                                            "Employee Name",
                                            "Leave Type",
                                            "Start Date",
                                            "End Date",
                                            "Start of\nthe Day",
                                            "No.Of Days",
                                            "Leave Year",
                                            "First Approver",
                                            "First Approval\nDate",
                                            "First Approval\nDecision",
                                            "Second Approver",
                                            "Second Approval\nDate",
                                            "Second Approval\nDecision",
                                        ].map((col, i) => (
                                            <th
                                                key={i}
                                                className="px-3 py-3 text-[10px] font-bold text-white uppercase tracking-wider whitespace-pre-line text-center border-r border-teal-600 last:border-r-0"
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={15} className="px-6 py-16 text-center text-slate-400 text-sm">
                                                No leave records found for the selected period.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((row, i) => (
                                            <tr
                                                key={i}
                                                className={`hover:bg-indigo-50/30 transition-colors text-center ${
                                                    i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                                                }`}
                                            >
                                                <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{row.applicationCreatedDate}</td>
                                                <td className="px-3 py-2.5 text-xs font-mono font-bold text-slate-700 whitespace-nowrap">{row.employeeId}</td>
                                                <td className="px-3 py-2.5 text-xs font-semibold text-slate-800 text-left whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px] ring-1 ring-indigo-100 shrink-0">
                                                            {row.employeeName?.charAt(0).toUpperCase()}
                                                        </div>
                                                        {row.employeeName}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">{leaveTypeBadge(row.leaveType)}</td>
                                                <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{row.startDate}</td>
                                                <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{row.endDate}</td>
                                                <td className="px-3 py-2.5 text-xs text-slate-500">{nullDisplay(row.startOfTheDay)}</td>
                                                <td className="px-3 py-2.5 text-xs font-bold text-slate-700">{row.noOfDays}</td>
                                                <td className="px-3 py-2.5 text-xs text-slate-600">{row.leaveYear}</td>
                                                <td className="px-3 py-2.5 text-xs font-mono text-slate-600 whitespace-nowrap">{nullDisplay(row.firstApprover)}</td>
                                                <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{nullDisplay(row.firstApprovalDate)}</td>
                                                <td className="px-3 py-2.5">{decisionBadge(row.firstApprovalDecision)}</td>
                                                <td className="px-3 py-2.5 text-xs font-mono text-slate-600 whitespace-nowrap">{nullDisplay(row.secondApprover)}</td>
                                                <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{nullDisplay(row.secondApprovalDate)}</td>
                                                <td className="px-3 py-2.5">{decisionBadge(row.secondApprovalDecision)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer summary */}
                        {filtered.length > 0 && (
                            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">
                                    {fromDate} — {toDate} · {filtered.length} applications
                                </span>
                                <div className="flex gap-2">
                                    {["ANNUAL","SICK","WFH","COMP_OFF"].map((type) => {
                                        const count = filtered.filter(r => r.leaveType === type).length;
                                        if (!count) return null;
                                        return (
                                            <span key={type} className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md">
                                                {type}: {count}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveExportPage;