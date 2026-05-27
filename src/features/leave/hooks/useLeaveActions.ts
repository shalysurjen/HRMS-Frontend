import { leaveService } from "@/features/leave/services/leaveService";
import type { LeaveDecisionRequest } from "@/features/leave/types";
import { useCallback, useState } from "react";

export const useLeaveAction = () => {

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);


    const applyLeave = useCallback(async (data: FormData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await leaveService.submitLeaveRequest(data);
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Submission failed";
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);
    const cancelLeave = useCallback(async (id: number, employeeId: string) => {
        setLoading(true);
        try {
            await leaveService.cancelLeave(id, employeeId);
            return true;
        } catch (err: any) {
            setError(err.message || "Cancel failed");
            return false;
        } finally {
            setLoading(false);
        }
    }, []);
    const editLeave = useCallback(async (id: number, data: any) => {
        setLoading(true);
        try {
            await leaveService.updateLeave(id, data);
            return true;
        } catch (err: any) {
            setError(err.message || "Update failed");
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const processApproval = async (
        decisionRequest: LeaveDecisionRequest
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            await leaveService.updateDecision(decisionRequest);
            return true;
        } catch (err: any) {
            console.error("Full Error Object:", err);
            setError(err.message || "Action failed");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const bankCompOff = useCallback(async (payload: any) => {
        setLoading(true);
        setError(null);
        try {
            const result = await leaveService.submitCompOffRequest(payload);
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Comp-Off banking failed";
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        setError,

        applyLeave,
        cancelLeave,
        editLeave,
        processApproval,
        bankCompOff,

    }
}