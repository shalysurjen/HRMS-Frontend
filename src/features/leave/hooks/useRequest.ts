import { requestService } from "@/features/leave/services/requestService";
import type { AccessRequest, MeetingRequest, ODRequest } from "@/features/leave/types";
import { useCallback, useState } from "react";

export const useRequest = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createOD = useCallback(async (request: ODRequest, employeeId: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await requestService.createODRequest(request, employeeId);
            return data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred";
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);
    const createMeeting = useCallback(async (request: MeetingRequest, employeeId: string, attendeeIds?: number[]) => {
        setLoading(true);
        setError(null);
        try {
            const data = await requestService.createMeetingRequest(request, employeeId, attendeeIds);
            return data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Failed to schedule meeting";
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);
    const createAccessRequest = useCallback(async (request: AccessRequest, employeeId: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await requestService.createAccessRequest(request, employeeId);
            return data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Failed to schedule meeting";
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);
    return {
        createOD,
        createMeeting,
        loading,
        error,
        setError,
        createAccessRequest
    };
};
