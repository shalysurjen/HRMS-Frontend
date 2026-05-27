import { useEmployee } from "@/features/employee/hooks/useEmployee";
import { LeaveRequestDetails } from "@/features/leave/components/LeaveRequestDetails";
import { useLeave } from "@/features/leave/hooks/useLeave";
import { useAuth } from "@/shared/auth/useAuth";
import { useEffect, useState } from "react";
import { FaTimes, FaCheckCircle, FaInfoCircle } from "react-icons/fa";

const DetailedRequestModal: React.FC<{
    req?: any;
    isOpen: boolean;
    leaveId?: number;
    onClose: () => void;
    onAction: (status: 'APPROVED' | 'REJECTED') => void;
}> = ({ req: initialReq, isOpen, leaveId, onClose, onAction }) => {
    const { fetchEmployeeName } = useEmployee();
    const { fetchLeaveApplicationById } = useLeave();
    const { user } = useAuth();

    const [req, setReq] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [approverNames, setApproverNames] = useState({ l1: "...", l2: "..." });

    useEffect(() => {
        const loadInitialData = async () => {
            if (!isOpen) return;
            setLoading(true);
            try {
                let currentReq = initialReq;
                let remarks: any[] = [];
                let attachments: any[] = [];

                if (leaveId) {
                    const response = await fetchLeaveApplicationById(leaveId);
                    currentReq = response?.leaveApplicationResponseDTO || response;
                    remarks = response?.remarks || [];
                    attachments = response?.attachments || [];
                } else if (initialReq) {
                    remarks = initialReq.remarks || [];
                    attachments = initialReq.attachments || [];
                }

                if (currentReq) {
                    const getName = (res: any) => {
                        if (!res) return "N/A";
                        return typeof res === 'string' ? res : (res.empName || res.name || "Unknown");
                    };

                    const [empRes, res1, res2] = await Promise.all([
                        currentReq.employeeId ? fetchEmployeeName(currentReq.employeeId) : null,
                        currentReq.firstApproverId ? fetchEmployeeName(currentReq.firstApproverId) : null,
                        currentReq.secondApproverId ? fetchEmployeeName(currentReq.secondApproverId) : null,
                    ]);

                    const l1RemarkObj = remarks.find(r => r.approverId === currentReq.firstApproverId);
                    const l2RemarkObj = remarks.find(r => r.approverId === currentReq.secondApproverId);

                    setApproverNames({ l1: getName(res1), l2: getName(res2) });

                    setReq({
                        ...currentReq,
                        employeeName: getName(empRes),
                        attachments,
                        firstApproverComment: l1RemarkObj?.comment || "",
                        firstApproverDate: l1RemarkObj?.decisionDate || null,
                        secondApproverComment: l2RemarkObj?.comment || "",
                        secondApproverDate: l2RemarkObj?.decisionDate || null
                    });
                }
            } catch (error) {
                console.error("Failed to load leave details:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [isOpen, initialReq, leaveId, fetchLeaveApplicationById, fetchEmployeeName]);

    // Check if the user is the current approver AND it's still pending
    const canReview = !!req && !!user && req.currentApproverId === user.id && req.status === 'PENDING';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
                
                {/* Header */}
                <div className="px-8 py-5 border-b flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-900">Leave Application Details</h2>
                            {req?.status && (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                                    req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                    {req.status}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Reference ID: #{req?.id || '---'}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar bg-white">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-semibold tracking-wide animate-pulse">Retrieving Request...</p>
                        </div>
                    ) : req ? (
                        <LeaveRequestDetails req={req} approverNames={approverNames} />
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <FaInfoCircle size={32} className="opacity-20" />
                            <p className="italic text-sm">No request data available.</p>
                        </div>
                    )}
                </div>

                {/* Footer Action Area */}
                <div className="px-8 py-5 bg-slate-50 border-t mt-auto">
                    {canReview ? (
                        <div className="flex items-center gap-4">
                            <button
                                disabled={loading || !req}
                                onClick={() => onAction('REJECTED')}
                                className="flex-1 py-3.5 px-6 bg-white border border-slate-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-[0.98] disabled:opacity-50 text-sm tracking-wide"
                            >
                                DECLINE REQUEST
                            </button>
                            <button
                                disabled={loading || !req}
                                onClick={() => onAction('APPROVED')}
                                className="flex-[2] py-3.5 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-indigo-200 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 text-sm tracking-wide flex items-center justify-center gap-2"
                            >
                                <FaCheckCircle />
                                APPROVE APPLICATION
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 text-slate-500 bg-slate-100/50 py-4 rounded-xl border border-dashed border-slate-300">
                            <FaCheckCircle className={req?.status === 'REJECTED' ? 'text-rose-400' : 'text-emerald-500'} />
                            <span className="text-sm font-semibold uppercase tracking-widest">
                                Decision Recorded
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetailedRequestModal;