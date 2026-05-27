
export interface EmployeeEntity {
  empId: string;        
  name: string;
  email: string;
  roleName: string;       
  departmentName: string;  
  branchName: string;      
  reportingId: string | null; 
  teamId: number | null;
  active: boolean;
  employeeExperience: string;
  joiningDate: string;
  biometricStatus: string;
  vpnStatus: string;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  // empty: boolean;
}