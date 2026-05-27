// AccessRequestForm.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Config-driven access request form.
// Currently: VPN only (POST /api/v1/vpn/apply)
// Future:    other types via GET /access-types/available → rendered dynamically
//
// API contract (VPN):
//   POST /api/v1/vpn/apply
//   Body: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", purpose: string }
//   Auth: Bearer JWT
//   Roles: EMPLOYEE · MANAGER (backend enforces)
// ─────────────────────────────────────────────────────────────────────────────

import api from "@/services/apiClient";
import { useAuth } from "@/shared/auth/useAuth";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import {
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineExclamationCircle,
  HiOutlineFingerPrint,
  HiOutlineLockClosed,
  HiOutlinePaperAirplane,
  HiOutlineShieldCheck,
  HiOutlineSignal,
  HiOutlineXCircle,
  HiOutlineFolderOpen,
  HiOutlineArrowPath,
} from "react-icons/hi2";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccessType = {
  type: "VPN" | "BIOMETRIC" | "NETWORK" | "SHARED_FOLDER";
  label: string;
  description: string;
  enabled: boolean;
  rolesAllowed: string[];      // "ALL" = everyone
  apiBasePath: string;         // e.g. "/vpn" → POST /api/v1/vpn/apply
};

// VPN response shape (from /api/v1/vpn/apply)
interface VpnRequestResponse {
  id: number;
  applicantId: string;
  applicantName: string;
  applicantRole: string;
  managerApproverName: string | null;
  purpose: string;
  status: string;
  statusLabel: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

// ─── Static config (fallback + future expansion) ─────────────────────────────
// Once backend /access-types/available is ready, replace with dynamic fetch.
// Frontend NEVER hardcodes "VPN" in logic — reads from this config.

const FALLBACK_ACCESS_TYPES: AccessType[] = [
  {
    type: "VPN",
    label: "VPN Access",
    description: "Remote work / secure tunnel to company network",
    enabled: true,
    rolesAllowed: ["EMPLOYEE", "MANAGER", "ADMIN", "HR", "CTO", "COO", "CFO"],
    apiBasePath: "/vpn",
  },
  // Future — set enabled: false until backend supports them
  {
    type: "BIOMETRIC",
    label: "Biometric Access",
    description: "Office entry / physical access registration",
    enabled: false,
    rolesAllowed: ["ALL"],
    apiBasePath: "/biometric",
  },
  {
    type: "NETWORK",
    label: "Network Access",
    description: "Internal network / intranet access",
    enabled: false,
    rolesAllowed: ["ALL"],
    apiBasePath: "/network",
  },
  {
    type: "SHARED_FOLDER",
    label: "Shared Folder",
    description: "Access to shared drives or project folders",
    enabled: false,
    rolesAllowed: ["ALL"],
    apiBasePath: "/shared-folder",
  },
];

// ─── Icon map ────────────────────────────────────────────────────────────────
const TYPE_ICON: Record<string, React.ReactNode> = {
  VPN: <HiOutlineShieldCheck size={18} />,
  BIOMETRIC: <HiOutlineFingerPrint size={18} />,
  NETWORK: <HiOutlineSignal size={18} />,
  SHARED_FOLDER: <HiOutlineFolderOpen size={18} />,
};

// ─── Custom hook — fetchable in future ───────────────────────────────────────
const useAccessTypes = (userRole?: string) => {
  const [accessTypes, setAccessTypes] = useState<AccessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Try dynamic fetch first
        const res = await api.get<AccessType[]>("/access-types/available");
        const data = res.data;
        const filtered = data.filter(
          t => t.enabled && (t.rolesAllowed.includes("ALL") || t.rolesAllowed.includes((userRole || "").toUpperCase()))
        );
        setAccessTypes(filtered);
      } catch {
        // Fallback to static config
        const filtered = FALLBACK_ACCESS_TYPES.filter(
          t => t.enabled && (t.rolesAllowed.includes("ALL") || t.rolesAllowed.includes((userRole || "").toUpperCase()))
        );
        setAccessTypes(filtered);
        setError(null); // silent fallback — no error shown to user
      } finally {
        setLoading(false);
      }
    };
    if (userRole) load();
  }, [userRole]);

  return { accessTypes, loading, error };
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const formatDisplay = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  PENDING_MANAGER:  { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  PENDING_ADMIN:    { color: "text-blue-700",     bg: "bg-blue-50",    border: "border-blue-200" },
  APPROVED:         { color: "text-emerald-700",  bg: "bg-emerald-50", border: "border-emerald-200" },
  MANAGER_REJECTED: { color: "text-rose-700",     bg: "bg-rose-50",    border: "border-rose-200" },
  ADMIN_REJECTED:   { color: "text-rose-700",     bg: "bg-rose-50",    border: "border-rose-200" },
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AccessRequestForm: React.FC = () => {
  const { user } = useAuth();
  const { accessTypes, loading: typesLoading } = useAccessTypes(user?.role);

  const [selectedType, setSelectedType] = useState<AccessType | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purpose, setPurpose] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<VpnRequestResponse | null>(null);

  // History
  const [history, setHistory] = useState<VpnRequestResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const purposeRef = useRef<HTMLTextAreaElement>(null);

  // Auto-select first available type
  useEffect(() => {
    if (accessTypes.length > 0 && !selectedType) {
      setSelectedType(accessTypes[0]);
    }
  }, [accessTypes]);

  // Fetch history for selected type
  const fetchHistory = async () => {
    if (!selectedType) return;
    try {
      setHistoryLoading(true);
      const res = await api.get<VpnRequestResponse[]>(`/api/v1${selectedType.apiBasePath}/my-requests`);
      setHistory(res.data);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory && selectedType) fetchHistory();
  }, [showHistory, selectedType]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!selectedType) return "Please select an access type.";
    if (!startDate) return "Please select a start date.";
    if (!endDate) return "Please select an end date.";
    if (endDate < startDate) return "End date must be on or after start date.";
    if (startDate < today()) return "Start date cannot be in the past.";
    if (!purpose.trim()) return "Please provide a reason / purpose.";
    return null;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const err = validate();
    if (err) { setFormError(err); return; }
    if (!selectedType) return;

    try {
      setSubmitting(true);
      // POST /api/v1/{apiBasePath}/apply
      const res = await api.post<VpnRequestResponse>(
        `/api/v1${selectedType.apiBasePath}/apply`,
        { startDate, endDate, purpose: purpose.trim() }
      );
      setSubmittedResponse(res.data);
      setSubmitted(true);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmittedResponse(null);
    setStartDate("");
    setEndDate("");
    setPurpose("");
    setFormError(null);
  };

  // ── Submitted success state ─────────────────────────────────────────────────
  if (submitted && submittedResponse) {
    const sc = STATUS_CONFIG[submittedResponse.status] || STATUS_CONFIG.PENDING_MANAGER;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Success header */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-8 py-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
              <HiOutlineCheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
            </motion.div>
            <h2 className="text-xl font-bold text-slate-800">Request Submitted!</h2>
            <p className="text-sm text-slate-500 mt-1">
              Your {submittedResponse.purpose.length > 40 ? selectedType?.label : selectedType?.label} request has been received.
            </p>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${sc.bg} ${sc.border}`}>
              <span className={`text-xs font-bold uppercase tracking-widest ${sc.color}`}>Status</span>
              <span className={`text-sm font-bold ${sc.color}`}>{submittedResponse.statusLabel}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Request ID", value: `#${submittedResponse.id}` },
                { label: "Access Type", value: selectedType?.label || "" },
                { label: "From", value: formatDisplay(submittedResponse.startDate) },
                { label: "To", value: formatDisplay(submittedResponse.endDate) },
                { label: "Manager", value: submittedResponse.managerApproverName || "—" },
                { label: "Submitted", value: formatDisplay(submittedResponse.createdAt?.split("T")[0]) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Purpose</p>
              <p className="text-sm text-slate-700">{submittedResponse.purpose}</p>
            </div>

            {/* Approval flow indicator */}
            <div className="pt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Approval Flow</p>
              <div className="flex items-center gap-2">
                {[
                  { label: "Employee", done: true },
                  { label: "Manager", done: submittedResponse.status !== "PENDING_MANAGER" },
                  { label: "Admin", done: submittedResponse.status === "APPROVED" },
                ].map((step, i, arr) => (
                  <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-slate-400'}`}>
                        {step.done ? "✓" : i + 1}
                      </div>
                      <span className="text-[9px] font-semibold text-slate-500 uppercase">{step.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`flex-1 h-0.5 mb-4 ${step.done && arr[i + 1].done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button onClick={handleReset}
              className="w-full py-3 rounded-xl border border-indigo-200 text-indigo-600 text-sm font-bold hover:bg-indigo-50 transition-colors">
              Submit Another Request
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (typesLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400 font-medium">Loading access types...</p>
      </div>
    );
  }

  // ── No access types for this role ───────────────────────────────────────────
  if (!typesLoading && accessTypes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <HiOutlineLockClosed size={40} className="text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700 mb-1">No Access Requests Available</h3>
        <p className="text-sm text-slate-400">Your role does not have any access request options at this time.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Header tabs: Form / My Requests ── */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setShowHistory(false)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!showHistory ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          New Request
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${showHistory ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          My Requests
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* ── HISTORY VIEW ── */}
        {showHistory && (
          <motion.div key="history"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">My {selectedType?.label} Requests</h2>
              <button onClick={fetchHistory} disabled={historyLoading}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                <HiOutlineArrowPath size={14} className={historyLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="p-12 text-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : history.length === 0 ? (
              <div className="p-12 text-center">
                <HiOutlineShieldCheck size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No requests submitted yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map(req => {
                  const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING_MANAGER;
                  return (
                    <div key={req.id} className="px-6 py-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-400">#{req.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${sc.bg} ${sc.border} ${sc.color}`}>
                              {req.statusLabel}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-700 truncate">{req.purpose}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatDisplay(req.startDate)} → {formatDisplay(req.endDate)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-slate-400">{formatDisplay(req.createdAt?.split("T")[0])}</p>
                          {req.status === "APPROVED" && <HiOutlineCheckCircle size={18} className="text-emerald-500 mt-1 ml-auto" />}
                          {(req.status === "MANAGER_REJECTED" || req.status === "ADMIN_REJECTED") && <HiOutlineXCircle size={18} className="text-rose-400 mt-1 ml-auto" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── FORM VIEW ── */}
        {!showHistory && (
          <motion.div key="form"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Form header */}
            <div className="px-6 py-5 bg-slate-50/60 border-b border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <HiOutlineShieldCheck size={18} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800">System Access Request</h1>
                <p className="text-[11px] text-slate-400">Raise a request for system access. Requires manager & admin approval.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* ── 1. Access Type Selection ── */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <HiOutlineLockClosed size={13} /> Request Type
                </label>

                {/* Active types — clickable tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {accessTypes.map(at => (
                    <button key={at.type} type="button"
                      onClick={() => setSelectedType(at)}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${selectedType?.type === at.type
                        ? 'border-indigo-400 bg-indigo-50/60 ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <div className={`mt-0.5 shrink-0 ${selectedType?.type === at.type ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {TYPE_ICON[at.type] || <HiOutlineShieldCheck size={18} />}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${selectedType?.type === at.type ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {at.label}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{at.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Disabled / coming soon types */}
                {FALLBACK_ACCESS_TYPES.filter(t => !t.enabled).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {FALLBACK_ACCESS_TYPES.filter(t => !t.enabled).map(at => (
                      <div key={at.type}
                        className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 opacity-50 cursor-not-allowed">
                        <span className="text-slate-300">{TYPE_ICON[at.type]}</span>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400">{at.label}</p>
                          <p className="text-[9px] text-slate-300 uppercase tracking-widest">Coming soon</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── 2. Date Range ── */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <HiOutlineCalendarDays size={13} /> Duration
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">From Date</label>
                    <input
                      type="date"
                      min={today()}
                      value={startDate}
                      onChange={e => {
                        setStartDate(e.target.value);
                        if (endDate && e.target.value > endDate) setEndDate("");
                      }}
                      className="border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">To Date</label>
                    <input
                      type="date"
                      min={startDate || today()}
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                  </div>
                </div>
                {/* Duration badge */}
                {startDate && endDate && endDate >= startDate && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <HiOutlineCalendarDays size={14} className="text-indigo-500" />
                    <span className="text-xs font-semibold text-indigo-600">
                      {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s) •{" "}
                      {formatDisplay(startDate)} → {formatDisplay(endDate)}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* ── 3. Purpose / Reason ── */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <HiOutlineChatBubbleLeftRight size={13} /> Reason / Purpose
                </label>
                <textarea
                  ref={purposeRef}
                  rows={4}
                  placeholder="e.g. I need VPN access for remote work during the project sprint from home..."
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  required
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 resize-none focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all placeholder:text-slate-300"
                />
                <div className="flex justify-end">
                  <span className={`text-[10px] font-medium ${purpose.length > 250 ? 'text-rose-400' : 'text-slate-300'}`}>
                    {purpose.length}/300
                  </span>
                </div>
              </div>

              {/* ── Error ── */}
              <AnimatePresence>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl"
                  >
                    <HiOutlineExclamationCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-700 font-medium">{formError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Approval flow info ── */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Approval Flow</p>
                <div className="flex items-center gap-2">
                  {["You Submit", "Manager Reviews", "Admin Approves"].map((step, i, arr) => (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          {i + 1}
                        </div>
                        <span className="text-[9px] font-semibold text-slate-500 text-center leading-tight">{step}</span>
                      </div>
                      {i < arr.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 mb-4" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* ── Buttons ── */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting || !selectedType}
                  className="flex-2 sm:flex-[2] flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm shadow-indigo-200">
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Request {selectedType?.label || "Access"}
                      <HiOutlinePaperAirplane size={16} className="rotate-45" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccessRequestForm;