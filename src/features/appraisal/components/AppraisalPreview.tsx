import { RatingInput } from "@/features/appraisal/components/RatingInput";
import { StatusBadge } from "@/features/appraisal/components/StatusBadge";
import {
  getEffectiveL1Rating,
} from "@/features/appraisal/types/appraisal";
import type { AppraisalDetail, ProjectItem } from "@/features/appraisal/types/appraisal";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineFolderOpen,
} from "react-icons/hi2";
import { ProjectInput } from "@/features/appraisal/components/ProjectInput";

interface Props {
  detail: AppraisalDetail;
  remarks: Record<number, { remarkText: string; revisedRating?: number }>;
  overallRemark: string;
  approverLevel: "EMPLOYEE" | "L1" | "L2";
  actionLabel: string;
  actionColor: "indigo" | "teal" | "rose";
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
}

const SUGGESTION_SECTION = "Suggestions";

export const AppraisalPreview = ({
  detail,
  remarks,
  overallRemark,
  approverLevel,
  actionLabel,
  actionColor,
  onCancel,
  onConfirm,
  saving,
}: Props) => {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-600 hover:bg-indigo-700",
      ring: "focus:ring-indigo-500/30",
    },
    teal: {
      bg: "bg-teal-600 hover:bg-teal-700",
      ring: "focus:ring-teal-500/30",
    },
    rose: {
      bg: "bg-rose-600 hover:bg-rose-700",
      ring: "focus:ring-rose-500/30",
    },
  };
  const colors = colorMap[actionColor];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium"
        >
          <HiOutlineArrowLeft size={16} /> Back to Form
        </button>
        <span className="text-slate-200">|</span>
        <p className="text-sm font-bold text-slate-800">
          Preview —{" "}
          {approverLevel === "L1"
            ? "Manager Review"
            : approverLevel === "L2"
            ? "Final Review"
            : "Self Appraisal"}
        </p>
        <StatusBadge status={detail.status} />
      </div>

      {/* Employee summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Employee
        </p>
        <p className="text-base font-bold text-slate-800">{detail.employeeName}</p>
        <p className="text-xs text-slate-500">
          {detail.role} · {detail.department} · {detail.cycleLabel}
        </p>
      </div>

      {/* Sections */}
      {detail.sections.map((sec) => {
        const isSuggestion = sec.sectionName === SUGGESTION_SECTION;
        return (
          <div
            key={sec.sectionName}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {sec.sectionName}
              </h3>
              {sec.sectionAvgRating != null && !isSuggestion && (
                <span className="text-xs font-bold bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1 rounded-full">
                  ⭐ {sec.sectionAvgRating} / 5.0
                </span>
              )}
            </div>

            <div className="p-5 space-y-6">
              {sec.questions.map((q, qIdx) => {
                const remark = remarks[q.questionId];
                const l1Rating = getEffectiveL1Rating(q);

                return (
                  <div key={q.questionId} className="space-y-2">
                    {/* Question */}
                    <p className="text-sm font-semibold text-slate-800">
                      <span className="text-xs font-black text-indigo-400 mr-2">
                        {String(qIdx + 1).padStart(2, "0")}
                      </span>
                      {q.questionText}
                    </p>

                    {/* ── Row 1: Employee Answer (full width) ── */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Employee Answer
                      </p>

                      {!q.questionText?.toLowerCase().includes("project") && (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {q.answerText || (
                            <span className="italic text-slate-300">No answer</span>
                          )}
                        </p>
                      )}

                      {q.questionText?.toLowerCase().includes("project") && (
                        <div className="space-y-2 mt-1">
                          {q.projects && (q.projects as ProjectItem[]).length > 0 ? (
                            (q.projects as ProjectItem[]).map((p, pi) => (
                              <div
                                key={p.id}
                                className="flex items-start gap-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl"
                              >
                                <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                  <HiOutlineFolderOpen size={11} className="text-white" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800">
                                    {String(pi + 1).padStart(2, "0")}. {p.projectName}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                    {p.description}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <ProjectInput
                              appraisalId={detail.appraisalId}
                              questionId={q.questionId}
                              readonly
                            />
                          )}
                          {q.answerText && (
                            <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">
                              {q.answerText}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Self rating — inline below answer */}
                      {!isSuggestion && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                            Self Rating
                          </p>
                          {q.selfRating != null ? (
                            <RatingInput value={q.selfRating} readonly />
                          ) : (
                            <p className="text-xs text-slate-300 italic">Not rated</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Row 2: L1 remark — L2 preview only ── */}
                    {approverLevel === "L2" &&
                      (q.revisedRemarks ?? q.l1Remark ?? l1Rating != null) && (
                        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 space-y-2">
                          <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">
                            Manager Remark (L1)
                          </p>
                          {(q.revisedRemarks ?? q.l1Remark) && (
                            <p className="text-sm text-teal-800 whitespace-pre-wrap leading-relaxed">
                              {q.revisedRemarks ?? q.l1Remark}
                            </p>
                          )}
                          {!isSuggestion && l1Rating != null && (
                            <div className="pt-2 border-t border-teal-100">
                              <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-1">
                                L1 Rating
                              </p>
                              <RatingInput value={l1Rating} readonly />
                            </div>
                          )}
                        </div>
                      )}

                    {/* ── Row 3: Your remark — L1/L2 only ── */}
                    {approverLevel !== "EMPLOYEE" && remark && (remark.remarkText?.trim() || remark.revisedRating != null) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                          Your Remark ({approverLevel})
                        </p>
                        {remark.remarkText?.trim() && (
                          <p className="text-sm text-amber-800 whitespace-pre-wrap leading-relaxed">
                            {remark.remarkText}
                          </p>
                        )}
                        {!isSuggestion && remark.revisedRating != null && (
                          <div className="pt-2 border-t border-amber-100">
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">
                              Revised Rating
                            </p>
                            <RatingInput value={remark.revisedRating} readonly />
                            {q.selfRating != null && (
                              <p className="text-xs text-amber-500 mt-2 font-semibold">
                                Average:{" "}
                                <span className="text-amber-700">
                                  {((q.selfRating + remark.revisedRating) / 2).toFixed(2)} / 5.0
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Overall remark */}
      {overallRemark.trim() && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Overall Remark
          </p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {overallRemark}
          </p>
        </div>
      )}

      {/* Overall average */}
      {detail.overallAvgRating != null && (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 w-fit">
          <span className="text-sm">📊</span>
          <span className="text-xs font-bold text-indigo-700">
            Overall Avg: {detail.overallAvgRating} / 5.0
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
        >
          <HiOutlineArrowLeft size={16} /> Back to Edit
        </button>

        <button
          onClick={onConfirm}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold shadow-md transition-all focus:ring-4 disabled:opacity-50 ${colors.bg} ${colors.ring}`}
        >
          <HiOutlineCheckCircle size={16} />
          {saving ? "Processing..." : actionLabel}
        </button>
      </div>

      <div className="h-8" />
    </div>
  );
};