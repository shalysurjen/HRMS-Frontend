import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/shared/auth/useAuth";
import { useAppraisal } from "@/features/appraisal/hooks/useAppraisal";
import { getEffectiveL1Rating, getEffectiveL2Rating } from "@/features/appraisal/types/appraisal";
import { RatingInput } from "@/features/appraisal/components/RatingInput";
import { EmployeeInfoCard } from "@/features/appraisal/components/EmployeeInfoCard";
import { ApprovalTimeline } from "@/features/appraisal/components/ApprovalTimeline";
import { StatusBadge } from "@/features/appraisal/components/StatusBadge";
import { AppraisalPreview } from "@/features/appraisal/components/AppraisalPreview";
import {
  HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineArrowLeft, HiOutlineExclamationCircle, HiOutlineEye,
  HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineLockClosed,
  HiOutlineBookmarkSquare,
} from "react-icons/hi2";
import { appraisalService } from "@/features/appraisal/services/appraisalService";

interface Props {
  appraisalId:   number;
  approverLevel: "L1" | "L2" | "VIEW_ONLY";
  onBack:        () => void;
}

const SUGGESTION_SECTION = "Suggestions";

/**
 * STATUS FLOW (backend enforces, frontend just sends approve/reject flags):
 *
 *  Employee submits   → status = "SUBMITTED"
 *  L1 sees it         → status "SUBMITTED" | "UNDER_REVIEW" | "L2_REJECTED"
 *  L1 saves draft     → status stays same (remarks saved, no status change)
 *  L1 approves        → status = "L1_APPROVED"  (triggers L2 notification)
 *  L1 rejects         → status = "L1_REJECTED"  (back to employee)
 *  L2 sees it         → status "L1_APPROVED"
 *  L2 saves draft     → status stays same (remarks saved, no status change)
 *  L2 saves review    → status = "FINAL_REVIEW"  (saved, not published yet)
 *  L2 rejects         → status = "L2_REJECTED"  (back to L1 only, before publish)
 *  L2 publishes       → status = "PUBLISHED"    (employee can see result)
 *
 *  L1 can act: SUBMITTED | UNDER_REVIEW | L1_APPROVED | L2_REJECTED
 *  L2 can act: L1_APPROVED (edit+reject) | FINAL_REVIEW (publish)
 */

const AppraisalReviewPage = ({ appraisalId, approverLevel, onBack }: Props) => {
  const { user } = useAuth();
  const { detail, loading, loadDetail, sendRemarks } = useAppraisal();

  const [step, setStep] = useState<"form" | "preview">("form");
  const [currentSection, setCurrentSection] = useState(0);
  const sectionCardRef = useRef<HTMLDivElement>(null);
  const [overallRemark, setOverallRemark]     = useState("");
  const [questionRemarks, setQuestionRemarks] = useState<
    Record<number, { remarkText: string; revisedRating?: number }>
  >({});
  const [pendingAction, setPendingAction] = useState<{ approve: boolean; publish: boolean } | null>(null);
  const [saving,         setSaving]       = useState(false);
  const [draftSaving,    setDraftSaving]  = useState(false);
  const [submitted,      setSubmitted]    = useState(false);
  const [toast,          setToast]        = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => { loadDetail(appraisalId); }, [appraisalId]); // eslint-disable-line

  // Pre-fill remarks from existing data (both L1 and L2)
  useEffect(() => {
    if (!detail) return;
    if (Object.keys(questionRemarks).length > 0) return;
    const prefilled: Record<number, { remarkText: string; revisedRating?: number }> = {};

    if (approverLevel === "L2") {
      detail.sections.forEach(sec =>
        sec.questions.forEach(q => {
          const r  = q.finalRemarks ?? q.l2Remark;
          const rt = q.finalRating  ?? q.l2RevisedRating;
          if (r || rt !== undefined) prefilled[q.questionId] = { remarkText: r ?? "", revisedRating: rt };
        })
      );
      if (detail.l2OverallRemark) setOverallRemark(detail.l2OverallRemark);
    } else if (approverLevel === "L1") {
      detail.sections.forEach(sec =>
        sec.questions.forEach(q => {
          const r  = q.revisedRemarks ?? q.l1Remark;
          const rt = q.revisedRating  ?? q.l1RevisedRating;
          if (r || rt !== undefined) prefilled[q.questionId] = { remarkText: r ?? "", revisedRating: rt };
        })
      );
      if (detail.l1OverallRemark) setOverallRemark(detail.l1OverallRemark);
    }

    if (Object.keys(prefilled).length > 0) setQuestionRemarks(prefilled);
  }, [detail]); // eslint-disable-line

  useEffect(() => {
    if (detail?.status === "FINAL_REVIEW" || detail?.status === "PUBLISHED" || detail?.status === "CLOSED") {
      setSubmitted(true);
    }
  }, [detail?.status]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const updateRemark = (qId: number, field: "remarkText" | "revisedRating", val: string | number | undefined) =>
    setQuestionRemarks(prev => ({ ...prev, [qId]: { ...prev[qId], [field]: val } }));

  const isEffectivelyOptional = (secName: string, qId: number, secQuestions: { questionId: number }[], isRequired: boolean) => {
    if (secName !== SUGGESTION_SECTION) return false;
    const lastId = secQuestions[secQuestions.length - 1]?.questionId;
    return qId === lastId && !isRequired;
  };

  const getMissingList = () => {
    if (!detail) return [];
    return detail.sections.flatMap(sec =>
      sec.questions.filter(q => {
        if (isEffectivelyOptional(sec.sectionName, q.questionId, sec.questions, q.isRequired)) return false;
        const isSuggestion = sec.sectionName === SUGGESTION_SECTION;
        const r = questionRemarks[q.questionId];
        if (isSuggestion) return !r?.remarkText?.trim();
        return !r?.remarkText?.trim() || r?.revisedRating == null;
      })
    );
  };

  // ── Save Draft: saves remarks without changing status ─────────────────────
  const handleSaveDraft = async () => {
    if (!user?.id) return;
    setDraftSaving(true);
    try {
      await appraisalService.saveDraftRemarks(appraisalId, {
        approverId: user.id,
        approverLevel,
        overallRemark,
        questionRemarks: Object.entries(questionRemarks).map(([id, r]) => ({
          questionId: Number(id), remarkText: r.remarkText, revisedRating: r.revisedRating,
        })),
        approve: false,
        publish: false,
        draftOnly: true,
      });
      showToast("Draft saved successfully.");
    } catch {
      showToast("Failed to save draft. Please try again.");
    } finally {
      setDraftSaving(false);
    }
  };

  // ── Next: NO validation, just scroll to section card ────────────────────
  const handleNextSection = () => {
    setCurrentSection(p => p + 1);
    setTimeout(() => {
      sectionCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // ── Action: approve/reject/publish — validate only on approve ────────────
  const handleActionClick = (approve: boolean, publish = false) => {
    if (!approve) {
      // Reject: go straight to confirm (no preview needed)
      handleConfirm(false, false);
      return;
    }
    const missing = getMissingList();
    if (missing.length > 0) {
      setSubmitAttempted(true);
      showToast(`${missing.length} required remark(s) / rating(s) missing.`);
      return;
    }
    setPendingAction({ approve, publish });
    setStep("preview");
  };

  const handleConfirm = async (approve: boolean, publish: boolean) => {
    if (!user?.id) return;
    setSaving(true);
    await sendRemarks(appraisalId, {
      approverId: user.id,
      approverLevel,
      overallRemark,
      questionRemarks: Object.entries(questionRemarks).map(([id, r]) => ({
        questionId: Number(id), remarkText: r.remarkText, revisedRating: r.revisedRating,
      })),
      approve,
      publish,
      draftOnly: false,
    });
    setSaving(false);
    setStep("form");
    if (!approve) {
      if (approverLevel === "L2") {
        showToast("Rejected. Sent back to manager (L1) for re-review.");
      } else {
        showToast("Appraisal rejected. Sent back to employee.");
      }
      onBack();
    } else if (publish) {
      showToast("Appraisal published successfully!");
      setSubmitted(true);
    } else if (approverLevel === "L2") {
      setSubmitted(true);
      showToast("Review saved! Click Preview & Publish to release results.");
    } else {
      showToast("Approved and forwarded to final approver (L2)!");
    }
  };

  if (loading || !detail) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  const sections      = detail.sections;
  const totalSections = sections.length;
  const currentSec    = sections[currentSection];

  const isPublishedOrClosed = ["PUBLISHED", "CLOSED"].includes(detail.status);

  const L1_ACTIVE_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "L1_APPROVED", "L2_REJECTED"];
  const L2_ACTIVE_STATUSES = ["L1_APPROVED", "FINAL_REVIEW"];

  const alreadyActed =
    approverLevel === "L1" ? !L1_ACTIVE_STATUSES.includes(detail.status)
    : approverLevel === "L2" ? !L2_ACTIVE_STATUSES.includes(detail.status)
    : true;

  const isViewOnly       = approverLevel === "VIEW_ONLY" || alreadyActed || isPublishedOrClosed;
  const l2CanEdit        = approverLevel === "L2" && L2_ACTIVE_STATUSES.includes(detail.status) && !submitted;
  const canPublish       = approverLevel === "L2" && !isPublishedOrClosed && (submitted || detail.status === "FINAL_REVIEW");
  const isActiveReviewer = (approverLevel === "L1" && !isViewOnly) || l2CanEdit;
  const allFilled        = getMissingList().length === 0;
  const isSuggestionSection = currentSec?.sectionName === SUGGESTION_SECTION;
  const isLastSection    = currentSection === totalSections - 1;

  const isQuestionMissing = (q: { questionId: number; isRequired: boolean }, secName: string) => {
    if (!submitAttempted || !isActiveReviewer) return false;
    if (isEffectivelyOptional(secName, q.questionId, currentSec?.questions ?? [], q.isRequired)) return false;
    const r = questionRemarks[q.questionId];
    if (secName === SUGGESTION_SECTION) return !r?.remarkText?.trim();
    return !r?.remarkText?.trim() || r?.revisedRating == null;
  };

  // ── PREVIEW step ──────────────────────────────────────────────────────────
  if (step === "preview" && detail && pendingAction) {
    const { approve, publish } = pendingAction;
    const label = publish
      ? "Publish Results"
      : approve && approverLevel === "L1"
      ? "Approve & Forward to L2"
      : "Save Review";
    return (
      <AppraisalPreview
        detail={detail}
        remarks={questionRemarks}
        overallRemark={overallRemark}
        approverLevel={approverLevel as "L1" | "L2"}
        actionLabel={label}
        actionColor={publish ? "indigo" : "teal"}
        onCancel={() => setStep("form")}
        onConfirm={() => handleConfirm(approve, publish)}
        saving={saving}
      />
    );
  }

  // ── FORM step ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium"
        >
          <HiOutlineArrowLeft size={16} /> Back
        </button>
        <span className="text-slate-200">|</span>
        <p className="text-sm font-bold text-slate-800">
          {isViewOnly
            ? "View Appraisal"
            : approverLevel === "L1"
            ? "Manager Review (L1)"
            : "Final Review (L2)"}
        </p>
        <StatusBadge status={detail.status} />
      </div>

      {/* L1 already acted banner */}
      {approverLevel === "L1" && alreadyActed && !isPublishedOrClosed && (
        <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-2xl">
          <HiOutlineCheckCircle size={20} className="text-teal-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-teal-800">Review submitted</p>
            <p className="text-xs text-teal-600">Your review has been forwarded to the final approver (L2).</p>
          </div>
        </div>
      )}

      {/* L2 saved banner — only when FINAL_REVIEW status but submitted flag set */}
      {approverLevel === "L2" && submitted && !isPublishedOrClosed && (
        <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-2xl">
          <HiOutlineCheckCircle size={20} className="text-teal-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-teal-800">Review saved</p>
            <p className="text-xs text-teal-600">
              Click <strong>Preview & Publish</strong> to release results to the employee.
            </p>
          </div>
        </div>
      )}

      {/* View-only / locked banner */}
      {isViewOnly && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <HiOutlineLockClosed size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">View only</p>
            <p className="text-xs text-amber-600">
              Current status: <strong>{detail.status.replace(/_/g, " ")}</strong>
            </p>
          </div>
          <span className="ml-auto"><StatusBadge status={detail.status} /></span>
        </div>
      )}

      {/* Missing warning — only after submit attempted */}
      {isActiveReviewer && submitAttempted && !allFilled && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
          <HiOutlineExclamationCircle size={15} className="shrink-0" />
          Fill all required (*) remarks and ratings to enable Preview & Submit.
        </div>
      )}

      <EmployeeInfoCard detail={detail} />

      {detail.overallAvgRating != null && (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 w-fit">
          <span className="text-sm">📊</span>
          <span className="text-xs font-bold text-indigo-700">
            Overall Avg: {detail.overallAvgRating} / 5.0
          </span>
        </div>
      )}

      {/* L1 info panel — visible to L2 */}
      {approverLevel === "L2" && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            First Approver (L1) — {detail.firstApproverName ?? detail.firstApproverId ?? "—"}
          </p>
          {detail.l1ReviewedAt && (
            <p className="text-xs text-teal-500">
              Reviewed: {new Date(detail.l1ReviewedAt).toLocaleString("en-IN")}
            </p>
          )}
          {detail.l1OverallRemark && (
            <div className="bg-white border border-teal-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-1">
                L1 Overall Remark
              </p>
              <p className="text-sm text-teal-800">{detail.l1OverallRemark}</p>
            </div>
          )}
        </div>
      )}

      {/* Section progress bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Section {currentSection + 1} of {totalSections}
          </p>
          <p className="text-xs font-bold text-indigo-600">{currentSec?.sectionName}</p>
        </div>
        <div className="flex gap-1">
          {sections.map((sec, i) => {
            const isSuggSec = sec.sectionName === SUGGESTION_SECTION;
            const filled = isViewOnly
              ? true
              : sec.questions.every(q => {
                  if (isEffectivelyOptional(sec.sectionName, q.questionId, sec.questions, q.isRequired)) return true;
                  const r = questionRemarks[q.questionId];
                  if (isSuggSec) return !!r?.remarkText?.trim();
                  return !!r?.remarkText?.trim() && r?.revisedRating != null;
                });
            return (
              <button
                key={i}
                onClick={() => setCurrentSection(i)}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  i === currentSection ? "bg-indigo-600" : filled ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Current section card */}
      {currentSec && (
        <div ref={sectionCardRef} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Section header */}
          <div className="p-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{currentSec.sectionName}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{currentSec.questions.length} questions</p>
            </div>
            {currentSec.sectionAvgRating != null && !isSuggestionSection && (
              <span className="text-xs font-bold bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1 rounded-full">
                ⭐ {currentSec.sectionAvgRating} / 5.0
              </span>
            )}
          </div>

          <div className="p-6 space-y-8">
            {(() => {
              const suggQIds = isSuggestionSection ? currentSec.questions.map(sq => sq.questionId) : [];
              const lastSuggQId = suggQIds[suggQIds.length - 1];
              return currentSec.questions.map((q, qIdx) => {
                const remark   = questionRemarks[q.questionId];
                const l1Remark = q.revisedRemarks ?? q.l1Remark;
                const l1Rating = getEffectiveL1Rating(q);
                const l2Remark = q.finalRemarks   ?? q.l2Remark;
                const l2Rating = getEffectiveL2Rating(q);

                const isOptional = isSuggestionSection && q.questionId === lastSuggQId && !q.isRequired;
                const isMissing  = isQuestionMissing(q, currentSec.sectionName);
                const missingText   = isMissing && !remark?.remarkText?.trim();
                const missingRating = isMissing && !isSuggestionSection && remark?.revisedRating == null;

                return (
                  <div key={q.questionId} className={`space-y-3 ${isMissing ? "bg-rose-50/30 -mx-2 px-2 py-2 rounded-xl" : ""}`}>
                    <label className="flex items-start gap-2">
                      <span className="text-xs font-black text-indigo-400 mt-0.5 shrink-0">
                        {String(qIdx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {q.questionText}
                        {isOptional
                          ? <span className="text-slate-300 text-xs font-normal ml-1">(optional)</span>
                          : <span className="text-rose-400 ml-1">*</span>}
                      </span>
                    </label>

                    {/* Employee answer + self rating */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Employee Answer
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {q.answerText || <span className="italic text-slate-300">No answer</span>}
                        </p>
                      </div>
                      {!isSuggestionSection && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">
                            Self Rating
                          </p>
                          {q.selfRating != null
                            ? <RatingInput value={q.selfRating} readonly />
                            : <p className="text-xs text-slate-300 italic">Not rated</p>}
                        </div>
                      )}
                    </div>

                    {/* L1 remark — shown to L2 and VIEW_ONLY */}
                    {approverLevel !== "L1" && (l1Remark || l1Rating != null) && (
                      <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-1">
                          Manager Remark (L1)
                        </p>
                        {l1Remark && <p className="text-sm text-teal-800 mb-2">{l1Remark}</p>}
                        {!isSuggestionSection && l1Rating != null && (
                          <RatingInput value={l1Rating} readonly />
                        )}
                      </div>
                    )}

                    {/* L2 remark — view only after submitted/published */}
                    {(isViewOnly || (approverLevel === "L2" && (submitted || isPublishedOrClosed))) &&
                      (l2Remark || l2Rating != null) && (
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">
                          Final Remark (L2)
                        </p>
                        {l2Remark && <p className="text-sm text-purple-800 mb-2">{l2Remark}</p>}
                        {!isSuggestionSection && l2Rating != null && (
                          <RatingInput value={l2Rating} readonly />
                        )}
                      </div>
                    )}

                    {/* Reviewer input */}
                    {isActiveReviewer && (
                      <div className={`border rounded-xl p-4 space-y-3 ${
                        isMissing ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-100"
                      }`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${
                          isMissing ? "text-rose-500" : "text-amber-600"
                        }`}>
                          Your Remark ({approverLevel}){" "}
                          {!isOptional && <span className="text-rose-400">*</span>}
                        </p>
                        <textarea
                          rows={2}
                          placeholder="Add your remark..."
                          className={`w-full border rounded-xl p-3 text-sm outline-none focus:ring-4 resize-none bg-white ${
                            missingText
                              ? "border-rose-300 focus:ring-rose-500/10"
                              : "border-amber-200 focus:ring-amber-500/10"
                          }`}
                          value={remark?.remarkText ?? ""}
                          onChange={e => updateRemark(q.questionId, "remarkText", e.target.value)}
                        />
                        {!isSuggestionSection && (
                          <div className={`border rounded-xl p-3 ${
                            missingRating ? "bg-rose-50 border-rose-200" : "bg-white border-amber-100"
                          }`}>
                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                              missingRating ? "text-rose-500" : "text-amber-500"
                            }`}>
                              Revised Rating {!isOptional && <span className="text-rose-400">*</span>}
                              {missingRating && <span className="ml-1 font-normal">(required)</span>}
                            </p>
                            <RatingInput
                              value={remark?.revisedRating}
                              onChange={val => updateRemark(q.questionId, "revisedRating", val)}
                            />
                            {q.selfRating != null && remark?.revisedRating != null && (
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
              });
            })()}
          </div>
        </div>
      )}

      {/* Overall remark — visible on ALL sections for active reviewers */}
      {isActiveReviewer && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Overall Remark <span className="text-slate-300 font-normal">(optional)</span>
          </p>
          <textarea
            rows={3}
            placeholder="Overall comment..."
            className="w-full border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none"
            value={overallRemark}
            onChange={e => setOverallRemark(e.target.value)}
          />
        </div>
      )}

      {/* Approval timeline — always visible */}
      {detail.statusHistory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <ApprovalTimeline history={detail.statusHistory} />
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          disabled={currentSection === 0}
          onClick={() => setCurrentSection(p => p - 1)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-40"
        >
          <HiOutlineChevronLeft size={16} /> Previous
        </button>

        <div className="flex gap-2 flex-wrap items-center">

          {/* Save Draft — available on every section for active reviewers */}
          {isActiveReviewer && (
            <button
              onClick={handleSaveDraft}
              disabled={draftSaving || saving}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-40 transition-all"
            >
              <HiOutlineBookmarkSquare size={16} />
              {draftSaving ? "Saving..." : "Save Draft"}
            </button>
          )}

          {/* Reject — L1 always on last section; L2 only BEFORE saving (l2CanEdit) */}
          {approverLevel === "L1" && !isViewOnly && isLastSection && (
            <button
              onClick={() => handleActionClick(false)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-rose-200 text-rose-600 text-sm font-bold hover:bg-rose-50 disabled:opacity-40 transition-all"
            >
              <HiOutlineXCircle size={16} />
              Reject
            </button>
          )}

          {approverLevel === "L2" && l2CanEdit && isLastSection && (
            <button
              onClick={() => handleActionClick(false)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-rose-200 text-rose-600 text-sm font-bold hover:bg-rose-50 disabled:opacity-40 transition-all"
            >
              <HiOutlineXCircle size={16} />
              Reject to L1
            </button>
          )}

          {/* Next section — NO validation */}
          {!isLastSection && (
            <button
              onClick={handleNextSection}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold"
            >
              Next <HiOutlineChevronRight size={16} />
            </button>
          )}

          {/* L1: Preview & Submit → triggers L2 */}
          {approverLevel === "L1" && !isViewOnly && isLastSection && (
            <button
              onClick={() => handleActionClick(true)}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-md transition-all ${
                allFilled
                  ? "bg-teal-600 text-white hover:bg-teal-700"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <HiOutlineEye size={16} /> Preview & Submit
            </button>
          )}

          {/* L2: Preview & Save */}
          {approverLevel === "L2" && l2CanEdit && isLastSection && (
            <button
              onClick={() => handleActionClick(true)}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-md transition-all ${
                allFilled
                  ? "bg-teal-600 text-white hover:bg-teal-700"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <HiOutlineEye size={16} /> Preview & Save
            </button>
          )}

          {/* L2: Preview & Publish */}
          {canPublish && isLastSection && (
            <button
              onClick={() => handleActionClick(true, true)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              <HiOutlineEye size={16} /> Preview & Publish
            </button>
          )}

          {/* View-only indicator */}
          {isViewOnly && isLastSection && (
            <span className="px-4 py-3 text-xs text-slate-400 font-medium">
              {detail.status === "PUBLISHED" ? "✓ Published" : "View only"}
            </span>
          )}
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
};

export default AppraisalReviewPage;
