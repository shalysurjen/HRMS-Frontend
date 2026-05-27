import React, { useState, useEffect } from "react";
import { skillsetService } from "@/features/skillset/skillsetService";
import type { SkillPayload } from "@/features/skillset/skillsetService";
// ── Types ──────────────────────────────────────────────────────────────────
// "type" here maps to the backend categoryLabel: "Technical" | "Tools & Platforms" | "Interpersonal"
// But we also handle the enum values TECHNICAL / TOOLS / INTERPERSONAL
type SkillType = "tech" | "tools" | "soft";

interface Skill {
  id: number;
  name: string;
  type: SkillType;
  rating: number;
  learn: string;
  apply: string;
  dateAdded: string;
  dateLearned: string;
  certDate: string;
  modified: string;
  file: string;       // URL to download
  fileName: string;   // display name
}

// ── Map backend response → frontend Skill ─────────────────────────────────
function mapResponse(d: any): Skill {
  // Backend category comes as enum string (TECHNICAL / TOOLS / INTERPERSONAL)
  // or as type alias string ("Technical" / "Tools & Platforms" / "Interpersonal")
  const catRaw: string = d.category ?? "";
  let type: SkillType = "tech";
  if (catRaw === "TOOLS" || catRaw === "Tools & Platforms") type = "tools";
  else if (catRaw === "INTERPERSONAL" || catRaw === "Interpersonal") type = "soft";

  return {
    id: d.id,
    name: d.skillName ?? d.name ?? "",
    type,
    rating: d.rating ?? d.stars ?? 0,
    learn: d.learnedAt ?? d.learn ?? "",
    apply: d.appliedAt ?? d.apply ?? "",
    dateAdded: d.dateAdded ?? "",
    dateLearned: d.dateLearned ?? "",
    certDate: d.certDate ?? d.certifiedDate ?? "",
    modified: d.modified ?? (d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : ""),
    file: d.file ?? d.proofFileUrl ?? d.certLink ?? "",
    fileName: d.proofFileName ?? "",
  };
}

// ── Map frontend Skill → backend payload ──────────────────────────────────
function toPayload(s: Skill): SkillPayload {
  const categoryMap: Record<SkillType, SkillPayload["category"]> = {
    tech: "TECHNICAL",
    tools: "TOOLS",
    soft: "INTERPERSONAL",
  };
  return {
    skillName: s.name,
    category: categoryMap[s.type],
    rating: s.rating,
    learnedAt: s.learn || undefined,
    appliedAt: s.apply || undefined,
    dateLearned: s.dateLearned || undefined,
    certDate: s.certDate || undefined,
  };
}

// ── Star renderer ──────────────────────────────────────────────────────────
function Stars({ rating, onChange }: { rating: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <span
          key={v}
          onClick={() => onChange?.(v)}
          className={`text-xl ${onChange ? "cursor-pointer" : ""}`}
          style={{ color: v <= rating ? "#D4AF37" : "#dee2e6" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ── Skill Card ─────────────────────────────────────────────────────────────
function SkillCard({
  skill,
  onEdit,
  onDelete,
}: {
  skill: Skill;
  onEdit: (s: Skill) => void;
  onDelete: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const borderColor =
    skill.type === "tech" ? "#2977d0" : skill.type === "tools" ? "#6f42c1" : "#0dcaf0";

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${skill.name}"?`)) return;
    setDeleting(true);
    try {
      await skillsetService.deleteSkill(skill.id);
      onDelete(skill.id);
    } catch {
      alert("Failed to delete skill. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl mb-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden"
      style={{ borderLeft: `6px solid ${borderColor}` }}
    >
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <span className="font-bold text-sm text-gray-800">{skill.name}</span>
          <div className="mt-1">
            <Stars rating={skill.rating} />
          </div>
        </div>
        <div className="flex gap-1">
          <button
            className="text-gray-400 hover:text-gray-600 p-1"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(skill);
            }}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className="text-gray-400 hover:text-red-500 p-1 disabled:opacity-40"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3">
          <div
            className="rounded-lg p-3 text-sm"
            style={{ background: "#fdfdfd", border: "1px dashed #e9ecef" }}
          >
            <div className="grid grid-cols-2 gap-y-1 mb-2">
              <div>
                <strong>Learned:</strong> {skill.learn || "—"}
              </div>
              <div>
                <strong>Applied:</strong> {skill.apply || "—"}
              </div>
              <div className="col-span-2">
                <strong>Proof:</strong>{" "}
                {skill.file ? (
                  <a
                    href={skill.file}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 no-underline text-xs"
                  >
                    📄 {skill.fileName || "View file"}
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs">No file uploaded</span>
                )}
              </div>
            </div>
            <div
              className="text-xs text-gray-400 italic pt-2"
              style={{ borderTop: "1px solid #e9ecef" }}
            >
              Added: {skill.dateAdded || "—"} | Learned: {skill.dateLearned || "—"} | Cert:{" "}
              {skill.certDate || "—"} | Modified: {skill.modified || "—"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────
function EditModal({
  skill,
  onClose,
  onSave,
}: {
  skill: Skill | "new";
  onClose: () => void;
  onSave: (updated: Skill) => void;
}) {
  const isNew = skill === "new";
  const [form, setForm] = useState<Skill>(
    isNew
      ? {
          id: 0,
          name: "",
          type: "tech",
          rating: 0,
          learn: "",
          apply: "",
          dateAdded: "",
          dateLearned: "",
          certDate: "",
          modified: "",
          file: "",
          fileName: "",
        }
      : { ...skill }
  );
  const [newFile, setNewFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof Skill, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim() || form.rating === 0) {
      setError("Skill name and rating are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(form);
      let data: any;
      if (isNew) {
        ({ data } = await skillsetService.addSkill(payload, newFile ?? undefined));
      } else {
        ({ data } = await skillsetService.updateSkill(form.id, payload, newFile ?? undefined));
      }
      onSave(mapResponse(data));
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Save failed. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 text-white rounded-t-xl"
          style={{ backgroundColor: "#001d3d" }}
        >
          <h5 className="font-semibold text-sm flex items-center gap-2">
            {isNew ? "➕ Add Competency" : "✏️ Edit Competency"}
          </h5>
          <button
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 text-xl leading-none"
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div className="p-5">
          {error && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Skill Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg text-sm px-2 py-1.5"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="tech">Technical Stack</option>
                <option value="tools">Tools & Platforms</option>
                <option value="soft">Interpersonal</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Skill Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg text-sm px-2 py-1.5"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Learned At</label>
              <input
                className="w-full border border-gray-300 rounded-lg text-sm px-2 py-1.5"
                value={form.learn}
                onChange={(e) => set("learn", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Applied At</label>
              <input
                className="w-full border border-gray-300 rounded-lg text-sm px-2 py-1.5"
                value={form.apply}
                onChange={(e) => set("apply", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Date Learned</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg text-sm px-2 py-1.5"
                value={form.dateLearned}
                onChange={(e) => set("dateLearned", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Certificate Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg text-sm px-2 py-1.5"
                value={form.certDate}
                onChange={(e) => set("certDate", e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-600 block mb-1">
                Certificate / Proof
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  className="flex-1 border border-gray-300 rounded-lg text-xs px-2 py-1.5"
                  onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                />
                <span className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg px-3 text-gray-500">
                  📄
                </span>
              </div>
              {!isNew && form.file && (
                <p className="text-xs text-blue-500 mt-1">
                  Current:{" "}
                  <a href={form.file} target="_blank" rel="noreferrer" className="underline">
                    {form.fileName || "View file"}
                  </a>
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-600 block mb-1">Proficiency</label>
              <Stars rating={form.rating} onChange={(v) => set("rating", v)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
            <button
              className="px-4 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="px-5 py-1.5 rounded-lg text-sm text-white font-semibold disabled:opacity-60"
              style={{ backgroundColor: "#003566" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : isNew ? "Add Skill" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MySkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingSkill, setEditingSkill] = useState<Skill | "new" | null>(null);

  // ── Fetch all skills on mount ─────────────────────────────────────────
  useEffect(() => {
    skillsetService
      .getMySkills()
      .then(({ data }) => setSkills(data.map(mapResponse)))
      .catch(() => alert("Failed to load skills."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const tech = filtered.filter((s) => s.type === "tech");
  const tools = filtered.filter((s) => s.type === "tools");
  const soft = filtered.filter((s) => s.type === "soft");

  // ── After save (add or edit) ──────────────────────────────────────────
  const handleSave = (updated: Skill) => {
    setSkills((prev) => {
      const exists = prev.find((s) => s.id === updated.id);
      if (exists) return prev.map((s) => (s.id === updated.id ? updated : s));
      return [updated, ...prev]; // newly added
    });
  };

  // ── After delete ──────────────────────────────────────────────────────
  const handleDelete = (id: number) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const ColHeader = ({ label, color }: { label: string; color: string }) => (
    <h6
      className="text-xs font-bold uppercase mb-6 pb-2"
      style={{ color: "#001D3D", borderBottom: "2px solid #e9ecef" }}
    >
      <span style={{ borderBottom: `3px solid ${color}`, paddingBottom: "2px" }}>{label}</span>
    </h6>
  );

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "#f8f9fa", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
    >
      <div className="container mx-auto px-4 mt-10 pb-12">
        {/* Header row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-3">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#001D3D" }}>
              Complete Skill History
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Review and manage your professional growth journey.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm shadow-sm w-full md:w-64"
              placeholder="Search by skill name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded-lg text-sm text-white font-semibold whitespace-nowrap"
              style={{ backgroundColor: "#003566" }}
              onClick={() => setEditingSkill("new")}
            >
              + Add Skill
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20 text-sm">Loading your skills...</div>
        ) : (
          /* 3-column grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Technical */}
            <div>
              <ColHeader label="Technical Stack" color="#2977d0" />
              {tech.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No technical skills added yet</p>
              ) : (
                tech.map((s) => (
                  <SkillCard key={s.id} skill={s} onEdit={setEditingSkill} onDelete={handleDelete} />
                ))
              )}
            </div>
            {/* Tools */}
            <div>
              <ColHeader label="Tools & Platforms" color="#6f42c1" />
              {tools.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No tools added yet</p>
              ) : (
                tools.map((s) => (
                  <SkillCard key={s.id} skill={s} onEdit={setEditingSkill} onDelete={handleDelete} />
                ))
              )}
            </div>
            {/* Interpersonal */}
            <div>
              <ColHeader label="Interpersonal Skills" color="#0dcaf0" />
              {soft.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No interpersonal skills added yet</p>
              ) : (
                soft.map((s) => (
                  <SkillCard key={s.id} skill={s} onEdit={setEditingSkill} onDelete={handleDelete} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {editingSkill !== null && (
        <EditModal
          skill={editingSkill}
          onClose={() => setEditingSkill(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}