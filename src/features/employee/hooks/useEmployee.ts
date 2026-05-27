import { dashboardService } from "@/features/dashboard/services/dashboardService";
import { employeeService } from "@/features/employee/services/employeeService";
import type { CreateUserRequest, Employee, EmployeeEntity, PaginatedResponse, ProfileData, TeamMember } from "@/features/employee/types";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export const useEmployee = () => {


    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);

    const [roles, setRoles] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);

    const fetchEmployees = async (employeeId: string): Promise<Employee[]> => {
        setLoading(true);
        try {
            return await dashboardService.getEmpDashboard(employeeId);

        } catch (err: any) {
            setError(err.message || "Failed to fetch employees");
            return [];
        } finally {
            setLoading(false);
        }
    };


    const fetchEmployeeProfile = useCallback(
        async (
            employeeId: string
        ): Promise<ProfileData | null> => {
            setLoading(true);
            setError(null);
            try {
                const response = await employeeService.getProfile(employeeId);

                setProfile(response);
                return response;
            } catch (err: unknown) {
                const msg =
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch employee profile";
                setError(msg);
                return null;
            } finally {
                setLoading(false);
            }
        }, []
    );


    const fetchEmployeeName = useCallback(
        async (
            employeeId: string
        ) => {
            setLoading(true);
            setError(null);
            try {
                const response = await employeeService.getNameByID(employeeId);
                return response;
            } catch (err: unknown) {
                const msg =
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch employee profile";
                setError(msg);
                return null;
            } finally {
                setLoading(false);
            }
        }, []
    );
    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await employeeService.getRoleList();
            setRoles(response); // Store in state
            return response;
        } catch (err: any) {
            setError(err.message || "Failed to fetch roles");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBranches = useCallback(async () => {
        setLoading(true);
        try {
            const response = await employeeService.getAllBranches();
            setBranches(response); // Store in state
            return response;
        } catch (err: any) {
            setError(err.message || "Failed to fetch branches");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchManagers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await employeeService.getAllManagers();
            setManagers(response); // Store in state
            return response;
        } catch (err: any) {
            setError(err.message || "Failed to fetch managers");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDepartments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await employeeService.getDepartmentList();
            setDepartments(response); // Store in state
            return response;
        } catch (err: any) {
            setError(err.message || "Failed to fetch departments");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);






    // const fetchAllEmployees = useCallback(
    //     async (
    //         filters: EmployeeFilters
    //     ): Promise<EmployeeEntity | null> => {
    //         setLoading(true);
    //         setError(null);

    //         try {
    //             const response = await employeeService.getAllEmployees(filters);
    //             return response;
    //         } catch (err: unknown) {
    //             const msg =
    //                 err instanceof Error
    //                     ? err.message
    //                     : "Failed to fetch employee directory";

    //             setError(msg);
    //             return null;
    //         } finally {
    //             setLoading(false);
    //         }
    //     },
    //     [employeeService]
    // );
    const getEmployees = useCallback(async (filters?: any): Promise<PaginatedResponse<EmployeeEntity> | null> => {
        setLoading(true);
        try {
            const response = await employeeService.getAllEmployees(filters);
            return response; 
        } catch (err: unknown) {
            setError("Failed to fetch");
            return null;
        } finally {
            setLoading(false);
        }
    }, [employeeService]);
    
    const addUser = async (data: CreateUserRequest): Promise<void> => {
        try {
            const message = await employeeService.createUser(data);
            toast.success(message);
        } catch (err: any) {
            toast.error(err.toString());
            throw err;
        }
    };
    const updateUser = async (data: CreateUserRequest): Promise<void> => {
        try {
            await employeeService.updateUser(data);
            toast.success("User Updated Successfully");
        } catch (err: any) {
            toast.error(err.toString());
            throw err;
        }
    };



    const deleteUser = async (employeeId: string): Promise<void> => {
        try {
            const message = await employeeService.deleteUser(employeeId);
            toast.success(message);
        } catch (err: any) {
            toast.error(err.toString());
            throw err;
        }
    };

    const getTeamMembers = useCallback(async (employeeId: string): Promise<TeamMember[]> => {
        setLoading(true);
        try {
            const response = await employeeService.getTeamMembers(employeeId);
            return response;
        } catch (err: any) {
            const message = err.message || "Failed to fetch team members";
            setError(message);
            console.error(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTeamMembers = useCallback(async (employeeId: string): Promise<TeamMember[]> => {
        setLoading(true);
        setError(null);
        try {
            const result = await employeeService.getTeamMembers(employeeId);
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Comp-Off banking failed";
            setError(errorMessage);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const searchUser = useCallback(async (query: string) => {
        setLoading(true);
        try {
            const data = await employeeService.searchEmployees(query);

            return { content: data, totalElements: data.length, totalPages: 1 };
        } catch (error) {
            console.error("Search failed", error);
            return { content: [], totalElements: 0, totalPages: 0 };
        } finally {
            setLoading(false);
        }
    }, []);
    return {
        loading,
        error,
        setError,
        fetchEmployees,
        // fetchAllEmployees,
        addUser,
        updateUser,
        deleteUser,
        getTeamMembers,
        fetchTeamMembers,
        fetchEmployeeProfile,
        profile,
        searchUser,
        fetchEmployeeName,
        getEmployees,
        fetchDepartments,
        fetchManagers,
        fetchRoles,
        fetchBranches,
        roles,        // Exported state
        branches,     // Exported state
        departments,  // Exported state
        managers,

    }
}