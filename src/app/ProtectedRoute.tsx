import type { UserRole } from "@/shared/auth/authTypes";
import { useAuth } from "@/shared/auth/useAuth";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import ChangePasswordDialog from "@/features/auth/components/ChangePasswordDialog";
import PersonalDetailsModal from "@/features/employee/components/PersonalDetailsModal";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const roleRedirectMap: Record<UserRole, string> = {
  EMPLOYEE: "/employee/dashboard",
  MANAGER: "/manager/dashboard",
  CTO: "/manager/dashboard",
  HR: "/hr/dashboard",
  ADMIN: "/admin/dashboard",
  CFO: "/cfo/dashboard",
  CEO: "/admin/dashboard",
  TEAM_LEADER: "",
  COO: "/manager/dashboard"
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, mustChangePassword, personalDetailsComplete , } = useAuth();

  // 1. Check Authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. MANDATORY CHECK: Password Change
  if (mustChangePassword) {
    return <ChangePasswordDialog />;
  }

  // 3. MANDATORY CHECK: Personal Details
  if (!personalDetailsComplete) {
    return <PersonalDetailsModal />;
  }

  // 4. Role Authorization
  if (allowedRoles && user?.role) {
    const hasAccess = allowedRoles.includes(user.role);
    if (!hasAccess) {
      return <Navigate to={roleRedirectMap[user.role as UserRole]} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;