export const GenderMap = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;
export type Gender = (typeof GenderMap)[keyof typeof GenderMap];

export const BloodGroupMap = {
  A_POSITIVE: "A_POSITIVE",
  A_NEGATIVE: "A_NEGATIVE",
  B_POSITIVE: "B_POSITIVE",
  B_NEGATIVE: "B_NEGATIVE",
  O_POSITIVE: "O_POSITIVE",
  O_NEGATIVE: "O_NEGATIVE",
  AB_POSITIVE: "AB_POSITIVE",
  AB_NEGATIVE: "AB_NEGATIVE",
} as const;
export type BloodGroup = (typeof BloodGroupMap)[keyof typeof BloodGroupMap];

export const MaritalStatusMap = {
  SINGLE: "SINGLE",
  MARRIED: "MARRIED",
  DIVORCED: "DIVORCED",
  WIDOWED: "WIDOWED",
} as const;
export type MaritalStatus = (typeof MaritalStatusMap)[keyof typeof MaritalStatusMap];