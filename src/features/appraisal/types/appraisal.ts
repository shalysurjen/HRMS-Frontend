export type AppraisalStatus =
  | "DRAFT" | "SUBMITTED" | "UNDER_REVIEW"
  | "L1_APPROVED" | "L1_REJECTED"
  | "L2_REJECTED"
  | "FINAL_REVIEW" | "PUBLISHED" | "CLOSED";

export interface AppraisalCycle {
  id: number;
  cycleLabel: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  isOpen: boolean;
}

export interface AppraisalQuestion {
  id: number;
  section: string;
  sortOrder: number;
  questionText: string;
  inputType: "TEXTAREA" | "RATING" | "TEXT";
  isRequired: boolean;
}

export interface AnswerDTO {
  questionId: number;
  answerText?: string;
  selfRating?: number;
}

export interface QuestionAnswer {
  questionId: number;
  questionText: string;
  inputType: string;
  isRequired: boolean;
  answerText?: string;
  selfRating?: number;

  // NEW: answer-level L1 reviewer fields (stored on SelfAppraisalAnswer)
  revisedRating?: number;
  revisedRemarks?: string;

  // NEW: answer-level L2 / final reviewer fields
  finalRating?: number;
  finalRemarks?: string;

  // Legacy remark-table fields (still populated for backward compat)
  l1Remark?: string;
  l1RevisedRating?: number;
  l2Remark?: string;
  l2RevisedRating?: number;
}

export interface SectionData {
  sectionName: string;
  questions: QuestionAnswer[];
  /** NEW: average of selfRating across rated questions in this section. */
  sectionAvgRating?: number;
}

export interface StatusHistory {
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  /** NEW: human-readable name of the actor. */
  changedByName?: string;
  /** NEW: semantic action type (e.g. "SUBMITTED", "L1_APPROVED"). */
  actionType?: string;
  remarks?: string;
  changedAt: string;
}

export interface AppraisalDetail {
  appraisalId: number;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  doj: string;
  totalExperience: string;
  companyExperience: string;
  experienceType: "Fresher" | "Experienced";
  reportingManager: string;
  cycleLabel: string;
  status: AppraisalStatus;
  submittedAt?: string;
  l1ReviewedAt?: string;
  publishedAt?: string;
  overallAvgRating?: number;
  // Approver identity (so L2 can see L1's info)
  firstApproverId?: string;
  firstApproverName?: string;
  finalApproverId?: string;
  finalApproverName?: string;
  l1OverallRemark?: string;
  l2OverallRemark?: string;
  sections: SectionData[];
  statusHistory: StatusHistory[];
}

export interface AppraisalSummary {
  appraisalId: number;
  employeeId: string;
  employeeName: string;
  cycleLabel: string;
  status: AppraisalStatus;
  submittedAt?: string;
  publishedAt?: string;
}

// Rating options: 0, 0.5, 1.0 ... 5.0
export const RATING_OPTIONS = Array.from({ length: 11 }, (_, i) => i * 0.5);

/** Derive the effective L1 rating for a question (answer-level → remark-table fallback). */
export const getEffectiveL1Rating = (q: QuestionAnswer): number | undefined =>
  q.revisedRating ?? q.l1RevisedRating;

/** Derive the effective L2 / final rating for a question. */
export const getEffectiveL2Rating = (q: QuestionAnswer): number | undefined =>
  q.finalRating ?? q.l2RevisedRating;

const SUGGESTION_SECTION = "Suggestions";

/** Compute section average for a set of answer objects (local draft state). */
export const computeSectionAvg = (
  questions: QuestionAnswer[],
  answers: Record<number, AnswerDTO>
): number | null => {
  const rated = questions.filter(q => answers[q.questionId]?.selfRating !== undefined);
  if (!rated.length) return null;
  const sum = rated.reduce((acc, q) => acc + (answers[q.questionId]?.selfRating ?? 0), 0);
  return Math.round((sum / rated.length) * 100) / 100;
};

/** Compute overall average across all sections EXCLUDING the Suggestion section (local draft state). */
export const computeOverallAvg = (
  sections: SectionData[],
  answers: Record<number, AnswerDTO>
): number | null => {
  const allRated = sections
    .filter(s => s.sectionName !== SUGGESTION_SECTION)
    .flatMap(s => s.questions)
    .filter(q => answers[q.questionId]?.selfRating !== undefined);
  if (!allRated.length) return null;
  const sum = allRated.reduce((acc, q) => acc + (answers[q.questionId]?.selfRating ?? 0), 0);
  return Math.round((sum / allRated.length) * 100) / 100;
};