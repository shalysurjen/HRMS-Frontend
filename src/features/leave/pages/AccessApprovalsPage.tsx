// import React, { useEffect, useMemo, useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FaUserCheck, FaCheck } from 'react-icons/fa';
// import EmptyStateSVG from '../../../assets/svg/EmpthyStateSVG';
// import type { AdminAccessDecision, PendingOnboardingResponse } from '@/features/leave/types';
// import { useOnboarding } from '@/features/onboarding/hooks/useOnboarding';

// const OnboardingPendingPage: React.FC = () => {
//     const { fetchOnboardingRequests, handleAccessDecision, loading, error } = useOnboarding();
//     const [requests, setRequests] = useState<PendingOnboardingResponse[]>([]);
//     const [activeMenu, setActiveMenu] = useState<number | null>(null);

//     console.log(activeMenu);
    
//     // State for the Decision Modal
//     const [decisionModal, setDecisionModal] = useState<{
//         isOpen: boolean;
//         employeeId: string | null;
//         bio: boolean;
//         vpn: boolean;
//     }>({ isOpen: false, employeeId: null, bio: false, vpn: false });

//     useEffect(() => {
//         const getData = async () => {
//             const data = await fetchOnboardingRequests();
//             setRequests(data || []);
//         };
//         getData();
//     }, [fetchOnboardingRequests]);

//     const submitDecision = async () => {
//         if (!selectedRequest) return;

//         const decisionBody: AdminAccessDecision = {
//             decision: 'APPROVED',
//             remarks: `Admin approved ${selectedRequest.accessType}`
//         };

//         // Pass the specific accessType from the object we found
//         await handleAccessDecision(
//             selectedRequest.id,
//             selectedRequest.accessType,
//             decisionBody
//         );

//         // Close and refresh
//         setDecisionModal({ isOpen: false, employeeId: null, bio: false, vpn: false });
//         const data = await fetchOnboardingRequests();
//         setRequests(data || []);
//     };

//     const selectedRequest = useMemo(() => {
//         return requests.find(r => r.id === decisionModal.employeeId);
//     }, [decisionModal.employeeId, requests]);

//     if (error) return <div className="p-6 text-red-500 text-center font-black text-[10px] uppercase tracking-widest">Error: {error}</div>;



//     return (
//         <div className="w-full relative">
//             <div className="flex justify-between items-center mb-6">
//                 <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Pending Onboarding</h1>
//                 <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest">
//                     {requests.length} Requests Found
//                 </span>
//             </div>

//             <div className="relative w-full bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm min-h-112.5">
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-left border-collapse">
//                         <thead className="bg-neutral-800 text-white">
//                             <tr>
//                                 <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">Member Identity</th>
//                                 <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-center">Onboarding Status</th>
//                                 <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-center">Remarks</th>
//                                 <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-right">Options</th>
//                             </tr>
//                         </thead>


//                         <tbody className="divide-y divide-slate-100">
//                             {requests.length > 0 ? (

//                                 requests.map((req) => (
//                                     <tr key={req.id} className="transition-colors duration-150 group hover:bg-slate-50">
//                                         <td className="px-6 py-4">
//                                             <div className="flex items-center gap-3">
//                                                 <div className="h-9 w-9 rounded-sm flex items-center justify-center text-[11px] font-black border transition-all bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-slate-900 group-hover:text-white">
//                                                     {req.employeeName?.charAt(0) || "?"}
//                                                 </div>
//                                                 <div>
//                                                     <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{req.employeeName}</p>
//                                                     <p className="text-[10px] font-medium text-slate-400 lowercase">{req.employeeEmail}</p>
//                                                 </div>
//                                             </div>
//                                         </td>



//                                         <td className="px-6 py-4 text-center">
//                                             <div className="flex flex-col items-center gap-1.5">
//                                                 <StatusRow label={''} status={req.status} />
//                                                 {/* <StatusRow label="VPN" status={req.vpnStatus} /> */}
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4 text-center">
//                                             <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-black uppercase tracking-tighter">
//                                                 {req.managerRemarks.replace(/_/g, " ")}
//                                             </span>
//                                         </td>

//                                         <td className="px-6 py-4 text-right relative">

//                                             <button
//                                                 onClick={() => {
//                                                     setDecisionModal({ isOpen: true, employeeId: req.id, bio: true, vpn: true });
//                                                     setActiveMenu(null);
//                                                 }}
//                                                 className="w-full bg-emerald-50 border-green-400  rounded-4xl text-center  px-3 py-2.5 text-[10px] font-black uppercase text-emerald-600 hover:bg-green-300 flex items-center gap-2"
//                                             >
//                                                 <FaCheck size={12} /> Approve
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))) : (
//                                 <tr>
//                                     <td colSpan={4} className="py-16">
//                                         <div className="flex flex-col items-center justify-center gap-3">
//                                             <EmptyStateSVG />
//                                             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
//                                                 No Pending Requests
//                                             </p>
//                                         </div>
//                                     </td>
//                                 </tr>)}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Action Modal Overlay */}
//                 <AnimatePresence>
//                     {decisionModal.isOpen && selectedRequest && (
//                         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
//                             <motion.div
//                                 initial={{ opacity: 0, y: 20, scale: 0.95 }}
//                                 animate={{ opacity: 1, y: 0, scale: 1 }}
//                                 exit={{ opacity: 0, y: 20, scale: 0.95 }}
//                                 className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-[360px] overflow-hidden"
//                             >
//                                 {/* Header: Cyber-Security Style */}
//                                 <div className="bg-slate-900 px-5 py-4 flex justify-between items-center border-b border-white/10">
//                                     <div className="flex flex-col">
//                                         <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
//                                             Security Protocol
//                                         </h3>
//                                         <span className="text-[14px] font-bold text-white tracking-tight">
//                                             Access Authorization
//                                         </span>
//                                     </div>
//                                     <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
//                                         <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
//                                     </div>
//                                 </div>

//                                 {/* Employee Profile: Minimalist Header */}
//                                 <div className="px-6 py-5 bg-gradient-to-b from-slate-50 to-white flex items-center gap-4">
//                                     <div className="relative">
//                                         <div className="h-14 w-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-slate-900/20">
//                                             {selectedRequest.employeeName?.charAt(0)}
//                                         </div>
//                                         <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center shadow-sm">
//                                             <FaUserCheck className="text-emerald-500" size={10} />
//                                         </div>
//                                     </div>
//                                     <div>
//                                         <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">
//                                             {selectedRequest.employeeName}
//                                         </p>
//                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                                             {selectedRequest.employeeDesignation}
//                                         </p>
//                                     </div>
//                                 </div>

//                                 {/* Content Body */}
//                                 <div className="p-6 pt-2 space-y-6">
//                                     {/* Action Card */}
//                                     <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3">
//                                         <div>
//                                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
//                                                 Module Granting
//                                             </p>
//                                             <div className="flex items-center gap-2">
//                                                 <span className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-black uppercase rounded-sm tracking-tighter">
//                                                     {selectedRequest.accessType.replace('_', ' ')}
//                                                 </span>
//                                                 <span className="text-slate-300">/</span>
//                                                 <span className="text-[11px] font-bold text-slate-600 uppercase">
//                                                     Full Access
//                                                 </span>
//                                             </div>
//                                         </div>

//                                         <div className="pt-2 border-t border-slate-200">
//                                             <div className="flex items-start gap-2">
//                                                 <div className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
//                                                 <p className="text-[10px] text-slate-500 font-medium leading-normal italic">
//                                                     Granting this access will permit the user to bypass standard directory restrictions.
//                                                 </p>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     {/* Action Buttons */}
//                                     <div className="flex flex-col gap-2">
//                                         <button
//                                             onClick={submitDecision}
//                                             className="w-full py-3.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] rounded-md flex items-center justify-center gap-2"
//                                         >
//                                             <FaCheck size={10} /> Confirm & Grant Access
//                                         </button>

//                                         <button
//                                             onClick={() => setDecisionModal({ isOpen: false, employeeId: null, bio: false, vpn: false })}
//                                             className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
//                                         >
//                                             Terminate Session
//                                         </button>
//                                     </div>
//                                 </div>

//                                 {/* Footer Accent */}
//                                 <div className="h-1 bg-linear-to-r from-emerald-500 via-indigo-500 to-slate-900" />
//                             </motion.div>
//                         </div>
//                     )}
//                 </AnimatePresence>

//                 {/* Fetching Overlay */}
//                 <AnimatePresence>
//                     {loading && (
//                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
//                             <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2" />
//                             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Processing Directory...</span>
//                         </motion.div>
//                     )}
//                 </AnimatePresence>
//             </div>
//         </div>
//     );
// };

// // --- Sub-Components ---

// // const SelectionCard = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
// //     <div
// //         onClick={onClick}
// //         className={`p-3 border flex items-center justify-between cursor-pointer transition-all ${active ? 'border-slate-900 bg-slate-50' : 'border-slate-100 opacity-60'}`}
// //     >
// //         <span className="text-[10px] font-black uppercase tracking-tight text-slate-900">{label}</span>
// //         <div className={`h-4 w-4 rounded-sm border flex items-center justify-center transition-all ${active ? 'bg-slate-900 border-slate-900' : 'border-slate-200'}`}>
// //             {active && <FaCheck size={8} className="text-white" />}
// //         </div>
// //     </div>
// // );

// const StatusRow = ({ label, status }: { label: string, status: string }) => (
//     <div className="flex items-center gap-2">
//         <span className="text-[9px] font-bold text-slate-400 uppercase w-12 text-right">{label}</span>
//         {/* <div className={`h-1.5 w-1.5 rounded-full ${status === 'COMPLETED' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : status === 'PENDING' ? "bg-amber-400" : "bg-red-400"}`} /> */}
//         <span className={`text-[9px] font-black uppercase text-green-600`}>
//             {status}
//         </span>
//     </div>
// );

// export default OnboardingPendingPage;





function AccessApprovalsPage() {
  return (
    <div>AccessApprovalsPage</div>
  )
}

export default AccessApprovalsPage