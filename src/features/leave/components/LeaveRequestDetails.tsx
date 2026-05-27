import AuthenticatedImage from "@/features/leave/components/AuthenticatedImage";
import { formatDateDisplay } from "@/shared/utils/dateUtils";
import api from "@/services/apiClient";
import React, { useState } from 'react';
import { FaCommentAlt, FaFileAlt, FaFileImage, FaDownload, FaTimes } from "react-icons/fa";

interface LeaveRequestDetailsProps {
    req: any;
    approverNames: { l1: string; l2: string };
    onViewFile?: (file: any) => void;
}

export const LeaveRequestDetails: React.FC<LeaveRequestDetailsProps> = ({ req, approverNames, onViewFile }) => {
    const [selectedAttachment, setSelectedAttachment] = useState<any | null>(null);
    const showSecondLevel = !!req.secondApproverId;
    const attachments = req.attachments || [];

    // Internal handler for previewing
    const handlePreview = (file: any) => {
        setSelectedAttachment(file);
        if (onViewFile) onViewFile(file);
    };

    const handleDownload = (file: any) => {
        // Construct download URL based on your API structure
        const downloadUrl = `${api.defaults.baseURL}/files/download/${file.fileName}`;
        window.open(downloadUrl, '_blank');
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Row 1: Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-slate-50 pb-6">
                <DetailItem label="Employee Name" value={req.employeeName} subValue={req.employeeId} />
                <DetailItem label="Leave Type" value={req.leaveTypeName} className="text-indigo-600" />
                <DetailItem label="Created At" value={formatDateDisplay(req.createdAt)} className="text-indigo-600" />
                <DetailItem
                    label="Period"
                    value={
                        formatDateDisplay(req.startDate) === formatDateDisplay(req.endDate)
                            ? formatDateDisplay(req.startDate)
                            : `${formatDateDisplay(req.startDate)} to ${formatDateDisplay(req.endDate)}`
                    }
                    subValue={`${req.days} Day(s) Total`}
                />
            </div>

            {/* Row 2: Workflow & Reason */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 flex flex-col gap-2 h-full">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                        Reason for Leave
                    </p>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-25 h-full">
                        <p className="text-sm text-slate-700 leading-relaxed italic wrap-break-word whitespace-pre-wrap">
                            "{req.reason || 'No reason provided'}"
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center lg:text-left">
                        Approval Workflow
                    </h4>
                    <div className="relative flex justify-between items-start w-full px-2 pt-2">
                        <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-100 z-0 mx-8" />
                        <div
                            className="absolute top-6 left-0 h-0.5 bg-emerald-400 transition-all duration-700 ease-in-out z-0 mx-8"
                            style={{
                                width:
                                    req.status === 'APPROVED' ? 'calc(100% - 4rem)' :
                                        req.status === 'REJECTED' ? '0%' :
                                            req.secondApproverDecision === 'APPROVED' ? 'calc(100% - 4rem)' :
                                                req.firstApproverDecision === 'APPROVED' ? (showSecondLevel ? '50%' : 'calc(100% - 4rem)') :
                                                    '0%'
                            }}
                        />
                        <WorkflowStep label="Applied" subLabel={formatDateDisplay(req.createdAt)} isComplete />
                        <WorkflowStep label={approverNames.l1} subLabel={req.firstApproverDecision || 'Pending'} status={req.firstApproverDecision} shortLabel="L1" />
                        {showSecondLevel && (
                            <WorkflowStep label={approverNames.l2} subLabel={req.secondApproverDecision || (req.firstApproverDecision === 'APPROVED' ? 'Waiting' : 'Locked')} status={req.secondApproverDecision} shortLabel="L2" />
                        )}
                        <WorkflowStep label="Outcome" subLabel={req.status} status={req.status} isFinal />
                    </div>
                </div>
            </div>

            {/* Reviewer Remarks */}
            {(req.firstApproverComment || req.secondApproverComment) && (
                <div className="space-y-3 pt-4 border-t border-slate-50">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FaCommentAlt size={10} className="text-indigo-400" /> Reviewer Remarks
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {req.firstApproverComment && (
                            <RemarkBubble name={approverNames.l1} role="Level 1" comment={req.firstApproverComment} date={req.firstApproverDate} />
                        )}
                        {req.secondApproverComment && (
                            <RemarkBubble name={approverNames.l2} role="Level 2" comment={req.secondApproverComment} date={req.secondApproverDate} />
                        )}
                    </div>
                </div>
            )}

            {/* Secure Document Preview Section */}
            {attachments.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-50">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FaFileAlt size={10} className="text-indigo-400" /> Supporting Documents
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {attachments.map((file: any, index: number) => {
                            const isImage = file.fileType?.toLowerCase().includes('image') ||
                                ['jpg', 'jpeg', 'png'].some(ext => file.fileUrl?.toLowerCase().endsWith(ext));

                            return (
                                <div
                                    key={index}
                                    onClick={() => handlePreview(file)}
                                    className="group flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-300 hover:bg-white transition-all cursor-pointer shadow-xs"
                                >
                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                                        {isImage ? (
                                            <AuthenticatedImage
                                                fileUrl={file.fileUrl}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                            />
                                        ) : (
                                            <FaFileAlt className="text-slate-300" size={16} />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                                            {file.fileName}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                                            Click to Preview
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- ATTACHMENT MODAL INTEGRATION --- */}
            {selectedAttachment && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
                        onClick={() => setSelectedAttachment(null)} 
                    />

                    <div className="relative max-w-5xl w-full bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 transform transition-all animate-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    {selectedAttachment.fileType?.includes('image') ? <FaFileImage size={18} /> : <FaFileAlt size={18} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 leading-none truncate max-w-[200px] md:max-w-xs">
                                        {selectedAttachment.fileName}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">Leave Application Attachment</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownload(selectedAttachment)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-md active:scale-95"
                                >
                                    <FaDownload size={14} /> Download
                                </button>
                                <button
                                    onClick={() => setSelectedAttachment(null)}
                                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 flex justify-center items-center bg-gradient-to-b from-slate-50 to-slate-100 min-h-[300px] max-h-[75vh] overflow-auto">
                            {selectedAttachment.fileType?.includes('image') || ['jpg', 'jpeg', 'png'].some(ext => selectedAttachment.fileUrl?.toLowerCase().endsWith(ext)) ? (
                                <div className="relative group">
                                    <AuthenticatedImage
                                        fileUrl={selectedAttachment.fileUrl}
                                        className="max-h-[60vh] w-auto object-contain rounded-xl shadow-2xl border-4 border-white transition-transform duration-500"
                                    />
                                </div>
                            ) : (
                                <div className="text-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm">
                                    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FaFileAlt size={40} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Document Preview</h4>
                                    <p className="text-slate-500 text-sm mb-6">Previews aren't available for this file type, but you can download it to view.</p>
                                    <button
                                        onClick={() => handleDownload(selectedAttachment)}
                                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                                    >
                                        Download File
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENTS ---

const RemarkBubble = ({ name, role, comment, date }: any) => (
    <div className="bg-indigo-50/40 border border-indigo-100/50 p-3 rounded-xl">
        <div className="flex justify-between items-start mb-1">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-indigo-900">{name}</span>
                <span className="text-[9px] font-black text-indigo-300 uppercase leading-none">{role}</span>
            </div>
            {date && (
                <span className="text-[8px] font-medium text-gray-800 bg-brand/20 px-2 py-0.5 rounded-full border border-slate-100 shrink-0">
                    {formatDateDisplay(date)}
                </span>
            )}
        </div>
        <p className="text-xs text-indigo-700 leading-snug mt-1.5 italic">"{comment}"</p>
    </div>
);

const DetailItem = ({ label, value, subValue, className = "" }: any) => (
    <div className="flex flex-col">
        <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">{label}</p>
        <p className={`text-sm text-slate-800 font-bold ${className}`}>{value || "N/A"}</p>
        {subValue && <p className="text-[11px] text-slate-500 font-medium mt-0.5">{subValue}</p>}
    </div>
);

const WorkflowStep = ({ label, subLabel, status, isComplete, isFinal, shortLabel }: any) => {
    const isApproved = status === 'APPROVED' || isComplete;
    const isRejected = status === 'REJECTED';

    return (
        <div className="relative flex flex-col items-center z-10 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-full border-[3px] border-white shadow-sm flex items-center justify-center transition-all duration-300 shrink-0
                ${isApproved ? 'bg-emerald-400 text-white' : isRejected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                {isApproved ? <span className="text-xs font-bold">✓</span> : isFinal ? <span className="text-xs">!</span> : <span className="text-[10px] font-bold">{shortLabel || 'A'}</span>}
            </div>

            <div className="mt-2 text-center w-full px-1">
                <p className="text-[9px] font-black text-slate-700 leading-tight wrap-break-word">
                    {label}
                </p>
                <p className={`text-[8px] font-bold mt-0.5 tracking-tighter ${isRejected ? 'text-rose-500' : 'text-slate-400'}`}>
                    {subLabel}
                </p>
            </div>
        </div>
    );
};