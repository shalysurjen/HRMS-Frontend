import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import OnboardingPendingPage from "@/features/leave/pages/AccessApprovalsPage";
import FlashNewsForm from "@/features/notification/pages/FlashNewsCreate";

/* COMMON */
import TeamCalendarView from "@/features/attendance/pages/TeamCalendarView";
import ManagerDashboardView from "@/features/dashboard/manager/pages/ManagerDashboardView";
import RequestCenter from "@/features/employee/components/RequestCenter";
import BirthdayPage from "@/features/birthday/pages/BirthdayPage";
import { HRVerificationPage } from "@/features/employee/pages/hr/Hrverificationpage";
import DashboardView from "@/features/employee/pages/self/DashboardView";
import EmployeeProfile from "@/features/employee/pages/self/EmployeeProfile";
import TeamMembersView from "@/features/employee/pages/TeamMembersView";
import LowBalancePage from "@/features/leave/pages/LowBalancePage";
import MyRequestsView from "@/features/leave/pages/MyLeavesView";
import PendingApprovalsView from "@/features/leave/pages/PendingApprovalsView";
import NotificationsView from "@/features/notification/pages/NotificationsView";
import PayrollView from "@/features/payroll/pages/PayrollPage";
import { useAuth } from "@/shared/auth/useAuth";
import EmployeesView from "@/features/employee/pages/admin/EmployeesView";
import SkillsetLayout from "@/features/skillset/Skillsetlayout";
import Myskills from "@/features/skillset/Myskills";
import Badges from "@/features/skillset/Badges";
import Progression from "@/features/skillset/Progression";
import ManagerTeamSkills from "@/features/skillset/ManagerTeamSkills";
import SkillsetHome from "@/features/skillset/SkillsetHome";
import AttendanceReports from "@/features/attendance/pages/AttendanceReports";
import PolicyConfig from "../admin/pages/PolicyConfig";
import { CFOEmployeesPage } from "@/features/payroll/pages/Cfoemployeepage";
import { PayslipPage } from "@/features/payroll/pages/PayslipPage";
import AdminAppraisalCyclePage from "@/features/appraisal/pages/AdminAppraisalCyclePage";

/* SELF APPRAISAL */
import SelfAppraisalPage from "@/features/appraisal/pages/SelfAppraisalPage";
import AppraisalDashboardPage from "@/features/appraisal/pages/AppraisalDashboardPage";

/* LEAVE EXPORT */
import LeaveExportPage from "@/features/leave/pages/LeaveExportPage";

const DashboardRoutes = () => {
  const { user } = useAuth();
  const role = user?.role;
  const location = useLocation();

  // Derive the base path (/employee, /manager, /hr, /admin, /cfo)
  const basePath = "/" + location.pathname.split("/")[1];

  const renderDashboard = () => {
    switch (role) {
      case "EMPLOYEE":
        return <DashboardView />;
      case "ADMIN":
        return <DashboardView />;
      case "CFO":
        return <PayslipPage />;
      default:
        return <ManagerDashboardView />;
    }
  };

  const renderEmployees = () => <EmployeesView />;

  return (
    <Routes>
      {/* DASHBOARD */}
      <Route path="dashboard" element={renderDashboard()} />

      {/* COMMON */}
      <Route path="notifications"   element={<NotificationsView />} />
      <Route path="requests"        element={<MyRequestsView />} />
      <Route path="profile"         element={<EmployeeProfile />} />
      <Route path="request-center"  element={<RequestCenter />} />

      {/* MANAGER */}
      <Route path="team"            element={<TeamMembersView />} />
      <Route path="action-center"   element={<PendingApprovalsView />} />
      <Route path="calendar"        element={<TeamCalendarView />} />

      {/* HR */}
      <Route path="employees"       element={renderEmployees()} />
      <Route path="low-balance"     element={<LowBalancePage />} />
      <Route path="verifications"   element={<HRVerificationPage />} />

      {/* ADMIN */}
      <Route path="onboarding"         element={<OnboardingPendingPage />} />
      <Route path="flash-news"         element={<FlashNewsForm />} />
      <Route path="attendance-reports" element={<AttendanceReports />} />
      <Route path="policies"           element={<PolicyConfig />} />

      {/* ADMIN APPRAISAL CYCLE */}
      <Route path="admin/appraisal-cycles" element={<AdminAppraisalCyclePage />} />

      {/* PAYROLL */}
      <Route path="payslip" element={<PayrollView />} />

      {/* SKILLSET */}
      <Route path="skillset" element={<SkillsetLayout />}>
        <Route path="home"        element={<SkillsetHome />} />
        <Route path="my-skills"   element={<Myskills />} />
        <Route path="badges"      element={<Badges />} />
        <Route path="progression" element={<Progression />} />
        <Route path="team-skills" element={<ManagerTeamSkills />} />
        <Route index element={<Navigate to="home" replace />} />
      </Route>

      {/* CFO */}
      <Route path="payroll" element={<CFOEmployeesPage />} />

      {/* BIRTHDAY */}
      <Route path="birthday" element={<BirthdayPage />} />

      {/* SELF APPRAISAL */}
      <Route path="self-appraisal"   element={<SelfAppraisalPage />} />
      <Route path="appraisal-reviews" element={<AppraisalDashboardPage />} />

      {/* LEAVE EXPORT — Admin sees all employees, Manager sees team only */}
      <Route path="leave-export" element={<LeaveExportPage />} />

      {/* DEFAULT — use absolute path to prevent nested redirect loop */}
      <Route path="*" element={<Navigate to={`${basePath}/dashboard`} replace />} />
    </Routes>
  );
};

export default DashboardRoutes;