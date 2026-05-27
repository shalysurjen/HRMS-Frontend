import React from "react";

interface OnboardingStatsProps {
  newEmployeesCount: number;
  pendingBiometricCount: number;
  pendingVPNCount: number;
  onboardingList? : {employeeId: string ; employeeName:string ; daysInOnboarding : number}[];
}

const OnboardingStats: React.FC<OnboardingStatsProps> = ({
  newEmployeesCount,
  pendingBiometricCount,
  pendingVPNCount,
}) => {

  const allcomplete = pendingBiometricCount === 0 && pendingVPNCount === 0 && newEmployeesCount === 0;

  if (allcomplete) {
    return (
      <div className="bg-white p-6 rounded-2xl flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
          ✅
        </div>
        <div>
          <p className="font-semibold text-slate-700">All Onboarding Complete</p>
          <p className="text-xs text-slate-400">No pending biometric or VPN requests</p>
        </div>
      </div>
    );
  }
  
  else
  return (
    <div className="bg-white p-6 rounded-2x">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Onboarding Overview
        </h2>
        {/* <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
          HR Monitor
        </span> */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* New Employees */}
        <div className="bg-slate-50 rounded-xl p-4 hover:shadow-md transition-all duration-200">
          <p className="text-3xl font-bold text-slate-900">
            {newEmployeesCount}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            New Employees
          </p>
        </div>

        {/* Pending Biometric */}
        <div className="bg-amber-50 rounded-xl p-4 hover:shadow-md transition-all duration-200">
          <p className="text-3xl font-bold text-amber-600">
            {pendingBiometricCount}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Pending Biometric
          </p>
        </div>

        {/* Pending VPN */}
        <div className="bg-rose-50 rounded-xl p-4 hover:shadow-md transition-all duration-200">
          <p className="text-3xl font-bold text-rose-600">
            {pendingVPNCount}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Pending VPN Setup
          </p>
        </div>

      </div>

      
    </div>

    
  );
};

export default OnboardingStats;