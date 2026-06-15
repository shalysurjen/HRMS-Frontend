import MyDatePicker from "@/shared/components/datepicker/MyDatePicker";
import { useAuth } from "@/shared/auth/useAuth";
import React, { useEffect, useRef, useState } from "react";

// Maximum days in the past that WFH can be back-dated (must match backend MAX_BACKDATE_DAYS)
const MAX_BACKDATE_DAYS = 31;
const getMinAllowedDate = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() - MAX_BACKDATE_DAYS);
  return d;
};
import {
  HiOutlineCheckCircle,
  HiOutlineHome,
  HiOutlinePaperAirplane,
  HiOutlinePaperClip,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { FaTimes } from "react-icons/fa";
import { wfhService } from "@/features/leave/services/wfhService";

type HalfDayType = "FIRST_HALF" | "SECOND_HALF" | null;

interface WfhFormState {
  startDate: Date | null;
  endDate: Date | null;
  startDateHalfDayType: HalfDayType;
  endDateHalfDayType: HalfDayType;
  reason: string;
  attachment: File | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const toLocalDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const calculateDays = (
  start: Date | null,
  end: Date | null,
  startHalf: HalfDayType,
  endHalf: HalfDayType
): number => {
  if (!start) return 0;
  const endEffective = end ?? start;
  const startMs = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endMs = new Date(endEffective.getFullYear(), endEffective.getMonth(), endEffective.getDate()).getTime();
  const calDays = Math.round((endMs - startMs) / 86400000) + 1;
  if (calDays === 1) {
    if (startHalf && endHalf) return 1;
    if (startHalf || endHalf) return 0.5;
    return 1;
  }
  let days = calDays;
  if (startHalf) days -= 0.5;
  if (endHalf) days -= 0.5;
  return Math.max(0, days);
};

// ── Half-Day Selector ─────────────────────────────────────────────────────────

const HalfDaySelector = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: HalfDayType;
  onChange: (v: HalfDayType) => void;
}) => (
  <div className="space-y-2">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
      {label}
    </span>
    <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit">
      {(["FIRST_HALF", "SECOND_HALF"] as HalfDayType[]).map((t) => (
        <button
          key={t!}
          type="button"
          onClick={() => onChange(value === t ? null : t)}
          className={`px-5 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-md transition-all ${
            value === t
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          {t === "FIRST_HALF" ? "1st Half" : "2nd Half"}
        </button>
      ))}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const WfhRequestForm: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<WfhFormState>({
    startDate: null,
    endDate: null,
    startDateHalfDayType: null,
    endDateHalfDayType: null,
    reason: "",
    attachment: null,
  });

  const [isSingleDay, setIsSingleDay] = useState(false);
  const [totalTaken, setTotalTaken] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    wfhService
      .getTotalDays(user.id)
      .then((d) => setTotalTaken(Number(d) || 0))
      .catch(() => setTotalTaken(0));
  }, [user?.id]);

  const daysInSelection = calculateDays(
    formData.startDate,
    formData.endDate,
    formData.startDateHalfDayType,
    formData.endDateHalfDayType
  );

  const handleStartDateChange = (date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      startDate: date,
      // if single-day mode, keep endDate in sync with startDate
      endDate: isSingleDay
        ? date
        : date && prev.endDate && prev.endDate < date
        ? null
        : prev.endDate,
      startDateHalfDayType: null,
      endDateHalfDayType: null,
    }));
  };

  const handleEndDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, endDate: date, endDateHalfDayType: null }));
  };

  const handleSingleDayToggle = (checked: boolean) => {
    setIsSingleDay(checked);
    if (checked) {
      // Lock end date to start date
      setFormData((prev) => ({
        ...prev,
        endDate: prev.startDate,
        endDateHalfDayType: null,
      }));
    } else {
      // Free end date — clear it so user must re-pick
      setFormData((prev) => ({ ...prev, endDate: null, endDateHalfDayType: null }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0])
      setFormData((prev) => ({ ...prev, attachment: e.target.files![0] }));
  };

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, attachment: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.startDate) return setError("Please select a start date.");
    if (!formData.endDate) return setError("Please select an end date.");
    if (!formData.reason.trim()) return setError("Please provide a reason.");
    if (!user?.id) return setError("User session not found.");

    const fd = new FormData();
    fd.append("employeeId", user.id);
    fd.append("startDate", toLocalDateString(formData.startDate));
    fd.append("endDate", toLocalDateString(formData.endDate));
    if (formData.startDateHalfDayType) fd.append("startDateHalfDayType", formData.startDateHalfDayType);
    if (formData.endDateHalfDayType) fd.append("endDateHalfDayType", formData.endDateHalfDayType);
    fd.append("reason", formData.reason);
    if (formData.attachment) fd.append("attachment", formData.attachment);

    try {
      setLoading(true);
      await wfhService.applyWfh(fd);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit WFH request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="p-10 text-center bg-white border border-slate-200 rounded-2xl shadow-sm animate-in zoom-in duration-300">
        <HiOutlineCheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">WFH Request Submitted</h2>
        <p className="text-slate-500 mt-2">Your Work From Home request has been sent for approval.</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setIsSingleDay(false);
            setFormData({
              startDate: null,
              endDate: null,
              startDateHalfDayType: null,
              endDateHalfDayType: null,
              reason: "",
              attachment: null,
            });
          }}
          className="mt-8 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-800 transition-all"
        >
          Raise another request →
        </button>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-sm overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <HiOutlineHome className="text-indigo-600" /> Work From Home Application
          </h1>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5 ml-6">
            No day limit · Backdating up to 31 days · Future dates allowed · Requires manager approval
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Taken</span>
            <span className="text-sm font-black text-indigo-600">
              {totalTaken}
              <span className="text-[10px] font-semibold text-slate-400 ml-0.5">
                {totalTaken === 1 ? "day" : "days"}
              </span>
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">

        {/* ── Day counter ──────────────────────────────────────── */}
        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600 font-bold text-sm min-w-[2.5rem] text-center">
            {daysInSelection.toString().replace(".", "½").padStart(2, "0")}
          </div>
          <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
            Total Working Days Requested for Work From Home
          </p>
        </div>

        {/* ── Date pickers ─────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Start date row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <MyDatePicker
                label="WFH Starts On"
                selected={formData.startDate}
                onChange={handleStartDateChange}
                minDate={getMinAllowedDate()}
                required
              />
              {formData.startDate && (
                <HalfDaySelector
                  label="Start Day Session (optional)"
                  value={formData.startDateHalfDayType}
                  onChange={(v) => setFormData((p) => ({ ...p, startDateHalfDayType: v }))}
                />
              )}
            </div>

            {/* End date — hidden when single-day checked */}
            {!isSingleDay && (
              <div className="space-y-3">
                <MyDatePicker
                  label="WFH Ends On"
                  selected={formData.endDate}
                  onChange={handleEndDateChange}
                  minDate={formData.startDate ?? getMinAllowedDate()}
                  required
                />
                {formData.endDate &&
                  formData.startDate &&
                  formData.endDate.toDateString() !== formData.startDate.toDateString() && (
                    <HalfDaySelector
                      label="End Day Session (optional)"
                      value={formData.endDateHalfDayType}
                      onChange={(v) => setFormData((p) => ({ ...p, endDateHalfDayType: v }))}
                    />
                  )}
              </div>
            )}
          </div>

          {/* Single-day checkbox — show only after start date is picked */}
          {formData.startDate && (
            <label className="flex items-center gap-2.5 cursor-pointer w-fit select-none">
              <input
                type="checkbox"
                checked={isSingleDay}
                onChange={(e) => handleSingleDayToggle(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-600">
                This is a single-day application
              </span>
            </label>
          )}
        </div>

        {/* ── Reason ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
            <HiOutlineChatBubbleLeftRight size={16} />
            Reason for Working From Home
          </label>
          <textarea
            rows={4}
            className="w-full border border-slate-200 bg-slate-50 p-4 rounded-xl text-xs font-bold uppercase outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-300 resize-none"
            placeholder="E.G. HOME INTERNET MAINTENANCE, PERSONAL COMMITMENT, HEALTH CONCERN, OR FOCUSED DEEP WORK SESSION..."
            value={formData.reason}
            onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))}
            required
          />
        </div>

        {/* ── Attachment ───────────────────────────────────────── */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
            <HiOutlinePaperClip size={16} />
            Attachment
            <span className="normal-case font-medium text-slate-300">(optional)</span>
          </label>

          {formData.attachment ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <HiOutlinePaperClip size={16} className="text-indigo-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 uppercase truncate">
                  {formData.attachment.name}
                </p>
                <p className="text-[10px] text-slate-400">{formatFileSize(formData.attachment.size)}</p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition"
              >
                <FaTimes size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition"
            >
              <HiOutlinePaperClip size={16} />
              Click to attach a file
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* ── Error ────────────────────────────────────────────── */}
        {error && (
          <p className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 px-4 py-3 rounded-lg">
            {error}
          </p>
        )}

        {/* ── Submit ───────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? "Submitting WFH Request..." : "Confirm WFH Schedule"}
          {!loading && <HiOutlinePaperAirplane size={18} className="rotate-45" />}
        </button>
      </form>
    </div>
  );
};

export default WfhRequestForm;