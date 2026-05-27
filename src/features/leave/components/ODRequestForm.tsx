import { useRequest } from "@/features/leave/hooks/useRequest";
import type { ODRequest } from "@/features/leave/types";
import { useAuth } from "@/shared/auth/useAuth";
import MyDatePicker from "@/shared/components/datepicker/MyDatePicker";
import Badge from "@/shared/components/NameBadge";
import React, { useState } from "react";
import {
    HiOutlineMapPin,
    HiOutlineChatBubbleLeftRight,
    HiOutlinePaperAirplane,
    HiOutlineCheckCircle} from "react-icons/hi2";

const ODRequestForm = () => {
    const { user } = useAuth();
    const { createOD, loading, setError } = useRequest();
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        fromDate: null as Date | null,
        toDate: null as Date | null,
        reason: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!user?.id) return;

        if (!formData.fromDate || !formData.toDate) {
            setError("Please select both start and end dates.");
            return;
        }

        const payload: ODRequest = {
            employeeId: user.id,
            startDate: formData.fromDate.toISOString().split("T")[0],
            endDate: formData.toDate.toISOString().split("T")[0],
            reason: formData.reason,
        };

        const success = await createOD(payload, user.id);
        if (success) setSubmitted(true);
    };
    // 1. First, calculate the actual days inside the component
    const calculateDays = () => {
        if (!formData.fromDate || !formData.toDate) return 0;
        const diffTime = Math.abs(formData.toDate.getTime() - formData.fromDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const totalDays = calculateDays();

    const renderApprovers = () => {
        const approvers = [];
        const role = user?.role?.toUpperCase();

        if (role === "EMPLOYEE") {
            approvers.push({ label: `TL: ${user?.name || 'Assigning...'}`, active: true });

            if (totalDays > 1) {
                approvers.push({ label: `Manager: ${user?.name || 'Assigning...'}`, active: true });
            }
        }
        if (role === "TEAM_LEADER") {
            approvers.push({ label: `Manager: ${user?.name || 'Assigning...'}`, active: true });
        }
        if (role === "MANAGER" || role === "ADMIN") {
            approvers.push({ label: `HR: ${user?.name || 'Final Approval'}`, active: true });
        }
        if (totalDays > 7 && role !== "MANAGER") {
            approvers.push({ label: `HR: ${user?.name || 'Assigning...'}`, active: true });
        }

        return approvers.map((app, index) => (
            <Badge key={index} label={app.label} active={app.active} />
        ));
    };

    if (submitted) {
        return (
            <div className="p-10 text-center bg-white border border-slate-200 rounded-2xl shadow-sm animate-in zoom-in duration-300">
                <HiOutlineCheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">OD Request Submitted</h2>
                <p className="text-slate-500 mt-2">Your On-Duty application has been sent for approval.</p>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setFormData({ fromDate: null, toDate: null, reason: "" });
                    }}
                    className="mt-8 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-800 transition-all"
                >
                    Raise another request →
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-sm overflow-hidden">
            <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {/* Changed Icon and Text */}
                    <HiOutlineMapPin className="text-indigo-600" /> On-Duty Application
                </h1>

                <div className="flex flex-col items-start sm:items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Approval Workflow
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {renderApprovers()}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Date Selection Info */}
                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600 font-bold text-sm">
                        {totalDays.toString().padStart(2, '0')}
                    </div>
                    <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
                        Total Working Days requested for On-Duty
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MyDatePicker
                        label="Work Starts On"
                        selected={formData.fromDate}
                        onChange={(date) => setFormData({ ...formData, fromDate: date })}
                        required
                    />
                    <MyDatePicker
                        label="Work Ends On"
                        selected={formData.toDate}
                        onChange={(date) => setFormData({ ...formData, toDate: date })}
                        minDate={formData.fromDate || new Date()}
                        required
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <HiOutlineChatBubbleLeftRight size={16} />
                        Duty Details & Location
                    </label>
                    <textarea
                        rows={4}
                        className="w-full border border-slate-200 bg-slate-50 p-4 rounded-xl text-xs font-bold uppercase outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-300"
                        /* Updated Placeholder */
                        placeholder="E.G. CLIENT SITE VISIT - BANGALORE OFFICE, SEMINAR AT TECH PARK, OR FIELD WORK FOR PROJECT X..."
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg"
                >
                    {loading ? "Registering Request..." : "Confirm OD Schedule"}
                    {!loading && <HiOutlinePaperAirplane size={18} className="rotate-45" />}
                </button>
            </form>
        </div>
    );
};

export default ODRequestForm;




