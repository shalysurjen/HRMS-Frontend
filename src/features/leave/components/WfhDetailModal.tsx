import React, { useState } from "react";
import {
  FaTimes, FaCheckCircle, FaTimesCircle,
  FaFile, FaDownload, FaFileAlt, FaFilePdf, FaFileImage,
} from "react-icons/fa";
import { wfhService } from "@/features/leave/services/wfhService";
import type { LeaveDecision } from "@/features/leave/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface WfhDetailModalProps {
  isOpen: boolean;
  req: any | null;
  onClose: () => void;
  onAction: (status: LeaveDecision) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmtDate = (s?: string | null): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** Detect content type from filename extension when backend doesn't provide it */
const guessContentType = (fileName: string | null, declared: string | null): string => {
  if (declared && declared !== "application/octet-stream") return declared;
  const ext = (fileName ?? "").split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf:  "application/pdf",
    png:  "image/png",
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    gif:  "image/gif",
    webp: "image/webp",
    doc:  "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return map[ext] ?? "application/octet-stream";
};

// ─────────────────────────────────────────────────────────────────────────────
// Workflow Step
// ─────────────────────────────────────────────────────────────────────────────
type StepState = "applied" | "approved" | "rejected" | "pending" | "locked";

const Step: React.FC<{ state: StepState; label: string; sublabel: string; initials: string }> = ({
  state, label, sublabel, initials,
}) => {
  const circle: Record<StepState, string> = {
    applied:  "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200",
    approved: "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200",
    rejected: "bg-red-500    border-red-500    text-white shadow-md shadow-red-200",
    pending:  "bg-white      border-slate-300  text-slate-500",
    locked:   "bg-slate-100  border-slate-200  text-slate-400",
  };

  const icon = (() => {
    if (state === "applied" || state === "approved") return <FaCheckCircle size={15} />;
    if (state === "rejected")                        return <FaTimesCircle  size={15} />;
    return <span className="text-[11px] font-bold leading-none">{initials}</span>;
  })();

  return (
    <div className="flex flex-col items-center gap-[5px]" style={{ minWidth: 70 }}>
      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${circle[state]}`}>
        {icon}
      </div>
      <span className={`text-[11px] font-semibold text-center leading-tight max-w-[78px] ${
        state === "locked" ? "text-slate-400" : "text-slate-700"
      }`}>
        {label}
      </span>
      <span className={`text-[10px] text-center leading-tight ${
        state === "locked"   ? "text-slate-400" :
        state === "rejected" ? "text-red-500"   : "text-slate-500"
      }`}>
        {sublabel}
      </span>
    </div>
  );
};

const Line: React.FC<{ faded?: boolean }> = ({ faded }) => (
  <div
    className={`flex-1 h-px mx-1 ${faded ? "bg-slate-200" : "bg-slate-300"}`}
    style={{ marginTop: -40, minWidth: 12 }}
  />
);

// ─────────────────────────────────────────────────────────────────────────────
// Attachment Preview Overlay
// ─────────────────────────────────────────────────────────────────────────────
interface PreviewProps {
  wfhId: number;
  originalName: string;
  contentType: string;   // already resolved via guessContentType
  onClose: () => void;
}

const AttachmentPreview: React.FC<PreviewProps> = ({ wfhId, originalName, contentType, onClose }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const isImage = contentType.startsWith("image/");
  const isPdf   = contentType === "application/pdf";

  React.useEffect(() => {
    let url = "";
    setLoading(true);
    setError(null);

    wfhService
      .downloadAttachment(wfhId)
      .then((blob) => {
        // Use guessed type so browser renders correctly even if server sends octet-stream
        const typedBlob = new Blob([blob], { type: contentType });
        url = URL.createObjectURL(typedBlob);
        setBlobUrl(url);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404) {
          setError("Attachment endpoint not found on server (404). Please add the backend endpoint — see WfhService_attachmentMethod.java.");
        } else if (status === 400) {
          setError("Bad request when fetching attachment (400). Check the WFH ID and server logs.");
        } else {
          setError("Could not load the attachment. Please check the server logs.");
        }
      })
      .finally(() => setLoading(false));

    return () => { if (url) URL.revokeObjectURL(url); };
  }, [wfhId, contentType]);

  const download = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Icon for header
  const HeaderIcon = isPdf ? FaFilePdf : isImage ? FaFileImage : FaFileAlt;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "88vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPdf ? "bg-red-100 text-red-500" : isImage ? "bg-blue-100 text-blue-500" : "bg-indigo-100 text-indigo-600"}`}>
              <HeaderIcon size={15} />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800 leading-tight">{originalName}</p>
              <p className="text-xs text-slate-400 mt-0.5">WFH Attachment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {blobUrl && (
              <button
                onClick={download}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <FaDownload size={11} />
                Download
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors">
              <FaTimes size={17} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 p-6 min-h-52">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading attachment…</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center bg-white rounded-2xl shadow p-10 max-w-sm border border-red-100">
              <div className="w-14 h-14 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFileAlt size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-2">Couldn't load file</h4>
              <p className="text-slate-500 text-xs leading-relaxed mb-5">{error}</p>
              <button
                onClick={onClose}
                className="w-full py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && blobUrl && (
            <>
              {/* Image */}
              {isImage && (
                <img
                  src={blobUrl}
                  alt={originalName}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-xl border-4 border-white"
                />
              )}

              {/* PDF — inline iframe */}
              {isPdf && (
                <iframe
                  src={blobUrl}
                  title={originalName}
                  className="w-full rounded-lg border border-slate-200"
                  style={{ height: "65vh" }}
                />
              )}

              {/* Other — download prompt */}
              {!isImage && !isPdf && (
                <div className="text-center bg-white rounded-2xl shadow p-10 max-w-xs">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-5">
                    <FaFileAlt size={30} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-2">Can't preview this file</h4>
                  <p className="text-slate-500 text-sm mb-6">Download it to view on your device.</p>
                  <button
                    onClick={download}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors"
                  >
                    Download File
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main WfhDetailModal
// ─────────────────────────────────────────────────────────────────────────────
const WfhDetailModal: React.FC<WfhDetailModalProps> = ({ isOpen, req, onClose, onAction }) => {
  const [showPreview, setShowPreview] = useState(false);

  React.useEffect(() => { if (!isOpen) setShowPreview(false); }, [isOpen]);

  if (!isOpen || !req) return null;

  // ── Period ──────────────────────────────────────────────────────────────────
  const startFmt  = fmtDate(req.startDate);
  const endFmt    = fmtDate(req.endDate);
  const periodStr = req.startDate === req.endDate ? startFmt : `${startFmt} to ${endFmt}`;
  const totalDays = req.totalDays ?? req.days ?? 1;

  // ── Workflow ────────────────────────────────────────────────────────────────
  const levels  = req.requiredApprovalLevels ?? 1;
  const l1Dec   = req.firstApproverDecision  as string | null;
  const l2Dec   = req.secondApproverDecision as string | null;
  const l1Name  = req.firstApproverName  || req.firstApproverId  || "Approver";
  const l2Name  = req.secondApproverName || req.secondApproverId || "Approver";

  const mkInitials = (s: string) =>
    s.includes(" ")
      ? s.split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join("")
      : s.slice(0, 1).toUpperCase();

  const l1State: StepState =
    l1Dec === "APPROVED" ? "approved" :
    l1Dec === "REJECTED" ? "rejected" : "pending";

  const l2Locked   = levels < 2 || l1Dec !== "APPROVED";
  const l2State: StepState = l2Locked ? "locked" :
    l2Dec === "APPROVED" ? "approved" :
    l2Dec === "REJECTED" ? "rejected" : "pending";

  const outcomeState: StepState =
    req.status === "APPROVED" ? "approved" :
    req.status === "REJECTED" ? "rejected" : "locked";

  // sublabels — only show decided-at date when actually decided
  const l1Sub =
    l1Dec === "APPROVED" ? (req.firstApproverDecidedAt  ? fmtDate(req.firstApproverDecidedAt)  : "Approved") :
    l1Dec === "REJECTED" ? (req.firstApproverDecidedAt  ? fmtDate(req.firstApproverDecidedAt)  : "Rejected") :
    "Pending";

  const l2Sub = l2Locked ? "Locked" :
    l2Dec === "APPROVED" ? (req.secondApproverDecidedAt ? fmtDate(req.secondApproverDecidedAt) : "Approved") :
    l2Dec === "REJECTED" ? (req.secondApproverDecidedAt ? fmtDate(req.secondApproverDecidedAt) : "Rejected") :
    "Pending";

  const outcomeSub =
    req.status === "APPROVED" ? "APPROVED" :
    req.status === "REJECTED" ? "REJECTED" : "PENDING";

  // ── Badge ───────────────────────────────────────────────────────────────────
  const badge =
    req.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
    req.status === "REJECTED" ? "bg-red-100 text-red-600"         :
    "bg-amber-100 text-amber-700";

  // ── Attachment ──────────────────────────────────────────────────────────────
  const hasAttachment  = !!req.attachmentOriginalName;
  const resolvedCType  = guessContentType(req.attachmentOriginalName, req.attachmentContentType);
  const isPdfFile      = resolvedCType === "application/pdf";
  const isImageFile    = resolvedCType.startsWith("image/");
  const AttachIcon     = isPdfFile ? FaFilePdf : isImageFile ? FaFileImage : FaFile;

  return (
    <>
      {/* ── Detail modal ────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
          style={{ maxWidth: 880, maxHeight: "90vh" }}
        >
          {/* Title bar */}
          <div className="px-8 pt-7 pb-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-[22px] font-bold text-slate-800 leading-tight">
                  WFH Application Details
                </h2>
                <span className={`px-3 py-[3px] rounded-md text-[11px] font-bold uppercase tracking-wide ${badge}`}>
                  {req.status ?? "PENDING"}
                </span>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
                <FaTimes size={17} />
              </button>
            </div>
            <p className="text-[13px] text-slate-400 mt-[5px]">Reference ID: #{req.id}</p>
          </div>

          <div className="h-px bg-slate-200 flex-shrink-0" />

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">

            {/* Meta grid */}
            <div className="grid grid-cols-4 border-b border-slate-200">
              {[
                { label: "EMPLOYEE NAME", value: req.employeeName || "—", sub: req.employeeId },
                { label: "LEAVE TYPE",    value: "WFH",                   sub: null },
                { label: "CREATED AT",    value: fmtDate(req.createdAt),  sub: null },
                { label: "PERIOD",        value: periodStr,               sub: `${totalDays} Day(s) Total` },
              ].map((col, i, arr) => (
                <div key={col.label} className={`px-7 py-6 ${i < arr.length - 1 ? "border-r border-slate-200" : ""}`}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{col.label}</p>
                  <p className="text-[15px] font-bold text-slate-800 leading-snug">{col.value}</p>
                  {col.sub && <p className="text-xs text-slate-400 mt-[3px]">{col.sub}</p>}
                </div>
              ))}
            </div>

            {/* Reason + Workflow */}
            <div className="grid grid-cols-2 border-b border-slate-200">
              <div className="px-7 py-6 border-r border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">REASON FOR LEAVE</p>
                <div className="border border-slate-200 rounded-lg px-4 py-[14px] min-h-[96px] text-[13px] text-slate-600 leading-relaxed italic bg-white">
                  {req.reason
                    ? `"${req.reason}"`
                    : <span className="not-italic text-slate-400">No reason provided.</span>}
                </div>
              </div>

              <div className="px-7 py-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">APPROVAL WORKFLOW</p>
                <div className="flex items-start">
                  <Step state="applied" label="Applied" sublabel={fmtDate(req.createdAt)} initials="✓" />
                  <Line />
                  <Step state={l1State} label={l1Name} sublabel={l1Sub} initials={mkInitials(l1Name)} />
                  {levels >= 2 && (
                    <>
                      <Line faded={l2Locked} />
                      <Step state={l2State} label={l2Name} sublabel={l2Sub} initials={mkInitials(l2Name)} />
                    </>
                  )}
                  <Line faded={req.status === "PENDING"} />
                  <Step state={outcomeState} label="Outcome" sublabel={outcomeSub} initials="i" />
                </div>
              </div>
            </div>

            {/* Supporting documents */}
            {hasAttachment && (
              <div className="px-7 py-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaFile size={10} className="text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    SUPPORTING DOCUMENTS
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 w-fit
                             hover:border-indigo-300 hover:bg-indigo-50/60 transition-all group"
                >
                  <div className={`w-9 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                    ${isPdfFile  ? "bg-red-50   group-hover:bg-red-100   text-red-400   group-hover:text-red-500"
                    : isImageFile ? "bg-blue-50  group-hover:bg-blue-100  text-blue-400  group-hover:text-blue-500"
                    :               "bg-slate-100 group-hover:bg-indigo-100 text-slate-400 group-hover:text-indigo-500"}`}
                  >
                    <AttachIcon size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-slate-700 leading-snug">
                      {req.attachmentOriginalName}
                    </p>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">
                      CLICK TO PREVIEW
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Scroll indicator dot */}
          <div className="flex justify-center py-2 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </div>

          {/* Action buttons */}
          {req.status === "PENDING" && (
            <div className="grid grid-cols-2 border-t border-slate-200 flex-shrink-0">
              <button
                type="button"
                onClick={() => onAction("REJECTED")}
                className="py-[18px] text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors uppercase tracking-widest border-r border-slate-200"
              >
                DECLINE REQUEST
              </button>
              <button
                type="button"
                onClick={() => onAction("APPROVED")}
                className="py-[18px] text-[13px] font-bold text-white uppercase tracking-widest
                           flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
              >
                <FaCheckCircle size={14} />
                APPROVE APPLICATION
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Attachment preview overlay */}
      {showPreview && hasAttachment && (
        <AttachmentPreview
          wfhId={req.id}
          originalName={req.attachmentOriginalName!}
          contentType={resolvedCType}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default WfhDetailModal;
