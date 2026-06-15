// src/features/appraisal/types/appraisal.ts

export type AppraisalStatus =
  | "DRAFT" | "SUBMITTED" | "UNDER_REVIEW"
  | "L1_APPROVED" | "L1_REJECTED"
  | "L2_UNDER_REVIEW"   // L2 clicked Start Review → Pending tab
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

// ── NEW: lightweight project item returned by the backend ───────────────────
export interface ProjectItem {
  id: number;
  projectName: string;
  description: string;
}

export interface QuestionAnswer {
  questionId: number;
  questionText: string;
  inputType: string;
  isRequired: boolean;
  answerText?: string;
  selfRating?: number;

  // L1 answer-level fields
  revisedRating?: number;
  revisedRemarks?: string;

  // L2 / final answer-level fields
  finalRating?: number;
  finalRemarks?: string;

  // Legacy remark-table fallback fields
  l1Remark?: string;
  l1RevisedRating?: number;
  l2Remark?: string;
  l2RevisedRating?: number;

  // ── NEW: projects for Q6 ─────────────────────────────────────────────────
  projects?: ProjectItem[];
}

export interface SectionData {
  sectionName: string;
  questions: QuestionAnswer[];
  sectionAvgRating?: number;
}

export interface StatusHistory {
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedByName?: string;
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
  combinedAvgRating?: number;  // (emp + L1) / 2  or  (emp + L1 + L2) / 3
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
  // ── NEW: needed so dashboard can compute per-record approver level ─────────
  firstApproverId?: string;
  finalApproverId?: string;
}

// Rating options: 0, 0.5, 1.0 ... 5.0
export const RATING_OPTIONS = Array.from({ length: 11 }, (_, i) => i * 0.5);

export const getEffectiveL1Rating = (q: QuestionAnswer): number | undefined =>
  q.revisedRating ?? q.l1RevisedRating;

export const getEffectiveL2Rating = (q: QuestionAnswer): number | undefined =>
  q.finalRating ?? q.l2RevisedRating;

const SUGGESTION_SECTION = "Suggestions";

export const computeSectionAvg = (
  questions: QuestionAnswer[],
  answers: Record<number, AnswerDTO>
): number | null => {
  const rated = questions.filter(q => answers[q.questionId]?.selfRating !== undefined);
  if (!rated.length) return null;
  const sum = rated.reduce((acc, q) => acc + (answers[q.questionId]?.selfRating ?? 0), 0);
  return Math.round((sum / rated.length) * 100) / 100;
};

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
