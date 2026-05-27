export interface ProfileData {
  ifscCode: string;
  bankBranchName: string;
  fatherDateOfBirth: string;
  fatherOccupation: string;
  fatherAlive: boolean;
  motherDateOfBirth: string;
  motherOccupation: string;
  motherAlive: boolean;
  spouseName: string;
  spouseOccupation: string;
  spouseContactNumber: string;
  children: never[];
  experiences: never[];
  spouseDateOfBirth: string;
  id: string;
  name: string;
  email: string;
  role: string;
  reportingId? : string | null;
  reportingName? : string | null;
  departmentId?:number;
  teamId?:number;
  hrname: string;
  branchId?:number;

  joiningDate: string;

  contactNumber: string;
  gender: string;
  maritalStatus: string;
  dateOfBirth: string;
  bloodGroup: string;

  personalEmail: string;
  aadharNumber: string;

  presentAddress: string;
  permanentAddress: string;

  emergencyContactNumber: string;

  fatherName: string;
  motherName: string;

  designation: string;
  skillSet: string[];

  biometricStatus: string;
  vpnStatus: string;

  active: boolean;
  mustChangePassword: boolean;

  createdAt?: string;
  updatedAt?: string;

  personalDetailsComplete: boolean;
  personalDetailsLocked: boolean;

  verificationStatus: string;
  hrRemarks?: string;

  employeeType: string;

  firstName: string;
  lastName?: string;
  surName?: string;

  accountNumber?: string;
  bankName?: string;
  pfNumber?: string;
  uanNumber? : number;

  passportPhotoPath?: string;
}