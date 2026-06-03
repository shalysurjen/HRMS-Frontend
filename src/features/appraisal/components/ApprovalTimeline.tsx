import type { StatusHistory } from "@/features/appraisal/types/appraisal";

const STATUS_COLOR: Record<string, string> = {
  DRAFT:        "bg-slate-300",
  SUBMITTED:    "bg-blue-400",
  UNDER_REVIEW: "bg-amber-400",
  L1_APPROVED:  "bg-teal-400",
  L1_REJECTED:  "bg-rose-400",
  FINAL_REVIEW: "bg-purple-400",
  PUBLISHED:    "bg-emerald-500",
  CLOSED:       "bg-gray-400",
};

export const ApprovalTimeline = ({ history }: { history: StatusHistory[] }) => {
  if (!history.length) return null;
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Approval Timeline</p>
      <ol className="relative border-l border-slate-200 ml-2 space-y-4">
        {history.map((h, i) => (
          <li key={i} className="ml-4">
            <span className={`absolute -left-1.5 mt-1 w-3 h-3 rounded-full border-2 border-white ${STATUS_COLOR[h.toStatus] ?? "bg-slate-300"}`} />
            <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">
                  {h.fromStatus ? `${h.fromStatus} → ` : ""}{h.toStatus}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(h.changedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-xs text-slate-500">By: <span className="font-medium">{h.changedBy}</span></p>
              {h.remarks && <p className="text-xs text-slate-400 mt-1 italic">"{h.remarks}"</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
