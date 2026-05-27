import { Badge, Card } from '@/shared/components';
import { CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { AlertTriangle, CalendarClock } from 'lucide-react';

interface OnboardingEmployee {
  employeeId: string;
  employeeName: string;
  email: string;
  joiningDate: string;
  biometricStatus: string;
  vpnStatus: string;
  daysInOnboarding: number;
}

interface Props {
  onboardingList: OnboardingEmployee[];
  employeesOnLeave: any[];
}

export function MonitoringSection({
  onboardingList,
  employeesOnLeave,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* 🔶 Onboarding Pending */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-3 px-5">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Onboarding Pending
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 px-5 pb-5 max-h-75 overflow-y-auto">
          {onboardingList.length === 0 ? (
            <p className="text-sm text-slate-400">
              No onboarding pending employees
            </p>
          ) : (
            onboardingList.map((emp) => (
              <div
                key={emp.employeeId}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {emp.employeeName}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {emp.email}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Joining: {new Date(emp.joiningDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Badge
                    className={`font-bold border-none shadow-none ${
                      emp.biometricStatus === 'PENDING'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    Biometric: {emp.biometricStatus}
                  </Badge>

                  <Badge
                    className={`font-bold border-none shadow-none ${
                      emp.vpnStatus === 'PENDING'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    VPN: {emp.vpnStatus}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 🔷 Employees On Leave */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-3 px-5">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
            <CalendarClock className="h-4 w-4 text-blue-500" />
            Employees On Leave Today
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 px-5 pb-5">
          {employeesOnLeave.length === 0 ? (
            <p className="text-sm text-slate-400">
              No employees on leave today
            </p>
          ) : (
            employeesOnLeave.map((emp: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {emp.employeeName || emp.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {emp.leaveType || 'Leave'}
                  </p>
                </div>

                <Badge className="bg-blue-50 text-blue-600 font-bold border-none">
                  On Leave
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

    </div>
  );
}