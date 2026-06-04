import React, { useState } from "react";
import {
  FaTimes, FaCheckCircle, FaTimesCircle,
  FaFile, FaDownload, FaFileAlt, FaFilePdf, FaFileImage, FaCommentAlt,
} from "react-icons/fa";
import { wfhService } from "@/features/leave/services/wfhService";
import { useAuth } from "@/shared/auth/useAuth";
import { employeeService } from "@/features/employee/services/employeeService";
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

const guessContentType = (fileName: string | null, declared: string | null): string => {
  if (declared && declared !== "application/octet-stream") return declared;
  const ext = (fileName ?? "").split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return map[ext] ?? "application/octet-stream";
};

// ─────────────────────────────────────────────────────────────────────────────
// Workflow Step (Leave modal style — horizontal with progress line)
// ─────────────────────────────────────────────────────────────────────────────
const WorkflowStep: React.FC<{
  label: string;
  subLabel: string;
  isComplete?: boolean;
  status?: string | null;
  shortLabel?: string;
  isFinal?: boolean;
}> = ({ label, subLabel, isComplete, status, shortLabel, isFinal }) => {
  const approved = isComplete || status === "APPROVED";
  const rejected = status === "REJECTED";

  const circleClass = approved
    ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100"
    : rejected
    ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-100"
    : "bg-white border-slate-200 text-slate-300";

  const icon = approved ? (
    <FaCheckCircle size={14} />
  ) : rejected ? (
    <FaTimesCircle size={14} />
  ) : shortLabel ? (
    <span className="text-[10px] font-black">{label && !label.startsWith('WENXT') && label !== 'Approver' ? label.charAt(0).toUpperCase() : shortLabel}</span>
  ) : isFinal ? (
    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" />
  ) : (
    <span className="text-[10px] text-slate-300">•</span>
  );

  return (
    <div className="relative flex flex-col items-center z-10 w-24">
      <div
        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ring-2 ring-transparent transition-all ${circleClass}`}
      >
        {icon}
      </div>
      <div className="mt-2 text-center">
        <p className="text-[9px] font-black text-slate-700 uppercase tracking-tighter leading-tight line-clamp-2 min-h-4">
          {label}
        </p>
        <p
          className={`text-[8px] font-bold uppercase mt-0.5 ${
            rejected ? "text-rose-500" : "text-slate-400"
          }`}
        >
          {subLabel}
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Remark Bubble
// ─────────────────────────────────────────────────────────────────────────────
const RemarkBubble: React.FC<{
  name: string;
  role: string;
  comment: string;
  date?: string | null;
}> = ({ name, role, comment, date }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div>
        <p className="text-xs font-black text-slate-700">{name}</p>
        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{role}</p>
      </div>
      {date && (
        <span className="text-[9px] text-slate-400 font-semibold bg-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
          {fmtDate(date)}
        </span>
      )}
    </div>
    <p className="text-xs text-slate-600 italic leading-relaxed">"{comment}"</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Attachment Preview Overlay
// ─────────────────────────────────────────────────────────────────────────────
interface PreviewProps {
  wfhId: number;
  originalName: string;
  contentType: string;
  onClose: () => void;
}

const AttachmentPreview: React.FC<PreviewProps> = ({ wfhId, originalName, contentType, onClose }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isImage = contentType.startsWith("image/");
  const isPdf = contentType === "application/pdf";

  React.useEffect(() => {
    let url = "";
    setLoading(true);
    setError(null);
    wfhService
      .downloadAttachment(wfhId)
      .then((blob) => {
        const typedBlob = new Blob([blob], { type: contentType });
        url = URL.createObjectURL(typedBlob);
        setBlobUrl(url);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404) setError("Attachment not found on server (404).");
        else if (status === 400) setError("Bad request when fetching attachment (400).");
        else setError("Could not load the attachment. Please check server logs.");
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

  const HeaderIcon = isPdf ? FaFilePdf : isImage ? FaFileImage : FaFileAlt;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "88vh" }}
      >
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
                <FaDownload size={11} /> Download
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors">
              <FaTimes size={17} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 p-6 min-h-52">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading attachment…</span>
            </div>
          )}
          {!loading && error && (
            <div className="text-center bg-white rounded-2xl shadow p-10 max-w-sm border border-red-100">
              <div className="w-14 h-14 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFileAlt size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-2">Couldn't load file</h4>
              <p className="text-slate-500 text-xs leading-relaxed mb-5">{error}</p>
              <button onClick={onClose} className="w-full py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors">Close</button>
            </div>
          )}
          {!loading && !error && blobUrl && (
            <>
              {isImage && <img src={blobUrl} alt={originalName} className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-xl border-4 border-white" />}
              {isPdf && <iframe src={blobUrl} title={originalName} className="w-full rounded-lg border border-slate-200" style={{ height: "65vh" }} />}
              {!isImage && !isPdf && (
                <div className="text-center bg-white rounded-2xl shadow p-10 max-w-xs">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-5"><FaFileAlt size={30} /></div>
                  <h4 className="text-base font-bold text-slate-800 mb-2">Can't preview this file</h4>
                  <p className="text-slate-500 text-sm mb-6">Download it to view on your device.</p>
                  <button onClick={download} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors">Download File</button>
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
  const { user } = useAuth();
  const [l1DisplayName, setL1DisplayName] = useState<string>("");
  const [l2DisplayName, setL2DisplayName] = useState<string>("");

  React.useEffect(() => { if (!isOpen) setShowPreview(false); }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen || !req) return;
    setL1DisplayName(req.firstApproverName || req.firstApproverId || "");
    setL2DisplayName(req.secondApproverName || req.secondApproverId || "");

    const extractName = (res: any): string => {
      if (!res) return "";
      if (typeof res === "string") return res;
      return res.empName || res.fullName || res.name || "";
    };

    if (req.firstApproverId) {
      employeeService.getNameByID(req.firstApproverId).then((res: any) => {
        const name = extractName(res);
        if (name) setL1DisplayName(name);
      }).catch(() => {});
    }
    if (req.secondApproverId) {
      employeeService.getNameByID(req.secondApproverId).then((res: any) => {
        const name = extractName(res);
        if (name) setL2DisplayName(name);
      }).catch(() => {});
    }
  }, [isOpen, req?.id]);

  if (!isOpen || !req) return null;

  // ── Period ────────────────────────────────────────────────────────────────
  const startFmt  = fmtDate(req.startDate);
  const endFmt    = fmtDate(req.endDate);
  const periodStr = req.startDate === req.endDate ? startFmt : `${startFmt} to ${endFmt}`;
  const totalDays = req.totalDays ?? req.days ?? 1;

  // ── Workflow ──────────────────────────────────────────────────────────────
  const levels  = req.requiredApprovalLevels ?? 1;
  const l1Dec   = req.firstApproverDecision  as string | null;
  const l2Dec   = req.secondApproverDecision as string | null;
  const l1Name  = l1DisplayName || req.firstApproverName  || req.firstApproverId  || "Approver";
  const l2Name  = l2DisplayName || req.secondApproverName || req.secondApproverId || "Approver";

  const showSecondLevel = levels >= 2 && l1Dec !== "REJECTED";

  const l1Sub =
    l1Dec === "APPROVED" ? (req.firstApproverDecidedAt  ? fmtDate(req.firstApproverDecidedAt)  : "Approved") :
    l1Dec === "REJECTED" ? (req.firstApproverDecidedAt  ? fmtDate(req.firstApproverDecidedAt)  : "Rejected") :
    "Pending";

  const l2Sub = (levels < 2 || l1Dec !== "APPROVED") ? "Locked" :
    l2Dec === "APPROVED" ? (req.secondApproverDecidedAt ? fmtDate(req.secondApproverDecidedAt) : "Approved") :
    l2Dec === "REJECTED" ? (req.secondApproverDecidedAt ? fmtDate(req.secondApproverDecidedAt) : "Rejected") :
    "Waiting";

  // Progress line width
  const progressWidth =
    req.status === "APPROVED" ? "calc(100% - 4rem)" :
    req.status === "REJECTED" ? "0%" :
    l2Dec === "APPROVED" ? "calc(100% - 4rem)" :
    l1Dec === "APPROVED" ? (showSecondLevel ? "50%" : "calc(100% - 4rem)") :
    "0%";

  // ── Can the current user take action? ────────────────────────────────────
  const userCodes = [user?.employeeCode, user?.id].filter(Boolean);
  const isCurrentApprover = (approverId: string | null | undefined): boolean => {
    if (!approverId) return false;
    return userCodes.some(code => code === approverId);
  };

  const canReview =
    req.status === "PENDING" &&
    !!user &&
    (() => {
      if (req.currentApproverId) return isCurrentApprover(req.currentApproverId);
      if (!req.firstApproverDecision || req.firstApproverDecision === "PENDING") {
        return isCurrentApprover(req.firstApproverId);
      }
      if (req.firstApproverDecision === "APPROVED" && req.secondApproverId) {
        return isCurrentApprover(req.secondApproverId);
      }
      return false;
    })();

  // ── Badge ─────────────────────────────────────────────────────────────────
  const badge =
    req.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
    req.status === "REJECTED" ? "bg-rose-100 text-rose-600"       :
    "bg-amber-100 text-amber-700";

  // ── Attachment ────────────────────────────────────────────────────────────
  const hasAttachment  = !!req.attachmentOriginalName;
  const resolvedCType  = guessContentType(req.attachmentOriginalName, req.attachmentContentType);
  const isPdfFile      = resolvedCType === "application/pdf";
  const isImageFile    = resolvedCType.startsWith("image/");
  const AttachIcon     = isPdfFile ? FaFilePdf : isImageFile ? FaFileImage : FaFile;

  // ── Remarks ───────────────────────────────────────────────────────────────
  const hasRemarks = !!(req.firstApproverComment || req.secondApproverComment);

  return (
    <>
      {/* ── Detail modal ──────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
        <div className="absolute inset-0" onClick={onClose} />

        <div
          className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
          style={{ maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="px-8 py-5 border-b flex justify-between items-center bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">WFH Application Details</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badge}`}>
                  {req.status ?? "PENDING"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Reference ID: #{req.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="p-8 overflow-y-auto custom-scrollbar bg-white flex-1">

            {/* ── Row 1: Meta details ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-slate-50 pb-6 mb-8">
              {[
                { label: "Employee Name", value: req.employeeName || "—", sub: req.employeeId },
                { label: "Leave Type",    value: "WFH",                   sub: null,            colored: true },
                { label: "Created At",    value: fmtDate(req.createdAt),  sub: null },
                { label: "Period",        value: periodStr,               sub: `${totalDays} Day(s) Total` },
              ].map((col) => (
                <div key={col.label}>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{col.label}</p>
                  <p className={`text-sm font-bold leading-snug ${col.colored ? "text-indigo-600" : "text-slate-800"}`}>
                    {col.value}
                  </p>
                  {col.sub && <p className="text-[10px] text-slate-400 mt-0.5">{col.sub}</p>}
                </div>
              ))}
            </div>

            {/* ── Row 2: Reason + Workflow ────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
              {/* Reason */}
              <div className="lg:col-span-1 flex flex-col gap-2 h-full">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                  Reason for Leave
                </p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[96px] h-full">
                  <p className="text-sm text-slate-700 leading-relaxed italic whitespace-pre-wrap">
                    {req.reason ? `"${req.reason}"` : <span className="not-italic text-slate-400">No reason provided.</span>}
                  </p>
                </div>
              </div>

              {/* Workflow */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Approval Workflow
                </h4>
                <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <div className="relative flex justify-between items-start px-4">
                    {/* Background line */}
                    <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-200 rounded-full z-0" />
                    {/* Progress line */}
                    <div
                      className="absolute top-4 left-8 h-0.5 bg-emerald-400 rounded-full transition-all duration-700 z-0"
                      style={{ width: progressWidth }}
                    />

                    <WorkflowStep label="Applied"  subLabel={fmtDate(req.createdAt)} isComplete />
                    <WorkflowStep label={l1Name}   subLabel={l1Sub} status={l1Dec} shortLabel="L1" />
                    {showSecondLevel && (
                      <WorkflowStep label={l2Name} subLabel={l2Sub} status={l2Dec} shortLabel="L2" />
                    )}
                    <WorkflowStep label="Outcome"  subLabel={req.status ?? "PENDING"} status={req.status} isFinal />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Attachment ──────────────────────────────────────────────── */}
            {hasAttachment && (
              <div className="mb-8">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Supporting Documents
                </p>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                    ${isPdfFile   ? "bg-red-50   group-hover:bg-red-100   text-red-400   group-hover:text-red-500"
                    : isImageFile ? "bg-blue-50  group-hover:bg-blue-100  text-blue-400  group-hover:text-blue-500"
                    :               "bg-slate-100 group-hover:bg-indigo-100 text-slate-400 group-hover:text-indigo-500"}`}
                  >
                    <AttachIcon size={14} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 truncate transition-colors">
                      {req.attachmentOriginalName}
                    </p>
                    <p className="text-[10px] text-slate-400 group-hover:text-indigo-400">Click to view document</p>
                  </div>
                </button>
              </div>
            )}

            {/* ── Reviewer Remarks ────────────────────────────────────────── */}
            {hasRemarks && (
              <div className="space-y-3 pt-6 border-t border-slate-50">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FaCommentAlt size={10} className="text-indigo-400" /> Reviewer Remarks
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {req.firstApproverComment && (
                    <RemarkBubble
                      name={l1Name}
                      role="Level 1"
                      comment={req.firstApproverComment}
                      date={req.firstApproverDecidedAt}
                    />
                  )}
                  {req.secondApproverComment && (
                    <RemarkBubble
                      name={l2Name}
                      role="Level 2"
                      comment={req.secondApproverComment}
                      date={req.secondApproverDecidedAt}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer Action Area ─────────────────────────────────────────── */}
          <div className="px-8 py-5 bg-slate-50 border-t mt-auto flex-shrink-0">
            {canReview ? (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onAction("REJECTED")}
                  className="flex-1 py-3.5 px-6 bg-white border border-slate-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-[0.98] text-sm tracking-wide uppercase"
                >
                  Decline Request
                </button>
                <button
                  type="button"
                  onClick={() => onAction("APPROVED")}
                  className="flex-[2] py-3.5 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] text-sm tracking-wide flex items-center justify-center gap-2 uppercase"
                >
                  <FaCheckCircle size={14} />
                  Approve Application
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-slate-500 bg-slate-100/50 py-4 rounded-xl border border-dashed border-slate-300">
                <FaCheckCircle className={req.status === "REJECTED" ? "text-rose-400" : "text-emerald-500"} />
                <span className="text-sm font-semibold uppercase tracking-widest">
                  Decision Recorded
                </span>
              </div>
            )}
          </div>
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