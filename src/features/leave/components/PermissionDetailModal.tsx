import api from "@/services/apiClient";
import { useEmployee } from "@/features/employee/hooks/useEmployee";
import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

interface PermissionDetailModalProps {
    isOpen: boolean;
    req: any;
    onClose: () => void;
    onAction: (status: "APPROVED" | "REJECTED") => void;
}

const PermissionDetailModal: React.FC<PermissionDetailModalProps> = ({
    isOpen,
    req,
    onClose,
    onAction,
}) => {
    const { fetchEmployeeName } = useEmployee();
    const [firstApproverName, setFirstApproverName] = useState("Loading...");
    const [secondApproverName, setSecondApproverName] = useState("");

    useEffect(() => {
        if (!req) return;
        const resolveNames = async () => {
            try {
                if (req.firstApproverId) {
                    const r = await fetchEmployeeName(req.firstApproverId);
                    setFirstApproverName(r?.empName || req.firstApproverId);
                }
                if (req.secondApproverId) {
                    const r = await fetchEmployeeName(req.secondApproverId);
                    setSecondApproverName(r?.empName || req.secondApproverId);
                }
            } catch {
                setFirstApproverName(req.firstApproverId || "Unknown");
            }
        };
        resolveNames();
    }, [req]);

    if (!isOpen || !req) return null;

    const showSecondLevel =
        !!req.secondApproverId && req.firstApproverDecision !== "REJECTED";

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-slate-800">
                            Permission Details
                        </h2>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            req.status === "PENDING"
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : req.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-rose-50 text-rose-600 border-rose-200"
                        }`}>
                            {req.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-bold">
                            Reference ID: #{req.id}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-6">

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Employee Name
                            </p>
                            <p className="text-sm font-bold text-slate-800">
                                {req.employeeName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                                {req.employeeId}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Type
                            </p>
                            <p className="text-sm font-bold text-indigo-600 uppercase">
                                Permission
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Created At
                            </p>
                            <p className="text-sm font-bold text-slate-800">
                                {formatDate(req.createdAt)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Period
                            </p>
                            <p className="text-sm font-bold text-slate-800">
                                {req.permissionDate}
                            </p>
                            <p className="text-[10px] text-indigo-500 font-bold">
                                {req.startTime} – {req.endTime}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                                {req.durationMinutes ? `${Math.floor(req.durationMinutes/60)} HR${req.durationMinutes%60 ? ` ${req.durationMinutes%60} MIN` : ""}` : ""} Total
                            </p>
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Reason for Permission
                        </p>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <p className="text-sm text-slate-600 italic">
                                "{req.reason || "No reason provided."}"
                            </p>
                        </div>
                        {/* Rejection reason */}
                        {req.rejectionReason && (
                            <div className="mt-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">
                                    Rejection Reason
                                </p>
                                <p className="text-sm font-bold text-rose-800">
                                    {req.rejectionReason}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Attachment */}
                    {(req.permissionAttachmentPath || req.attachmentPath) && (
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                Attachment
                            </p>
                            <div
                                onClick={async () => {
                                    try {
                                        // ✅ FIX: Use api (Axios) — JWT token automatic-ஆ header-ல் போகும்
                                        // window.open() browser tab = no JWT → 401
                                        const response = await api.get(
                                            `/permissions/${req.id}/attachment`,
                                            { responseType: 'blob' }
                                        );
                                        const contentType = response.headers['content-type'];
                                        const blob = new Blob([response.data], {
                                            type: typeof contentType === 'string' ? contentType : 'application/octet-stream'
                                        });
                                        const objectUrl = URL.createObjectURL(blob);
                                        window.open(objectUrl, '_blank');
                                        // Cleanup after tab opens
                                        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
                                    } catch (err) {
                                        console.error('Attachment fetch error:', err);
                                    }
                                }}
                                className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                            >
                                <div className="w-9 h-9 bg-indigo-50 group-hover:bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 truncate transition-colors">
                                        {req.permissionAttachmentName || req.attachmentOriginalName || "attachment"}
                                    </p>
                                    <p className="text-[10px] text-slate-400 group-hover:text-indigo-400">Click to view document</p>
                                </div>
                                {/* View icon */}
                                <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Approval Workflow */}
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Approval Workflow
                        </p>
                        <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-6">
                            <div className="relative flex justify-between items-start px-4">

                                {/* Gray line */}
                                <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-200 rounded-full z-0" />

                                {/* Progress line */}
                                <div
                                    className="absolute top-4 left-8 h-0.5 bg-indigo-500 rounded-full transition-all duration-700 z-0"
                                    style={{
                                        width:
                                            req.status === "APPROVED" || req.status === "REJECTED"
                                                ? "calc(100% - 64px)"
                                                : req.firstApproverDecision === "APPROVED" && showSecondLevel
                                                ? "50%"
                                                : "0%",
                                    }}
                                />

                                {/* Applied node */}
                                <WorkflowNode
                                    label="Applied"
                                    sub={formatDate(req.createdAt)}
                                    status="APPROVED"
                                />

                                {/* Level 1 */}
                                <WorkflowNode
                                    label={firstApproverName}
                                    sub={req.firstApproverDecision || "Pending"}
                                    status={req.firstApproverDecision}
                                    level="L1"
                                />

                                {/* Level 2 */}
                                {showSecondLevel && (
                                    <WorkflowNode
                                        label={secondApproverName}
                                        sub={req.secondApproverDecision || "Locked"}
                                        status={req.secondApproverDecision}
                                        level="L2"
                                    />
                                )}

                                {/* Outcome */}
                                <WorkflowNode
                                    label="Outcome"
                                    sub={req.status}
                                    status={req.status}
                                    isFinal
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer — Action buttons */}
                {req.status === "PENDING" && (
                    <div className="flex gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50/50">
                        <button
                            onClick={() => onAction("REJECTED")}
                            className="flex-1 py-3 border-2 border-rose-400 text-rose-500 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-all"
                        >
                            Decline Request
                        </button>
                        <button
                            onClick={() => onAction("APPROVED")}
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve Application
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const WorkflowNode = ({ label, sub, status, level, isFinal }: any) => {
    const getColors = () => {
        if (status === "APPROVED" || status === "COMPLETED")
            return "bg-emerald-400 text-white border-white ring-emerald-100";
        if (status === "REJECTED")
            return "bg-rose-500 text-white border-white ring-rose-100";
        return "bg-white text-slate-300 border-white ring-transparent";
    };

    return (
        <div className="relative flex flex-col items-center z-10 w-24">
            <div className={`w-8 h-8 rounded-full border-[3px] shadow-sm flex items-center justify-center ring-2 transition-all ${getColors()}`}>
                {status === "APPROVED" || status === "COMPLETED" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                ) : status === "REJECTED" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : level ? (
                    <span className="text-[10px] font-black text-slate-300">{level}</span>
                ) : isFinal ? (
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" />
                ) : (
                    <span className="text-[10px] text-slate-300">•</span>
                )}
            </div>
            <div className="mt-2 text-center">
                <p className="text-[9px] font-black text-slate-700 uppercase tracking-tighter leading-tight line-clamp-2 min-h-4">
                    {label}
                </p>
                <p className={`text-[8px] font-bold uppercase mt-0.5 ${
                    status === "REJECTED" ? "text-rose-500" : "text-slate-400"
                }`}>
                    {sub}
                </p>
            </div>
        </div>
    );
};

export default PermissionDetailModal;