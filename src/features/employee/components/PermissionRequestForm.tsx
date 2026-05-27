import MyDatePicker from "@/shared/components/datepicker/MyDatePicker";
import { useState } from "react";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlinePaperAirplane,
  HiOutlineClock,
  HiOutlinePaperClip,
} from "react-icons/hi2";
import { FaTimes } from "react-icons/fa";
import { permissionService } from "@/features/leave/services/permissionService";
import { useAuth } from "@/shared/auth/useAuth";

interface TimeValue {
  hour: number;
  minute: number;
}

interface PermissionFormState {
  date: Date | null;
  startTime: TimeValue;
  endTime: TimeValue;
  attachments: File[];
  reason: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (t: TimeValue) => t.hour * 60 + t.minute;

const MIN_TOTAL = 9 * 60 + 15;   // ── CHANGED: 09:15 (was 09:30)
const MAX_TOTAL = 18 * 60 + 30;  // 18:30

// ── Local date — avoids UTC shift for IST ─────────────────────────
const toLocalDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const dd   = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// ── Format file size ──────────────────────────────────────────────
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Time Picker ──────────────────────────────────────────────────
const TimePicker = ({
  label,
  value,
  onChange,
  minTotal = MIN_TOTAL,
  maxTotal = MAX_TOTAL,
}: {
  label: string;
  value: TimeValue;
  onChange: (v: TimeValue) => void;
  minTotal?: number;
  maxTotal?: number;
}) => {
  const [editingHour,   setEditingHour]   = useState(false);
  const [editingMinute, setEditingMinute] = useState(false);
  const [hourInput,     setHourInput]     = useState("");
  const [minuteInput,   setMinuteInput]   = useState("");

  const isAM = value.hour < 12;
  const displayHour =
    value.hour === 0 ? 12 : value.hour > 12 ? value.hour - 12 : value.hour;

  const clampToRange = (h: number, m: number): TimeValue => {
    const total = Math.min(Math.max(h * 60 + m, minTotal), maxTotal);
    return { hour: Math.floor(total / 60), minute: total % 60 };
  };

  const incrementHour   = () => onChange(clampToRange(value.hour + 1, value.minute));
  const decrementHour   = () => onChange(clampToRange(value.hour - 1, value.minute));
  const incrementMinute = () => onChange(clampToRange(value.hour, value.minute + 1));
  const decrementMinute = () => onChange(clampToRange(value.hour, value.minute - 1));

  const handleHourClick = () => { setEditingHour(true); setHourInput(""); };
  const handleHourKey   = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") commitHour();
  };
  const commitHour = () => {
    const parsed = parseInt(hourInput);
    if (!isNaN(parsed)) {
      let h = parsed;
      if (h >= 1 && h <= 12) {
        h = isAM ? (h === 12 ? 0 : h) : h === 12 ? 12 : h + 12;
      }
      onChange(clampToRange(h, value.minute));
    }
    setEditingHour(false);
    setHourInput("");
  };

  const handleMinuteClick = () => { setEditingMinute(true); setMinuteInput(""); };
  const handleMinuteKey   = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") commitMinute();
  };
  const commitMinute = () => {
    const parsed = parseInt(minuteInput);
    if (!isNaN(parsed)) onChange(clampToRange(value.hour, parsed));
    setEditingMinute(false);
    setMinuteInput("");
  };

  const toggleAMPM = () => {
    const newHour = isAM ? value.hour + 12 : value.hour - 12;
    onChange(clampToRange(newHour, value.minute));
  };

  const atMin = toMinutes(value) <= minTotal;
  const atMax = toMinutes(value) >= maxTotal;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        <HiOutlineClock size={13} />
        {label}
      </label>

      <div className="inline-flex items-end gap-3 border border-slate-200 rounded-xl px-5 py-4 bg-white shadow-sm w-fit">

        {/* Hours */}
        <div className="flex flex-col items-center gap-1.5">
          <button type="button" onClick={incrementHour} disabled={atMax}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 transition text-sm font-black disabled:opacity-20 disabled:cursor-not-allowed">
            ▲
          </button>
          {editingHour ? (
            <input autoFocus type="text" value={hourInput} maxLength={2}
              onChange={(e) => setHourInput(e.target.value.replace(/\D/g, ""))}
              onBlur={commitHour} onKeyDown={handleHourKey}
              className="w-12 text-center text-2xl font-black text-indigo-600 outline-none border-b-2 border-indigo-400 bg-transparent" />
          ) : (
            <span onClick={handleHourClick} title="Click to type"
              className="w-12 text-center text-2xl font-black text-slate-800 cursor-text hover:text-indigo-600 transition select-none">
              {pad(displayHour)}
            </span>
          )}
          <button type="button" onClick={decrementHour} disabled={atMin}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 transition text-sm font-black disabled:opacity-20 disabled:cursor-not-allowed">
            ▼
          </button>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Hours</span>
        </div>

        <span className="text-2xl font-black text-slate-300 mb-7">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center gap-1.5">
          <button type="button" onClick={incrementMinute} disabled={atMax}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 transition text-sm font-black disabled:opacity-20 disabled:cursor-not-allowed">
            ▲
          </button>
          {editingMinute ? (
            <input autoFocus type="text" value={minuteInput} maxLength={2}
              onChange={(e) => setMinuteInput(e.target.value.replace(/\D/g, ""))}
              onBlur={commitMinute} onKeyDown={handleMinuteKey}
              className="w-12 text-center text-2xl font-black text-indigo-600 outline-none border-b-2 border-indigo-400 bg-transparent" />
          ) : (
            <span onClick={handleMinuteClick} title="Click to type"
              className="w-12 text-center text-2xl font-black text-slate-800 cursor-text hover:text-indigo-600 transition select-none">
              {pad(value.minute)}
            </span>
          )}
          <button type="button" onClick={decrementMinute} disabled={atMin}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 transition text-sm font-black disabled:opacity-20 disabled:cursor-not-allowed">
            ▼
          </button>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Minutes</span>
        </div>

        {/* AM/PM */}
        <div className="mb-7 ml-1">
          <button type="button" onClick={toggleAMPM}
            className={`text-[11px] font-black px-2.5 py-1.5 rounded-lg border transition-all ${
              isAM
                ? "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100"
                : "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100"
            }`}>
            {isAM ? "AM" : "PM"}
          </button>
        </div>
      </div>

      {/* ── CHANGED: hint updated to 09:15 AM ─── */}
      <p className="text-[9px] text-slate-400 font-medium">
        Allowed: 09:15 AM – 06:30 PM
      </p>
    </div>
  );
};

// ─── Duration Display ─────────────────────────────────────────────
const DurationDisplay = ({
  startTime,
  endTime,
}: {
  startTime: TimeValue;
  endTime: TimeValue;
}) => {
  const diff = toMinutes(endTime) - toMinutes(startTime);

  if (diff <= 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
        <HiOutlineClock size={15} className="text-rose-400 shrink-0" />
        <p className="text-xs font-semibold text-rose-500">
          End time must be after start time.
        </p>
      </div>
    );
  }

  const hours   = Math.floor(diff / 60);
  const minutes = diff % 60;

  return (
    <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
      <HiOutlineClock size={18} className="text-indigo-500 shrink-0" />
      <div>
        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
          Total Permission Duration
        </p>
        <p className="text-sm font-black text-indigo-700 mt-0.5">
          {hours > 0 && `${hours} hr${hours > 1 ? "s" : ""} `}
          {minutes > 0 && `${minutes} min${minutes > 1 ? "s" : ""}`}
        </p>
      </div>
    </div>
  );
};

// ─── Main Form ────────────────────────────────────────────────────
const PermissionRequestForm = () => {
  const { user } = useAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyOneDaysAgo = new Date(today);
  thirtyOneDaysAgo.setDate(today.getDate() - 31);

  const [form, setForm] = useState<PermissionFormState>({
    date:        null,
    // ── CHANGED: default start time 09:15 (was 09:30) ─────────────
    startTime:   { hour: 9, minute: 15 },
    endTime:     { hour: 18, minute: 30 },
    attachments: [],
    reason:      "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [apiError,  setApiError]  = useState<string | null>(null);

  const isValidDuration = toMinutes(form.endTime) > toMinutes(form.startTime);

  // ── Attachment handlers ───────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Max 5 files, max 5 MB each
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
    const combined = [...form.attachments, ...valid].slice(0, 5);
    setForm({ ...form, attachments: combined });
    // Reset input so same file can be re-added if removed
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setForm({
      ...form,
      attachments: form.attachments.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDuration || !form.date) return;

    setLoading(true);
    setApiError(null);

    try {
      // Build FormData so attachments are sent as multipart
      const formData = new FormData();
      formData.append("employeeId",     user!.id);
      formData.append("permissionDate", toLocalDateString(form.date));
      formData.append("startTime",      `${pad(form.startTime.hour)}:${pad(form.startTime.minute)}:00`);
      formData.append("endTime",        `${pad(form.endTime.hour)}:${pad(form.endTime.minute)}:00`);
      formData.append("reason",         form.reason);
      form.attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      await permissionService.submitPermissionRequest(formData);
      setSubmitted(true);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Permission submission failed";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-6 md:my-10 p-6 md:p-10 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
        <HiOutlineCheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl md:text-2xl font-semibold text-slate-800 tracking-tight">
          Request Submitted
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Your permission request is awaiting approval.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-8 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Submit another request →
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 md:py-6 px-0 md:px-4">
      <div className="bg-white border-y md:border border-slate-200 md:rounded-2xl shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-lg md:text-xl font-bold text-slate-800">
            Request Permission
          </h1>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Required Approvals
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">

          {/* 01. Date — CHANGED: reduced width, inline with label ── */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              01. Date <span className="text-rose-400">*</span>
            </label>
            {/* Max width so it doesn't stretch full width */}
            <div className="w-full max-w-xs">
              <MyDatePicker
                selected={form.date}
                onChange={(date) => setForm({ ...form, date })}
                minDate={thirtyOneDaysAgo}
                required
              />
            </div>
          </div>

          {/* 02. Start Time + 03. End Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TimePicker
              label="02. Start Time"
              value={form.startTime}
              onChange={(v) => setForm({ ...form, startTime: v })}
              minTotal={MIN_TOTAL}
              maxTotal={MAX_TOTAL}
            />
            <TimePicker
              label="03. End Time"
              value={form.endTime}
              onChange={(v) => setForm({ ...form, endTime: v })}
              minTotal={MIN_TOTAL}
              maxTotal={MAX_TOTAL}
            />
          </div>

          {/* Duration */}
          <DurationDisplay
            startTime={form.startTime}
            endTime={form.endTime}
          />

          {/* 04. Attachments — NEW ─────────────────────────────── */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <HiOutlinePaperClip size={16} /> 04. Attachments
              <span className="text-[9px] font-normal text-slate-400 normal-case tracking-normal">
                (optional · max 5 files · 5 MB each)
              </span>
            </label>

            {/* Drop zone */}
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
              <HiOutlinePaperClip
                size={22}
                className="text-slate-300 group-hover:text-indigo-400 transition mb-1"
              />
              <p className="text-xs font-semibold text-slate-400 group-hover:text-indigo-500 transition">
                Click to upload
              </p>
              <p className="text-[10px] text-slate-300 mt-0.5">
                PNG, JPG, PDF, DOC up to 5 MB
              </p>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
                disabled={form.attachments.length >= 5}
              />
            </label>

            {/* File list */}
            {form.attachments.length > 0 && (
              <ul className="space-y-2">
                {form.attachments.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <HiOutlinePaperClip
                        size={14}
                        className="text-indigo-400 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700 truncate">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="ml-3 text-slate-300 hover:text-rose-500 transition shrink-0"
                    >
                      <FaTimes size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 05. Reason — CHANGED: was 04 ────────────────────────── */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <HiOutlineChatBubbleLeftRight size={16} /> 05. Reason
            </label>
            <textarea
              rows={3}
              placeholder="Briefly explain the reason for your permission request..."
              className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
          </div>

          {/* API error */}
          {apiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <p className="text-sm text-rose-600 font-semibold">{apiError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isValidDuration}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Processing..." : "Submit Application"}
            {!loading && <HiOutlinePaperAirplane size={18} className="rotate-45" />}
          </button>

        </form>
      </div>
    </div>
  );
};

export default PermissionRequestForm;