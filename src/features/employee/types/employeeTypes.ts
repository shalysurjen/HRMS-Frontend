

// export type EmployeeExperience = 'FRESHER' | 'EXPERIENCED';
// export interface Employee {
//   empId: number;
//   teamId?: number | null;
//   departmentId: number;
//   name: string;
//   email: string;
//   role: string;
//   employeeExperience: EmployeeExperience;
//   reportingId: number | null;
//   branchId: number;
// }

// export interface ProfileResponse {
//   employee: Employee;

// }

export interface User {
  // Core Identity
  id: string;
  employeeCode:string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  mustChangePassword: boolean;

  // Metadata/Status
  personalDetailsComplete: boolean;
  personalDetailsLocked: boolean;
  verificationStatus: string; // Or your Enum
  employeeExperience: 'FRESHER' | 'EXPERIENCED';
  hrRemarks?: string;
  maritalStatus? : string;

  // Personal Info
  firstName: string;
  lastName: string;
  contactNumber: string;
  personalEmail: string;
  gender: string;
  dateOfBirth: string; // ISO Date string
  joiningDate: string;
  designation: string;
  bloodGroup: string;
  skillSet: string[]; // MATCHING JAVA: List<String> becomes string[]

  // Reporting
  reportingId: string;
  reportingName: string;

  // Bank/IDs
  aadharNumber: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  pfNumber?: string;
  uanNumber?: string;

  // UI status
  biometricStatus: string;
  vpnStatus: string;
  passportPhotoPath? : string;
}

// export interface PersonalDetails {
//   firstName: string;
//   lastName: string;
//   contactNumber: string;
//   accountNumber: string;
//   bankName: string;
//   pfNumber: string;
//   unaNumber?: string | null;
//   gender: Gender;
//   maritalStatus: MaritalStatus;
//   aadharNumber: string;
//   personalEmail: string;
//   dateOfBirth: string;
//   presentAddress: string;
//   permanentAddress: string;
//   bloodGroup: BloodGroup;

//   emergencyContactNumber: string;
//   fatherName: string;
//   motherName: string;
//   designation: string;
//   skillSet: string;

//   // DOC
//   aadhaarDocPath: string;
//   tcDocPath: string;
//   offerLetterDocPath: string;
//   experienceCertDocPath: string;
//   leavingLetterDocPath: string;

//   previousRole?: string | null;
//   oldCompanyName?: string | null;
//   oldCompanyFromDate?: string | null;
//   oldCompanyEndDate: string | null;


// }

export interface Employee {
  managerId: null;
  active: any;
  joiningDate: string | number | Date;
  biometricStatus: string;
  vpnStatus: string;
  department?: string;
  id: number | null | undefined;
  color: string;
  initial?: string | null;
  name: string;
  email: string;
  dept: string;
  role: string;
  status: string;
  employeeId: string;
  employeeName: string;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  compOffBalance: number;
  lopPercentage: number;
  totalWorkingDays: number | null;
}

export interface TeamMember {
  employeeName: string;
  employeeId: string;
  designation: string | null;
  skills: string | null;
}



