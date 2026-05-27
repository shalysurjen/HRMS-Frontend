import { authService } from "@/features/auth/api/authApi";
import { useAuth } from "@/shared/auth/useAuth";
import { FailureModal, Loader } from "@/shared/components";
import React, { useState, useMemo } from "react";
import { FaCheckCircle, FaTimesCircle, FaLock } from "react-icons/fa";

const ChangePasswordDialog: React.FC = () => {
  const { user, setUser } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loader & Error States
  const [loaderState, setLoaderState] = useState({ active: false, finished: false });
  const [showFailure, setShowFailure] = useState(false);
  const [failureMessage, setFailureMessage] = useState("");

  // Helper to prevent spaces during typing
  const handlePasswordChange = (val: string, setter: (v: string) => void) => {
    const noSpaces = val.replace(/\s/g, "");
    setter(noSpaces);
  };

  // Advanced Live Validation Logic
  const validations = useMemo(() => {
    return [
      { label: "8+ Characters", valid: newPassword.length >= 8 },
      { label: "Uppercase Letter", valid: /[A-Z]/.test(newPassword) },
      { label: "Lowercase Letter", valid: /[a-z]/.test(newPassword) },
      { label: "Contains a Number", valid: /\d/.test(newPassword) },
      { label: "Special Symbol (@$!%*#?)", valid: /[@$!%*#?&]/.test(newPassword) },
      { label: "No spaces allowed", valid: !/\s/.test(newPassword) && newPassword.length > 0 },
      { label: "Passwords match", valid: newPassword === confirmPassword && confirmPassword !== "" },
    ];
  }, [newPassword, confirmPassword]);

  const allValid = validations.every((v) => v.valid);

  const handleSubmit = async () => {
    if (!allValid) {
      setFailureMessage("Please meet all password requirements.");
      setShowFailure(true);
      return;
    }

    try {
      setLoaderState({ active: true, finished: false });
      
      await authService.changePassword(newPassword);

      
      
      setLoaderState({ active: true, finished: true });
    } catch (err) {
      setLoaderState({ active: false, finished: false });
      setFailureMessage("Failed to update password. Please try again.");
      setShowFailure(true);
    }
  };

  const handleFinalize = async () => {
    if (user) {
      try {
        const updatedProfile = await authService.getEmployeeProfile(user.id);
        setUser(updatedProfile);
      } catch (err) {
        window.location.reload();
      }
    }
  };

  return (
    <>
      {loaderState.active && (
        <Loader
          message="Securing your account..."
          isFinished={loaderState.finished}
          onFinished={handleFinalize}
        />
      )}

      {!loaderState.active && (
        <div className="fixed inset-0 z-9998 flex items-center justify-center p-6 bg-neutral-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-100">
            
            {/* Header Section */}
            <div className="pt-10 pb-6 px-8 text-center bg-linear-to-b from-red-50 to-white">
              <div className="mx-auto w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-4 text-2xl text-white shadow-lg shadow-red-200 rotate-3">
                <FaLock />
              </div>
              <h3 className="text-2xl font-black text-neutral-800 tracking-tight">
                Update Password
              </h3>
              <p className="text-neutral-500 mt-2 text-sm leading-relaxed">
                Choose a strong password to protect your account.
              </p>
            </div>

            {/* Form Section */}
            <div className="px-8 pb-10 space-y-5">
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full border border-neutral-200 bg-neutral-50 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all placeholder:text-neutral-400"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value, setNewPassword)}
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full border border-neutral-200 bg-neutral-50 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all placeholder:text-neutral-400"
                  value={confirmPassword}
                  onChange={(e) => handlePasswordChange(e.target.value, setConfirmPassword)}
                />
              </div>

              {/* Live Validation Checklist */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 space-y-2">
                {validations.map((v, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="transition-all duration-300">
                      {v.valid ? (
                        <FaCheckCircle className="text-emerald-500 text-base" />
                      ) : (
                        <FaTimesCircle className="text-neutral-300 text-base" />
                      )}
                    </div>
                    <span className={`text-xs font-semibold transition-colors duration-300 ${
                      v.valid ? "text-emerald-700" : "text-neutral-400"
                    }`}>
                      {v.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!allValid}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform active:scale-[0.95] shadow-xl ${
                  allValid 
                  ? "bg-red-600 hover:bg-red-700 shadow-red-200" 
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showFailure && (
        <FailureModal
          title="Security Update Failed"
          message={failureMessage}
          buttonText="Try Again"
          onClose={() => setShowFailure(false)}
        />
      )}
    </>
  );
};

export default ChangePasswordDialog;