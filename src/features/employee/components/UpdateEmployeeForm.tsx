import { useEmployee } from "@/features/employee/hooks/useEmployee";
import type { CreateUserRequest, ProfileData } from "@/features/employee/types";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import {
    FaArrowLeft,
    FaBuilding,
    FaTimes, FaUser
} from "react-icons/fa";
import { toast } from "sonner";
import MyDatePicker from "../../../shared/components/datepicker/MyDatePicker";
import Loader from "../../../shared/components/Loader";

interface Props {
    open: boolean;
    onClose: () => void;
    updateUser: (data: CreateUserRequest) => Promise<void>;
    employeeId: string;
}

interface EmployeeFormState {
    empId: string;
    fullName: string;
    email: string;
    roleId: string | number;
    employeeExperience: string;
    reportingId: string;
    teamId: string | number;
    departmentId: string | number;
    branchId: string | number;
    joiningDate: string;
}

const UpdateEmployeePopup: React.FC<Props> = ({ open, onClose, updateUser, employeeId }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const { fetchEmployeeProfile } = useEmployee();

    const {
        fetchBranches, branches,
        fetchDepartments, departments,
        fetchManagers, managers,
        fetchRoles, roles,
        loading: isFetchingData,
        profile
    } = useEmployee();

    const [formData, setFormData] = useState<EmployeeFormState>({
        empId: "",
        fullName: "",
        email: "",
        roleId: "",
        employeeExperience: "FRESHER",
        reportingId: "",
        teamId: "",
        departmentId: "",
        branchId: "",
        joiningDate: ""
    });

    // 1. Fetch organizational data when popup opens
    // 1. Fetch organizational data and Employee details
    useEffect(() => {
        const loadData = async () => {
            if (open && employeeId) {
                // Fetch organizational lookups
                fetchBranches();
                fetchDepartments();
                fetchManagers();
                fetchRoles();

                // Fetch specific employee data and load it into form immediately
                try {
                    const data = await fetchEmployeeProfile(employeeId);
                    if (data) {
                        syncFormData(data);
                    }
                } catch (error) {
                    toast.error("Failed to load employee details");
                }
            }
        };
        loadData();
    }, [open, employeeId]);
    // 1. Fetch organizational data and Employee details
   
    const syncFormData = (data: ProfileData) => {
        // Helper to find IDs from names if the API returns names
        const matchedRole = roles.find(r => r.roleName === data.role);
        const matchedDept = departments.find(d => d.departmentName === (data as any).departmentName);
        const matchedBranch = branches.find(b => b.branchName === (data as any).branch);

        setFormData({
            empId: data.id || "",
            fullName: data.name || "",
            email: data.email || "",
            roleId: matchedRole?.id || data.role || "",
            employeeExperience: (data as any).employeeExperience || data.employeeType || "FRESHER",
            reportingId: data.reportingId || "",
            teamId: data.teamId?.toString() || "",
            departmentId: data.departmentId?.toString() || matchedDept?.id?.toString() || "",
            branchId: data.branchId?.toString() || matchedBranch?.id?.toString() || "",
            joiningDate: data.joiningDate || ""
        });
    };

    // 2. SYNC FORM DATA when profile is loaded
    useEffect(() => {
        if (profile && open) {

            // Map String Names from JSON to IDs for your Dropdowns
            // This is crucial because your JSON has "Engineering" but your type wants "departmentId"
            const matchedRole = roles.find(r => r.roleName === profile.role);
            const matchedDept = departments.find(d => d.departmentName === (profile as any).departmentName);
            const matchedBranch = branches.find(b => b.branchName === (profile as any).branch);

            setFormData({
                empId: profile.id || "",
                fullName: profile.name || "",
                email: profile.email || "",

                // Priority: 1. profile.role (if it's an ID), 2. Matched ID from roles list
                roleId: matchedRole?.id || profile.role || "",

                // Map JSON 'employeeExperience' to Interface 'employeeType'
                employeeExperience: (profile as any).employeeExperience || profile.employeeType || "FRESHER",

                reportingId: profile.reportingId || "",
                teamId: profile.teamId?.toString() || "",

                // Mapping Logic for IDs
                departmentId: profile.departmentId?.toString() || matchedDept?.id?.toString() || "",
                branchId: profile.branchId?.toString() || matchedBranch?.id?.toString() || "",

                joiningDate: profile.joiningDate || ""
            });
        }
    }, [profile, open, roles, departments, branches]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const isEmailValid = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const canProceed = () => {
        if (step === 1) {
            return (
                formData.empId.trim().length >= 3 &&
                formData.fullName.trim().length >= 3 &&
                isEmailValid(formData.email) &&
                formData.roleId !== ""
            );
        }
        if (step === 2) {
            return (
                formData.joiningDate !== "" &&
                formData.departmentId !== "" &&
                formData.branchId !== ""
            );
        }
        return true;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setStatus("idle");

        try {
            const payload: CreateUserRequest = {
                empId: formData.empId,
                name: formData.fullName,
                email: formData.email,
                roleId: Number(formData.roleId),
                reportingId: formData.reportingId || null,
                teamId: formData.teamId ? Number(formData.teamId) : null,
                departmentId: Number(formData.departmentId),
                branchId: Number(formData.branchId),
                joiningDate: formData.joiningDate.includes('T')
                    ? formData.joiningDate.split('T')[0]
                    : formData.joiningDate,
                employeeExperience: formData.employeeExperience
            };

            await updateUser(payload);
            setStatus("success");
        } catch (err: any) {
            toast.error(err?.message || "Update failed");
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLoaderFinished = () => {
        if (status === "success") handleClose();
        setStatus("idle");
    };

    const handleClose = () => {
        setStep(1);
        setStatus("idle");
        setIsSubmitting(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div onClick={handleClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />

                    <motion.div className="relative z-10 w-full max-w-2xl bg-slate-50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-10 py-6 bg-white border-b flex justify-between items-center">
                            <div>
                                <div className="flex gap-2 mb-2">
                                    {[1, 2].map((s) => (
                                        <div key={s} className={`h-1 w-8 ${step >= s ? "bg-indigo-600" : "bg-slate-200"}`} />
                                    ))}
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">Update Employee</h2>
                            </div>
                            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                                <FaTimes />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 min-h-[400px]">
                            {isFetchingData && !formData.empId ? (
                                <div className="flex flex-col justify-center items-center h-full py-20">
                                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    <p className="mt-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
                                        Retrieving Employee Data...
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div key="step1" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-4">
                                            <SectionHeader icon={<FaUser />} title="Identity & Contact" />
                                            <FormInput label="Employee ID (Custom ID)" name="empId" placeholder="e.g. WENXT001" value={formData.empId.toUpperCase()} onChange={handleInputChange} required />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormInput label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                                                <FormInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Role *</label>
                                                    <select name="roleId" value={formData.roleId} onChange={handleInputChange} className="w-full border-b-2 border-slate-200 py-2 mt-1 bg-transparent outline-none focus:border-indigo-500 text-sm transition-all cursor-pointer">
                                                        <option value="">Select Role</option>
                                                        {roles.map((r: any) => (
                                                            <option key={r.id} value={r.id}>{r.roleName}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Experience Level</label>
                                                    <select name="employeeExperience" value={formData.employeeExperience} onChange={handleInputChange} className="w-full border-b-2 border-slate-200 py-2 mt-1 bg-transparent outline-none focus:border-indigo-500 text-sm transition-all cursor-pointer">
                                                        <option value="FRESHER">Fresher</option>
                                                        <option value="EXPERIENCED">Experienced</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div key="step2" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-4">
                                            <SectionHeader icon={<FaBuilding />} title="Organization Details" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Department *</label>
                                                    <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} className="w-full border-b-2 border-slate-200 py-2 mt-1 bg-transparent outline-none focus:border-indigo-500 text-sm transition-all cursor-pointer">
                                                        <option value="">Select Department</option>
                                                        {departments.map((d: any) => (
                                                            <option key={d.id} value={d.id}>{d.departmentName}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch *</label>
                                                    <select name="branchId" value={formData.branchId} onChange={handleInputChange} className="w-full border-b-2 border-slate-200 py-2 mt-1 bg-transparent outline-none focus:border-indigo-500 text-sm transition-all cursor-pointer">
                                                        <option value="">Select Branch</option>
                                                        {branches.map((b: any) => (
                                                            <option key={b.id} value={b.id}>{b.branchName}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reporting Manager</label>
                                                    <select name="reportingId" value={formData.reportingId} onChange={handleInputChange} className="w-full border-b-2 border-slate-200 py-2 mt-1 bg-transparent outline-none focus:border-indigo-500 text-sm transition-all cursor-pointer">
                                                        <option value="">No Manager (Top Level)</option>
                                                        {managers.map((m: any) => (
                                                            <option key={m.empId} value={m.empId}>{m.empName} ({m.empId})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <FormInput label="Team ID" name="teamId" type="number" value={formData.teamId} onChange={handleInputChange} />
                                            </div>
                                            <MyDatePicker
                                                label="Joining Date"
                                                required
                                                selected={formData.joiningDate ? new Date(formData.joiningDate) : null}
                                                onChange={(date: Date | null) => setFormData({ ...formData, joiningDate: date ? date.toISOString() : "" })}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-4 bg-white border-t flex justify-between">
                            {step > 1 ? (
                                <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-slate-600 font-bold hover:text-indigo-600 transition-colors">
                                    <FaArrowLeft /> Back
                                </button>
                            ) : <div />}

                            <button
                                disabled={!canProceed() || isSubmitting}
                                onClick={step === 1 ? () => setStep(2) : handleSubmit}
                                className={`px-6 py-2 rounded font-bold transition-all ${canProceed() ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                            >
                                {step === 1 ? "Next Step" : (isSubmitting ? "Updating..." : "Update Employee")}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {(isSubmitting || status !== "idle") && (
                <Loader
                    message={status === "error" ? "Update Failed" : status === "success" ? "Updated Successfully!" : "Processing..."}
                    isFinished={status === "success" || status === "error"}
                    onFinished={handleLoaderFinished}
                />
            )}
        </AnimatePresence>
    );
};

/* Internal Helper Components */
const SectionHeader = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="flex items-center gap-2 font-black text-slate-800 uppercase tracking-wider text-sm mb-4">
        <span className="text-indigo-500">{icon}</span> {title}
    </div>
);

const FormInput = ({ label, required, ...props }: any) => (
    <div className="flex-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <input
            {...props}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            className="w-full border-b-2 border-slate-200 px-1 py-2 mt-1 focus:border-indigo-500 outline-none transition-all text-sm bg-transparent"
        />
    </div>
);

export default UpdateEmployeePopup;