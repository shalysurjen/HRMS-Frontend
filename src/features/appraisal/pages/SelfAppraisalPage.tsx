import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/shared/auth/useAuth";
import { useAppraisal } from "@/features/appraisal/hooks/useAppraisal";
import type { AnswerDTO, SectionData } from "@/features/appraisal/types/appraisal";
import { computeSectionAvg, computeOverallAvg } from "@/features/appraisal/types/appraisal";
import { RatingInput } from "@/features/appraisal/components/RatingInput";
import { EmployeeInfoCard } from "@/features/appraisal/components/EmployeeInfoCard";
import { ApprovalTimeline } from "@/features/appraisal/components/ApprovalTimeline";
import { StatusBadge } from "@/features/appraisal/components/StatusBadge";
import {
  HiOutlineChevronRight, HiOutlineChevronLeft,
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentText,
  HiOutlineLockClosed, HiOutlineInformationCircle, HiOutlineStar,
  HiOutlineTrophy, HiOutlineArrowDownTray, HiOutlineExclamationCircle,
} from "react-icons/hi2";
import { appraisalService } from "@/features/appraisal/services/appraisalService";
import { AppraisalPreview } from "@/features/appraisal/components/AppraisalPreview";
import { ProjectInput } from "@/features/appraisal/components/ProjectInput";

/**
 * SelfAppraisalPage — EMPLOYEE only (enforced via AppRoutes).
 *
 * States:
 *  "select"  → choose appraisal cycle
 *  "form"    → fill / view the appraisal
 *  "done"    → submitted, waiting for manager review
 *  "result"  → PUBLISHED: employee sees full form with L1 + L2 remarks & ratings
 *
 * Optionality rules:
 *  - isRequired = true  → MANDATORY (text + rating both required)
 *  - isRequired = false → OPTIONAL (can skip)
 *  - Section name does NOT affect optionality — DB flag is the only source of truth
 */

const SUGGESTION_SECTION = "Suggestions";

const SelfAppraisalPage = () => {
  const { user } = useAuth();
  const { cycles, detail, loading, error, loadCycles, loadOrCreate, saveDraft, submitFinal } =
    useAppraisal();

  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [step, setStep] = useState<"select" | "form" | "preview" | "done" | "result">("select");
  const [currentSection, setCurrentSection] = useState(0);
  const sectionCardRef = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<Record<number, AnswerDTO>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [skippedLastQuestion, setSkippedLastQuestion] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // Track whether submit was attempted — to show rose highlights
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => { loadCycles(); }, []); 
  // eslint-disable-line
  
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // ── Employee: download their own published PDF ──────────────────────────
  const handleDownloadPdf = async () => {
    if (!user?.id || !selectedCycleId) return;
    setDownloading(true);
    try {
      await appraisalService.exportEmployeePdf(user.id, selectedCycleId);
    } catch {
      showToast("PDF download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Employee: download their own published Excel ────────────────────────
  const handleDownloadExcel = async () => {
    if (!user?.id || !selectedCycleId) return;
    setDownloading(true);
    try {
      await appraisalService.exportEmployeeExcel(user.id, selectedCycleId);
    } catch {
      showToast("Excel download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Load appraisal after cycle selection ────────────────────────────────
  const handleCycleNext = async () => {
    if (!selectedCycleId || !user?.id) return;
    const data = await loadOrCreate(user.id, selectedCycleId);
    if (!data) return;

    // Pre-populate answers from existing draft / submitted data
    const existing: Record<number, AnswerDTO> = {};
    data.sections.forEach(sec =>
      sec.questions.forEach(q => {
        if (q.answerText || (q.selfRating !== undefined && q.selfRating !== null)) {
          existing[q.questionId] = {
            questionId: q.questionId,
            answerText: q.answerText,
            selfRating: q.selfRating ?? undefined,
          };
        }
      })
    );
    setAnswers(existing);

    if (data.status === "PUBLISHED" || data.status === "CLOSED") {
      setStep("result");
    } else {
      setStep("form");
    }
  };

  // ── Save draft ──────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!user?.id || !selectedCycleId) return;
    setSaving(true);
    await saveDraft(user.id, selectedCycleId, Object.values(answers));
    setSaving(false);
    showToast("Draft saved successfully!");
  };

  // ── Validate + go to preview ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user?.id || !selectedCycleId || !detail) return;

    const allQuestions = detail.sections.flatMap(s => s.questions);
    const totalQuestions = allQuestions.length;
    const lastQuestion = allQuestions[totalQuestions - 1];

    const missing = allQuestions.filter((q, idx) => {
      if (!q.isRequired) return false;
      const isLast = idx === totalQuestions - 1;
      if (isLast && !q.isRequired) return false;
      const ans = answers[q.questionId];
      const isSuggestionSec = detail.sections.find(s =>
        s.questions.some(sq => sq.questionId === q.questionId)
      )?.sectionName === SUGGESTION_SECTION;
      if (isSuggestionSec) return !ans?.answerText || ans.answerText.trim().length === 0;
      const isProjectQ = detail.sections.find(s =>
        s.questions.some(sq => sq.questionId === q.questionId)
      )?.sectionName === "Performance" && q.questionText.toLowerCase().includes("project");
      const hasText   = isProjectQ ? true : (ans?.answerText && ans.answerText.trim().length > 0);
      const hasRating = ans?.selfRating != null;
      return !hasText || !hasRating;
    });

    if (missing.length) {
      setSubmitAttempted(true);
      showToast(`Please complete ${missing.length} required field(s) before submitting.`);
      return;
    }

    const lastIsOptionalAndBlank =
      lastQuestion &&
      !lastQuestion.isRequired &&
      !answers[lastQuestion.questionId]?.answerText &&
      answers[lastQuestion.questionId]?.selfRating == null;

    if (lastIsOptionalAndBlank && !skippedLastQuestion) {
      setSkippedLastQuestion(true);
      showToast("Last question is optional. Click Submit again to confirm.");
      return;
    }

    // All valid — go to preview
    setStep("preview");
  };

  // ── Confirm submit (called from preview) ────────────────────────────────
  const handleConfirmSubmit = async () => {
    if (!user?.id || !selectedCycleId) return;
    setSaving(true);
    const res = await submitFinal(user.id, selectedCycleId, Object.values(answers));
    setSaving(false);
    if (res) {
      setStep("done");
      showToast("Appraisal submitted successfully!");
    }
  };

  const sections = detail?.sections ?? [];
  const totalSections = sections.length;
  const currentSec: SectionData | undefined = sections[currentSection];

  const isSubmitted = detail?.status !== "DRAFT" && detail?.status !== "L1_REJECTED";
  const isSuggestionSection = currentSec?.sectionName === SUGGESTION_SECTION;

  // ── Next section: NO validation, just scroll to section card ─────────────
  const handleNextSection = () => {
    setCurrentSection(p => p + 1);
    setTimeout(() => {
      sectionCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const updateAnswer = (
    questionId: number,
    field: "answerText" | "selfRating",
    value: string | number | undefined
  ) => {
    if (skippedLastQuestion) setSkippedLastQuestion(false);
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], questionId, [field]: value },
    }));
  };

  // Helper: is this question missing a required field?
  const isQuestionMissing = (q: {
    questionText: any; questionId: number; isRequired: boolean 
}, secName: string) => {
    if (!q.isRequired) return false;
    if (!submitAttempted) return false;
    const ans = answers[q.questionId];
    if (secName === SUGGESTION_SECTION) {
      return !ans?.answerText || ans.answerText.trim().length === 0;
    }
    const isProjectQ = secName === "Performance" && q.questionText.toLowerCase().includes("project");
    const hasText   = isProjectQ ? true : (ans?.answerText && ans.answerText.trim().length > 0);
    const hasRating = ans?.selfRating != null;
    return !hasText || !hasRating;
  };

  const sectionAvg = currentSec ? computeSectionAvg(currentSec.questions, answers) : null;
  const overallAvg = sections.length ? computeOverallAvg(sections, answers) : null;

  // ── Step: Select Cycle ───────────────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Self Appraisal</h1>
        <p className="text-sm text-slate-400 mb-8">Select the appraisal year to begin</p>

        <div className="space-y-3 mb-8">
          {cycles.map(c => {
            const isSelected = selectedCycleId === c.id;
            return (
              <button
                key={c.id}
                disabled={!c.isOpen && !c.isActive}
                onClick={() => c.isOpen && setSelectedCycleId(c.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all
                  ${isSelected ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-slate-200 bg-white hover:border-slate-300"}
                  ${!c.isOpen ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${c.isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                    <HiOutlineDocumentText size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">{c.cycleLabel}</p>
                    <p className="text-xs text-slate-400">
                      {c.isActive ? "Current Year" : !c.isOpen ? "View Only" : "Open"}
                    </p>
                  </div>
                </div>
                {c.isActive && (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          disabled={!selectedCycleId || loading}
          onClick={handleCycleNext}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "Loading..." : "Next →"}
        </button>
      </div>
    );
  }

  // ── Step: Done (submitted, waiting for manager) ──────────────────────────
  if (step === "done" && detail) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center">
        <HiOutlineCheckCircle size={56} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Submitted!</h2>
        <p className="text-sm text-slate-400 mt-2 mb-2">
          Your appraisal has been sent to your reporting manager for review.
        </p>
        <p className="text-xs text-slate-300 mb-6">
          You will be notified once the review is complete and results are published.
        </p>
        <button onClick={() => setStep("select")} className="text-sm text-indigo-600 font-medium">
          ← Back to Appraisals
        </button>
      </div>
    );
  }

  // ── Step: Result (PUBLISHED — employee sees full result) ─────────────────
  if (step === "result" && detail) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
            {toast}
          </div>
        )}

        {/* Published banner */}
        <div className="flex items-center gap-3 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex-wrap">
          <HiOutlineTrophy size={28} className="text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-bold text-emerald-800">Appraisal Result Published</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Your manager has reviewed and published your appraisal.
              {detail.publishedAt && ` Published on ${new Date(detail.publishedAt).toLocaleDateString("en-IN")}.`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={detail.status} />
            <button
              onClick={handleDownloadExcel}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <HiOutlineArrowDownTray size={13} />
              {downloading ? "..." : "Excel"}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all disabled:opacity-50"
            >
              <HiOutlineDocumentText size={13} />
              {downloading ? "..." : "PDF"}
            </button>
          </div>
        </div>

        {/* Overall rating summary */}
        {detail.overallAvgRating !== undefined && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center">
                <HiOutlineStar size={28} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Rating</p>
                <p className="text-3xl font-black text-slate-800">
                  {detail.overallAvgRating}
                  <span className="text-sm text-slate-400 font-normal ml-1">/ 5.0</span>
                </p>
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-wrap gap-3">
              {detail.l1OverallRemark && (
                <div className="flex-1 min-w-[180px] bg-teal-50 border border-teal-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-1">
                    Manager Remark (L1)
                  </p>
                  <p className="text-xs text-teal-800">{detail.l1OverallRemark}</p>
                </div>
              )}
              {detail.l2OverallRemark && (
                <div className="flex-1 min-w-[180px] bg-purple-50 border border-purple-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">
                    Final Approver Remark (L2)
                  </p>
                  <p className="text-xs text-purple-800">{detail.l2OverallRemark}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <EmployeeInfoCard detail={detail} />

        {/* Sections with answers + remarks */}
        {detail.sections.map((sec, sIdx) => {
          return (
            <div key={sIdx} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">{sec.sectionName}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{sec.questions.length} questions</p>
                </div>
                {sec.sectionAvgRating !== undefined && sec.sectionName !== SUGGESTION_SECTION && (
                  <span className="text-xs font-bold bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1 rounded-full">
                    ⭐ Avg {sec.sectionAvgRating} / 5.0
                  </span>
                )}
              </div>

              <div className="p-6 space-y-6">
                {sec.questions.map((q, idx) => {
                  const isSuggestion = sec.sectionName === SUGGESTION_SECTION;
                  const suggQIds = sec.sectionName === SUGGESTION_SECTION
                    ? sec.questions.map(sq => sq.questionId)
                    : [];  
                  const lastSuggQId = suggQIds[suggQIds.length - 1];
                  const isOptional =
                    sec.sectionName === SUGGESTION_SECTION &&
                    q.questionId === lastSuggQId &&
                    !q.isRequired;
                  return (
                    <div key={q.questionId} className="space-y-3">
                      <label className="flex items-start gap-2">
                        <span className="text-xs font-black text-indigo-400 mt-0.5 shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {q.questionText}
                          {isOptional ? (
                            <span className="text-slate-300 ml-1 text-xs font-normal">(optional)</span>
                          ) : (
                            <span className="text-rose-400 ml-1">*</span>
                          )}
                        </span>
                      </label>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Your Answer
                        </p>
                        <p className="text-sm text-slate-700">{q.answerText || "—"}</p>
                      </div>

                      {!isSuggestion && q.selfRating !== undefined && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Self Rating
                          </p>
                          <RatingInput value={q.selfRating} onChange={() => {}} readonly />
                        </div>
                      )}

                      {(q.revisedRemarks || q.l1Remark) && (
                        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-1">
                            Manager Remark (L1) — {detail.firstApproverName ?? "Manager"}
                          </p>
                          <p className="text-xs text-teal-800">{q.revisedRemarks ?? q.l1Remark}</p>
                          {!isSuggestion && (q.revisedRating ?? q.l1RevisedRating) !== undefined && (
                            <p className="text-xs text-teal-600 mt-1">
                              Revised Rating: <strong>{q.revisedRating ?? q.l1RevisedRating} / 5.0</strong>
                            </p>
                          )}
                        </div>
                      )}

                      {(q.finalRemarks || q.l2Remark) && (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">
                            Final Approver Remark (L2) — {detail.finalApproverName ?? "Final Approver"}
                          </p>
                          <p className="text-xs text-purple-800">{q.finalRemarks ?? q.l2Remark}</p>
                          {!isSuggestion && (q.finalRating ?? q.l2RevisedRating) !== undefined && (
                            <p className="text-xs text-purple-600 mt-1">
                              Final Rating: <strong>{q.finalRating ?? q.l2RevisedRating} / 5.0</strong>
                            </p>
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

        {detail.statusHistory.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Approval Timeline</h3>
            <ApprovalTimeline history={detail.statusHistory} />
          </div>
        )}

        <button onClick={() => setStep("select")} className="text-sm text-indigo-600 font-medium">
          ← Back to Appraisals
        </button>
      </div>
    );
  }

  // ── Step: Preview (before final submit) ─────────────────────────────────
  if (step === "preview" && detail) {
    // Convert AnswerDTO map → the remarks shape AppraisalPreview expects
    const remarksFromAnswers: Record<number, { remarkText: string; revisedRating?: number }> =
      Object.fromEntries(
        Object.entries(answers).map(([qId, ans]) => [
          Number(qId),
          { remarkText: ans.answerText ?? "", revisedRating: ans.selfRating },
        ])
      );

    return (
      <AppraisalPreview
        detail={detail}
        remarks={remarksFromAnswers}
        overallRemark=""
        approverLevel="EMPLOYEE"
        actionLabel={skippedLastQuestion ? "Confirm Submit (skip last) ✓" : "Submit Appraisal ✓"}
        actionColor="indigo"
        onCancel={() => setStep("form")}
        onConfirm={handleConfirmSubmit}
        saving={saving}
      />
    );
  }

  // ── Step: Form (fill / locked view) ────────────────────────────────────
  if (!detail) return null;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* L1 Rejected — tell employee why form is editable again */}
      {detail.status === "L1_REJECTED" && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <HiOutlineExclamationCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-800">Your manager has returned this appraisal</p>
            <p className="text-xs text-rose-600 mt-0.5">
              Please review the feedback, update your responses, and resubmit.
            </p>
            {detail.statusHistory.slice().reverse().find(h => h.toStatus === "L1_REJECTED")?.remarks && (
              <p className="text-xs text-rose-700 mt-2 bg-white border border-rose-100 rounded-xl px-3 py-2">
                <span className="font-bold">Manager note: </span>
                {detail.statusHistory.slice().reverse().find(h => h.toStatus === "L1_REJECTED")!.remarks}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status banner when locked */}
      {isSubmitted && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <HiOutlineLockClosed size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Appraisal submitted</p>
            <p className="text-xs text-amber-600">
              Your responses are locked. Current status:{" "}
              <strong>{detail.status.replace(/_/g, " ")}</strong>
            </p>
            {(detail.status === "SUBMITTED" || detail.status === "L1_APPROVED" || detail.status === "FINAL_REVIEW") && (
              <p className="text-xs text-amber-500 mt-0.5">
                Your manager is reviewing your appraisal. Results will be visible once published.
              </p>
            )}
            {detail.status === "L2_REJECTED" && (
              <p className="text-xs text-amber-500 mt-0.5">
                Your appraisal has been sent back to your manager for re-review. No action needed from you.
              </p>
            )}
          </div>
          <span className="ml-auto"><StatusBadge status={detail.status} /></span>
        </div>
      )}

      <EmployeeInfoCard detail={detail} />

      {/* Overall average chip */}
      {overallAvg !== null && !isSubmitted && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full">
            <span>📊</span>
            <span>Overall average: {overallAvg} / 5.0</span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Section {currentSection + 1} of {totalSections}
          </p>
          <p className="text-xs font-bold text-indigo-600">{currentSec?.sectionName}</p>
        </div>
        <div className="flex gap-1">
          {sections.map((sec, i) => {
            const filled = sec.questions.every(q => {
              if (!q.isRequired) return true;
              const isSuggSec = sec.sectionName === SUGGESTION_SECTION;
              const ans = answers[q.questionId];
              if (isSuggSec) {
                return ans?.answerText && ans.answerText.trim().length > 0;
              }
              return (
                (ans?.answerText && ans.answerText.trim().length > 0) &&
                ans?.selfRating != null
              );
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

      {/* Questions */}
      {currentSec && (
        <div ref={sectionCardRef} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{currentSec.sectionName}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentSec.questions.length} questions
              </p>
            </div>
            {currentSec.sectionAvgRating !== undefined && !isSuggestionSection && (
              <span className="text-xs font-bold bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1 rounded-full">
                ⭐ Avg {currentSec.sectionAvgRating} / 5.0
              </span>
            )}
          </div>

          <div className="p-6 space-y-8">
            {currentSec.questions.map((q, idx) => {
              const ans = answers[q.questionId];
              const charCount = ans?.answerText?.length ?? 0;

              const allQuestions = detail.sections.flatMap(s => s.questions);
              const isGlobalLast = q.questionId === allQuestions[allQuestions.length - 1]?.questionId;

              const suggestionQIds = detail.sections
                .find(s => s.sectionName === SUGGESTION_SECTION)
                ?.questions.map(sq => sq.questionId) ?? [];
              const lastSuggestionQId = suggestionQIds[suggestionQIds.length - 1];
              const isEffectivelyOptional =
                isSuggestionSection &&
                q.questionId === lastSuggestionQId &&
                !q.isRequired;

              // Rose highlight when submit attempted and field is missing
              const missing = isQuestionMissing(q, currentSec.sectionName);
              const missingText   = missing && !(ans?.answerText && ans.answerText.trim().length > 0);
              const missingRating = missing && !isSuggestionSection && ans?.selfRating == null;

              return (
                <div key={q.questionId} className={`space-y-3 ${missing ? "bg-rose-50/30 -mx-2 px-2 py-2 rounded-xl" : ""}`}>
                  <label className="flex items-start gap-2">
                    <span className="text-xs font-black text-indigo-400 mt-0.5 shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {q.questionText}
                      {isEffectivelyOptional ? (
                        <span className="text-slate-400 ml-1 text-xs font-normal">(optional)</span>
                      ) : (
                        <span className="text-rose-500 ml-1" title="Required">*</span>
                      )}
                    </span>
                  </label>

                  {/* Textarea — hidden for project question (Projects widget replaces it) */}
                  {!(currentSec?.sectionName === "Performance" && q.questionText.toLowerCase().includes("project")) && (
                  <div className="relative">
                    <textarea
                      rows={3}
                      disabled={isSubmitted}
                      placeholder={isSubmitted ? "—" : "Write your response here..."}
                      className={`w-full border rounded-xl p-4 text-sm outline-none focus:ring-4 resize-none disabled:bg-slate-50 disabled:text-slate-600 ${
                        missingText
                          ? "border-rose-300 bg-rose-50 focus:ring-rose-500/10"
                          : "border-slate-200 focus:ring-indigo-500/10"
                      }`}
                      value={ans?.answerText ?? ""}
                      onChange={e => updateAnswer(q.questionId, "answerText", e.target.value)}
                      maxLength={2000}
                    />
                    {!isSubmitted && (
                      <span className="absolute bottom-2 right-3 text-[10px] text-slate-300">
                        {charCount}/2000
                      </span>
                    )}
                  </div>
                  )}

                  {/* Project entries — only for Performance section, projects question */}
                  {detail.appraisalId && currentSec?.sectionName === "Performance" && q.questionText.toLowerCase().includes("project") && (
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Projects
                      </p>
                      <ProjectInput
                        appraisalId={detail.appraisalId}
                        questionId={q.questionId}
                        readonly={isSubmitted}
                      />
                    </div>
                  )}

                  {/* Self rating — not shown for Suggestions section */}
                  {!isSuggestionSection && (
                    <div className={`border rounded-xl p-3 ${
                      missingRating
                        ? "bg-rose-50 border-rose-200"
                        : "bg-slate-50 border-slate-200"
                    }`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                        missingRating ? "text-rose-500" : "text-slate-400"
                      }`}>
                        Self Rating
                        {isEffectivelyOptional && (
                          <span className="ml-1 font-normal text-slate-300">(optional)</span>
                        )}
                        {missingRating && (
                          <span className="ml-1 font-normal">(required)</span>
                        )}
                      </p>
                      <RatingInput
                        value={ans?.selfRating}
                        onChange={val => updateAnswer(q.questionId, "selfRating", val)}
                        readonly={isSubmitted}
                      />
                    </div>
                  )}

                  {/* Optional skip hint for last question */}
                  {isGlobalLast && !q.isRequired && !isSubmitted && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <HiOutlineInformationCircle size={14} />
                      <span>This question is optional — you may skip it and submit.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section average chip */}
      {currentSec && sectionAvg !== null && !isSuggestionSection && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full">
            <span>⭐</span>
            <span>Section average: {sectionAvg} / 5.0</span>
          </div>
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

        <div className="flex gap-3">
          {!isSubmitted && (
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-5 py-3 rounded-xl border border-indigo-200 text-indigo-600 text-sm font-bold hover:bg-indigo-50 disabled:opacity-50 flex items-center gap-2"
            >
              <HiOutlineClock size={16} /> {saving ? "Saving..." : "Save Draft"}
            </button>
          )}

          {currentSection < totalSections - 1 ? (
            <button
              onClick={handleNextSection}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold"
            >
              Next <HiOutlineChevronRight size={16} />
            </button>
          ) : !isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className={`px-6 py-3 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50
                ${skippedLastQuestion
                  ? "bg-amber-500 shadow-amber-200 animate-pulse"
                  : "bg-indigo-600 shadow-indigo-200"
                }`}
            >
              {saving
                ? "Submitting..."
                : skippedLastQuestion
                ? "Confirm Submit (skip last) ✓"
                : "Submit Appraisal ✓"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Approval Timeline */}
      {detail.statusHistory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <ApprovalTimeline history={detail.statusHistory} />
        </div>
      )}
    </div>
  );
};

export default SelfAppraisalPage;