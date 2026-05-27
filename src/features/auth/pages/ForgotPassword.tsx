import { ArrowLeft, CheckCircle, CheckCircle2, Loader, Mail, ShieldCheck, XCircle } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FailureModal from "../../../shared/components/FailureModal";
import { authService } from "../api/authApi";

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<"email" | "otp" | "success">("email");

    // Form States
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI States
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Validation Logic
    const validations = useMemo(() => {
        return [
            { label: "8+ Characters", valid: newPassword.length >= 8 },
            { label: "Uppercase & Lowercase", valid: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) },
            { label: "Contains a Number", valid: /\d/.test(newPassword) },
            { label: "Special Symbol (@$!%*#?)", valid: /[@$!%*#?&]/.test(newPassword) },
            { label: "Passwords match", valid: newPassword === confirmPassword && confirmPassword !== "" },
        ];
    }, [newPassword, confirmPassword]);

    const allValid = validations.every((v) => v.valid);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.forgotPassword(email);
            setStep("otp");
        } catch (err) {
            setErrorMsg("Unable to send OTP. Please check your email.");
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allValid) return;

        setLoading(true);
        try {
            // We send the newPassword (which is confirmed by our local state)
            await authService.verifyOtp({ email, otp, newPassword });
            setStep("success");
        } catch (err) {
            setErrorMsg("Invalid OTP or expired. Please try again.");
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 transition-all">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors mb-4`}>
                    <button onClick={() => navigate('/login')}><ArrowLeft /></button>
                </div>

                {/* Stepper Header */}
                {step !== "success" && (
                    <div className="flex items-center justify-between mb-8 px-4">
                        <div className="flex flex-col items-center space-y-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step === 'email' ? 'border-blue-500 bg-blue-50 text-blue-50' : 'border-green-500 bg-green-50 text-green-500'}`}>
                                <Mail size={20} className={step === 'email' ? 'text-blue-600' : 'text-green-600'} />
                            </div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Step 1</span>
                        </div>
                        <div className={`flex-1 h-0.5 mx-2 ${step === 'otp' ? 'bg-green-500' : 'bg-gray-200'}`} />
                        <div className="flex flex-col items-center space-y-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step === 'otp' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400'}`}>
                                <ShieldCheck size={20} />
                            </div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Step 2</span>
                        </div>
                    </div>
                )}

                {showError && (
                    <FailureModal title="Error" message={errorMsg} onClose={() => setShowError(false)} />
                )}

                {/* STEP 1: Email */}
                {step === "email" && (
                    <form onSubmit={handleEmailSubmit} className="space-y-6 animate-in slide-in-from-left duration-300">
                        <div className="text-center">
                            <h1 className="text-2xl font-black text-gray-900">Reset Password</h1>
                            <p className="text-gray-500 text-sm mt-1">Enter your email to receive a verification code.</p>
                        </div>

                        <input
                            type="email"
                            placeholder="Registered Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
                            required
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl p-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center transition-all active:scale-[0.98]"
                        >
                            {loading ? <Loader className="animate-spin" size={22} /> : "Get OTP Code"}
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP + New Password with Validation */}
                {step === "otp" && (
                    <form onSubmit={handleOtpSubmit} className="space-y-5 animate-in slide-in-from-right duration-300">
                        <div className="text-center">
                            <h1 className="text-2xl font-black text-gray-900">Secure Account</h1>
                            <p className="text-gray-500 text-sm mt-1">Check <b>{email}</b> for the code.</p>
                        </div>

                        <input
                            type="text"
                            placeholder="XXXXXX"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
                            required
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl p-4 tracking-[0.3em] text-center font-bold text-lg focus:border-blue-500 outline-none"
                        />

                        <div className="space-y-3">
                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value.replace(/\s/g, ""))}
                                required
                                className="w-full border border-gray-200 bg-gray-50 rounded-xl p-4 focus:border-blue-500 outline-none transition-all"
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ""))}
                                required
                                className="w-full border border-gray-200 bg-gray-50 rounded-xl p-4 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        {/* Live Validation Checklist */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                            {validations.map((v, i) => (
                                <div key={i} className="flex items-center space-x-2">
                                    {v.valid ? (
                                        <CheckCircle className="text-emerald-500" size={14} />
                                    ) : (
                                        <XCircle className="text-gray-300" size={14} />
                                    )}
                                    <span className={`text-[11px] font-bold uppercase tracking-tight transition-colors ${v.valid ? "text-emerald-700" : "text-gray-400"}`}>
                                        {v.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !allValid}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg active:scale-[0.98] ${allValid ? "bg-green-600 hover:bg-green-700 shadow-green-100" : "bg-gray-200 cursor-not-allowed"}`}
                        >
                            {loading ? <Loader className="animate-spin mx-auto" size={22} /> : "Update Password"}
                        </button>
                    </form>
                )}

                {/* STEP 3: Success State */}
                {step === "success" && (
                    <div className="text-center py-6 animate-in zoom-in duration-500">
                        <div className="flex justify-center mb-6">
                            <div className="bg-green-100 p-5 rounded-3xl rotate-6 shadow-inner">
                                <CheckCircle2 className="text-green-600" size={64} />
                            </div>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Success!</h1>
                        <p className="text-gray-500 text-sm mb-8 px-4">
                            Your password has been securely updated. You can now use your new credentials to sign in.
                        </p>
                        <button
                            onClick={() => navigate("/login")}
                            className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all shadow-xl"
                        >
                            Back to Sign In
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;