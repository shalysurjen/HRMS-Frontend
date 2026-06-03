import { useEffect, useState } from "react";
import { useAuth } from "@/shared/auth/useAuth";
import { useAppraisal } from "@/features/appraisal/hooks/useAppraisal";
import type { AppraisalSummary } from "@/features/appraisal/types/appraisal";
import { StatusBadge } from "@/features/appraisal/components/StatusBadge";
import AppraisalReviewPage from "./AppraisalReviewPage";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineDocumentText,
  HiOutlineFunnel,
} from "react-icons/hi2";
import { appraisalService } from "@/features/appraisal/services/appraisalService";

/**
 * AppraisalDashboardPage
 *
 * Who sees what:
 *  - ADMIN / HR          → ALL appraisals, all statuses + Excel & PDF export buttons
 *  - COO / CEO           → Only L1_APPROVED / FINAL_REVIEW / PUBLISHED (L2 queue), can publish + export
 *  - CFO                 → ALL appraisals, VIEW_ONLY
 *  - MANAGER / CTO etc.  → Only their pending queue (L1 + L2 combined)
 *
 * Filters:
 *   - Cycle filter   : Admin / HR / COO / CFO
 *   - Status filter  : All / Pending / Published  (for view-all roles)
 */

// Statuses considered "pending" for status filter tabs
const PENDING_STATUSES   = ["DRAFT", "SUBMITTED", "L1_APPROVED", "L1_REJECTED", "L2_REJECTED", "FINAL_REVIEW"];
const PUBLISHED_STATUSES = ["PUBLISHED", "CLOSED"];

// COO / CEO: only see records that have passed L1 (or are published/closed)
// SUBMITTED and L1_REJECTED must NEVER appear in L2's queue
const COO_VISIBLE_STATUSES = new Set(["L1_APPROVED", "FINAL_REVIEW", "PUBLISHED", "CLOSED"]);

type StatusFilter = "ALL" | "PENDING" | "PUBLISHED";

const AppraisalDashboardPage = () => {
  const { user } = useAuth();
  const { summaries, cycles, loading, loadPendingApprover, loadAll, loadCycles } = useAppraisal();
  const [selected, setSelected] = useState<AppraisalSummary | null>(null);
  const [filterCycleId, setFilterCycleId] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [exporting, setExporting] = useState(false);

  const role = user?.role?.toUpperCase();
  const isAdmin   = role === "ADMIN" || role === "HR";
  const isCOO     = role === "COO" || role === "CEO";
  const isCFO     = role === "CFO";
  // Admin/HR sees only their own L1 pending queue — same as a manager, NOT view-all
  const isViewAll = isCOO || isCFO;
  const canExport = isCOO; // Only COO / CEO can export

  /** What actions this user can take in the review page */
  const getApproverLevel = (): "L1" | "L2" | "VIEW_ONLY" => {
    if (isCFO)  return "VIEW_ONLY";
    if (isCOO)  return "L2";
    return "L1"; // Admin/HR acting as L1, MANAGER, CTO, etc.
  };

  useEffect(() => {
    if (!user?.id) return;
    if (isCOO || isCFO) {
      loadAll(filterCycleId ? Number(filterCycleId) : undefined);
      loadCycles();
    } else {
      // Admin/HR (if L1), MANAGER, CTO, TEAM_LEADER — own pending queue only
      loadPendingApprover(user.id);
    }
  }, [user?.id, filterCycleId]); // eslint-disable-line

  // ── Excel Export ─────────────────────────────────────────────────────────
  const handleExcelExport = async () => {
    setExporting(true);
    try {
      await appraisalService.exportExcel(filterCycleId ? Number(filterCycleId) : undefined, statusFilter);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ── PDF Export ────────────────────────────────────────────────────────────
  const handlePdfExport = async () => {
    setExporting(true);
    try {
      await appraisalService.exportPdf(filterCycleId ? Number(filterCycleId) : undefined, statusFilter);
    } catch {
      alert("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ── Open review detail ────────────────────────────────────────────────────
  if (selected) {
    return (
      <AppraisalReviewPage
        appraisalId={selected.appraisalId}
        approverLevel={getApproverLevel()}
        onBack={() => setSelected(null)}
      />
    );
  }

  // ── Admin/HR: Access Denied if no L1 records assigned ────────────────────
  // loadPendingApprover already returns only records where firstApproverId === user.id
  // If that list is empty (and loading is done), they have no L1 role → block access
  if (isAdmin && !loading && summaries.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center text-slate-400">
        <HiOutlineClipboardDocumentList size={48} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium text-slate-600">Access Denied</p>
        <p className="text-sm mt-1">You are not assigned as an L1 reviewer for any appraisal.</p>
      </div>
    );
  }

  // ── COO hard-filter: strip SUBMITTED / L1_REJECTED — those belong to L1 only ──
  // loadAll returns everything; COO should only see records that have cleared L1
  const baseSummaries = isCOO
    ? summaries.filter(s => COO_VISIBLE_STATUSES.has(s.status))
    : summaries;

  // ── Status tab filter (for view-all roles: COO/CFO) ──────────────────────
  const displayedSummaries = baseSummaries.filter(s => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING") return PENDING_STATUSES.includes(s.status);
    if (statusFilter === "PUBLISHED") return PUBLISHED_STATUSES.includes(s.status);
    return true;
  });

  const pendingCount   = baseSummaries.filter(s => PENDING_STATUSES.includes(s.status)).length;
  const publishedCount = baseSummaries.filter(s => PUBLISHED_STATUSES.includes(s.status)).length;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appraisal Reviews</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isViewAll ? "All appraisals across the organisation" : "Pending your review"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full">
            {displayedSummaries.length} records
          </span>

          {/* Export buttons — Admin / HR / COO / CEO */}
          {canExport && (
            <>
              <button
                onClick={handleExcelExport}
                disabled={exporting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                <HiOutlineArrowDownTray size={14} />
                {exporting ? "Exporting..." : "Excel"}
              </button>

              <button
                onClick={handlePdfExport}
                disabled={exporting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                <HiOutlineDocumentText size={14} />
                {exporting ? "Exporting..." : "PDF"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Filters row (view-all roles only) ── */}
      {isViewAll && (
        <div className="flex items-center gap-3 flex-wrap">
          <HiOutlineFunnel size={16} className="text-slate-400" />

          {/* Cycle filter */}
          {cycles.length > 0 && (
            <select
              value={filterCycleId}
              onChange={e => setFilterCycleId(e.target.value === "" ? "" : Number(e.target.value))}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
            >
              <option value="">All Cycles</option>
              {cycles.map(c => (
                <option key={c.id} value={c.id}>{c.cycleLabel}</option>
              ))}
            </select>
          )}

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(
              [
                { key: "ALL",       label: `All (${baseSummaries.length})` },
                { key: "PENDING",   label: `Pending (${pendingCount})` },
                { key: "PUBLISHED", label: `Published (${publishedCount})` },
              ] as { key: StatusFilter; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === key
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && displayedSummaries.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <HiOutlineClipboardDocumentList size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {isViewAll ? "No appraisals found" : "No appraisals pending your review"}
          </p>
        </div>
      )}

      {/* ── List ── */}
      <div className="space-y-3">
        {displayedSummaries.map(s => (
          <div
            key={s.appraisalId}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 hover:border-indigo-200 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black shrink-0">
                {s.employeeName?.[0] ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{s.employeeName}</p>
                <p className="text-xs text-slate-400">{s.employeeId} · {s.cycleLabel}</p>
                {s.submittedAt && (
                  <p className="text-xs text-slate-300 mt-0.5">
                    Submitted: {new Date(s.submittedAt).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge status={s.status} />
              <button
                onClick={() => setSelected(s)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all"
              >
                <HiOutlineEye size={14} />
                {isCFO ? "View" : "Review"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppraisalDashboardPage;