import type { CreateUserRequest, EmployeeEntity, EmployeeFilters, PaginatedResponse, ProfileData, TeamMember } from '@/features/employee/types';
import { AxiosError } from 'axios';
import api from '../../../services/apiClient';

export interface Employee {
  empId: string;
  name: string;
  email: string;
  roleName: string;
  reportingId: string | null;
  active: boolean;
  joiningDate: string;
  biometricStatus: string;
  vpnStatus: string;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // ─── Optional fields ────────────────────────────────────────
  designation?: string | null;
  employeeId?: string;
  employeeName?: string | null;
}

export interface EmployeePageResponse {
  content: Employee[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

const handleError = (err: unknown, context: string): never => {
  if (err instanceof AxiosError) {
    throw new Error(
      `${context}: ${err.response?.status ?? 'Network Error'} ${err.response?.statusText ?? ''}`.trim()
    );
  }
  throw new Error(`${context}: Unexpected error`);
};

export const employeeService = {


  getNameByID: async (employeeId: string) => {
    const res = await api.get(`/v1/employees/name/${employeeId}`);
    return res.data;
  },
  getRoleList: async () => {
    const res = await api.get(`/v1/employees/role/list`);
    return res.data;
  },
  getDepartmentList: async () => {
    const res = await api.get(`/v1/employees/departments/list`);
    return res.data;
  },
  getAllManagers: async () => {
    const res = await api.get(`/v1/employees/managers/list`);
    return res.data;
  },
  getAllBranches: async () => {
    const res = await api.get(`/v1/employees/branch/list`);
    return res.data;
  },

  searchEmployees: async (query: string): Promise<EmployeeEntity[]> => {
    const response = await api.get(`/v1/employees/search`, {
      params: { query }
    });
    return response.data;
  },


  // ─── HR: paginated list ───────────────────────────────────────
  getAllEmployeesHR: async (
    page = 0,
    size = 10,
    signal?: AbortSignal
  ): Promise<EmployeePageResponse> => {
    try {
      const response = await api.get<EmployeePageResponse>('/v1/employees/all', {
        params: { page, size },
        signal,
      });
      return response.data;
    } catch (err) {
      throw handleError(err, 'getAllEmployeesHR');
    }
  },

  // ─── Unified getAllEmployees — supports both (page, size) and filters object ──
  getAllEmployees: async (
    pageOrFilters: number | EmployeeFilters = 0,
    size = 10,
  ): Promise<PaginatedResponse<EmployeeEntity>> => {
    try {
      const params = typeof pageOrFilters === 'number'
        ? { page: pageOrFilters, size }
        : pageOrFilters;

      const response = await api.get<PaginatedResponse<EmployeeEntity>>('/v1/employees/all', {
        params
      });

      return response.data;
    } catch (err) {
      throw handleError(err, 'getAllEmployees');
    }
  },


  getTeamMembers: async (id: string): Promise<TeamMember[]> => {
    const res = await api.get(`/v1/dashboard/team-members/${id}`);
    return res.data;
  },

  createUser: async (userData: CreateUserRequest): Promise<string> => {
    try {
      const response = await api.post('/v1/admin/users/add', userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || "Failed to create user";
    }
  },
  updateUser: async (userData: CreateUserRequest) => {
    try {
      await api.put('/v1/admin/users/update', userData);
    } catch (error: any) {
      throw error.response?.data || "Failed to update user";
    }
  },

  deleteUser: async (employeeId: string): Promise<string> => {
    try {
      const res = await api.delete(`/v1/employees/${employeeId}`);
      return res.data.message || "Employee deleted successfully";
    } catch (error: any) {
      throw error.response?.data?.message || "Failed to delete user";
    }
  },

  getProfile: async (employeeId: string): Promise<ProfileData> => {
    const response = await api.get(`/v1/employees/profile/${employeeId}`);
    return response.data;
  },
};