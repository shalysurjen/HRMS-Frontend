// ProjectInput.tsx
// Place at: src/features/appraisal/components/ProjectInput.tsx
//
// Uses the project's axios `api` client (handles auth token + baseURL automatically).
// API base = /api  →  calls /v1/appraisals/{id}/projects

import { useState, useEffect } from "react";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineFolderOpen,
} from "react-icons/hi2";
import api from "@/services/apiClient";

// ── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id?: number;
  appraisalId?: number;
  questionId?: number;
  projectName: string;
  description: string;
}

interface ProjectInputProps {
  appraisalId: number;
  questionId: number;
  readonly?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export const ProjectInput = ({
  appraisalId,
  questionId,
  readonly = false,
}: ProjectInputProps) => {
  const [projects, setProjects]       = useState<Project[]>([]);
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [form, setForm]               = useState({ projectName: "", description: "" });
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!appraisalId || !questionId) return;
    api
      .get(`/v1/appraisals/${appraisalId}/projects`, { params: { questionId } })
      .then((res) => setProjects(res.data))
      .catch((e) => console.error("Failed to load projects", e));
  }, [appraisalId, questionId]);

  const resetForm = () => {
    setForm({ projectName: "", description: "" });
    setShowForm(false);
    setEditingId(null);
    setError(null);
    setDeleteConfirm(null);
  };

  // ── Add ────────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.projectName.trim()) { setError("Project name is required."); return; }
    if (!form.description.trim()) { setError("Description is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await api.post(`/v1/appraisals/${appraisalId}/projects`, {
        questionId,
        projectName: form.projectName.trim(),
        description: form.description.trim(),
      });
      setProjects((prev) => [...prev, res.data]);
      resetForm();
    } catch {
      setError("Failed to save project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Update ─────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!form.projectName.trim() || !form.description.trim()) {
      setError("Both fields are required.");
      return;
    }
    if (editingId === null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.put(`/v1/appraisals/${appraisalId}/projects/${editingId}`, {
        questionId,
        projectName: form.projectName.trim(),
        description: form.description.trim(),
      });
      setProjects((prev) => prev.map((p) => (p.id === editingId ? res.data : p)));
      resetForm();
    } catch {
      setError("Failed to update project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (projectId: number) => {
    try {
      await api.delete(`/v1/appraisals/${appraisalId}/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setDeleteConfirm(null);
    } catch {
      setError("Failed to delete project. Please try again.");
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id!);
    setForm({ projectName: project.projectName, description: project.description });
    setShowForm(true);
    setError(null);
    setDeleteConfirm(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 mt-3">

      {/* Project cards */}
      {projects.length > 0 && (
        <div className="space-y-2">
          {projects.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <HiOutlineFolderOpen size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  {String(idx + 1).padStart(2, "0")}. {p.projectName}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.description}</p>
              </div>
              {!readonly && (
                <div className="flex gap-1 shrink-0">
                  {deleteConfirm === p.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(p.id!)}
                        className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg hover:bg-rose-100"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-[11px] text-slate-500 px-2 py-1 rounded-lg hover:bg-slate-100"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-100 transition-all"
                        title="Edit"
                      >
                        <HiOutlinePencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(p.id!)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-all"
                        title="Delete"
                      >
                        <HiOutlineTrash size={14} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && !showForm && !readonly && (
        <div className="text-center py-5 border-2 border-dashed border-slate-200 rounded-xl">
          <HiOutlineFolderOpen size={26} className="text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs text-slate-400">No projects added yet.</p>
        </div>
      )}

      {/* Readonly empty */}
      {projects.length === 0 && readonly && (
        <p className="text-xs text-slate-400 italic">No projects added.</p>
      )}

      {/* Add / Edit form */}
      {showForm && !readonly && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {editingId ? "Edit Project" : "Add Project"}
          </p>
          <input
            type="text"
            placeholder="Project Name *"
            value={form.projectName}
            maxLength={300}
            autoFocus
            onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400"
          />
          <textarea
            rows={3}
            placeholder="Description — what did you do, what was the outcome? *"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 resize-none"
          />
          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              <HiOutlineCheck size={14} />
              {saving ? "Saving..." : editingId ? "Update" : "Add Project"}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all"
            >
              <HiOutlineXMark size={14} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showForm && !readonly && (
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-indigo-200 text-indigo-600 text-xs font-bold rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all w-full justify-center"
        >
          <HiOutlinePlus size={16} />
          Add Project
        </button>
      )}
    </div>
  );
};