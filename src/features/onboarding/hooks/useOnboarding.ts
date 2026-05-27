import type { AdminAccessDecision, LeaveType, PendingOnboardingResponse } from "@/features/leave/types";
import { onboardingServices } from "@/features/onboarding/services/onboardingService";
import { useCallback, useState } from "react";

export const useOnboarding = () => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOnboardingRequests = useCallback(async (): Promise<PendingOnboardingResponse[]> => {
        setLoading(true);
        setError(null);
        try {
            const result = await onboardingServices.getOnboardingRequests();
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || " Onboarding request fetching failed";
            setError(errorMessage);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAccessDecision = useCallback(async (
        requestId: number,
        type: LeaveType,
        decision: AdminAccessDecision
    ) => {
        setLoading(true);
        setError(null);
        try {

            await onboardingServices.approveAccessAdmin(requestId, decision);
            // Refresh the list after a successful decision
            const updatedData = await onboardingServices.getOnboardingRequests();
            return updatedData;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || `Failed to update ${type} status`;
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
        fetchOnboardingRequests,
        handleAccessDecision,

    }
}