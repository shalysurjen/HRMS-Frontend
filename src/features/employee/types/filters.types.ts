export interface EmployeeFilters {
  name?: string;
  email?: string;
  role?: string;
  managerId?: number;
  active?: boolean;
  page?: number;
  size?: number;
}