// src/features/appraisal/pages/AdminAppraisalCyclePage.tsx
//
// Route: /admin/appraisal-cycles
// Access: ADMIN / HR only
//
// Lets admin toggle isActive (which cycle is the "current" year) and
// isOpen (whether employees can fill/submit their form) per cycle.
//
// Business rules (enforced by both UI + backend):
//   • Only ONE cycle can be isActive=true at a time.
//     Enabling one automatically disables all others (backend does this).
//   • isOpen can be set independently on any cycle.

import { useEffect, useState } from "react";
import { useAppraisal } from "@/features/appraisal/hooks/useAppraisal";
import type { AppraisalCycle } from "@/features/appraisal/types/appraisal";
import { appraisalService } from "@/features/appraisal/services/appraisalService";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineCalendarDays,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

const AdminAppraisalCyclePage = () => {
  const { cycles, loading, loadCycles } = useAppraisal();
  const [localCycles, setLocalCycles]   = useState<AppraisalCycle[]>([]);
  const [toggling, setToggling]         = useState<string | null>(null); // "id:field"
  const [toast, setToast]               = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState<{
    cycleId: number; field: "isActive" | "isOpen"; value: boolean; label: string;
  } | null>(null);

  useEffect(() => { loadCycles(); }, []); // eslint-disable-line
  useEffect(() => { setLocalCycles(cycles); }, [cycles]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = (
    cycle: AppraisalCycle,
    field: "isActive" | "isOpen",
    newValue: boolean
  ) => {
    // Turning on isActive needs a confirmation because it deactivates all others
    if (field === "isActive" && newValue) {
      setConfirmPending({
        cycleId: cycle.id,
        field,
        value: newValue,
        label: cycle.cycleLabel,
      });
      return;
    }
    doToggle(cycle.id, field, newValue);
  };

  const doToggle = async (
    cycleId: number,
    field: "isActive" | "isOpen",
    value: boolean
  ) => {
    const key = `${cycleId}:${field}`;
    setToggling(key);
    setConfirmPending(null);
    try {
      const updated = await appraisalService.toggleCycleField(cycleId, field, value);
      setLocalCycles(prev =>
        prev.map(c => {
          if (field === "isActive" && value && c.id !== cycleId) {
            // Backend deactivated all others — reflect that locally
            return { ...c, isActive: false };
          }
          return c.id === cycleId ? updated : c;
        })
      );
      showToast(
        `Cycle "${updated.cycleLabel}" — ${field === "isActive" ? "Active" : "Open"} set to ${value ? "ON" : "OFF"}.`
      );
    } catch {
      showToast("Failed to update. Please try again.");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Confirm modal for isActive=true */}
      {confirmPending && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <HiOutlineExclamationTriangle size={24} className="text-amber-500 shrink-0" />
              <p className="font-bold text-slate-800">Activate Cycle</p>
            </div>
            <p className="text-sm text-slate-600">
              Setting <strong>{confirmPending.label}</strong> as the active cycle will{" "}
              <strong>deactivate all other cycles</strong>. Employees will only see this cycle
              as the current appraisal year.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => doToggle(confirmPending.cycleId, confirmPending.field, confirmPending.value)}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmPending(null)}
                className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Appraisal Cycles</h1>
        <p className="text-sm text-slate-400 mt-1">
          Control which cycle is active and open for employee submissions.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
          <span><strong>Active</strong> — shown as current year to employees</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          <span><strong>Open</strong> — employees can fill & submit their appraisal</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Cycle cards */}
      <div className="space-y-4">
        {localCycles.map(cycle => {
          const activeKey = `${cycle.id}:isActive`;
          const openKey   = `${cycle.id}:isOpen`;
          const isTogglingActive = toggling === activeKey;
          const isTogglingOpen   = toggling === openKey;

          return (
            <div
              key={cycle.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                cycle.isActive
                  ? "border-indigo-300 ring-2 ring-indigo-100"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-4">

                {/* Cycle info */}
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    cycle.isActive ? "bg-indigo-600" : "bg-slate-100"
                  }`}>
                    <HiOutlineCalendarDays
                      size={22}
                      className={cycle.isActive ? "text-white" : "text-slate-400"}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-base">{cycle.cycleLabel}</p>
                    <p className="text-xs text-slate-400">{cycle.startYear} – {cycle.endYear}</p>
                  </div>
                </div>

                {/* Toggle row */}
                <div className="flex items-center gap-6 flex-wrap">

                  {/* isActive toggle */}
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-600">Active</p>
                      <p className="text-[10px] text-slate-400">Current year</p>
                    </div>
                    <button
                      disabled={isTogglingActive || (cycle.isActive)}
                      onClick={() => handleToggle(cycle, "isActive", !cycle.isActive)}
                      title={cycle.isActive ? "Already active" : "Set as active cycle"}
                      className={`relative w-12 h-6 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${
                        cycle.isActive
                          ? "bg-indigo-500 cursor-default"
                          : "bg-slate-200 hover:bg-slate-300"
                      } disabled:opacity-60`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          cycle.isActive ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                      {isTogglingActive && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </span>
                      )}
                    </button>
                    {cycle.isActive
                      ? <HiOutlineCheckCircle size={16} className="text-indigo-500" />
                      : <HiOutlineXCircle size={16} className="text-slate-300" />}
                  </div>

                  {/* Divider */}
                  <div className="w-px h-8 bg-slate-200" />

                  {/* isOpen toggle */}
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-600">Open</p>
                      <p className="text-[10px] text-slate-400">Allow submissions</p>
                    </div>
                    <button
                      disabled={isTogglingOpen}
                      onClick={() => handleToggle(cycle, "isOpen", !cycle.isOpen)}
                      title={cycle.isOpen ? "Close submissions" : "Open for submissions"}
                      className={`relative w-12 h-6 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 ${
                        cycle.isOpen ? "bg-emerald-500" : "bg-slate-200 hover:bg-slate-300"
                      } disabled:opacity-60`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          cycle.isOpen ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                      {isTogglingOpen && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </span>
                      )}
                    </button>
                    {cycle.isOpen
                      ? <HiOutlineLockOpen size={16} className="text-emerald-500" />
                      : <HiOutlineLockClosed size={16} className="text-slate-300" />}
                  </div>

                </div>
              </div>

              {/* Status chips */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {cycle.isActive && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                    ● Active
                  </span>
                )}
                {cycle.isOpen && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    ● Open for submissions
                  </span>
                )}
                {!cycle.isActive && !cycle.isOpen && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    Closed / Inactive
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && localCycles.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <HiOutlineCalendarDays size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No appraisal cycles found.</p>
        </div>
      )}
    </div>
  );
};

export default AdminAppraisalCyclePage;
