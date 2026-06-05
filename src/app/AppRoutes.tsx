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
import SelfAppraisalPage from "@/features/appraisal/pages/SelfAppraisalPage";
import AppraisalDashboardPage from "@/features/appraisal/pages/AppraisalDashboardPage";
import AdminAppraisalCyclePage from "@/features/appraisal/pages/AdminAppraisalCyclePage";

/**
 * APPRAISAL ROUTING RULES:
 *
 * Self Appraisal  → Only EMPLOYEE role can fill their own form.
 *                   After submit → goes to their Reporting Manager (L1 Approver).
 *                   After PUBLISHED → employee can view their result in the same page.
 *
 * Appraisal Reviews (Dashboard) →
 *   - MANAGER / CTO / COO / CEO / CFO / TEAM_LEADER → sees pending reviews (L1 or L2)
 *   - ADMIN / HR → sees ALL appraisals + can export Excel/PDF
 *   - EMPLOYEE → NOT allowed here
 */

const REVIEWER_ROLES = ["MANAGER", "CTO", "COO", "CEO", "CFO", "TEAM_LEADER", "ADMIN", "HR"];
const EMPLOYEE_ONLY  = ["EMPLOYEE"];

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loader />;

  return (
    <Routes>
      {/* ── PROTECTED ROUTES ──────────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/portal" element={<LaunchPage />} />

        {/* Role-specific dashboard layouts */}
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

        {/* ── APPRAISAL ROUTES ─────────────────────────────────────────── */}

        {/*
          Self Appraisal — EMPLOYEE only.
          - Employees fill their own form here.
          - After submit the backend automatically assigns firstApproverId = employee's reportingId.
          - Once PUBLISHED by final approver, employee sees full result with L1/L2 remarks here.
        */}
        <Route element={<ProtectedRoute allowedRoles={EMPLOYEE_ONLY} />}>
          <Route path="/self-appraisal" element={<SelfAppraisalPage />} />
        </Route>

        {/*
          Appraisal Reviews — Managers / Admin / HR.
          - MANAGER / CTO / COO etc → sees only their pending queue (L1 or L2).
          - ADMIN / HR → sees all + export button.
          - EMPLOYEE is explicitly excluded.
        */}
        <Route element={<ProtectedRoute allowedRoles={REVIEWER_ROLES} />}>
          <Route path="/appraisal-reviews" element={<AppraisalDashboardPage />} />
        </Route>

        {/*
          Admin Appraisal Cycle Management — ADMIN / HR only.
          Toggle isActive (current year) and isOpen (submissions allowed) per cycle.
        */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN", "HR"]} />}>
          <Route path="/admin/appraisal-cycles" element={<AdminAppraisalCyclePage/>} />
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
