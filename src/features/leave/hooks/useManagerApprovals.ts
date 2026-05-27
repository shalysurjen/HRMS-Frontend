import { employeeService } from "@/features/employee/services/employeeService";
import { leaveService } from "@/features/leave/services/leaveService";
import { permissionService } from "@/features/leave/services/permissionService";
import { wfhService } from "@/features/leave/services/wfhService";
import type { LeaveDecision, LeaveDecisionRequest, LeaveType } from "@/features/leave/types";
import { useEffect, useState } from "react";

export const useManagerApprovals = (userId: string, role?: string) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // ── Fetch leaves, permissions AND wfh in parallel ──────────
      const [leaveData, permissionData, wfhData] = await Promise.all([
        leaveService.getPendingApprovals(userId),
        permissionService.getPendingPermissions(userId).catch(() => []),
        wfhService.getPendingForApprover(userId).catch(() => []),
      ]);

      // ── Map leave data ─────────────────────────────────────────
      const rawLeaves = (leaveData || []).map((item: any) => ({
        ...item.leaveApplicationResponseDTO,
        attachments: item.attachments || [],
        attachmentCount: item.attachmentCount || 0,
        isLeave: true,
        requestType: "LEAVE",
      }));

      // ── Map permission data ────────────────────────────────────
      const rawPermissions = (permissionData || []).map((item: any) => ({
        ...item,
        isPermission: true,
        requestType: "PERMISSION",
        leaveTypeName: "PERMISSION",
        startDate: item.permissionDate,
        endDate: item.permissionDate,
        days: parseFloat((item.durationMinutes / 60).toFixed(1)),
      }));

      // ── Map WFH data ───────────────────────────────────────────
      const rawWfh = (wfhData || []).map((item: any) => ({
        ...item,
        isWfh: true,
        requestType: "WFH",
        leaveTypeName: "WFH",
        days: item.totalDays,
      }));

      // ── Resolve names for leaves ───────────────────────────────
      const formattedLeaves = await Promise.all(
        rawLeaves.map(async (req: any) => {
          const response = await employeeService.getNameByID(req.employeeId);
          const nameString = typeof response === 'string'
            ? response
            : (response?.fullName || response?.empName || "Unknown Employee");
          return { ...req, employeeName: nameString };
        })
      );

      // ── Resolve names for permissions ──────────────────────────
      const formattedPermissions = await Promise.all(
        rawPermissions.map(async (req: any) => {
          const response = await employeeService.getNameByID(req.employeeId);
          const nameString = typeof response === 'string'
            ? response
            : (response?.fullName || response?.empName || "Unknown Employee");
          return { ...req, employeeName: nameString };
        })
      );

      // ── Resolve names for WFH ──────────────────────────────────
      const formattedWfh = await Promise.all(
        rawWfh.map(async (req: any) => {
          const response = await employeeService.getNameByID(req.employeeId);
          const nameString = typeof response === 'string'
            ? response
            : (response?.fullName || response?.empName || "Unknown Employee");
          return { ...req, employeeName: nameString };
        })
      );

      // ── Combine and sort ───────────────────────────────────────
      const combined = [...formattedLeaves, ...formattedPermissions, ...formattedWfh].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRequests(combined);
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [userId, role]);

  const removeFromState = (id: number) => {
    setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  const handleDecision = async (
    requestId: number,
    status: LeaveDecision,
    reason: string = "",
    type?: LeaveType | string,
  ) => {
    try {
      setLoading(true);

      // ── WFH decision ───────────────────────────────────────────
      if (type === 'WFH') {
        if (status === 'APPROVED') {
          await wfhService.approveWfh(requestId, userId, reason);
        } else {
          await wfhService.rejectWfh(requestId, userId, reason);
        }
      }
      // ── Permission decision ────────────────────────────────────
      else if (type === 'PERMISSION') {
        if (status === 'APPROVED') {
          await permissionService.approvePermission(requestId, userId, reason);
        } else {
          await permissionService.rejectPermission(requestId, userId, reason);
        }
      }
      // ── Comp-Off decision ──────────────────────────────────────
      else if (type === 'COMP_OFF') {
        if (status === 'APPROVED') {
          await leaveService.approveCompOff(requestId);
        } else {
          await leaveService.rejectCompOff(requestId, reason);
        }
      }
      // ── Leave decision ─────────────────────────────────────────
      else {
        const decisionRequest: LeaveDecisionRequest = {
          leaveId: requestId,
          approverId: userId,
          decision: status,
          comments: reason
        };
        await leaveService.updateDecision(decisionRequest);
      }

      removeFromState(requestId);
      return { success: true };

    } catch (err) {
      console.error(`Decision error for ${type || 'LEAVE'}:`, err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const handleCompOffApprove = async (compOffId: number) => {
    try {
      await leaveService.approveCompOff(compOffId);
      removeFromState(compOffId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const handleCompOffReject = async (compOffId: number, reason: string) => {
    try {
      await leaveService.rejectCompOff(compOffId, reason);
      removeFromState(compOffId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  return {
    requests,
    loading,
    handleDecision,
    handleCompOffApprove,
    handleCompOffReject,
    refresh: fetchRequests
  };
};
