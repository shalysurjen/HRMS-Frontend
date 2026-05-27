import { useEmployee } from "@/features/employee/hooks/useEmployee";
import EditLeaveModal from "@/features/leave/components/EditLeaveModal";
import { useLeave } from "@/features/leave/hooks/useLeave";
import { useLeaveAction } from "@/features/leave/hooks/useLeaveActions";
import type { LeaveRecord } from "@/features/leave/types";
import { permissionService } from "@/features/leave/services/permissionService";
import { wfhService } from "@/features/leave/services/wfhService";
import { useAuth } from "@/shared/auth/useAuth";
import { CustomLoader } from "@/shared/components";
import { formatTimeAgo } from "@/shared/utils/formatTimeAgo";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaCalendarAlt, FaEdit, FaEllipsisV, FaInfoCircle, FaTimes, FaUserCheck } from "react-icons/fa";
import { HiOutlineClock, HiOutlinePaperClip } from "react-icons/hi2";

const MyRequestsView: React.FC = () => {
  const { fetchMyLeaves } = useLeave();
  const { cancelLeave, editLeave, loading } = useLeaveAction();
  const { user } = useAuth();
  const [history, setHistory] = useState<LeaveRecord[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [wfhRequests, setWfhRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [editingLeave, setEditingLeave] = useState<LeaveRecord | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingPermission, setEditingPermission] = useState<any | null>(null);
  const [editingWfh, setEditingWfh] = useState<any | null>(null);

  const accordionVariants: Variants = {
    open: { height: "auto", opacity: 1, transition: { height: { duration: 0.3, ease: "easeOut" }, opacity: { duration: 0.2, delay: 0.1 } } },
    collapsed: { height: 0, opacity: 0, transition: { height: { duration: 0.3, ease: "easeIn" }, opacity: { duration: 0.1 } } }
  };

  const loadAllHistory = async () => {
    if (!user?.id) return;
    try {
      const [leavesData, permissionsData, wfhData] = await Promise.all([
        fetchMyLeaves(user.id),
        permissionService.getMyPermissions(user.id).catch(() => []),
        wfhService.getMyApplications(user.id).catch(() => []),
      ]);
      setHistory([...(leavesData || [])]);
      setPermissions(permissionsData || []);
      setWfhRequests(wfhData || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  useEffect(() => {
    loadAllHistory();
  }, [user?.id]);

  useEffect(() => {
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  // ── Existing leave handlers (unchanged) ────────────────────────
  const handleCancel = async (id: number) => {
    if (!user?.id) return;
    const success = await cancelLeave(id, user.id);
    if (success) loadAllHistory();
  };

  const handleSaveEdit = async (formData: Partial<LeaveRecord>) => {
    if (!user?.id || !editingLeave) return;
    const success = await editLeave(editingLeave.id, { ...formData, employeeId: user.id });
    if (success) {
      loadAllHistory();
      setEditingLeave(null);
    }
  };

  // ── WFH cancel handler ────────────────────────────────────────
  const handleWfhCancel = async (id: number) => {
    if (!user?.id) return;
    try {
      await wfhService.cancelWfh(id, user.id);
      await loadAllHistory();
    } catch (err) {
      console.error("Failed to cancel WFH:", err);
    }
  };

  // ── WFH save-edit handler ─────────────────────────────────────
  const handleWfhSaveEdit = async (formData: {
    startDate: string;
    endDate: string;
    startDateHalfDayType: string | null;
    endDateHalfDayType: string | null;
    reason: string;
    attachment?: File | null;
  }) => {
    if (!user?.id || !editingWfh) return;
    const fd = new FormData();
    fd.append("employeeId", user.id);
    fd.append("startDate", formData.startDate);
    fd.append("endDate", formData.endDate);
    if (formData.startDateHalfDayType) fd.append("startDateHalfDayType", formData.startDateHalfDayType);
    if (formData.endDateHalfDayType) fd.append("endDateHalfDayType", formData.endDateHalfDayType);
    fd.append("reason", formData.reason);
    if (formData.attachment) fd.append("attachment", formData.attachment);
    try {
      await wfhService.editWfh(editingWfh.id, fd);
      await loadAllHistory();
      setEditingWfh(null);
    } catch (err) {
      console.error("Failed to edit WFH:", err);
      throw err;
    }
  };

  // ── Permission cancel handler ──────────────────────────────────
  const handlePermissionCancel = async (id: number) => {
    if (!user?.id) return;
    try {
      await permissionService.cancelPermission(id, user.id);
      await loadAllHistory();
    } catch (err) {
      console.error("Failed to cancel permission:", err);
    }
};

  // ── Permission save-edit handler ───────────────────────────────
  const handlePermissionSaveEdit = async (formData: {
    permissionDate: string;
    startTime: string;
    endTime: string;
    reason: string;
  }) => {
    if (!user?.id || !editingPermission) return;
    try {
      await permissionService.editPermission(editingPermission.id, {
        employeeId: user.id,
        ...formData,
      });
      await loadAllHistory();
      setEditingPermission(null);
    } catch (err) {
      console.error("Failed to edit permission:", err);
    }
  };

  // ── Existing leave processing (unchanged) ──────────────────────
  const filteredLeaves = useMemo(() => {
    let list = [...history];
    if (statusFilter !== "ALL") {
      list = list.filter((item) => item.status === statusFilter);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list.map((item) => {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      const isSameDay = item.startDate === item.endDate;
      let calculatedDays = item.days || 0;
      if (calculatedDays === 0) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
      const durationLabel = calculatedDays < 1
        ? "Half Day"
        : `${calculatedDays} ${calculatedDays === 1 ? 'Day' : 'Days'}`;
      const dateOptions: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
      const displayRange = isSameDay
        ? start.toLocaleDateString("en-GB", dateOptions)
        : `${start.toLocaleDateString("en-GB", dateOptions)} - ${end.toLocaleDateString("en-GB", dateOptions)}`;

      return {
        ...item,
        days: calculatedDays,
        durationLabel,
        displayType: item.leaveTypeName ? item.leaveTypeName : "N/A",
        displayRange,
        requestType: "LEAVE",
      };
    });
  }, [history, statusFilter]);

  // ── Permission processing (unchanged) ─────────────────────────
  const filteredPermissions = useMemo(() => {
    let list = [...permissions];
    if (statusFilter !== "ALL") {
      list = list.filter((item) => item.status === statusFilter);
    }
    return list.map((item) => ({
      ...item,
      displayType: "PERMISSION",
      displayRange: item.permissionDate,
      durationLabel: item.durationFormatted,
      requestType: "PERMISSION",
    }));
  }, [permissions, statusFilter]);

  // ── WFH processing ─────────────────────────────────────────────
  const filteredWfh = useMemo(() => {
    let list = [...wfhRequests];
    if (statusFilter !== "ALL") {
      list = list.filter((item) => item.status === statusFilter);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.map((item) => {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      const isSameDay = item.startDate === item.endDate;
      const dateOptions: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
      const displayRange = isSameDay
        ? start.toLocaleDateString("en-GB", dateOptions)
        : `${start.toLocaleDateString("en-GB", dateOptions)} - ${end.toLocaleDateString("en-GB", dateOptions)}`;
      return {
        ...item,
        displayType: "WFH",
        displayRange,
        durationLabel: `${item.totalDays} ${item.totalDays === 1 ? "Day" : "Days"}`,
        requestType: "WFH",
        leaveTypeName: "WFH",
      };
    });
  }, [wfhRequests, statusFilter]);

  // ── Merge and sort both (unchanged) ───────────────────────────
  const filteredHistory = useMemo(() => {
    return [...filteredLeaves, ...filteredPermissions, ...filteredWfh].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredLeaves, filteredPermissions, filteredWfh]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <CustomLoader label="Syncing Records" />
    </div>
  );

  // ── Actions column renderer ────────────────────────────────────
  const renderActions = (item: any) => {
    if (item.status === 'PENDING') {
      return (
        <ActionMenu
          item={item}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          onEdit={() => {
            setActiveMenu(null);
            if (item.requestType === 'PERMISSION') {
              setEditingPermission(item);
            } else if (item.requestType === 'WFH') {
              setEditingWfh(item);
            } else {
              setEditingLeave(item as LeaveRecord);
            }
          }}
          onCancel={() => {
            setActiveMenu(null);
            if (item.requestType === 'PERMISSION') {
              handlePermissionCancel(item.id);
            } else if (item.requestType === 'WFH') {
              handleWfhCancel(item.id);
            } else {
              handleCancel(item.id);
            }
          }}
        />
      );
    }
    return (
      <span className="text-slate-300 text-[10px] font-bold uppercase tracking-tighter">
        Finalized
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      <header className="px-1 md:px-0">
        <h3 className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Track Leaves and OD Requests</h3>
        <div className="mt-4 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex bg-slate-100 p-1 rounded-sm w-max md:w-full">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-6 py-2 rounded-sm text-xs font-black transition-all snap-start ${statusFilter === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── MOBILE VIEW ─────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        <AnimatePresence initial={false}>
          {filteredHistory.map((item) => (
            <motion.div
              layout
              key={`${item.requestType}-${item.id}`}
              className={`bg-white rounded-sm border overflow-hidden transition-colors ${expandedId === item.id ? 'border-indigo-300 ring-1 ring-indigo-50' : 'border-slate-200 shadow-sm'}`}
            >
              <div className="p-4 cursor-pointer active:bg-slate-50" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0">
                    <span className={`text-[9px] font-black uppercase block mb-0.5 tracking-wider ${
                      item.requestType === 'PERMISSION'
                        ? 'text-violet-500'
                        : item.requestType === 'WFH'
                        ? 'text-teal-500'
                        : item.leaveTypeName === 'ON_DUTY'
                        ? 'text-amber-500'
                        : 'text-indigo-500'
                    }`}>
                      {item.displayType}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {item.requestType === 'PERMISSION'
                        ? item.durationLabel
                        : item.requestType === 'WFH'
                        ? `${item.durationLabel} WFH`
                        : `${item.durationLabel} ${item.leaveTypeName === 'ON_DUTY' ? 'OD' : 'Leave'}`}
                    </h3>
                    {item.requestType === 'PERMISSION' && (
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                        <HiOutlineClock size={11} />
                        {item.startTime} – {item.endTime}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={item.status} />
                    {item.status === 'PENDING' && (
                      <ActionMenu
                        item={item}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        onEdit={() => {
                          setActiveMenu(null);
                          if (item.requestType === 'PERMISSION') {
                            setEditingPermission(item);
                          } else if (item.requestType === 'WFH') {
                            setEditingWfh(item);
                          } else {
                            setEditingLeave(item as LeaveRecord);
                          }
                        }}
                        onCancel={() => {
                          setActiveMenu(null);
                          if (item.requestType === 'PERMISSION') {
                            handlePermissionCancel(item.id);
                          } else if (item.requestType === 'WFH') {
                            handleWfhCancel(item.id);
                          } else {
                            handleCancel(item.id);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FaCalendarAlt className="text-slate-400 shrink-0" size={12} />
                    <span className="text-xs font-bold uppercase tracking-tight">{item.displayRange}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatTimeAgo(item.createdAt)}</span>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {expandedId === item.id && (
                  <motion.div key="content" variants={accordionVariants} initial="collapsed" animate="open" exit="collapsed" className="bg-slate-50 border-t border-slate-100">
                    <div className="p-4">
                      {item.requestType === 'PERMISSION'
                        ? <PermissionDetailContent item={item} />
                        : item.requestType === 'WFH'
                        ? <WfhDetailContent item={item} />
                        : <DetailContent item={item} />
                      }
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── DESKTOP VIEW ────────────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-sm border border-slate-200 overflow-visible">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase">Type</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase">Duration</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase">Date Range</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase text-right">Actions</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase">Applied</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHistory.map((item) => (
              <React.Fragment key={`${item.requestType}-${item.id}`}>
                <tr
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className={`transition-colors cursor-pointer ${expandedId === item.id ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`}
                >
                  <td className={`px-6 py-4 font-bold uppercase text-xs ${
                    item.requestType === 'PERMISSION'
                      ? 'text-violet-600'
                      : item.requestType === 'WFH'
                      ? 'text-teal-600'
                      : item.leaveTypeName === 'ON_DUTY'
                      ? 'text-amber-600'
                      : 'text-slate-900'
                  }`}>
                    {item.displayType}
                  </td>

                  <td className="px-6 py-4 text-indigo-600 font-bold text-sm">
                    {item.durationLabel}
                    {item.requestType === 'PERMISSION' && (
                      <span className="block text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                        <HiOutlineClock size={10} />
                        {item.startTime} – {item.endTime}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-slate-600 text-xs font-bold">
                    {item.displayRange}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {renderActions(item)}
                  </td>

                  <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">
                    {formatTimeAgo(item.createdAt)}
                  </td>
                </tr>

                <tr>
                  <td colSpan={6} className="p-0 border-none">
                    <AnimatePresence initial={false}>
                      {expandedId === item.id && (
                        <motion.div
                          variants={accordionVariants}
                          initial="collapsed"
                          animate="open"
                          exit="collapsed"
                          className="overflow-hidden bg-slate-50/50 shadow-inner"
                        >
                          <div className="px-6 py-8">
                            {item.requestType === 'PERMISSION'
                              ? <PermissionDetailContent item={item} />
                              : item.requestType === 'WFH'
                              ? <WfhDetailContent item={item} />
                              : <DetailContent item={item} />
                            }
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Existing leave edit modal (unchanged) ─────────────────── */}
      <EditLeaveModal
        isOpen={!!editingLeave}
        leave={editingLeave}
        onClose={() => setEditingLeave(null)}
        onSave={handleSaveEdit}
      />

      {/* ── Permission edit modal ──────────────────────────────────── */}
      <EditPermissionModal
        isOpen={!!editingPermission}
        permission={editingPermission}
        onClose={() => setEditingPermission(null)}
        onSave={handlePermissionSaveEdit}
      />

      {/* ── WFH edit modal ────────────────────────────────────────── */}
      <EditWfhModal
        isOpen={!!editingWfh}
        wfh={editingWfh}
        onClose={() => setEditingWfh(null)}
        onSave={handleWfhSaveEdit}
      />
    </div>
  );
};

// ── PERMISSION: Derive true outcome from individual decisions ─────
const derivePermissionOutcome = (
  firstDecision: string | null | undefined,
  secondDecision: string | null | undefined,
  secondApproverId: any
): string => {
  if (firstDecision === "REJECTED" || secondDecision === "REJECTED") return "REJECTED";
  const hasSecondApprover = !!secondApproverId;
  if (!hasSecondApprover) {
    return firstDecision === "APPROVED" ? "APPROVED" : "PENDING";
  }
  if (firstDecision === "APPROVED" && secondDecision === "APPROVED") return "APPROVED";
  return "PENDING";
};

const derivePermissionProgressWidth = (
  firstDecision: string | null | undefined,
  secondApproverId: any,
  derivedOutcome: string
): string => {
  if (derivedOutcome === "APPROVED" || derivedOutcome === "REJECTED") return "calc(100% - 32px)";
  if (firstDecision === "APPROVED" && !!secondApproverId) return "50%";
  return "0%";
};

const getPermissionL1Label = (decision: string | null | undefined): string => {
  if (decision === "APPROVED") return "Approved";
  if (decision === "REJECTED") return "Rejected";
  return "Pending";
};

const getPermissionL2Label = (
  firstDecision: string | null | undefined,
  secondDecision: string | null | undefined
): string => {
  if (!firstDecision || firstDecision === "PENDING") return "Waiting";
  if (secondDecision === "APPROVED") return "Approved";
  if (secondDecision === "REJECTED") return "Rejected";
  return "Pending";
};

const getPermissionNodeStatus = (decision: string | null | undefined): string | null => {
  if (decision === "APPROVED") return "APPROVED";
  if (decision === "REJECTED") return "REJECTED";
  return null;
};

// ── Edit Permission Modal ─────────────────────────────────────────
const EditPermissionModal = ({
  isOpen,
  permission,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  permission: any | null;
  onClose: () => void;
  onSave: (data: {
    permissionDate: string;
    startTime: string;
    endTime: string;
    reason: string;
  }) => Promise<void>;
}) => {
  const [permissionDate, setPermissionDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (permission) {
      setPermissionDate(permission.permissionDate || '');
      setStartTime(permission.startTime || '');
      setEndTime(permission.endTime || '');
      setReason(permission.reason || '');
      setError('');
    }
  }, [permission]);

  // ── Auto-calculate total hours ─────────────────────────────────
  const totalHours = useMemo(() => {
    if (!startTime || !endTime) return '';
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const totalMins = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMins <= 0) return '';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m} mins`;
    if (m === 0) return `${h} hr${h > 1 ? 's' : ''}`;
    return `${h} hr${h > 1 ? 's' : ''} ${m} mins`;
  }, [startTime, endTime]);

  const handleSave = async () => {
    if (!permissionDate) { setError('Please select a date.'); return; }
    if (!startTime) { setError('Please enter start time.'); return; }
    if (!endTime) { setError('Please enter end time.'); return; }
    if (!totalHours) { setError('End time must be after start time.'); return; }
    if (!reason.trim()) { setError('Please enter a reason.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({ permissionDate, startTime, endTime, reason: reason.trim() });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !permission) return null;

  // ── Generate hour and minute options for selects ───────────────
  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, '0')
  );
  const minuteOptions = ['00', '15', '30', '45'];

  const startHH = startTime.split(':')[0] || '09';
  const startMM = startTime.split(':')[1] || '00';
  const endHH = endTime.split(':')[0] || '10';
  const endMM = endTime.split(':')[1] || '00';

  const handleStartChange = (hh: string, mm: string) => setStartTime(`${hh}:${mm}`);
  const handleEndChange = (hh: string, mm: string) => setEndTime(`${hh}:${mm}`);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-md border border-slate-200">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
                  Edit Permission Request
                </h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-sm hover:bg-slate-100"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-5">

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Date
                  </label>
                  <input
                    type="date"
                    value={permissionDate}
                    onChange={(e) => setPermissionDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-sm text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50"
                  />
                </div>

                {/* Start Time + End Time — FIXED: HH MM dropdowns ──── */}
                <div className="grid grid-cols-2 gap-4">

                  {/* Start Time */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Start Time
                    </label>
                    <div className="flex items-center gap-1 border border-slate-200 rounded-sm bg-slate-50 px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
                      {/* Hours */}
                      <select
                        value={startHH}
                        onChange={(e) => handleStartChange(e.target.value, startMM)}
                        className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        {hourOptions.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="text-slate-400 font-black text-sm">:</span>
                      {/* Minutes */}
                      <select
                        value={startMM}
                        onChange={(e) => handleStartChange(startHH, e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        {minuteOptions.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* End Time */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      End Time
                    </label>
                    <div className="flex items-center gap-1 border border-slate-200 rounded-sm bg-slate-50 px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
                      {/* Hours */}
                      <select
                        value={endHH}
                        onChange={(e) => handleEndChange(e.target.value, endMM)}
                        className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        {hourOptions.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="text-slate-400 font-black text-sm">:</span>
                      {/* Minutes */}
                      <select
                        value={endMM}
                        onChange={(e) => handleEndChange(endHH, e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        {minuteOptions.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Total Hours — auto-calculated, read-only */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Total Hours
                  </label>
                  <div className={`w-full px-4 py-3 border rounded-sm text-sm font-black transition-all ${
                    totalHours
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 bg-slate-100 text-slate-400'
                  }`}>
                    {totalHours || '—'}
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Reason for Permission
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-sm text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none bg-slate-50"
                  />
                </div>

                {/* Inline error */}
                {error && (
                  <p className="text-[11px] font-bold text-rose-500 bg-rose-50 border border-rose-200 px-3 py-2 rounded-sm">
                    {error}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Permission Detail Content ─────────────────────────────────────
const PermissionDetailContent = ({ item }: { item: any }) => {
  const { fetchEmployeeName } = useEmployee();
  const [firstApproverName, setFirstApproverName] = useState<string>("Loading...");
  const [secondApproverName, setSecondApproverName] = useState<string>("");

  useEffect(() => {
    const resolveNames = async () => {
      try {
        if (item.firstApproverId) {
          const r = await fetchEmployeeName(item.firstApproverId);
          setFirstApproverName(r?.empName || item.firstApproverId);
        }
        if (item.secondApproverId) {
          const r = await fetchEmployeeName(item.secondApproverId);
          setSecondApproverName(r?.empName || item.secondApproverId);
        }
      } catch {
        setFirstApproverName(item.firstApproverId || "Unknown");
      }
    };
    resolveNames();
  }, [item.firstApproverId, item.secondApproverId]);

  const showSecondLevel = !!item.secondApproverId && item.firstApproverDecision !== 'REJECTED';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const derivedOutcome = derivePermissionOutcome(
    item.firstApproverDecision,
    item.secondApproverDecision,
    item.secondApproverId
  );

  const progressWidth = derivePermissionProgressWidth(
    item.firstApproverDecision,
    item.secondApproverId,
    derivedOutcome
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_0.7fr_1.3fr] gap-6">
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
          <FaInfoCircle className="text-indigo-400" /> Request Details
        </h4>
        <div className="bg-white p-3 rounded-sm border border-slate-200 shadow-sm min-h-[80px] flex flex-col justify-between">
          <p className="text-xs text-slate-600 leading-relaxed italic">
            {item.reason ? `"${item.reason}"` : "No reason provided."}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-violet-50 text-violet-600 text-[9px] font-black px-2 py-0.5 rounded-sm uppercase border border-violet-100 flex items-center gap-1">
              <HiOutlineClock size={9} />
              {item.startTime} – {item.endTime}
            </span>
            <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-sm uppercase border border-indigo-100">
              {item.durationFormatted}
            </span>
          </div>
        </div>
        {(derivedOutcome === 'REJECTED' || item.rejectionReason) && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-sm">
            <h5 className="text-[9px] font-black text-rose-600 uppercase tracking-tighter mb-1">
              Reason for Rejection
            </h5>
            <p className="text-xs font-bold text-rose-900 leading-normal whitespace-pre-wrap">
              {item.rejectionReason || "No specific reason provided."}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
          Dates
        </h4>
        <div className="bg-white rounded-sm border border-slate-200 divide-y divide-slate-100 shadow-sm h-fit">
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase">Date</span>
            <span className="text-[11px] font-bold text-slate-700">{item.permissionDate}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase">Start</span>
            <span className="text-[11px] font-bold text-slate-700">{item.startTime}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase">End</span>
            <span className="text-[11px] font-bold text-slate-700">{item.endTime}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center bg-slate-50/50">
            <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
            <span className="text-[11px] font-black text-indigo-600">{item.durationFormatted}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
          <FaUserCheck className="text-emerald-400" /> Approval Workflow
        </h4>
        <div className="bg-slate-50/30 border border-slate-200 rounded-sm p-4 h-[125px] flex flex-col justify-center shadow-inner relative overflow-hidden">
          <div className="relative flex justify-between items-start w-full mx-auto px-2">
            <div className="absolute top-4 left-4 right-4 h-1 bg-slate-200 rounded-full z-0" />
            <div
              className={`absolute top-4 left-4 h-1 rounded-full transition-all duration-700 z-0 ${
                derivedOutcome === 'REJECTED' ? 'bg-rose-400' : 'bg-primary-500'
              }`}
              style={{ width: progressWidth }}
            />
            <CompactNode label="Applied" sub={formatDate(item.createdAt).split(',')[0]} status="APPROVED" />
            <CompactNode label={firstApproverName} sub={getPermissionL1Label(item.firstApproverDecision)} status={getPermissionNodeStatus(item.firstApproverDecision)} />
            {showSecondLevel && (
              <CompactNode
                label={secondApproverName}
                sub={getPermissionL2Label(item.firstApproverDecision, item.secondApproverDecision)}
                status={item.firstApproverDecision === 'APPROVED' ? getPermissionNodeStatus(item.secondApproverDecision) : null}
              />
            )}
            <CompactNode label="Outcome" sub={derivedOutcome} status={derivedOutcome} isFinal />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── WFH Detail Content ────────────────────────────────────────────
const WfhDetailContent = ({ item }: { item: any }) => {
  const { fetchEmployeeName } = useEmployee();
  const [firstApproverName, setFirstApproverName] = useState<string>("Loading...");
  const [secondApproverName, setSecondApproverName] = useState<string>("Loading...");

  useEffect(() => {
    const resolveNames = async () => {
      try {
        if (item.firstApproverId) {
          const r = await fetchEmployeeName(item.firstApproverId);
          setFirstApproverName(r?.empName || item.firstApproverId);
        }
        if (item.secondApproverId) {
          const r = await fetchEmployeeName(item.secondApproverId);
          setSecondApproverName(r?.empName || item.secondApproverId);
        }
      } catch {
        setFirstApproverName(item.firstApproverId || "Unknown");
        setSecondApproverName(item.secondApproverId || "Unknown");
      }
    };
    resolveNames();
  }, [item.firstApproverId, item.secondApproverId]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    });
  };

  const showSecondLevel = !!item.secondApproverId && item.firstApproverDecision !== "REJECTED";

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_0.7fr_1.3fr] gap-6">
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
          <FaInfoCircle className="text-teal-400" /> WFH Details
        </h4>
        <div className="bg-white p-3 rounded-sm border border-slate-200 shadow-sm min-h-[80px] flex flex-col justify-between">
          <p className="text-xs text-slate-600 leading-relaxed italic">
            {item.reason ? `"${item.reason}"` : "No reason provided."}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {item.startDateHalfDayType && (
              <span className="bg-teal-50 text-teal-600 text-[9px] font-black px-2 py-0.5 rounded-sm uppercase border border-teal-100">
                Start: {item.startDateHalfDayType.replace("_", " ")}
              </span>
            )}
            {item.endDateHalfDayType && (
              <span className="bg-teal-50 text-teal-600 text-[9px] font-black px-2 py-0.5 rounded-sm uppercase border border-teal-100">
                End: {item.endDateHalfDayType.replace("_", " ")}
              </span>
            )}
          </div>
        </div>
        {(item.status === "REJECTED" || item.firstApproverDecision === "REJECTED" || item.secondApproverDecision === "REJECTED") && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-sm">
            <h5 className="text-[9px] font-black text-rose-600 uppercase tracking-tighter mb-1">Reason for Rejection</h5>
            <p className="text-xs font-bold text-rose-900 leading-normal whitespace-pre-wrap">
              {item.rejectionReason || "No specific rejection reason provided."}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">Dates</h4>
        <div className="bg-white rounded-sm border border-slate-200 divide-y divide-slate-100 shadow-sm h-fit">
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase">Start</span>
            <span className="text-[11px] font-bold text-slate-700">{item.startDate}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase">End</span>
            <span className="text-[11px] font-bold text-slate-700">{item.endDate}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center bg-slate-50/50">
            <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
            <span className="text-[11px] font-black text-teal-600">{item.durationLabel}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
          <FaUserCheck className="text-emerald-400" /> Approval Workflow
        </h4>
        <div className="bg-slate-50/30 border border-slate-200 rounded-sm p-4 h-[125px] flex flex-col justify-center shadow-inner relative overflow-hidden">
          <div className="relative flex justify-between items-start w-full mx-auto px-2">
            <div className="absolute top-4 left-4 right-4 h-1 bg-slate-200 rounded-full z-0" />
            <div
              className="absolute top-4 left-4 h-1 bg-primary-500 rounded-full transition-all duration-700 z-0"
              style={{
                width: (item.status === "APPROVED" || item.status === "REJECTED")
                  ? "calc(100% - 32px)"
                  : (item.firstApproverDecision === "APPROVED" && showSecondLevel)
                  ? "50%"
                  : "0%"
              }}
            />
            <CompactNode label="Applied" sub={formatDate(item.createdAt).split(",")[0]} status="APPROVED" />
            <CompactNode label={firstApproverName} sub={item.firstApproverDecision || "Pending"} status={item.firstApproverDecision} />
            {showSecondLevel && (
              <CompactNode label={secondApproverName} sub={item.secondApproverDecision || "Waiting"} status={item.secondApproverDecision} />
            )}
            <CompactNode label="Outcome" sub={item.status} status={item.status} isFinal />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Unchanged: Leave detail content ───────────────────────────────
const DetailContent = ({ item }: { item: any }) => {
  const { fetchEmployeeName } = useEmployee();
  const [firstApproverName, setFirstApproverName] = useState<string>("Loading...");
  const [secondApproverName, setSecondApproverName] = useState<string>("Loading...");

  useEffect(() => {
    const resolveNames = async () => {
      try {
        if (item.firstApproverId) {
          const response1 = await fetchEmployeeName(item.firstApproverId);
          setFirstApproverName(response1?.empName || item.firstApproverId);
        }
        if (item.secondApproverId) {
          const response2 = await fetchEmployeeName(item.secondApproverId);
          setSecondApproverName(response2?.empName || item.secondApproverId);
        }
      } catch (err) {
        setFirstApproverName(item.firstApproverId || "Unknown");
        setSecondApproverName(item.secondApproverId || "Unknown");
      }
    };
    resolveNames();
  }, [item.firstApproverId, item.secondApproverId, fetchEmployeeName]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const showSecondLevel = !!item.secondApproverId && item.firstApproverDecision !== 'REJECTED';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_0.7fr_1.3fr] gap-6">
      <div className="space-y-4">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <FaInfoCircle className="text-indigo-400" /> Request Details
          </h4>
          <div className="bg-white p-3 rounded-sm border border-slate-200 shadow-sm min-h-[80px] flex flex-col justify-between">
            <p className="text-xs text-slate-600 leading-relaxed italic">
              {item.reason ? `"${item.reason}"` : "No reason provided."}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {item.isAppointment && (
                <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-sm uppercase border border-blue-100">
                  Appointment
                </span>
              )}
              {item.startDateHalfDayType && (
                <span className="bg-orange-50 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-sm uppercase border border-orange-100">
                  {item.startDateHalfDayType.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>
        {(item.status === 'REJECTED' || item.firstApproverDecision === 'REJECTED' || item.secondApproverDecision === 'REJECTED') && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-sm animate-in slide-in-from-top-1">
            <h5 className="text-[9px] font-black text-rose-600 uppercase tracking-tighter mb-1">
              Reason for Rejection
            </h5>
            <p className="text-xs font-bold text-rose-900 leading-normal whitespace-pre-wrap">
              {item.rejectionReason || "No specific rejection reason provided."}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
          Dates
        </h4>
        <div className="bg-white rounded-sm border border-slate-200 divide-y divide-slate-100 shadow-sm h-fit">
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase">Start</span>
            <span className="text-[11px] font-bold text-slate-700">{item.startDate}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase">End</span>
            <span className="text-[11px] font-bold text-slate-700">{item.endDate}</span>
          </div>
          <div className="p-2.5 flex justify-between items-center bg-slate-50/50">
            <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
            <span className="text-[11px] font-black text-indigo-600">{item.durationLabel}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
          <FaUserCheck className="text-emerald-400" /> Approval Workflow
        </h4>
        <div className="bg-slate-50/30 border border-slate-200 rounded-sm p-4 h-[125px] flex flex-col justify-center shadow-inner relative overflow-hidden">
          <div className="relative flex justify-between items-start w-full mx-auto px-2">
            <div className="absolute top-4 left-4 right-4 h-1 bg-slate-200 rounded-full z-0" />
            <div
              className="absolute top-4 left-4 h-1 bg-primary-500 rounded-full transition-all duration-700 z-0"
              style={{
                width: (item.status === 'APPROVED' || item.status === 'REJECTED')
                  ? 'calc(100% - 32px)'
                  : (item.firstApproverDecision === 'APPROVED' && showSecondLevel)
                  ? '50%'
                  : '0%'
              }}
            />
            <CompactNode label="Applied" sub={formatDate(item.createdAt).split(',')[0]} status="APPROVED" />
            <CompactNode label={firstApproverName} sub={item.firstApproverDecision || 'Pending'} status={item.firstApproverDecision} />
            {showSecondLevel && (
              <CompactNode label={secondApproverName} sub={item.secondApproverDecision || 'Waiting'} status={item.secondApproverDecision} />
            )}
            <CompactNode label="Outcome" sub={item.status} status={item.status} isFinal />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Unchanged: Shared UI components ───────────────────────────────
const CompactNode = ({ label, sub, status, isFinal }: any) => {
  const getColors = () => {
    if (status === 'APPROVED' || status === 'COMPLETED') return 'bg-emerald-400 text-white ring-emerald-100';
    if (status === 'REJECTED') return 'bg-rose-500 text-white ring-rose-100';
    return 'bg-white text-slate-300 ring-transparent';
  };
  return (
    <div className="relative flex flex-col items-center z-10 w-24 px-0">
      <div className={`w-8 h-8 rounded-full border-[3px] border-white shadow-sm flex items-center justify-center transition-all duration-300 ring-2 ${getColors()}`}>
        {status === 'APPROVED' || status === 'COMPLETED' ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : status === 'REJECTED' ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : isFinal && status === 'PENDING' ? (
          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" />
        ) : (
          <span className="text-[12px] text-slate-300">•</span>
        )}
      </div>
      <div className="mt-2 text-center w-full px-1">
        <p className="text-[9px] font-black text-slate-800 uppercase tracking-tighter leading-[1.1] wrap-break-word line-clamp-2 min-h-5">
          {label}
        </p>
        <p className={`text-[8px] font-bold uppercase mt-0.5 leading-tight ${status === 'REJECTED' ? 'text-rose-500' : 'text-slate-400'}`}>
          {sub}
        </p>
      </div>
    </div>
  );
};

// ── FIXED: ActionMenu — closes on action click ────────────────────
const ActionMenu = ({ item, activeMenu, setActiveMenu, onEdit, onCancel }: any) => {
  const isOpen = activeMenu === item.id;
  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setActiveMenu(isOpen ? null : item.id)}
        className={`p-2 rounded-sm transition-colors ${isOpen ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-slate-100"}`}
      >
        <FaEllipsisV size={14} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-sm z-[60] shadow-xl overflow-hidden"
          >
            <button
              onClick={() => {
                setActiveMenu(null); // ← FIXED: close menu first
                onEdit();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50 text-left uppercase"
            >
              <FaEdit className="text-indigo-500" /> Edit
            </button>
            <button
              onClick={() => {
                setActiveMenu(null); // ← FIXED: close menu first
                onCancel();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-rose-600 hover:bg-rose-50 border-t border-slate-50 text-left uppercase"
            >
              <FaTimes /> Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    APPROVED:  "bg-emerald-50 text-emerald-600 border-emerald-200/50",
    REJECTED:  "bg-rose-50 text-rose-600 border-rose-200/50",
    PENDING:   "bg-amber-50 text-amber-600 border-amber-200/50",
    CANCELLED: "bg-slate-100 text-slate-500 border-slate-300/50",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-sm border uppercase text-[10px] font-bold tracking-wider ${styles[status.toUpperCase()] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
};

// ── Edit WFH Modal ────────────────────────────────────────────────
type HalfDayType = "FIRST_HALF" | "SECOND_HALF" | null;

const toLocalDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const calculateEditDays = (
  start: Date | null,
  end: Date | null,
  startHalf: HalfDayType,
  endHalf: HalfDayType
): number => {
  if (!start) return 0;
  const endEff = end ?? start;
  const startMs = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endMs = new Date(endEff.getFullYear(), endEff.getMonth(), endEff.getDate()).getTime();
  const calDays = Math.round((endMs - startMs) / 86400000) + 1;
  if (calDays === 1) {
    if (startHalf && endHalf) return 1;
    if (startHalf || endHalf) return 0.5;
    return 1;
  }
  let days = calDays;
  if (startHalf) days -= 0.5;
  if (endHalf) days -= 0.5;
  return Math.max(0, days);
};

const HalfDaySelectorModal = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: HalfDayType;
  onChange: (v: HalfDayType) => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    <div className="flex p-1 bg-slate-100 rounded-sm border border-slate-200">
      {(["FIRST_HALF", "SECOND_HALF"] as HalfDayType[]).map((t) => (
        <button
          key={t!}
          type="button"
          onClick={() => onChange(value === t ? null : t)}
          className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-sm transition-all ${
            value === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t === "FIRST_HALF" ? "1st Half" : "2nd Half"}
        </button>
      ))}
    </div>
  </div>
);

const EditWfhModal = ({
  isOpen,
  wfh,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  wfh: any | null;
  onClose: () => void;
  onSave: (data: {
    startDate: string;
    endDate: string;
    startDateHalfDayType: string | null;
    endDateHalfDayType: string | null;
    reason: string;
    attachment?: File | null;
  }) => Promise<void>;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [startHalf, setStartHalf] = useState<HalfDayType>(null);
  const [endHalf, setEndHalf] = useState<HalfDayType>(null);
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Populate from existing WFH record
  useEffect(() => {
    if (wfh) {
      setStartDateStr(wfh.startDate || "");
      setEndDateStr(wfh.endDate || "");
      setStartHalf((wfh.startDateHalfDayType as HalfDayType) || null);
      setEndHalf((wfh.endDateHalfDayType as HalfDayType) || null);
      setReason(wfh.reason || "");
      setAttachment(null);
      setError("");
    }
  }, [wfh]);

  const startDate = startDateStr ? new Date(startDateStr + "T00:00:00") : null;
  const endDate = endDateStr ? new Date(endDateStr + "T00:00:00") : null;
  const isSameDay = startDateStr && endDateStr && startDateStr === endDateStr;
  const days = calculateEditDays(startDate, endDate, startHalf, endHalf);

  // 31-day window
  const today = new Date();
  const minDate = new Date(today); minDate.setDate(today.getDate() - 31);
  const minStr = toLocalDateString(minDate);

  const handleSave = async () => {
    if (!startDateStr) { setError("Please select a start date."); return; }
    if (!endDateStr) { setError("Please select an end date."); return; }
    if (endDateStr < startDateStr) { setError("End date cannot be before start date."); return; }
    if (!reason.trim()) { setError("Please enter a reason."); return; }
    setError("");
    setSaving(true);
    try {
      await onSave({
        startDate: startDateStr,
        endDate: endDateStr,
        startDateHalfDayType: startHalf,
        endDateHalfDayType: endHalf,
        reason: reason.trim(),
        attachment,
      });
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !wfh) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg border border-slate-200 max-h-[90vh] flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
                  Edit WFH Request
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-sm hover:bg-slate-100">
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1">

                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Start Date</label>
                  <input
                    type="date"
                    value={startDateStr}
                    min={minStr}
                    onChange={(e) => {
                      setStartDateStr(e.target.value);
                      if (endDateStr && e.target.value > endDateStr) setEndDateStr("");
                      setStartHalf(null);
                      setEndHalf(null);
                    }}
                    className="w-full px-4 py-3 border border-slate-200 rounded-sm text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50"
                  />
                </div>

                {/* Start half-day — show after start date selected */}
                {startDateStr && (
                  <HalfDaySelectorModal
                    label="Start Day Session (optional)"
                    value={startHalf}
                    onChange={setStartHalf}
                  />
                )}

                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">End Date</label>
                  <input
                    type="date"
                    value={endDateStr}
                    min={startDateStr || minStr}
                    onChange={(e) => { setEndDateStr(e.target.value); setEndHalf(null); }}
                    className="w-full px-4 py-3 border border-slate-200 rounded-sm text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50"
                  />
                </div>

                {/* End half-day — only if end != start */}
                {endDateStr && startDateStr && !isSameDay && (
                  <HalfDaySelectorModal
                    label="End Day Session (optional)"
                    value={endHalf}
                    onChange={setEndHalf}
                  />
                )}

                {/* Days calculation — shown after start date picked */}
                {startDateStr && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-sm px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-700">Days in this request</span>
                    <span className="text-xl font-black text-indigo-600">
                      {days}
                      <span className="text-xs font-semibold text-indigo-400 ml-0.5">{days === 1 ? "day" : "days"}</span>
                    </span>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason</label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe why you need to work from home…"
                    className="w-full px-4 py-3 border border-slate-200 rounded-sm text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none bg-slate-50"
                  />
                  <p className="text-[10px] text-slate-400 self-end text-right">{reason.length}/500</p>
                </div>

                {/* Attachment */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Attachment <span className="normal-case font-medium text-slate-300">(optional — replaces existing)</span>
                  </label>

                  {/* Show existing attachment info if no new file selected */}
                  {!attachment && wfh.attachmentOriginalName && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-500">
                      <HiOutlinePaperClip size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{wfh.attachmentOriginalName}</span>
                      <span className="text-slate-300 text-[10px] shrink-0">current</span>
                    </div>
                  )}

                  {attachment ? (
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-sm px-4 py-3">
                      <HiOutlinePaperClip size={16} className="text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{attachment.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {attachment.size < 1024 * 1024
                            ? `${(attachment.size / 1024).toFixed(1)} KB`
                            : `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`}
                        </p>
                      </div>
                      <button type="button" onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="p-1 rounded-sm hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                        <FaTimes size={11} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 border-2 border-dashed border-slate-200 rounded-sm px-4 py-3 text-xs font-semibold text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition w-full">
                      <HiOutlinePaperClip size={15} />
                      Click to attach a new file
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAttachment(e.target.files[0]); }} />
                </div>

                {error && (
                  <p className="text-[11px] font-bold text-rose-500 bg-rose-50 border border-rose-200 px-3 py-2 rounded-sm">{error}</p>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button onClick={onClose} disabled={saving} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                  {saving ? (
                    <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Saving...</>
                  ) : "Save Changes"}
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MyRequestsView;