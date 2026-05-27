import { Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/shared/components/Card";
import { Badge } from "lucide-react";


interface ManagerApprovalStat {
  rejectedCount: number;
  managerId: number;
  managerName: string;
  teamSize: number;
  approvalsThisYear: number;
  pendingRequests: number;
  approvalRate: number;
  lastApprovalData: number;
}

interface Props {
  totalManagers: number;
  managerStats: ManagerApprovalStat[];
}

export default function ManagerTrackingTable({
  totalManagers,
  managerStats,
}: Props) {



  // 🔥 Compute Top Approver
  const topApprover =
    managerStats.length > 0
      ? managerStats.reduce((prev, current) =>
        (current.approvalsThisYear
          ?? 0) > (prev.approvalsThisYear ?? 0)
          ? current
          : prev
      )
      : null;

  // 🔥 Compute Most Pending
  const topPending =
    managerStats.length > 0
      ? managerStats.reduce((prev, current) =>
        (current.pendingRequests ?? 0) > (prev.pendingRequests ?? 0)
          ? current
          : prev
      )
      : null;

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-slate-800">
            Manager Tracking
          </CardTitle>

          <CardDescription className="text-xs text-slate-500">
            Total Managers:{" "}
            <span className="font-bold text-slate-700">
              {totalManagers}
            </span>{" "}
            · Top approver:{" "}
            <span className="font-bold text-emerald-600">
              {topApprover?.managerName ?? "N/A"}
            </span>{" "}
            · Most pending:{" "}
            <span className="font-bold text-rose-600">
              {topPending?.managerName ?? "N/A"}
            </span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                <th className="text-left py-3 px-2">Manager</th>
                <th className="text-center py-3 px-2">Approved</th>
                <th className="text-center py-3 px-2">Pending</th>
                <th className="text-center py-3 px-2">ApprovalRate</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {managerStats.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-4 px-2 text-center text-slate-400"
                  >
                    No approval data available
                  </td>
                </tr>
              ) : (
                managerStats.map((m) => (
                  <tr
                    key={m.managerId}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-2 font-semibold text-slate-700">
                      {m.managerName}
                    </td>

                    <td className="py-4 px-2 text-center">
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3">
                        {m.approvalsThisYear ?? 0}
                      </Badge>
                    </td>

                    <td className="py-4 px-2 text-center">
                      <Badge
                        className={
                          (m.pendingRequests ?? 0) > 3
                            ? "bg-rose-50 text-rose-600 border-rose-100 font-bold px-3"
                            : "bg-slate-100 text-slate-600 border-slate-200 font-bold px-3"
                        }
                      >
                        {m.pendingRequests ?? 0}
                      </Badge>
                    </td>

                    <td className="py-4 px-2 text-center">
                      <Badge
                        className={`font-bold px-3 border-none ${(m.approvalRate ?? 0) >= 80
                          ? 'bg-emerald-50 text-emerald-600'
                          : (m.approvalRate ?? 0) >= 50
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-rose-50 text-rose-600'
                          }`}
                      >
                        {Math.min(m.approvalRate ?? 0, 100)}%
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}