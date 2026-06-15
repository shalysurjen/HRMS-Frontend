import NotFoundPage from "@/app/NotFoundPage";
import AuthPage from "@/features/auth/pages/AuthPage";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import DashboardLayout from "@/features/dashboard/layout/DashboardLayout";
import EmployeeProfile from "@/features/employee/pages/self/EmployeeProfile";
import LandingPage from "@/features/landingpage/pages/LandingPage";
import PrivacyPolicy from "@/features/landingpage/pages/PrivacyPolicy";
import TermsOfService from "@/features/landingpage/pages/TermsOfService";
import LaunchPage from "@/features/launchpage/LaunchPage";
import LeavePolicies from "@/features/leave/pages/LeavePolicy";
import { useAuth } from "@/shared/auth/useAuth";
import Loader from "@/shared/components/Loader";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import FileViewer from "@/features/dashboard/admin/pages/FileViewer";

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loader />;

  return (
    <Routes>
      {/* ── PROTECTED ROUTES ──────────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/portal" element={<LaunchPage />} />

        {/* Role-specific dashboard layouts — appraisal routes live INSIDE DashboardRoutes */}
        <Route element={<ProtectedRoute allowedRoles={["EMPLOYEE"]} />}>
          <Route path="/employee/*" element={<DashboardLayout />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["MANAGER", "CTO", "COO", "ADMIN", "CEO", "CFO"]} />}>
          <Route path="/manager/*" element={<DashboardLayout />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["HR"]} />}>
          <Route path="/hr/*" element={<DashboardLayout />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin/*" element={<DashboardLayout />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["CFO"]} />}>
          <Route path="/cfo/*" element={<DashboardLayout />} />
        </Route>

        <Route path="/profile" element={<EmployeeProfile />} />
      </Route>

      {/* ── PUBLIC ROUTES ─────────────────────────────────────────────── */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/portal" replace /> : <LandingPage />} />
      <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/portal" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/leave-policy" element={<LeavePolicies />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/file-viewer" element={<FileViewer />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;