import AuthenticatedImage from '@/features/leave/components/AuthenticatedImage';
import DetailedRequestModal from '@/features/leave/components/DetailedRequestModal';
import PermissionDetailModal from '@/features/leave/components/PermissionDetailModal';
import WfhDetailModal from '@/features/leave/components/WfhDetailModal';
import PermissionTile from '@/features/leave/components/PermissionTile';
import RequestTile from '@/features/leave/components/RequestTile';
import { useLeave } from '@/features/leave/hooks/useLeave';
import { useManagerApprovals } from '@/features/leave/hooks/useManagerApprovals';
import type { LeaveDecision } from '@/features/leave/types';
import { notify } from '@/features/notification/utils/notifications';
import { useAuth } from '@/shared/auth/useAuth';
import { CommentDialog, CustomLoader, MetricTile } from '@/shared/components';
import { formatTimeAgo } from '@/shared/utils/formatTimeAgo';
import React, { useEffect, useMemo, useState } from 'react';
import { FaCheckDouble, FaChevronDown, FaDownload, FaFileAlt, FaFileImage, FaSearch, FaTimes } from 'react-icons/fa';

const PendingApprovalsView: React.FC = () => {
    const { user } = useAuth();

    const canSeeDashboardMetrics = true;

    const {
        requests,
        loading,
        handleDecision,
    } = useManagerApprovals(user!.id, user?.role);

    const { teamOnLeave } = useLeave();

    const [searchQuery, setSearchQuery] = useState("");
    const [timeFilter, setTimeFilter] = useState("all");
    const [detailModalReq, setDetailModalReq] = useState<any | null>(null);
    const [permissionModalReq, setPermissionModalReq] = useState<any | null>(null);
    const [wfhModalReq, setWfhModalReq] = useState<any | null>(null);
    const [statusFilter, setStatusFilter] = useState("PENDING");

    useEffect(() => {
        if (user?.id && canSeeDashboardMetrics) {
            // fetchWeeklyLeaveSummary(user.id);
            // fetchTeamOnLeave(user.id);
        }
    }, [user?.id, canSeeDashboardMetrics]);

    const [selectedAttachment, setSelectedAttachment] = useState<any | null>(null);

    const formatDateRange = (start: string, end: string) => {
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit' };
        const startDate = new Date(start).toLocaleDateString('en-US', options);
        const endDate = new Date(end).toLocaleDateString('en-US', options);
        return start === end ? startDate : `${startDate} - ${endDate}`;
    };

    const [dialogConfig, setDialogConfig] = useState<{
        isOpen: boolean;
        req: any;
        status: LeaveDecision | null;
    }>({ isOpen: false, req: null, status: null });

    const onActionTriggered = (req: any, status: LeaveDecision) => {
        setDialogConfig({ isOpen: true, req, status });
    };

    const filteredRequests = useMemo(() => {
        return requests.filter((req) => {
            const matchesStatus = req.status === statusFilter;
            const matchesSearch =
                req.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.leaveTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.reason?.toLowerCase().includes(searchQuery.toLowerCase());

            const createdDate = new Date(req.createdAt);
            const now = new Date();
            let matchesTime = true;

            if (timeFilter === 'today') {
                matchesTime = createdDate.toDateString() === now.toDateString();
            } else if (timeFilter === 'week') {
                const oneWeekAgo = new Date().setDate(now.getDate() - 7);
                matchesTime = createdDate.getTime() >= oneWeekAgo;
            } else if (timeFilter === 'month') {
                matchesTime = createdDate.getMonth() === now.getMonth() &&
                    createdDate.getFullYear() === now.getFullYear();
            }

            return matchesStatus && matchesSearch && matchesTime;
        });
    }, [requests, searchQuery, timeFilter, statusFilter]);

    const pendingCount = useMemo(() =>
        requests.filter(r => r.status === 'PENDING').length,
        [requests]);

    const approvedCount = useMemo(() =>
        requests.filter(r => r.status === 'APPROVED').length,
        [requests]);

    const handleConfirmDecision = async (
        req: any,
        status: LeaveDecision,
        commentText?: string
    ) => {
        const type = req.requestType === 'PERMISSION'
            ? 'PERMISSION'
            : req.leaveTypeName;

        const result = await handleDecision(
            req.id,
            status,
            commentText || (status === 'APPROVED' ? "Approved" : "Rejected"),
            type,
        );

        if (result?.success) {
            notify.leaveAction(status, req.employeeName, !!req.isCompOff, !!req.isOD);
            setDialogConfig({ isOpen: false, req: null, status: null });
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
            <CustomLoader label="Loading pending approvals" />
        </div>
    );

    function handleDownload(_selectedAttachment: any): void {
        throw new Error('Function not implemented.');
    }

    return (
        <div className='flex flex-col gap-4 w-full max-w-full overflow-x-hidden'>

            {/* ── Leave detail modal (unchanged) ──────────────────── */}
            <DetailedRequestModal
                isOpen={!!detailModalReq}
                req={detailModalReq}
                onClose={() => setDetailModalReq(null)}
                onAction={(status) => {
                    const reqToProcess = detailModalReq;
                    setDetailModalReq(null);
                    onActionTriggered(reqToProcess, status);
                }}
            />

            {/* ── WFH detail modal ─────────────────────────────────── */}
            <WfhDetailModal
                isOpen={!!wfhModalReq}
                req={wfhModalReq}
                onClose={() => setWfhModalReq(null)}
                onAction={(status) => {
                    const reqToProcess = wfhModalReq;
                    setWfhModalReq(null);
                    onActionTriggered(reqToProcess, status);
                }}
            />

            {/* ── Permission detail modal (new) ────────────────────── */}
            <PermissionDetailModal
                isOpen={!!permissionModalReq}
                req={permissionModalReq}
                onClose={() => setPermissionModalReq(null)}
                onAction={(status) => {
                    const reqToProcess = permissionModalReq;
                    setPermissionModalReq(null);
                    onActionTriggered(reqToProcess, status as LeaveDecision);
                }}
            />

            {/* ── Comment dialog (unchanged) ───────────────────────── */}
            <CommentDialog
                isOpen={dialogConfig.isOpen}
                onClose={() => setDialogConfig({ isOpen: false, req: null, status: null })}
                title={
                    dialogConfig.status === 'APPROVED'
                        ? `Approve ${dialogConfig.req?.employeeName}'s Request`
                        : `Reject ${dialogConfig.req?.employeeName}'s Request`
                }
                placeholder={
                    dialogConfig.status === 'APPROVED'
                        ? "Add an optional note..."
                        : "Reason for rejection is required..."
                }
                confirmLabel={dialogConfig.status === 'APPROVED' ? 'Confirm Approval' : 'Reject Request'}
                onSubmit={(comment) => handleConfirmDecision(dialogConfig.req, dialogConfig.status!, comment)}
            />

            {/* ── Metrics (unchanged) ─────────────────────────────── */}
            <div className='py-6 w-full bg-[#F1F5F9] px-4 md:px-8 rounded-sm border border-slate-200 shadow-sm'>
                <div className='grid grid-cols-2 md:flex md:flex-row md:justify-between items-center gap-y-8 gap-x-4'>
                    <div className='flex justify-start md:justify-center'>
                        <MetricTile
                            value={pendingCount.toString().padStart(2, '0')}
                            firstLabel="Pending"
                            secondLabel="Approvals"
                        />
                    </div>
                    {canSeeDashboardMetrics && (
                        <>
                            <div className="hidden md:block h-12 w-px bg-slate-300" />
                            <div className='flex justify-start md:justify-center'>
                                <MetricTile
                                    value={approvedCount.toString().padStart(2, '0')}
                                    firstLabel="Total"
                                    secondLabel="Approved"
                                />
                            </div>
                            <div className="hidden md:block h-12 w-px bg-slate-300" />
                            <div className='col-span-2 md:col-span-1 flex justify-center md:justify-end border-t border-slate-200 pt-6 md:border-none md:pt-0'>
                                <MetricTile
                                    value={(teamOnLeave?.length || 0).toString().padStart(2, '0')}
                                    firstLabel="Members"
                                    secondLabel="Out Today"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Filters (unchanged) ─────────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-3 items-center w-full">
                <div className="relative flex-1 w-full">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Search employee or leave type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-[#F1F5F9] border border-slate-200 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                </div>
                <div className="relative w-full md:w-48 group">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-sm text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer transition-all shadow-sm"
                    >
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <FaChevronDown size={12} />
                    </div>
                </div>
                <div className="relative w-full md:w-48 group">
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-sm text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer transition-all shadow-sm"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <FaChevronDown size={12} />
                    </div>
                </div>
            </div>

            {/* ── Request List ─────────────────────────────────────── */}
            <div className='flex flex-col gap-3 bg-[#F1F5F9] py-4 px-2 md:px-4 rounded-sm border border-slate-200'>
                {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                        <div
                            key={req.id}
                            className="transition-transform active:scale-[0.99]"
                        >
                            {/* ── WFH tile ─────────────────────────────── */}
                            {req.requestType === 'WFH' ? (
                                <div
                                    onClick={() => setWfhModalReq(req)}
                                    className="cursor-pointer"
                                >
                                    <RequestTile
                                        key={req.id}
                                        status={req.status}
                                        employeeName={req.employeeName}
                                        leaveType={"WFH" as any}
                                        reasonMessage={req.reason || "Work From Home"}
                                        dateRange={formatDateRange(req.startDate, req.endDate)}
                                        startDate={req.startDate}
                                        endDate={req.endDate}
                                        startDateHalfDayType={req.startDateHalfDayType}
                                        endDateHalfDayType={req.endDateHalfDayType}
                                        days={req.totalDays ?? req.days}
                                        createdAt={formatTimeAgo(req.createdAt)}
                                        onAccept={() => onActionTriggered(req, 'APPROVED')}
                                        onReject={() => onActionTriggered(req, 'REJECTED')}
                                        attachments={[]}
                                    />
                                </div>
                            ) : req.requestType === 'PERMISSION' ? (
                                <div
                                    onClick={() => setPermissionModalReq(req)}
                                    className="cursor-pointer"
                                >
                                    <PermissionTile
                                        employeeName={req.employeeName}
                                        permissionDate={req.permissionDate}
                                        startTime={req.startTime}
                                        endTime={req.endTime}
                                        durationFormatted={req.durationFormatted}
                                        reason={req.reason}
                                        createdAt={formatTimeAgo(req.createdAt)}
                                        status={req.status}
                                        onAccept={() => onActionTriggered(req, 'APPROVED')}
                                        onReject={() => onActionTriggered(req, 'REJECTED')}
                                    />
                                </div>
                            ) : (
                                /* ── Leave tile (unchanged) ─────────────── */
                                <div
                                    onClick={() => setDetailModalReq(req)}
                                    className="cursor-pointer"
                                >
                                    <RequestTile
                                        key={req.id}
                                        status={req.status}
                                        employeeName={req.employeeName}
                                        leaveType={req.leaveTypeName}
                                        reasonMessage={req.isCompOff ? "Comp-Off Credit Request" : req.reason}
                                        dateRange={formatDateRange(req.startDate, req.endDate)}
                                        startDate={req.startDate}
                                        endDate={req.endDate}
                                        startDateHalfDayType={req.startDateHalfDayType || req.halfDayType}
                                        endDateHalfDayType={req.endDateHalfDayType}
                                        days={req.days}
                                        createdAt={formatTimeAgo(req.createdAt)}
                                        onAccept={() => onActionTriggered(req, 'APPROVED')}
                                        onReject={() => onActionTriggered(req, 'REJECTED')}
                                        attachments={req.attachments}
                                        onViewAttachment={(attachment) => setSelectedAttachment(attachment)}
                                    />
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="py-16 bg-white rounded-sm border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                        <FaCheckDouble className="mb-3 opacity-20 text-4xl" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                            {searchQuery ? "No matches found" : "Everything Caught Up"}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Attachment modal (unchanged) ─────────────────────── */}
            {selectedAttachment && (
                <div className="fixed inset-0 z-2000 flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        onClick={() => setSelectedAttachment(null)}
                    />
                    <div className="relative max-w-5xl w-full bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 transform transition-all scale-100">
                        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <FaFileImage size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 leading-none">{selectedAttachment.fileName}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Leave Application Attachment</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownload(selectedAttachment)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-md active:scale-95"
                                >
                                    <FaDownload size={14} />
                                    Download
                                </button>
                                <button
                                    onClick={() => setSelectedAttachment(null)}
                                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-8 flex justify-center items-center bg-linear-to-b from-slate-50 to-slate-100 min-h-100 max-h-[80vh] overflow-auto">
                            {selectedAttachment.fileType.includes('image') ? (
                                <div className="relative group">
                                    <AuthenticatedImage
                                        fileUrl={selectedAttachment.fileUrl}
                                        className="max-h-[65vh] w-auto object-contain rounded-xl shadow-2xl border-4 border-white transition-transform duration-500 group-hover:scale-[1.01]"
                                    />
                                </div>
                            ) : (
                                <div className="text-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm">
                                    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FaFileAlt size={40} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Document Preview</h4>
                                    <p className="text-slate-500 text-sm mb-6">We can't preview this file type directly, but you can download it to view.</p>
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

export default PendingApprovalsView;