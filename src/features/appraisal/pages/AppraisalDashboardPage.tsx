// src/features/appraisal/pages/AppraisalDashboardPage.tsx
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
 * AppraisalDashboardPage — Approver / Admin view
 *
 * TAB LOGIC (per-record, not just by role):
 *
 *   For any given record, this user can be:
 *     • L1 (firstApproverId === user.id)  — can act on SUBMITTED / L2_REJECTED
 *     • L2 (finalApproverId === user.id)  — can act on L1_APPROVED / FINAL_REVIEW
 *     • VIEW_ONLY (CFO, or COO seeing non-L2 records, or already actioned)
 *
 *   Tabs:
 *     "PENDING"   → records where this user still needs to take action (editable)
 *     "VIEW_ONLY" → records where this user's action is done (read-only)
 *     "PUBLISHED" → fully published / closed records
 *
 * Export (COO / CEO only):
 *   Excel + PDF with cycle/status filter.
 */

// Statuses where a record is fully done
const PUBLISHED_STATUSES = new Set(["PUBLISHED", "CLOSED"]);

// Statuses where L1 can still act
// FIX: UNDER_REVIEW means L1 has opened the form (status set by backend) — still actionable
const L1_ACTIONABLE = new Set(["SUBMITTED", "UNDER_REVIEW", "L2_REJECTED"]);

// Statuses where L2 can still act
// FIX: L2_UNDER_REVIEW = L2 clicked Start Review → still actionable
const L2_ACTIONABLE = new Set(["L1_APPROVED", "L2_UNDER_REVIEW", "FINAL_REVIEW"]);

type TabKey = "ALL" | "PENDING" | "VIEW_ONLY" | "PUBLISHED";

/** Compute the approver level for a specific record given who the user is. */
function resolveApproverLevel(
  s: AppraisalSummary,
  userId: string,
  role: string
): "L1" | "L2" | "VIEW_ONLY" {
  if (role === "CFO") return "VIEW_ONLY";

  const isL1 = s.firstApproverId === userId;
  const isL2 = s.finalApproverId === userId;

  if (isL2 && L2_ACTIONABLE.has(s.status)) return "L2";
  if (isL1 && L1_ACTIONABLE.has(s.status)) return "L1";
  return "VIEW_ONLY";
}

/** Determine which tab a record belongs to for this user. */
function resolveTab(
  s: AppraisalSummary,
  userId: string,
  role: string
): TabKey {
  if (PUBLISHED_STATUSES.has(s.status)) return "PUBLISHED";
  const level = resolveApproverLevel(s, userId, role);
  if (level === "L1" || level === "L2") return "PENDING";
  return "VIEW_ONLY";
}

const AppraisalDashboardPage = () => {
  const { user } = useAuth();
  const { summaries, cycles, loading, loadAllForApprover, loadAll, loadCycles } = useAppraisal();

  const [selected, setSelected]       = useState<AppraisalSummary | null>(null);
  const [tab, setTab]                  = useState<TabKey>("ALL");
  const [filterCycleId, setFilterCycleId] = useState<number | "">("");
  const [exporting, setExporting]      = useState(false);

  const role      = user?.role?.toUpperCase() ?? "";
  const isCOO     = role === "COO" || role === "CEO";
  const isCFO     = role === "CFO";
  // COO / CFO see ALL records; others see their own queue
  const isViewAll = isCOO || isCFO;
  const canExport = isCOO;

  useEffect(() => {
    if (!user?.id) return;
    if (isViewAll) {
      loadAll(filterCycleId ? Number(filterCycleId) : undefined);
      loadCycles();
    } else {
      loadAllForApprover(user.id);  // FIX: includes L2 view-only records from submission
    }
  }, [user?.id, filterCycleId]); // eslint-disable-line

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExcelExport = async () => {
    setExporting(true);
    try { await appraisalService.exportExcel(filterCycleId ? Number(filterCycleId) : undefined, tab); }
    catch { alert("Export failed. Please try again."); }
    finally { setExporting(false); }
  };

  const handlePdfExport = async () => {
    setExporting(true);
    try { await appraisalService.exportPdf(filterCycleId ? Number(filterCycleId) : undefined, tab); }
    catch { alert("PDF export failed. Please try again."); }
    finally { setExporting(false); }
  };

  // ── Open review detail ─────────────────────────────────────────────────────
  if (selected && user?.id) {
    const level = resolveApproverLevel(selected, user.id, role);
    return (
      <AppraisalReviewPage
        appraisalId={selected.appraisalId}
        approverLevel={level}
        onBack={() => setSelected(null)}
      />
    );
  }

  // ── Bucket summaries into tabs ─────────────────────────────────────────────
  const bucketed = user?.id
    ? summaries.reduce<Record<TabKey, AppraisalSummary[]>>(
        (acc, s) => {
          const t = resolveTab(s, user.id, role);
          acc[t].push(s);
          acc["ALL"].push(s);  // FIX: always push to ALL tab
          return acc;
        },
        { ALL: [], PENDING: [], VIEW_ONLY: [], PUBLISHED: [] }
      )
    : { ALL: [], PENDING: [], VIEW_ONLY: [], PUBLISHED: [] };

  const displayed = bucketed[tab];

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "ALL",       label: "All",              count: bucketed.ALL.length       },
    { key: "PENDING",   label: "Pending",          count: bucketed.PENDING.length   },
    { key: "VIEW_ONLY", label: "View Only",        count: bucketed.VIEW_ONLY.length },
    { key: "PUBLISHED", label: "Published",        count: bucketed.PUBLISHED.length  },
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appraisal Reviews</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isViewAll ? "All appraisals across the organisation" : "Your reviewer queue"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

      {/* ── Cycle filter (COO/CFO) ── */}
      {isViewAll && cycles.length > 0 && (
        <div className="flex items-center gap-3">
          <HiOutlineFunnel size={16} className="text-slate-400" />
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
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === key
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
              tab === key ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && displayed.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <HiOutlineClipboardDocumentList size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {tab === "ALL"
              ? "No appraisals found"
              : tab === "PENDING"
              ? "No appraisals pending your review"
              : tab === "VIEW_ONLY"
              ? "No submitted / reviewed appraisals"
              : "No published appraisals yet"}
          </p>
        </div>
      )}

      {/* ── List ── */}
      <div className="space-y-3">
        {displayed.map(s => {
          const level = user?.id ? resolveApproverLevel(s, user.id, role) : "VIEW_ONLY";
          const isPending = level === "L1" || level === "L2";

          return (
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
                {/* Show which role this user plays for this record */}
                {isPending && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                    level === "L1"
                      ? "bg-teal-50 border-teal-200 text-teal-700"
                      : "bg-purple-50 border-purple-200 text-purple-700"
                  }`}>
                    {level}
                  </span>
                )}
                <StatusBadge status={s.status} />

                {/* FIX: L2 VIEW_ONLY — show "Start Review" button to move to Pending
                {!isPending && tab === "VIEW_ONLY" && s.finalApproverId === user?.id
                  && s.status === "L1_APPROVED" && (
                  <button
                    onClick={() => handleStartL2Review(s)}
                    disabled={startingReview === s.appraisalId}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-all"
                  >
                    <HiOutlinePlayCircle size={14} />
                    {startingReview === s.appraisalId ? "Starting..." : "Start Review"}
                  </button>
                )} */}

                <button
                  onClick={() => setSelected(s)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isPending
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <HiOutlineEye size={14} />
                  {isPending ? "Review" : "View"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AppraisalDashboardPage;
