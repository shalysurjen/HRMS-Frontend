import type { AppraisalStatus } from "@/features/appraisal/types/appraisal";

const CONFIG: Record<AppraisalStatus, { label: string; dot: string; text: string; ring: string }> = {
  DRAFT:        { label: "Draft",         dot: "bg-slate-400",   text: "text-slate-600", ring: "ring-slate-200" },
  SUBMITTED:    { label: "Submitted",     dot: "bg-blue-500",    text: "text-blue-700",  ring: "ring-blue-200"  },
  UNDER_REVIEW: { label: "Under Review",  dot: "bg-amber-500",   text: "text-amber-700", ring: "ring-amber-200" },
  L1_APPROVED:  { label: "L1 Approved",   dot: "bg-teal-500",    text: "text-teal-700",  ring: "ring-teal-200"  },
  L1_REJECTED:  { label: "L1 Rejected",   dot: "bg-rose-500",    text: "text-rose-700",  ring: "ring-rose-200"  },
  L2_UNDER_REVIEW: { label: "L2 Reviewing",  dot: "bg-violet-500",  text: "text-violet-700", ring: "ring-violet-200" },
  L2_REJECTED:  { label: "L2 Rejected",   dot: "bg-orange-500", text: "text-orange-700", ring: "ring-orange-200" },
  FINAL_REVIEW: { label: "Final Review",  dot: "bg-purple-500",  text: "text-purple-700",ring: "ring-purple-200"},
  PUBLISHED:    { label: "Published",     dot: "bg-emerald-500", text: "text-emerald-700",ring: "ring-emerald-200"},
  CLOSED:       { label: "Closed",        dot: "bg-gray-400",    text: "text-gray-500",  ring: "ring-gray-200"  },
};

export const StatusBadge = ({ status }: { status: AppraisalStatus }) => {
  const cfg = CONFIG[status] ?? CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white ring-1 ${cfg.ring} ${cfg.text} text-[11px] font-semibold`}>
      {/* Pulsing dot for active states, static dot otherwise */}
      <span className="relative flex h-2 w-2 shrink-0">
        {(status === "SUBMITTED" || status === "UNDER_REVIEW" || status === "L2_UNDER_REVIEW" || status === "FINAL_REVIEW") && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-60`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
      </span>
      {cfg.label}
    </span>
  );
};