import { useEmployee } from "@/features/employee/hooks/useEmployee";
import type { TeamMember } from "@/features/employee/types";
import { useAuth } from "@/shared/auth/useAuth";
import { CustomLoader } from "@/shared/components";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import {
    FaCalendarCheck,
    FaSearch,
    FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
interface TeamMembersViewProps {
    onNavigate?: (tab: string) => void;
}
const TeamMembersView: React.FC<TeamMembersViewProps> = ({ onNavigate }) => {

    const navigate = useNavigate();
    const { fetchTeamMembers, loading } = useEmployee();
    const { user } = useAuth();

    const [members, setMembers] = useState<TeamMember[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (user?.id) {
            fetchTeamMembers(user.id).then(setMembers);
        }
    }, [user?.id, fetchTeamMembers]);

    const filteredMembers = useMemo(() => {
        return members.filter((emp) =>
            emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [members, searchTerm]);

    if (loading && members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
                <CustomLoader label="Loading Team" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="px-1 md:px-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase  ">My Team</h2>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">
                            Managing {filteredMembers.length} Direct Reports
                        </p>
                    </div>
                    {onNavigate && (
                        <button onClick={() => navigate("manager/team-calendar")} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-sm text-xs font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                            <FaCalendarCheck size={14} /> Team Calendar
                        </button>)}
                </div>
            </header>

            <div className="flex flex-col sm:flex-row gap-2 px-1 md:px-0">
                <div className="flex-1 relative group">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={12} />
                    <input
                        type="text"
                        placeholder="SEARCH NAME..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 rounded-sm text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all placeholder:text-slate-300"
                    />
                </div>

            </div>

            <div className="md:hidden space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredMembers.map((emp) => (
                        <motion.div
                            layout
                            key={emp.employeeId}
                            className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-900 rounded-sm flex items-center justify-center text-white font-black text-sm">
                                        {emp.employeeName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm uppercase">{emp.employeeName}</p>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">ID: #00{emp.employeeId}</p>
                                    </div>
                                </div>

                            </div>

                            <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-3">
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Designation</p>
                                    <p className="text-xs font-black text-indigo-600 bg-indigo-50 py-1 rounded-sm">{emp.designation ? emp.designation : "Not Set Yet"}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Skills</p>
                                    <p className="text-xs font-black text-slate-700 bg-slate-50 py-1 rounded-sm">{emp.skills ? emp.skills : "Not Set Yet"}</p>
                                </div>
                                {/* <div className="text-center"> */}
                                {/* <p className="text-[8px] font-black text-slate-400 uppercase mb-1">LOP</p> */}
                                {/* <p className={`text-xs font-black py-1 rounded-sm ${emp.lopPercentage! > 0 ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50"}`}>
                                        {emp.lopPercentage}%
                                    </p> */}
                                {/* </div> */}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="hidden md:block bg-white rounded-sm border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Member</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Designation</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Skills</th>
                            {/* <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Salary Status</th> */}
                            <th className="px-6 py-4 w-20"></th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        <AnimatePresence mode="popLayout">
                            {filteredMembers.map((emp) => (
                                <motion.tr
                                    key={emp.employeeId}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="hover:bg-slate-50/50 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 bg-slate-900 rounded-sm flex items-center justify-center text-white font-black text-xs">
                                                {emp.employeeName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-xs uppercase tracking-tight">{emp.employeeName}</p>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">ID: #00{emp.employeeId}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-black text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-3 py-1 rounded-sm">
                                            {emp.designation ? emp.designation : "Not Set Yet"}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                                            {emp.skills ? emp.skills : "Not Set Yet"}
                                        </span>
                                    </td>



                                    {/* <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-sm transition-all">
                                            <FaChartPie size={14} />
                                        </button>
                                    </td> */}
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {filteredMembers.length === 0 && !loading && (
                <div className="py-20 text-center bg-white border border-slate-200 rounded-sm border-dashed">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 rounded-sm mb-4">
                        <FaUser className="text-slate-300" size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching members found</p>
                </div>
            )}
        </div>
    );
};

export default TeamMembersView;