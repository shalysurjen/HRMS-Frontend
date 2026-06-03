import type { AppraisalDetail } from "@/features/appraisal/types/appraisal";
import { StatusBadge } from "./StatusBadge";

export const EmployeeInfoCard = ({ detail }: { detail: AppraisalDetail }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg">
          {detail.employeeName?.[0] ?? "?"}
        </div>
        <div>
          <p className="font-bold text-slate-800">{detail.employeeName}</p>
          <p className="text-xs text-slate-400">{detail.employeeId} · {detail.role}</p>
        </div>
      </div>
      <StatusBadge status={detail.status} />
    </div>

    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: "Department",    value: detail.department },
        { label: "DOJ",           value: detail.doj },
        { label: "Company Exp",   value: detail.companyExperience },
        { label: "Type",          value: detail.experienceType },
      ].map(({ label, value }) => (
        <div key={label} className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">{value ?? "—"}</p>
        </div>
      ))}
    </div>
  </div>
);
