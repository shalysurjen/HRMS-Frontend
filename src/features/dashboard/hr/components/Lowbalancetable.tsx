
import { Badge } from '@/shared/components/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { AlertTriangle } from 'lucide-react';

export interface LowBalanceEmployee {
  employeeId: string;
  employeeName: string;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  compOffBalance: number | null;
  lopPercentage: number | null;
  totalWorkingDays: number | null;
}

interface LowBalanceTableProps {
  data: LowBalanceEmployee[];
  loading: boolean;
  error: string | null;
}

function getRemainingBadge(remaining: number) {
  if (remaining <= 0) {
    return (
      <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-bold px-3">
        {remaining}
      </Badge>
    );
  }
  if (remaining <= 2) {
    return (
      <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold px-3">
        {remaining}
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3">
      {remaining}
    </Badge>
  );
}

export default function LowBalanceTable({ data, loading }: LowBalanceTableProps) {
  const renderBody = () => {


    // Loading state
    if (loading) {
      return (
        <tr>
          <td colSpan={7} className="py-8 text-center text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              Loading...
            </div>
          </td>
        </tr>
      );
    }

    // Backend error — show message, not crash
    // if (error) {
    //   return (
    //     <tr>
    //       <td colSpan={7} className="py-8 text-center text-slate-400">
    //         <div className="flex items-center justify-center gap-2">
    //           <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    //           Loading...
    //         </div>
    //       </td>
    //     </tr>
    //   );
    // }

    // Empty state
    if (!data || data.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
            No employee balance data available
          </td>
        </tr>
      );
    }

    // Data rows
    return data.map((emp) => (
      <tr
        key={emp.employeeId}
        className="group hover:bg-slate-50/80 transition-colors"
      >
        <td className="py-3 px-2 text-xs text-slate-400 font-medium">
          #{emp.employeeId}
        </td>
        <td className="py-3 px-2 font-semibold text-slate-700">
          {emp.employeeName}
        </td>
        <td className="py-3 px-2 text-center text-slate-600 font-medium">
          {emp.totalAllocated}
        </td>
        <td className="py-3 px-2 text-center">
          <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-bold px-3">
            {emp.totalUsed}
          </Badge>
        </td>
        <td className="py-3 px-2 text-center">
          {getRemainingBadge(emp.totalRemaining)}
        </td>
        <td className="py-3 px-2 text-center text-slate-500 font-medium">
          {emp.compOffBalance != null ? emp.compOffBalance : '—'}
        </td>
        <td className="py-3 px-2 text-center">
          {emp.lopPercentage != null ? (
            <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-medium px-3">
              {emp.lopPercentage}%
            </Badge>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
      </tr>
    ));
  };


  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Low Leave Balance
          </CardTitle>
          {/* <CardDescription className="text-xs text-slate-500">
            {error ? (
              <span className="text-amber-500">Backend unavailable</span>
            ) : (
              <>Total: <span className="font-bold text-slate-700">{data.length}</span> employees</>
            )}
          </CardDescription> */}
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                <th className="text-left py-3 px-2">Emp ID</th>
                <th className="text-left py-3 px-2">Employee</th>
                <th className="text-center py-3 px-2">Allocated</th>
                <th className="text-center py-3 px-2">Used</th>
                <th className="text-center py-3 px-2">Remaining</th>
                <th className="text-center py-3 px-2">Comp Off</th>
                <th className="text-center py-3 px-2">LOP %</th>
                {/* <th className="text-center py-3 px-2">totalWorkingDays</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {renderBody()}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}