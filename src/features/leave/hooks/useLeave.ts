import type { TeamMemberBalance } from "@/features/attendance/types";
import { leaveService } from "@/features/leave/services/leaveService";
import type { LeaveBalanceResponseV2, LeaveRecord } from "@/features/leave/types";
import { useCallback, useState } from "react";



export const useLeave = () => {
    const [loading, setLoading] = useState<boolean>(false);

    const [weeklyLeaveSummary, setWeeklyLeaveSummary] = useState<LeaveRecord[]>([]);
    const [teamOnLeave, setTeamOnLeave] = useState<TeamMemberBalance[]>([]);
    const [error, setError] = useState<string | null>(null);
    
      const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceResponseV2 | null>(null);


    const fetchMyLeaves = useCallback(async (employeeId: string): Promise<LeaveRecord[]> => {
        setLoading(true);
        try {
            return await leaveService.getMyLeaveHistory(employeeId);
        } catch (err: any) {
            setError(err.message || "Failed to fetch leave history");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);
        const fetchLeaveApplicationById = useCallback(async (leaveId: number) => {
        setLoading(true);
        try {
            return await leaveService.getLeaveApplicationByID(leaveId);
        } catch (err: any) {
            setError(err.message || "Failed to fetch leave application");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // const fetchMyOD = useCallback(async (employeeId: string): Promise<ODResponse[]> => {
    //     setLoading(true);
    //     try {
    //         return await leaveService.getMyODHistory(employeeId);
    //     } catch (err: any) {
    //         setError(err.message || "Failed to fetch leave history");
    //         return [];
    //     } finally {
    //         setLoading(false);
    //     }
    // }, []);


    const fetchWeeklyLeaveSummary = useCallback(async (managerId: string): Promise<LeaveRecord[]> => {
        setLoading(true);
        try {
            const data = await leaveService.getWeeklyLeaveSummary(managerId);
            setWeeklyLeaveSummary(data);
            return data;
        } catch (err: any) {
            setError(err.message || "Failed to fetch leave history");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTeamOnLeave = useCallback(async (managerId: string): Promise<TeamMemberBalance[]> => {
        setLoading(true);
        try {
            const data = await leaveService.getTeamOnLeave(managerId);
            setTeamOnLeave(data);
            return data;
        } catch (err: any) {
            setError(err.message || "Failed to fetch leave history");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    
    
    
      const fetchLeaveBalance = useCallback(async (employeeId: string, year: number = 2026) => {
        setLoading(true);
        setError(null);
        try {
          const data = await leaveService.getLeaveBalances(employeeId, year);
          
          setLeaveBalance(data);
          return data;
        } catch (err: any) {
          setError(err.message || "Failed to fetch leave balance");
          return null;
        } finally {
          setLoading(false);
        }
      }, []);
    

    return {
        loading,
        error,
        setError,
        fetchMyLeaves,
        // fetchMyOD,
        fetchTeamOnLeave,
        fetchWeeklyLeaveSummary,
        weeklyLeaveSummary,
        teamOnLeave,
        fetchLeaveBalance,
        leaveBalance,
        fetchLeaveApplicationById

    }
}