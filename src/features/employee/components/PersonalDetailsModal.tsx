import logo from '@/assets/images/bg-rm-logo-HRES.png';
import { authService } from "@/features/auth/api/authApi";
import type {
    ExperiencedPersonalDetailsRequest,
    FresherPersonalDetailsRequest,
} from "@/features/employee/types";
import { useAuth } from "@/shared/auth/useAuth";
import { FailureModal, Loader } from "@/shared/components";
import CustomDatePicker from '@/shared/components/CustomDatePicker';
import InputLabel from '@/shared/components/InputLabel';
import type { Gender } from '@/shared/types';
import { useEffect, useRef, useState } from "react";
import {
    // --- ADDED THESE NEW ICONS ---
    HiCheck,
    HiCircleStack,
    HiOutlineBanknotes,
    HiOutlineBriefcase,
    HiOutlineCloudArrowUp,
    HiOutlineDocumentText,
    HiOutlineUserCircle,
    HiOutlineUsers,
    HiPlus,
    HiTrash,
} from "react-icons/hi2";

type PersonalDetailsForm = FresherPersonalDetailsRequest & Partial<ExperiencedPersonalDetailsRequest>;

const PersonalDetailsModal = () => {
    const { user } = useAuth();
    const isExperienced = user?.employeeExperience === "EXPERIENCED";
    const submissionType = isExperienced ? "EXPERIENCED" : "FRESHER";

    // --- NEW: Step State and Definition ---
    const [activeStep, setActiveStep] = useState(1);

    const steps = [
        { id: 1, title: 'Document Upload', description: 'Digital Vault', icon: <HiOutlineCloudArrowUp size={22} /> },
        { id: 2, title: 'Identity & Info', description: 'Core Profile Details', icon: <HiOutlineUserCircle size={22} /> },
        { id: 3, title: 'Family Details', description: 'Payroll & Benefits', icon: <HiOutlineUsers size={22} /> },
        { id: 4, title: 'Banking Details', description: 'Salary Credits', icon: <HiOutlineBanknotes size={22} /> },
    ];

    if (isExperienced) {
        // Experience is step 4, banking becomes step 5
        steps.splice(3, 0, { id: 4, title: 'Work History', description: 'Experience History', icon: <HiOutlineBriefcase size={22} /> });
        // Update Banking to be the last step
        steps[4].id = 5;
    }

    const totalSteps = steps.length;
    // --- End Step Definitions ---


    const [formData, setFormData] = useState<Partial<PersonalDetailsForm>>({
        firstName: "",
        lastName: "",
        contactNumber: "",
        gender: "MALE",
        maritalStatus: "SINGLE",
        aadharNumber: "",
        personalEmail: "",
        dateOfBirth: "",
        presentAddress: "",
        permanentAddress: "",
        bloodGroup: "O_POSITIVE",
        emergencyContactNumber: "",
        designation: "",
        skillSet: "",
        accountNumber: "",
        bankName: "",
        ifscCode: "",
        bankBranchName: "",
        fatherName: "",
        fatherDateOfBirth: "",
        fatherOccupation: "",
        fatherAlive: true,
        motherName: "",
        motherDateOfBirth: "",
        motherOccupation: "",
        motherAlive: true,
        spouseName: "",
        spouseDateOfBirth: "",
        spouseOccupation: "",
        spouseContactNumber: "",
        children: [],
        experiences: isExperienced ? [{ companyName: "", role: "", fromDate: "", endDate: "" }] : [],
        uanNumber: "",

    });

    const [aadharParts, setAadharParts] = useState({ p1: "", p2: "", p3: "" });
    const [files, setFiles] = useState<Record<string, File | File[] | null>>({});
    const [loaderState, setLoaderState] = useState({ active: false, finished: false });
    const [showFailure, setShowFailure] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const aadharRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null)
    ];


    useEffect(() => {
        const combined = `${aadharParts.p1}${aadharParts.p2}${aadharParts.p3}`;
        setFormData(prev => ({ ...prev, aadharNumber: combined }));
    }, [aadharParts]);

    const handleAadharChange = (part: 'p1' | 'p2' | 'p3', value: string) => {
        const sanitized = value.replace(/\D/g, "").slice(0, 4);
        setAadharParts(prev => ({ ...prev, [part]: sanitized }));


        if (sanitized.length === 4) {
            if (part === 'p1') {
                aadharRefs[1].current?.focus();
            } else if (part === 'p2') {
                aadharRefs[2].current?.focus();
            }
        }
    };
    const handleAadharKeyDown = (part: 'p1' | 'p2' | 'p3', e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !aadharParts[part]) {
            if (part === 'p2') {
                aadharRefs[0].current?.focus();
            } else if (part === 'p3') {
                aadharRefs[1].current?.focus();
            }
        }
    };

    const handleInputChange = (field: keyof PersonalDetailsForm, value: any) => {
        // Check if the field is a Date of Birth field
        if (field.toLowerCase().includes('dateofbirth') || field === 'dateOfBirth') {
            const selectedDate = new Date(value);
            const year = selectedDate.getFullYear();
            const currentYear = new Date().getFullYear();
            if (value !== "") {
                if (year > currentYear || (year < 1900 && year.toString().length === 4)) {

                    return;
                }
            }
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (key: string, file: File | null) => {
        setFiles(prev => ({
            ...prev,
            [key]: file  // This creates a new object reference, triggering a re-render
        }));
    };

    const handleMultiFileChange = (key: string, fileList: FileList | null) => {
        if (fileList) {
            setFiles(prev => ({
                ...prev,
                [key]: Array.from(fileList) // Creates a new object reference
            }));
        }
    };

    const handleExperienceFileChange = (index: number, file: File | null) => {
        if (!file) return;
        const newExperiences = [...(formData.experiences || [])];
        (newExperiences[index] as any).tempCert = file;
        setFormData({ ...formData, experiences: newExperiences });
    };
    // Add this near handleExperienceFileChange
    const handleJoiningLetterFileChange = (index: number, file: File | null) => {
        if (!file) return;
        const newExperiences = [...(formData.experiences || [])];
        (newExperiences[index] as any).tempJoiningLetter = file;
        setFormData({ ...formData, experiences: newExperiences });
    };
    const handleRelievingLetterFileChange = (index: number, file: File | null) => {
        if (!file) return;
        const newExperiences = [...(formData.experiences || [])];
        (newExperiences[index] as any).tempRelievingLetter = file;
        setFormData({ ...formData, experiences: newExperiences });
    };

    const handleSubmit = async () => {
        try {
            if (!user?.id) return;

            // 1. Validation for common required files
            const requiredFiles = submissionType === "FRESHER"
                ? ["idProof", "passportPhoto", "tenthMarksheet", "twelfthMarksheet", "degreeCertificate", "offerLetter"]
                : ["idProof", "passportPhoto"];

            const missing = requiredFiles.filter(k => !files[k]);
            if (missing.length > 0) {
                setErrorMessage(`Missing required files: ${missing.join(", ")}`);
                setShowFailure(true);
                return;
            }

            setLoaderState({ active: true, finished: false });

            const experienceFiles: File[] = [];
            const joiningLetterFiles: File[] = []; // <-- Add this
            const relievingLetterFiles: File[] = [];

            const cleanedExperiences = formData.experiences?.map((exp: any) => {
                if (exp.tempCert) experienceFiles.push(exp.tempCert);
                if (exp.tempJoiningLetter) joiningLetterFiles.push(exp.tempJoiningLetter);
                if (exp.tempRelievingLetter) relievingLetterFiles.push(exp.tempRelievingLetter); // 2. Collect

                // 3. Clean all temp fields
                const { tempCert, tempJoiningLetter, tempRelievingLetter, ...rest } = exp;
                return rest;
            });

            // 3. Prepare Cleaned Payload
            const { experiences, uanNumber, ...restOfData } = formData;

            const payload = submissionType === "EXPERIENCED"
                ? { ...formData, experiences: cleanedExperiences }
                : { ...restOfData };

            // 4. Merge all files (Global + Extracted from Experience rows)
            const finalFiles = {
                ...files,
                experienceCerts: experienceFiles.length > 0 ? experienceFiles : null,
                joiningLetter: joiningLetterFiles.length > 0 ? joiningLetterFiles : null,
                relievingLetter: relievingLetterFiles.length > 0 ? relievingLetterFiles : null // 4. Map it
            };
            // 5. Send to Service
            await authService.submitMultipartDetails(
                user.id,
                submissionType,
                payload,
                finalFiles
            );

            setLoaderState({ active: true, finished: true });
        } catch (err: any) {
            setLoaderState({ active: false, finished: false });
            setErrorMessage(err.response?.data?.message || "Submission failed. Please check all fields.");
            setShowFailure(true);
        }
    };


    const FileRow = ({
        label,
        fileKey,
        required = false,
        multiple = false,
        customFile = undefined,
        allowedTypes, // e.g., ".png, .jpg, .pdf"
        onCustomChange
    }: {
        label: string,
        fileKey: string,
        required?: boolean,
        multiple?: boolean,
        customFile?: any,
        allowedTypes?: string,
        onCustomChange?: (file: File | null) => void
    }) => {
        const inputId = `file-input-${fileKey}`;
        const displayFile = customFile !== undefined ? customFile : files[fileKey];

        const handleValidation = (fileList: FileList | null): boolean => {
            if (!allowedTypes || !fileList) return true;

            // Split allowedTypes into an array and clean them up
            const typesArray = allowedTypes.split(',').map(t => t.trim().toLowerCase());

            // Check every file selected against the allowed list
            const allValid = Array.from(fileList).every(file => {
                const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
                // Also check MIME type (e.g., 'image/png') for better coverage
                return typesArray.includes(extension) || typesArray.includes(file.type);
            });

            if (!allValid) {
                alert(`Invalid file type. Please upload: ${allowedTypes}`);
                return false;
            }
            return true;
        };

        return (
            <div className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-2xl group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-lg shrink-0 ${displayFile ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                        <HiOutlineDocumentText size={18} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[11px] font-bold text-neutral-700 tracking-tight">
                            {label} {required && <span className="text-red-500">*</span>}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">
                            {Array.isArray(displayFile)
                                ? `${displayFile.length} files`
                                : (displayFile as File)?.name || "Not uploaded"}
                        </p>
                    </div>
                </div>

                <label
                    htmlFor={inputId}
                    className="cursor-pointer shrink-0 bg-neutral-50 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all border border-neutral-200"
                >
                    {displayFile ? "CHANGE" : "UPLOAD"}
                </label>

                <input
                    id={inputId}
                    type="file"
                    className="hidden"
                    multiple={multiple}
                    accept={allowedTypes}
                    onChange={(e) => {
                        const selectedFiles = e.target.files;

                        // 1. Validate types
                        if (!handleValidation(selectedFiles)) {
                            e.target.value = '';
                            return;
                        }

                        // 2. Process changes
                        if (onCustomChange) {
                            onCustomChange(selectedFiles?.[0] || null);
                        } else {
                            if (multiple) {
                                handleMultiFileChange(fileKey, selectedFiles);
                            } else {
                                handleFileChange(fileKey, selectedFiles?.[0] || null);
                            }
                        }

                        // Reset to allow re-uploading the same file if deleted
                        e.target.value = '';
                    }}
                />
            </div>
        );
    };

    // --- NEW: Next/Prev handlers ---
    const handleNext = () => {
        if (activeStep < totalSteps) {
            setActiveStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (activeStep > 1) {
            setActiveStep(prev => prev - 1);
        }
    };
    // --- End Next/Prev handlers ---

    return (
        <>
            {loaderState.active && (
                <Loader message="Syncing WeHRM Profile..." isFinished={loaderState.finished} onFinished={() => window.location.reload()} />
            )}

            <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <div className="bg-white rounded-3xl shadow-2xl w-[98vw] h-[96vh] flex flex-col overflow-hidden">
                    {/* HEADER */}
                    <div className="p-6 border-b flex justify-between items-center bg-neutral-50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"><img src={logo} alt="" /></div>
                            <div>
                                <h3 className="text-xl font-black text-neutral-900 tracking-tight">Profile Data Mapping</h3>
                                <p className="text-[10px] text-indigo-600 font-bold tracking-widest italic">Sync with WeHRM</p>
                            </div>
                        </div>
                        <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full capitalize tracking-tighter border border-indigo-200">
                            {submissionType} Employee
                        </span>
                    </div>

                    {/* --- REFACTORED MAIN CONTENT: 2-column layout --- */}
                    <div className="flex flex-1 overflow-hidden">

                        {/* LEFT COLUMN: The Steps Sidebar (New Component) */}
                        <aside className="w-[300px] bg-neutral-50 border-r border-neutral-100 p-8 pt-10 shrink-0 custom-scrollbar overflow-y-auto">
                            <div className="flex items-center gap-2 text-indigo-600 mb-8 border-b pb-6 border-neutral-100">
                                <HiCircleStack size={22} />
                                <span className="font-bold text-xs uppercase tracking-widest text-neutral-800">Migration Steps</span>
                            </div>

                            <div className="relative space-y-10">
                                {/* Vertical connector line */}
                                <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-neutral-100 z-0"></div>

                                {steps.map((step) => {
                                    const isCurrent = step.id === activeStep;
                                    const isCompleted = step.id < activeStep;

                                    return (
                                        <div key={step.id} className={`flex items-start gap-4 z-10 relative group transition-opacity duration-300 ${isCurrent ? 'opacity-100' : 'opacity-60'}`}>
                                            {/* Number/Icon Bubble */}
                                            <div className={`w-9 h-9 shrink-0 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors duration-300 z-10
                                                ${isCurrent ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' :
                                                    (isCompleted ? 'bg-green-100 border-green-200 text-green-700' :
                                                        'bg-white border-neutral-200 text-neutral-400')}`}
                                            >
                                                {isCompleted ? <HiCheck size={18} /> : (isCurrent ? step.id : step.id)}
                                            </div>

                                            {/* Step text */}
                                            <div className="overflow-hidden pt-0.5">
                                                <p className={`text-[11px] font-bold uppercase tracking-tight leading-snug ${isCurrent ? 'text-indigo-600' : (isCompleted ? 'text-neutral-700' : 'text-neutral-400')}`}>
                                                    {step.title}
                                                </p>
                                                <p className={`text-[10px] italic leading-tight ${isCurrent ? 'text-indigo-500' : (isCompleted ? 'text-neutral-500' : 'text-neutral-400')}`}>
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </aside>


                        {/* RIGHT COLUMN: The current form section (Conditional Rendering) */}
                        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white">

                            {/* Section Header (Icon and bold title from step) */}
                            <div className="flex items-center gap-3 mb-12 border-b border-neutral-100 pb-8">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                                    {steps[activeStep - 1].icon}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-neutral-900 tracking-tight">{steps[activeStep - 1].title}</h2>
                                    <p className="text-xs text-neutral-400 leading-relaxed italic">Confirm details to proceed.</p>
                                </div>
                            </div>

                            {/* --- Start CONDITIONAL RENDERING --- */}

                            {/* STEP 1: Documents */}
                            {activeStep === 1 && (
                                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FileRow label="ID Proof (Aadhar/PAN/Driving License/Voter ID)" fileKey="idProof" required />
                                    <FileRow
                                        label="Passport Size Photo"
                                        fileKey="passportPhoto"
                                        required
                                        allowedTypes=".jpg,.jpeg,.png"
                                    />
                                    {!isExperienced && (
                                        <>
                                            <FileRow label="10th Marksheet" fileKey="tenthMarksheet" required />
                                            <FileRow label="12th Marksheet" fileKey="twelfthMarksheet" required />
                                            <FileRow label="Degree Certificate" fileKey="degreeCertificate" required />
                                            <FileRow label="Offer Letter" fileKey="offerLetter" required />
                                        </>
                                    )}
                                </section>
                            )}

                            {/* STEP 2: Core Identity */}
                            {activeStep === 2 && (
                                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-1 space-y-6">
                                        <div>
                                            <InputLabel>Designation</InputLabel>
                                            <input className="w-full border rounded-xl p-3 text-sm bg-neutral-50 font-bold" value={formData.designation} onChange={e => handleInputChange('designation', e.target.value)} />
                                        </div>
                                        <div>
                                            <InputLabel>Aadhar Number</InputLabel>
                                            <div className="flex gap-2">
                                                {(['p1', 'p2', 'p3'] as const).map((p, idx) => (
                                                    <input
                                                        key={p}
                                                        ref={aadharRefs[idx]}
                                                        className="w-full text-center border rounded-xl p-3 font-mono text-sm outline-none focus:border-indigo-500"
                                                        maxLength={4}
                                                        value={aadharParts[p]}
                                                        onChange={e => handleAadharChange(p, e.target.value)}
                                                        onKeyDown={e => handleAadharKeyDown(p, e)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel>Skills (Comma separated)</InputLabel>
                                            <input className="w-full border rounded-xl p-3 text-sm" placeholder="React, Spring, etc" value={formData.skillSet} onChange={e => handleInputChange('skillSet', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><InputLabel>First Name</InputLabel><input className="w-full border rounded-xl p-3 text-sm" value={formData.firstName} onChange={e => handleInputChange('firstName', e.target.value)} /></div>
                                            <div><InputLabel>Last Name</InputLabel><input className="w-full border rounded-xl p-3 text-sm" value={formData.lastName} onChange={e => handleInputChange('lastName', e.target.value)} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><InputLabel>Personal Email</InputLabel><input className="w-full border rounded-xl p-3 text-sm" value={formData.personalEmail} onChange={e => handleInputChange('personalEmail', e.target.value)} /></div>
                                            <div><InputLabel>Contact Number</InputLabel><input className="w-full border rounded-xl p-3 text-sm" value={formData.contactNumber} onChange={e => handleInputChange('contactNumber', e.target.value)} /></div>
                                            <div><InputLabel>Emergency Contact Number</InputLabel><input className="w-full border rounded-xl p-3 text-sm" value={formData.emergencyContactNumber} onChange={e => handleInputChange('emergencyContactNumber', e.target.value)} /></div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <CustomDatePicker label="Date of Birth" value={formData.dateOfBirth} onChange={(val: string) => handleInputChange('dateOfBirth', val)} />
                                            <div>
                                                <InputLabel>Gender</InputLabel>
                                                <select className="w-full border rounded-xl p-3 text-sm bg-white" value={formData.gender} onChange={e => handleInputChange('gender', e.target.value as any)}>
                                                    <option value="MALE">MALE</option><option value="FEMALE">FEMALE</option><option value="OTHER">OTHER</option>
                                                </select>
                                            </div>
                                            <div>
                                                <InputLabel>Blood Group</InputLabel>
                                                <select className="w-full border rounded-xl p-3 text-sm bg-white" value={formData.bloodGroup} onChange={e => handleInputChange('bloodGroup', e.target.value as any)}>
                                                    <option value="O_POSITIVE">O+</option><option value="O_NEGATIVE">O-</option>
                                                    <option value="A_POSITIVE">A+</option><option value="A_NEGATIVE">A-</option>
                                                    <option value="B_POSITIVE">B+</option><option value="B_NEGATIVE">B-</option>
                                                    <option value="AB_POSITIVE">AB+</option><option value="AB_NEGATIVE">AB-</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div><InputLabel>Present Address</InputLabel><textarea rows={2} className="w-full border rounded-xl p-3 text-sm" value={formData.presentAddress} onChange={e => handleInputChange('presentAddress', e.target.value)} /></div>
                                        <div><InputLabel>Permanent Address</InputLabel><textarea rows={2} className="w-full border rounded-xl p-3 text-sm" value={formData.permanentAddress} onChange={e => handleInputChange('permanentAddress', e.target.value)} /></div>
                                    </div>
                                </section>
                            )}

                            {/* STEP 3: Family */}
                            {activeStep === 3 && (
                                <section className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                                            <div className="flex justify-between items-center mb-3"><InputLabel>Father's Details</InputLabel> <input type="checkbox" checked={formData.fatherAlive} onChange={e => handleInputChange('fatherAlive', e.target.checked)} /></div>
                                            <input placeholder="Name" className="w-full border rounded-xl p-3 text-sm bg-white mb-3" value={formData.fatherName} onChange={e => handleInputChange('fatherName', e.target.value)} />
                                            <CustomDatePicker label="Date of Birth" value={formData.fatherDateOfBirth} onChange={(val: string) => handleInputChange('fatherDateOfBirth', val)} />
                                            <div><InputLabel>Occupation</InputLabel><input className="w-full border rounded-xl p-3 text-sm bg-white font-bold" value={formData.fatherOccupation} onChange={e => handleInputChange('fatherOccupation', e.target.value)} /></div>
                                        </div>
                                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                                            <div className="flex justify-between items-center mb-3"><InputLabel>Mother's Details</InputLabel> <input type="checkbox" checked={formData.motherAlive} onChange={e => handleInputChange('motherAlive', e.target.checked)} /></div>
                                            <input placeholder="Name" className="w-full border rounded-xl p-3 text-sm bg-white mb-3" value={formData.motherName} onChange={e => handleInputChange('motherName', e.target.value)} />
                                            <CustomDatePicker label="Date of Birth" value={formData.motherDateOfBirth} onChange={(val: string) => handleInputChange('motherDateOfBirth', val)} />
                                            <div><InputLabel>Occupation</InputLabel><input className="w-full border rounded-xl p-3 text-sm bg-white font-bold" value={formData.motherOccupation} onChange={e => handleInputChange('motherOccupation', e.target.value)} /></div>
                                        </div>
                                    </div>

                                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                                        <div className="flex justify-between items-center mb-4"><InputLabel>Marital Status</InputLabel><select className="border rounded-lg px-2 py-1 text-xs font-bold" value={formData.maritalStatus} onChange={e => handleInputChange('maritalStatus', e.target.value as any)}><option value="SINGLE">SINGLE</option><option value="MARRIED">MARRIED</option></select></div>
                                        {formData.maritalStatus === "MARRIED" && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><InputLabel>Spouse Name</InputLabel><input placeholder="Name" className="w-full border rounded-xl p-3 text-sm bg-white" value={formData.spouseName} onChange={e => handleInputChange('spouseName', e.target.value)} /></div>
                                                    <div><InputLabel>Spouse Contact</InputLabel><input placeholder="Contact Number" className="w-full border rounded-xl p-3 text-sm bg-white" value={formData.spouseContactNumber} onChange={e => handleInputChange('spouseContactNumber', e.target.value)} /></div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <CustomDatePicker label="Spouse Date of Birth" value={formData.spouseDateOfBirth} onChange={(val: string) => handleInputChange('spouseDateOfBirth', val)} />


                                                    <div><InputLabel>Spouse Occupation</InputLabel><input placeholder="Occupation" className="w-full border rounded-xl p-3 text-sm bg-white" value={formData.spouseOccupation} onChange={e => handleInputChange('spouseOccupation', e.target.value)} /></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {formData.maritalStatus === "MARRIED" && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Children ({formData.children?.length || 0})
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({
                                                        ...p,
                                                        children: [...(p.children || []), { childName: "", gender: "MALE", childDateOfBirth: "" }]
                                                    }))}
                                                    className="text-indigo-600 text-[10px] font-black flex items-center gap-1 hover:underline"
                                                >
                                                    <HiPlus /> ADD CHILD
                                                </button>
                                            </div>

                                            {formData.children?.map((child, idx) => (
                                                <div key={idx} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-slate-50 p-4 rounded-2xl relative border border-slate-100">
                                                    {/* Name Field */}
                                                    <div className="flex-1 min-w-[150px]">
                                                        <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Name</label>
                                                        <input
                                                            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                            placeholder="Child's name"
                                                            value={child.childName}
                                                            onChange={e => {
                                                                const children = [...(formData.children || [])];
                                                                children[idx].childName = e.target.value;
                                                                setFormData({ ...formData, children });
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Date of Birth Field */}
                                                    <div className="flex-1 min-w-37.5">
                                                        {/* Replacing the native input with your CustomDatePicker */}
                                                        <CustomDatePicker
                                                            label="Date of Birth"
                                                            value={child.childDateOfBirth}
                                                            onChange={(val: string) => {
                                                                const children = [...(formData.children || [])];
                                                                // Update the specific child's DOB at the current index
                                                                children[idx] = {
                                                                    ...children[idx],
                                                                    childDateOfBirth: val
                                                                };
                                                                setFormData({ ...formData, children });
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Gender Selection */}
                                                    <div className="w-full md:w-32">
                                                        <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Gender</label>
                                                        <select
                                                            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white outline-none cursor-pointer"
                                                            value={child.gender}
                                                            onChange={e => {
                                                                const children = [...(formData.children || [])];
                                                                children[idx].gender = e.target.value as Gender;
                                                                setFormData({ ...formData, children });
                                                            }}
                                                        >
                                                            <option value="MALE">MALE</option>
                                                            <option value="FEMALE">FEMALE</option>
                                                            <option value="OTHER">OTHER</option>
                                                        </select>
                                                    </div>

                                                    {/* Remove Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(p => ({ ...p, children: p.children?.filter((_, i) => i !== idx) }))}
                                                        className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                                    >
                                                        <HiTrash size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* STEP 4 (Experienced Only): Work History */}
                            {isExperienced && activeStep === 4 && (
                                <section className="space-y-6">
                                    <div><InputLabel>UAN Number</InputLabel><input placeholder="10XXXXXXXXXX" className="w-full border rounded-xl p-3 text-sm font-mono" value={formData.uanNumber} onChange={e => handleInputChange('uanNumber', e.target.value)} /></div>
                                    <div className="flex justify-end"><button onClick={() => setFormData(p => ({ ...p, experiences: [...(p.experiences || []), { companyName: "", role: "", fromDate: "", endDate: "" }] }))} className="px-4 py-2 bg-neutral-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-black transition-all">Add Company</button></div>
                                    {formData.experiences?.map((exp, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 relative"><div className="flex justify-between items-start"><div className="flex-1 mr-4"><InputLabel>Company Name</InputLabel><input className="w-full border rounded-xl p-3 text-sm" value={exp.companyName} onChange={e => { const exps = [...(formData.experiences || [])]; exps[idx].companyName = e.target.value; setFormData({ ...formData, experiences: exps }); }} /></div><button onClick={() => setFormData(p => ({ ...p, experiences: p.experiences?.filter((_, i) => i !== idx) }))} className="p-3 text-neutral-400 hover:text-red-500 transition-colors"><HiTrash size={18} /></button></div><div className="grid grid-cols-2 gap-4"><div><InputLabel>Role</InputLabel><input className="w-full border rounded-xl p-3 text-sm" value={exp.role} onChange={e => { const exps = [...(formData.experiences || [])]; exps[idx].role = e.target.value; setFormData({ ...formData, experiences: exps }); }} /></div></div><div className="grid grid-cols-2 gap-4"><CustomDatePicker label="From Date" value={exp.fromDate} onChange={(val: string) => { const exps = [...(formData.experiences || [])]; exps[idx].fromDate = val; setFormData({ ...formData, experiences: exps }); }} /><CustomDatePicker label="End Date" value={exp.endDate} onChange={(val: string) => { const exps = [...(formData.experiences || [])]; exps[idx].endDate = val; setFormData({ ...formData, experiences: exps }); }} /></div><div><InputLabel>Experience Certificate</InputLabel><FileRow label="Experience Certificate" fileKey={`exp_cert_${idx}`} customFile={exp.tempCert} onCustomChange={(file) => handleExperienceFileChange(idx, file)} /></div><div><InputLabel>Joining Letter</InputLabel><FileRow label="Joining Letter" fileKey={`joining_letter_${idx}`} customFile={exp.tempJoiningLetter} onCustomChange={(file) => handleJoiningLetterFileChange(idx, file)} /></div><div><InputLabel>Relieving Letter</InputLabel><FileRow label="Relieving Letter" fileKey={`relieving_letter_${idx}`} customFile={exp.tempRelievingLetter} onCustomChange={(file) => handleRelievingLetterFileChange(idx, file)} /></div></div>
                                    ))}
                                </section>
                            )}

                            {/* STEP 4 (Fresher) or STEP 5 (Experienced): Banking */}
                            {((!isExperienced && activeStep === 4) || (isExperienced && activeStep === 5)) && (
                                <section className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2"><InputLabel>Bank Name</InputLabel><input className="w-full border rounded-xl p-3 text-sm" value={formData.bankName} onChange={e => handleInputChange('bankName', e.target.value.toUpperCase())} /></div>
                                    <div><InputLabel>Account Number</InputLabel><input className="w-full border rounded-xl p-3 text-sm font-mono" value={formData.accountNumber} onChange={e => handleInputChange('accountNumber', e.target.value)} /></div>
                                    <div><InputLabel>IFSC Code</InputLabel><input className="w-full border rounded-xl p-3 text-sm font-mono uppercase" value={formData.ifscCode} onChange={e => handleInputChange('ifscCode', e.target.value.toUpperCase())} /></div>
                                    <div className="col-span-2"><InputLabel>Branch Name</InputLabel><input className="w-full border rounded-xl p-3 text-sm" value={formData.bankBranchName} onChange={e => handleInputChange('bankBranchName', e.target.value)} /></div>
                                </section>
                            )}
                            {/* --- End CONDITIONAL RENDERING --- */}

                        </div>
                    </div>

                    {/* --- REFACTORED FOOTER: Context-aware buttons --- */}
                    <div className="p-6 border-t bg-neutral-50 shrink-0 flex items-center justify-between gap-4">
                        <button
                            onClick={handlePrev}
                            disabled={activeStep === 1}
                            className="bg-neutral-100 text-neutral-600 font-bold px-10 py-4 rounded-xl text-[10px] tracking-widest uppercase hover:bg-neutral-200 disabled:opacity-50 transition-all border border-neutral-200 flex items-center gap-1.5"
                        >
                            <span className="text-sm">←</span> Prev
                        </button>

                        {activeStep === totalSteps ? (
                            // Submit button (unchanged logic) shown only on the last step
                            <button
                                onClick={handleSubmit}
                                className="bg-indigo-600 text-white font-black px-10 py-4 rounded-xl text-[10px] tracking-widest uppercase hover:bg-indigo-700 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <HiCheck size={16} /> Finalize Profile & Sync
                            </button>
                        ) : (
                            // Next button shown on all steps except the last
                            <button
                                onClick={handleNext}
                                className="bg-neutral-900 text-white font-black px-10 py-4 rounded-xl text-[10px] tracking-widest uppercase hover:bg-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-1.5"
                            >
                                Next <span className="text-sm">→</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showFailure && <FailureModal title="Sync Error" message={errorMessage} onClose={() => setShowFailure(false)} />}
        </>
    );
};

export default PersonalDetailsModal;