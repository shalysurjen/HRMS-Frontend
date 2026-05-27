export interface BirthdayEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  dateOfBirth: string;
  age: number;
  profilePicture?: string;
}

export interface BirthdayWish {
  id: number;
  birthdayEmployeeId: string;
  wishedByEmployeeId: string;
  wishedByName: string;
  wishedByRole?: string;
  wishMessage: string;
  wishYear: number;
  isSystemWish: boolean;
  createdAt: string;
}

export interface SendWishRequest {
  birthdayEmployeeId: string;
  wishedByEmployeeId: string;
  wishMessage: string;
}
