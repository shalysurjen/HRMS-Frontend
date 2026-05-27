import { useLeave } from "@/features/leave/hooks/useLeave";
import { useLeaveAction } from "@/features/leave/hooks/useLeaveActions";
import type { LeaveType } from "@/features/leave/types";
import { useAuth } from "@/shared/auth/useAuth";
import MyDatePicker from "@/shared/components/datepicker/MyDatePicker";
import React, { useEffect, useRef, useState } from "react";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlinePaperAirplane,
  HiOutlinePaperClip,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { toLocalISOString } from "../../../shared/utils/dateUtils";

type HalfDayType = "FIRST_HALF" | "SECOND_HALF" | null;

const LeaveApplicationForm = () => {
  const { user } = useAuth();
  const { setError, leaveBalance, fetchLeaveBalance, error } = useLeave();
  const { applyLeave, bankCompOff, loading } = useLeaveAction();
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    leaveTypeName: "ANNUAL" as LeaveType | "COMP_OFF",
    startDate: null as Date | null,
    endDate: null as Date | null,
    compOffPlannedDate: null as Date | null,
    isHalfDay: false,
    startDateHalfDayType: null as HalfDayType,
    endDateHalfDayType: null as HalfDayType,
    reason: "",
    isAppointment: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const leaveLabels: Record<string, string> = {
    ANNUAL: "Annual Leave",
    SICK: "Sick Leave",
    COMP_OFF: "Bank Comp-Off",
    PATERNITY: "Paternity",
    MATERNITY: "Maternity"
  };

  useEffect(() => {
    if (user?.id) {
      fetchLeaveBalance(user.id, 2026);
    }
  }, [user?.id, fetchLeaveBalance]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.startDate) {
      setError("Please select a start date.");
      return;
    }

    const employeeId = user?.id;
    if (!employeeId) {
      setError("User session not found.");
      return;
    }

    if (formData.leaveTypeName === "COMP_OFF") {
      if (!formData.compOffPlannedDate) {
        setError("Please select the date you plan to take your leave.");
        return;
      }
      const compOffPayload = {
        employeeId,
        entries: [{
          workedDate: toLocalISOString(formData.startDate),
          days: formData.isHalfDay ? 0.5 : 1.0,
          plannedLeaveDate: toLocalISOString(formData.compOffPlannedDate),
          halfDayType: formData.isHalfDay ? formData.startDateHalfDayType : null
        }],
      };
      const result = await bankCompOff(compOffPayload);
      if (result) setSubmitted(true);
      return;
    }

    const fd = new FormData();
    fd.append("employeeId", employeeId);

    fd.append("leaveTypeName", formData.leaveTypeName);
    fd.append("startDate", toLocalISOString(formData.startDate));

    const isFutureDate = formData.startDate ? new Date(formData.startDate).setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0) : false;
    const isAppointment = formData.leaveTypeName === "SICK" && isFutureDate && formData.isAppointment;

    fd.append("isAppointment", isAppointment.toString());

    const endDateStr = formData.isHalfDay
      ? toLocalISOString(formData.startDate)
      : toLocalISOString(formData.endDate);

    if (!endDateStr) {
      setError("Please select an end date.");
      return;
    }
    fd.append("endDate", endDateStr);
    fd.append("reason", formData.reason);
    fd.append("confirmLossOfPay", "false");

    if (formData.isHalfDay) {
      fd.append("startDateHalfDayType", formData.startDateHalfDayType || "");
      fd.append("halfDayType", formData.startDateHalfDayType || "");
    } else {
      if (formData.startDateHalfDayType) fd.append("startDateHalfDayType", formData.startDateHalfDayType);
      if (formData.endDateHalfDayType) fd.append("endDateHalfDayType", formData.endDateHalfDayType);
    }

    if (selectedFile) fd.append("files", selectedFile);

    const result = await applyLeave(fd);
    if (result) setSubmitted(true);
  };

  // const calculateDays = () => {
  //   if (!formData.startDate) return 0;
  //   if (formData.isHalfDay || formData.leaveTypeName === "COMP_OFF") return formData.startDateHalfDayType ? 0.5 : 1;
  //   if (!formData.endDate) return 1;

  //   const start = new Date(formData.startDate);
  //   const end = new Date(formData.endDate);
  //   const diffTime = Math.abs(end.getTime() - start.getTime());
  //   let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  //   if (formData.startDateHalfDayType) days -= 0.5;
  //   if (formData.endDateHalfDayType) days -= 0.5;
  //   return days;
  // };

  const getAvailableLeaveTypes = () => {
    const types = ["SICK", "ANNUAL"];

    const gender = user?.gender?.toUpperCase();

    if (user?.maritalStatus === "MARRIED") {
      if (gender === "MALE") {
        types.push("PATERNITY");
      } else if (gender === "FEMALE") {
        types.push("MATERNITY");
      }
    }

    return types as (LeaveType)[];
  };


  const getBalanceForType = (type: string) => {

    if (!leaveBalance) return 0;

    const monthlyData = type === "SICK"
      ? leaveBalance.sickLeaveBalance.remainingDays
      : leaveBalance.annualLeaveBalance.remainingDays;

    return monthlyData;
  };
  const availableTypes = getAvailableLeaveTypes();

  const HalfDaySelector = ({ label, value, onChange }: { label: string, value: HalfDayType, onChange: (v: HalfDayType) => void }) => (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 w-full sm:w-fit">
        {["FIRST_HALF", "SECOND_HALF"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(value === type ? null : type as HalfDayType)}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${value === type
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {type === "FIRST_HALF" ? "1st Half" : "2nd Half"}
          </button>
        ))}
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-6 md:my-10 p-6 md:p-10 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
        <HiOutlineCheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl md:text-2xl font-semibold text-slate-800 tracking-tight">Request Submitted</h2>
        <p className="text-sm text-slate-500 mt-2">Your application is awaiting approval.</p>
        <button onClick={() => setSubmitted(false)} className="mt-8 text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Apply for another leave →
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 md:py-6 px-0 md:px-4">
      {error && (
        <div className="mx-4 mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <HiOutlineExclamationTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {leaveBalance && (
        <div className="mb-6 mx-4 md:mx-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto no-scrollbar md:divide-x divide-slate-100">
            {availableTypes
              .filter(type => type !== "COMP_OFF")
              .map((type) => {

                const isActive = formData.leaveTypeName === type;
                const remaining = getBalanceForType(type);
                return (
                  <div
                    key={type}
                    onClick={() => setFormData({ ...formData, leaveTypeName: type as any })}
                    className={`flex-1 min-w-35 px-4 py-3 cursor-pointer transition-all relative ${isActive ? "bg-indigo-50/50" : "hover:bg-slate-50"
                      }`}
                  >
                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                    <div className="flex flex-col">
                      <span className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? "text-indigo-600" : "text-slate-400"
                        }`}>
                        {type.replace("_", " ")}
                      </span>
                      <div className="flex flex-col mt-1">
                        <span className="text-xs text-slate-500 font-medium">Balance</span>
                        <span className="text-lg font-bold text-slate-900">
                          {remaining} <span className="text-xs font-medium text-slate-400">days</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="bg-white border-y md:border border-slate-200 md:rounded-2xl shadow-sm overflow-hidden">
        {/* Responsive Header */}
        <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-lg md:text-xl font-bold text-slate-800">
            {formData.leaveTypeName === "COMP_OFF" ? "Bank Comp-Off Credit" : "Apply for Leave"}
          </h1>
          <div className="flex flex-col items-start md:items-end w-full md:w-auto">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Required Approvals
            </span>
            <div className="flex flex-wrap gap-2">
              {/* {(() => {
                const approvers = [];
                const days = calculateDays();
                const role = user?.role?.toUpperCase();



                return approvers.map((app, index) => (
                  <Badge key={index} label={app.label} active={app.active} />
                ));
              })()} */}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* 01. Category Selection: Stack on mobile */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <HiOutlineClock size={16} /> 01. Leave Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {availableTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, leaveTypeName: type })}
                  className={`py-3 px-4 text-sm font-medium rounded-xl border transition-all ${formData.leaveTypeName === type
                    ? "bg-slate-900 border-slate-900 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  {leaveLabels[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <MyDatePicker
                  label={formData.leaveTypeName === "COMP_OFF" ? "02. Date Worked" : "02. Start Date"}
                  selected={formData.startDate}
                  onChange={(date) => setFormData({ ...formData, startDate: date })}
                  required
                />
                <HalfDaySelector
                  label="Start Day Type"
                  value={formData.startDateHalfDayType}
                  onChange={(v) => setFormData({ ...formData, startDateHalfDayType: v })}
                />
              </div>

              {!formData.isHalfDay && (
                <div className="space-y-4">
                  <MyDatePicker
                    label={formData.leaveTypeName === "COMP_OFF" ? "03. Planned Leave Date" : "03. End Date"}
                    selected={formData.leaveTypeName === "COMP_OFF" ? formData.compOffPlannedDate : formData.endDate}
                    onChange={(date) => setFormData({
                      ...formData,
                      [formData.leaveTypeName === "COMP_OFF" ? "compOffPlannedDate" : "endDate"]: date
                    })}
                    minDate={formData.startDate || new Date()}
                    required
                  />
                  {formData.leaveTypeName !== "COMP_OFF" && (
                    <HalfDaySelector
                      label="End Day Type"
                      value={formData.endDateHalfDayType}
                      onChange={(v) => setFormData({ ...formData, endDateHalfDayType: v })}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={formData.isHalfDay}
                  onChange={(e) => setFormData({
                    ...formData,
                    isHalfDay: e.target.checked,
                    endDate: e.target.checked ? null : formData.endDate,
                    endDateHalfDayType: e.target.checked ? null : formData.endDateHalfDayType
                  })}
                />
                <span className="text-sm font-medium text-slate-700">This is a single-day application</span>
              </label>
            </div>
          </div>

          {formData.leaveTypeName === "SICK" && formData.startDate &&
            new Date(formData.startDate).setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0) && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    checked={formData.isAppointment}
                    onChange={(e) => setFormData({ ...formData, isAppointment: e.target.checked })}
                  />
                  <div>
                    <span className="text-sm font-bold text-amber-900 flex items-center gap-2">
                      <HiOutlineShieldCheck className="text-amber-600" /> Medical Appointment?
                    </span>
                    <p className="text-[11px] text-amber-700">Checking this schedules a future doctor's visit.</p>
                  </div>
                </label>
              </div>
            )}

          {/* Attachments & Reason: Full Width */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <HiOutlinePaperClip size={16} /> 04. Attachments
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${selectedFile ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <span className="text-sm text-slate-500 font-medium">
                  {selectedFile ? selectedFile.name : "Tap to upload medical proof or documents"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <HiOutlineChatBubbleLeftRight size={16} /> 05. Reason
              </label>
              <textarea
                rows={3}
                placeholder="Briefly explain the reason for your leave..."
                className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
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

// const Badge = ({ label, active }: { label: string; active: boolean }) => (
//   <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap ${active
//     ? "bg-indigo-50 text-indigo-700 border-indigo-200"
//     : "bg-slate-50 text-slate-400 border-slate-100"
//     }`}>
//     {label}
//   </span>
// );

export default LeaveApplicationForm;