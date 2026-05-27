
import type { BloodGroup, Gender, MaritalStatus } from "@/shared/types";

// export interface PersonalDetails {
//   firstName: string;
//   lastName: string;
//   contactNumber: string;
//   gender: Gender;
//   maritalStatus: MaritalStatus;
//   aadharNumber: string;
//   personalEmail: string;
//   dateOfBirth: string;
//   presentAddress: string;
//   permanentAddress: string;
//   bloodGroup: BloodGroup;
//   emergencyContactNumber?: string;
//   designation: string;
//   skillSet: string;
//   accountNumber: string;
//   bankName: string;
//   fatherName: string;
//   fatherDateOfBirth: string;
//   fatherOccupation: string;
//   fatherAlive: boolean;
//   motherName: string;
//   motherDateOfBirth: string;
//   motherOccupation: string;
//   motherAlive: boolean;
//   uanNumber?: string;
//   previousRole?: string;
//   oldCompanyName?: string;
//   oldCompanyFromDate?: string;
//   oldCompanyEndDate?: string;


// }

// export type PersonalDetailsRequest = PersonalDetails; 

export interface MultipartFiles {
  // Common
  idProof: File;
  passportPhoto: File;

  // Fresher
  tenthMarksheet?: File;
  twelfthMarksheet?: File;
  degreeCertificate?: File;
  offerLetter?: File;

  // Experienced
  experienceCerts?: File[];
  joiningLetter?: File[];
  relievingLetter?: File[];
}

export interface BasePersonalDetails {
  // Name
  firstName: string;
  lastName: string;

  // Contact
  contactNumber: string;
  gender: Gender;
  maritalStatus: MaritalStatus;

  aadharNumber: string;
  personalEmail: string;
  dateOfBirth: string; // YYYY-MM-DD

  presentAddress: string;
  permanentAddress: string;

  bloodGroup: BloodGroup;
  emergencyContactNumber: string;

  designation: string;
  skillSet?: string;

  // Bank
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  bankBranchName: string;

  // Father
  fatherName?: string;
  fatherDateOfBirth?: string;
  fatherOccupation?: string;
  fatherAlive?: boolean;

  // Mother
  motherName?: string;
  motherDateOfBirth?: string;
  motherOccupation?: string;
  motherAlive?: boolean;

  // Spouse (UPDATED)
  spouseName?: string;
  spouseDateOfBirth?: string;
  spouseOccupation?: string;
  spouseContactNumber?: string;

  // Children
  children?: Child[];
}

export interface Child {
  childName: string;
  gender: Gender;
  childDateOfBirth: string;
}

export interface ExperienceEntry {
  companyName: string;
  role: string;
  fromDate: string;
  endDate: string;
  lastCompany?: boolean;
  tempCert?: File | null;
  tempJoiningLetter?: File | null;
  tempRelievingLetter?: File | null;

}

export interface FresherPersonalDetailsRequest extends BasePersonalDetails { }
export interface ExperiencedPersonalDetailsRequest extends BasePersonalDetails {
  uanNumber: string;
  experiences: ExperienceEntry[];
}



export type PersonalDetailsRequest =
  | FresherPersonalDetailsRequest
  | ExperiencedPersonalDetailsRequest;

export interface CreateUserRequest {
  empId: string;           // Matches private String empId
  name: string;            // Matches private String name
  email: string;           // Matches private String email
  roleId: number;          // Matches private Long roleId (using number in TS)
  reportingId?: string | null; // Matches private String reportingId
  teamId?: number | null;  // Matches private Long teamId
  departmentId: number;    // Matches private Long departmentId
  branchId: number;        // Matches private Long branchId
  joiningDate: string;     // Matches LocalDate (sent as ISO string)
  employeeExperience: string; // Matches the Enum/String on backend
  biometricStatus? : string;
  vpnStatus? : string;
}