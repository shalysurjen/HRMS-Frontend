// import { useRequest } from "@/features/leave/hooks/useRequest";
// import { useAuth } from "@/shared/auth/useAuth";
// import { MyTimePicker } from "@/shared/components";
// import MyDatePicker from "@/shared/components/datepicker/MyDatePicker";
// import Badge from "@/shared/components/NameBadge";
// import React, { useState } from "react";
// import {
//     HiOutlineUsers,
//     HiOutlineBuildingOffice2,
//     HiOutlineChatBubbleLeftRight,
//     HiOutlinePaperAirplane,
//     HiOutlineCheckCircle} from "react-icons/hi2";
// const MeetingRequestForm = () => {
//     const { user } = useAuth();
//     const { createMeeting, loading, setError } = useRequest();
//     const [submitted, setSubmitted] = useState(false);

//     const [formData, setFormData] = useState({
//         meetingDate: new Date(),
//         startTime: null as Date | null,
//         endTime: null as Date | null,
//         title: "",
//         location: "",
//         description: "",
//     });

//     // Security Check: Only allow non-employees to see/submit meetings
//     if (user?.role === "EMPLOYEE") {
//         return (
//             <div className="p-10 bg-rose-50 border border-rose-100 rounded-2xl text-center">
//                 <p className="text-rose-600 font-bold">Access Denied</p>
//                 <p className="text-sm text-rose-500">Only Managers or Admins can schedule room meetings.</p>
//             </div>
//         );
//     }

//     const mergeDateAndTime = (baseDate: Date, timeDate: Date | null) => {
//         if (!timeDate) return null;
//         const newDate = new Date(baseDate);
//         newDate.setHours(timeDate.getHours());
//         newDate.setMinutes(timeDate.getMinutes());
//         newDate.setSeconds(0);
//         return newDate;
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError(null);

//         if (!user?.id) return;

//         const start = mergeDateAndTime(formData.meetingDate, formData.startTime);
//         const end = mergeDateAndTime(formData.meetingDate, formData.endTime);

//         if (!start || !end) {
//             setError("Please select both start and end times.");
//             return;
//         }

//         const meetingPayload = {
//             title: formData.title,
//             location: formData.location,
//             startTime: start.toISOString(),
//             endTime: end.toISOString(),
//             description: formData.description
//         };

//         const success = await createMeeting(meetingPayload, user.id, undefined);
//         if (success) setSubmitted(true);
//     };

//     const totalDays = 1;

//     const renderApprovers = () => {
//         const approvers = [];

//         if (user?.role === "EMPLOYEE") {
//             approvers.push({ label: `TL: ${user?.teamLeaderName || 'Assigning...'}`, active: true });
//             if (totalDays > 1) {
//                 approvers.push({ label: `Manager: ${user?.managerName || 'Assigning...'}`, active: true });
//             }
//         }

//         if (user?.role === "TEAM_LEADER") {
//             approvers.push({ label: `Manager: ${user?.managerName || 'Assigning...'}`, active: true });
//         }

//         if (totalDays > 7) {
//             approvers.push({ label: `HR: ${user?.hrname || 'Assigning...'}`, active: true });
//         }

//         return approvers.map((app, index) => (
//             <Badge key={index} label={app.label} active={app.active} />
//         ));
//     };

//     if (submitted) {
//         return (
//             <div className="p-10 text-center bg-white border border-slate-200 rounded-2xl shadow-sm animate-in zoom-in duration-300">
//                 <HiOutlineCheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
//                 <h2 className="text-2xl font-bold text-slate-800">Meeting Scheduled</h2>
//                 <p className="text-slate-500 mt-2">The meeting room has been reserved successfully.</p>
//                 <button
//                     onClick={() => setSubmitted(false)}
//                     className="mt-8 text-sm font-bold text-indigo-600 hover:text-indigo-800"
//                 >
//                     Schedule another meeting →
//                 </button>
//             </div>
//         );
//     }

//     return (
//         <div className=" rounded-2xl  overflow-hidden ">
//             <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                 <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
//                     <HiOutlineUsers className="text-indigo-600" /> Schedule Meeting
//                 </h1>

//                 <div className="flex flex-col items-start sm:items-end">
//                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
//                         Required Approvals
//                     </span>
//                     <div className="flex flex-wrap gap-2">
//                         {renderApprovers()}
//                     </div>
//                 </div>
//             </div>

//             <form onSubmit={handleSubmit} className="p-8 space-y-6">
//                 {/* Title & Location Row */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="space-y-2">
//                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
//                             Meeting Title
//                         </label>
//                         <input
//                             className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-bold uppercase outline-none focus:border-indigo-600 transition-all"
//                             placeholder="e.g. Sprint Planning"
//                             value={formData.title}
//                             onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//                             required
//                         />
//                     </div>
//                     <div className="space-y-2">
//                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
//                             <HiOutlineBuildingOffice2 size={14} /> Room / Location
//                         </label>
//                         <input
//                             className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-bold uppercase outline-none focus:border-indigo-600 transition-all"
//                             placeholder="e.g. Conference Room A"
//                             value={formData.location}
//                             onChange={(e) => setFormData({ ...formData, location: e.target.value })}
//                             required
//                         />
//                     </div>
//                 </div>

//                 {/* Date & Time Row */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                     <MyDatePicker
//                         label="Date"
//                         selected={formData.meetingDate}
//                         onChange={(date) => setFormData({ ...formData, meetingDate: date || new Date() })}
//                         required
//                     />
//                     <MyTimePicker
//                         label="Start Time"
//                         selected={formData.startTime}
//                         onChange={(time) => setFormData({ ...formData, startTime: time })}
//                         required
//                     />
//                     <MyTimePicker
//                         label="End Time"
//                         selected={formData.endTime}
//                         onChange={(time) => setFormData({ ...formData, endTime: time })}
//                         required
//                     />
//                 </div>

//                 {/* Description */}
//                 <div className="space-y-3">
//                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
//                         <HiOutlineChatBubbleLeftRight size={16} /> Agenda / Description
//                     </label>
//                     <textarea
//                         rows={3}
//                         className="w-full border border-slate-200 bg-slate-50 p-4 rounded-xl text-xs font-bold uppercase outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300"
//                         placeholder="Briefly describe the meeting objective..."
//                         value={formData.description}
//                         onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                         required
//                     />
//                 </div>

//                 <button
//                     type="submit"
//                     disabled={loading}
//                     className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all disabled:opacity-50"
//                 >
//                     {loading ? "Scheduling..." : "Create Meeting"}
//                     {!loading && <HiOutlinePaperAirplane size={18} className="rotate-45" />}
//                 </button>
//             </form>
//         </div>
//     );
// };


// export default MeetingRequestForm;