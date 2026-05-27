export type UserRole = "EMPLOYEE" | "MANAGER" | "HR" | 'CEO' | "ADMIN" | "CFO" | "TEAM_LEADER" | "CTO" | "COO";

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  token: string;   
  employeeId: string; 
  role: UserRole;
  forcePasswordChange: boolean;
}
export type ExperienceType = 'EXPERIENCED' | 'FRESHER';