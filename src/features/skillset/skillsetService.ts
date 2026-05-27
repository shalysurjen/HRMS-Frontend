import api from "@/services/apiClient";

export interface SkillPayload {
  skillName: string;
  category: "TECHNICAL" | "TOOLS" | "INTERPERSONAL";
  rating: number;
  learnedAt?: string;
  appliedAt?: string;
  dateLearned?: string; // ISO date string e.g. "2026-01-15"
  certDate?: string;
}

// Shared helper: builds the FormData expected by the Spring Boot controller.
// The controller uses @RequestPart("dto") for the JSON blob and
// @RequestPart("proofFile") for the optional file.
function buildFormData(payload: SkillPayload, file?: File): FormData {
  const formData = new FormData();
  formData.append(
    "dto",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );
  if (file) {
    formData.append("proofFile", file);
  }
  return formData;
}

// Multipart config: clears the default "application/json" Content-Type so
// Axios can set "multipart/form-data; boundary=..." automatically.
const multipartConfig = {
  headers: { "Content-Type": undefined as unknown as string },
};

export const skillsetService = {
  // ── Employee APIs ────────────────────────────────────────────────────────

  /** GET /api/skillset/me — all skills for the logged-in employee */
  getMySkills: () => api.get("/api/skillset/me"),

  /** POST /api/skillset — add a new skill (with optional proof file) */
  addSkill: (payload: SkillPayload, file?: File) =>
    api.post("/api/skillset", buildFormData(payload, file), multipartConfig),

  /** PUT /api/skillset/{id} — edit an existing skill */
  updateSkill: (id: number, payload: SkillPayload, file?: File) =>
    api.put(`/api/skillset/${id}`, buildFormData(payload, file), multipartConfig),

  /** DELETE /api/skillset/{id} */
  deleteSkill: (id: number) => api.delete(`/api/skillset/${id}`),

  /** GET /api/skillset/me/badges — counts + badge flags for Badges.tsx / Progression.tsx */
  getMyBadges: () => api.get("/api/skillset/me/badges"),

  /** GET /api/skillset/{id}/file — download/view the proof file */
  getSkillFile: (id: number) =>
    api.get(`/api/skillset/${id}/file`, { responseType: "blob" }),

  // ── Manager / HR APIs ────────────────────────────────────────────────────

  /** GET /api/skillset/team — skills for all direct reports */
  getTeamSkills: () => api.get("/api/skillset/team"),

  /** GET /api/skillset/employee/{employeeId} — skills for a specific employee */
  getEmployeeSkills: (employeeId: number | string) =>
    api.get(`/api/skillset/employee/${employeeId}`),
};