import type { LeaveTypeBreakDown } from "@/features/leave/types";

// export interface EmployeeData {
//   employeeId: string;
//   employeeName: string;
//   currentYear: number;
//   yearlyAllocated: number;
//   yearlyUsed: number;
//   yearlyBalance: number;
//   monthlyAllocated: number;
//   monthlyUsed: number;
//   monthlyBalance: number;
//   carryForwardTotal: number;
//   carryForwardUsed: number;
//   carryForwardRemaining: number;
//   compoffBalance: number;
//   lossOfPayPercentage: number;
//   approvedCount: number;
//   rejectedCount: number;
//   pendingCount: number;
//   breakdown: LeaveBreakDown[];
// }

export interface EmployeeData {
  employeeId: string;
  employeeName: string;
  currentYear: number;
  lastUpdated: string; // Added from your data
  
  // Yearly Totals
  yearlyAllocated: number;
  yearlyUsed: number;
  yearlyBalance: number;

  // Monthly Breakdown (Specific Categories)
  monthlyAnnualAllocated: number; // Updated
  monthlyAnnualUsed: number;      // Updated
  monthlyAnnualBalance: number;   // Updated
  monthlySickAllocated: number;   // Updated
  monthlySickUsed: number;       // Updated
  monthlySickBalance: number;    // Updated
  monthlyTotalBalance: number;   // Added

  // Carry Forward Logic
  carryForwardTotal: number;
  carryForwardUsed: number;
  carryForwardRemaining: number;

  // Additional Balances & Stats
  compoffBalance: number;
  lossOfPayPercentage: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;

  // Nested Data
  breakdown: LeaveTypeBreakDown[];
}