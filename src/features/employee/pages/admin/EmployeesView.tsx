import AddEmployeePopup from "@/features/employee/components/AddEmployeeForm";
import UpdateEmployeePopup from "@/features/employee/components/UpdateEmployeeForm";
import { useEmployee } from "@/features/employee/hooks/useEmployee";
import type { EmployeeEntity } from "@/features/employee/types";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisV,
  FaFilter,
  FaPlus,
  FaRegAddressCard,
  FaSearch,
  FaTimes,
  FaUserCheck,
  FaUserSlash
} from "react-icons/fa";

const EmployeesView = () => {
  const { getEmployees, loading, fetchEmployeeProfile, addUser, updateUser, deleteUser, searchUser, roles, fetchRoles } = useEmployee();
  const [employees, setEmployees] = useState<EmployeeEntity[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeEntity[]>([]);
  const [pagination, setPagination] = useState({ totalElements: 0, totalPages: 0 });

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [openAddEmployee, setOpenAddEmployee] = useState(false);
  const [openUpdateEmployee, setOpenUpdateEmployee] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  const isSearchMode = !!searchTerm;
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    empId: string | null;
    mode: 'DEACTIVATE' | 'REACTIVATE';
  }>({ isOpen: false, empId: null, mode: 'DEACTIVATE' });

  // ─── Manager name lookup ──────────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      try {
        const result = await getEmployees({ page: 0, size: 1000 });
        if (result?.content) setAllEmployees(result.content);
      } catch { /* silent */ }
    };
    loadAll();
  }, []);

  const managerMap = useMemo(() => {
    const map: Record<string, string> = {};
    allEmployees.forEach(emp => { map[emp.empId] = emp.name; });
    return map;
  }, [allEmployees]);

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return '—';
    return managerMap[managerId] || `#${managerId}`;
  };

  useEffect(() => {

    fetchRoles();

  }, [fetchRoles]);

  // ─── Load employees ───────────────────────────────────────────
  const loadEmployeeData = useCallback(async () => {
    let result;
    if (searchTerm.trim()) {
      result = await searchUser(searchTerm);
    } else {
      result = await getEmployees({
        page: currentPage,
        size: 10,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
    }

    if (result && Array.isArray(result.content)) {
      setEmployees(result.content);
      setPagination({
        totalElements: result.totalElements || 0,
        totalPages: result.totalPages || 0,
      });
    } else {
      setEmployees([]);
      setPagination({ totalElements: 0, totalPages: 0 });
    }
  }, [getEmployees, searchUser, currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    const delay = setTimeout(loadEmployeeData, 250);
    return () => clearTimeout(delay);
  }, [loadEmployeeData]);

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(0);
    }, 300);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(0);
  };

  const handleAction = async () => {
    if (confirmState.empId) {
      await deleteUser(confirmState.empId);
      setConfirmState({ ...confirmState, isOpen: false });
      loadEmployeeData();
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchRole = roleFilter === "ALL" || emp.roleName === roleFilter;
    const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? emp.active : !emp.active);
    return matchRole && matchStatus;
  });

  return (
    <div className=" bg-[#f8f9fa] min-h-screen space-y-6">

      {/* ── Tabs Style Navigation ── */}
      {/* <div className="flex gap-2 mb-4">
        <button className="px-5 py-2 bg-brand text-white rounded-lg text-xs font-medium shadow-sm">Employee</button>
        <button className="px-5 py-2 bg-white text-gray-500 rounded-lg text-xs font-medium border border-gray-100 hover:bg-gray-50">Inactive employees list</button>
      </div> */}

      {/* ── Main Container ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* ── Top Toolbar ── */}
        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* <h2 className="text-xl font-semibold text-gray-800">Employee list</h2> */}

          <div className="flex flex-wrap items-center gap-3 w-full md:w-full">
            {/* Search Input */}
            <div className="relative flex-1 md:w-150">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search"
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full bg-gray-50 border border-transparent pl-11 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-200 transition-all"
              />
              {searchInput && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FaTimes size={12} />
                </button>
              )}
            </div>
            <div className="flex gap-4">
              <div className="sticky">
                {/* The Filter Button */}
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
                >
                  <FaFilter size={12} className={statusFilter !== 'ALL' || roleFilter !== 'ALL' ? "text-orange-500" : "text-gray-400"} />
                  <span className="font-medium">Filter</span>
                  {/* Optional: Show a dot if filters are active */}
                  {(statusFilter !== 'ALL' || roleFilter !== 'ALL') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  )}
                </button>

                <AnimatePresence>
                  {showFilterMenu && (
                    <>
                      {/* Backdrop to close menu when clicking outside */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />

                      {/* The Menu Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="fixed z-[100] w-72 bg-white border border-gray-100 shadow-2xl rounded-2xl p-5 overflow-hidden"
                        style={{
                          // These coordinates align the menu specifically to your UI layout
                          top: '185px',
                          right: '180px'
                        }}
                      >
                        <div className="space-y-5">
                          {/* Header */}
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-800">Filters</h3>
                            <button
                              onClick={() => { setStatusFilter('ALL'); setRoleFilter('ALL'); }}
                              className="text-[11px] font-semibold text-orange-600 hover:underline"
                            >
                              Reset All
                            </button>
                          </div>

                          {/* Status Section */}
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Employment Status</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['ALL', 'ACTIVE', 'Disabled'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => setStatusFilter(status)}
                                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === status
                                    ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                  {status.charAt(0) + status.slice(1).toLowerCase()}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Role Section */}
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                              User Role
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {/* Explicitly add the "All" button first */}
                              <button
                                onClick={() => setRoleFilter('ALL')}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${roleFilter === 'ALL'
                                  ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                  }`}
                              >
                                All Roles
                              </button>

                              {roles.map((role: any) => (
                                <button
                                  key={role.id}
                                  onClick={() => setRoleFilter(role.roleName)}
                                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${roleFilter === role.id
                                    ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                  {role.roleName}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Add Employee Button */}
              <button
                onClick={() => setOpenAddEmployee(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-medium hover:bg-[#e05b2a] shadow-md shadow-orange-100 transition-all active:scale-95"
              >
                <FaPlus size={12} /> Add Employee
              </button>
            </div>

          </div>
        </div>

        {/* ── Table Area ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fcfcfc] border-y border-gray-50">
              <tr>
                <th className="px-6 py-4 text-[13px] font-medium text-gray-400">S.No</th>
                <th className="px-6 py-4 text-[13px] font-medium text-gray-400">Employee Id</th>
                <th className="px-6 py-4 text-[13px] font-medium text-gray-400">Name</th>
                <th className="px-6 py-4 text-[13px] font-medium text-gray-400">Email</th>
                <th className="px-6 py-4 text-[13px] font-medium text-gray-400 text-center">Manager</th>
                <th className="px-6 py-4 text-[13px] font-medium text-gray-400 text-center">Joining Date</th>
                <th className="px-6 py-4 text-[13px] font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-[13px] font-medium text-gray-400 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="p-6">
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp, index) => (
                  <tr
                    key={emp.empId}
                    className="even:bg-gray-50/80 hover:bg-orange-50/30 transition-colors group"
                  >
                    {/* S.No */}
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {(currentPage * 10) + index + 1 < 10 ? `0${(currentPage * 10) + index + 1}` : (currentPage * 10) + index + 1}
                    </td>

                    {/* ID */}
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{emp.empId}</td>

                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-[11px] font-bold text-orange-600">
                          {emp.name?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{emp.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-sm text-gray-500">{emp.email}</td>

                    {/* Manager */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-600 font-medium">{getManagerName(emp.reportingId)}</span>
                    </td>

                    {/* Joining Date */}
                    <td className="px-6 py-4 text-center text-sm text-gray-500">
                      {(emp as any).joiningDate ? new Date((emp as any).joiningDate).toLocaleDateString() : '—'}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[11px] font-semibold ${emp.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {emp.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === emp.empId ? null : emp.empId)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FaEllipsisV size={14} />
                      </button>

                      <AnimatePresence>
                        {activeMenu === emp.empId && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                            <motion.div
                              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                              className="absolute right-12 top-1/2 -translate-y-1/2 z-50 bg-white shadow-xl border border-gray-100 rounded-xl p-2 min-w-[160px] text-left"
                            >
                              <button
                                onClick={async () => {
                                  setSelectedEmployeeId(emp.empId);
                                  await fetchEmployeeProfile(emp.empId);
                                  setOpenUpdateEmployee(true);
                                  setActiveMenu(null);
                                }}
                                className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                              >
                                <FaRegAddressCard className="text-blue-500" /> Edit Details
                              </button>
                              <button
                                onClick={() => { setConfirmState({ isOpen: true, empId: emp.empId, mode: emp.active ? 'DEACTIVATE' : 'REACTIVATE' }); setActiveMenu(null); }}
                                className={`w-full px-4 py-2 text-xs font-medium rounded-lg flex items-center gap-2 ${emp.active ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                              >
                                {emp.active ? <><FaUserSlash /> Deactivate</> : <><FaUserCheck /> Activate</>}
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-gray-400 text-sm">No results found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {!isSearchMode && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center px-2">
          <p className="text-xs text-gray-500">Page {currentPage + 1} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2.5 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all"
            >
              <FaChevronLeft size={12} className="text-gray-500" />
            </button>
            <button
              disabled={currentPage >= (pagination.totalPages - 1)}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2.5 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all"
            >
              <FaChevronRight size={12} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <AddEmployeePopup open={openAddEmployee} addUser={addUser} onClose={() => { setOpenAddEmployee(false); loadEmployeeData(); }} />
      <UpdateEmployeePopup
        employeeId={selectedEmployeeId}
        open={openUpdateEmployee}
        updateUser={updateUser}
        onClose={() => { setOpenUpdateEmployee(false); setSelectedEmployeeId(""); loadEmployeeData(); }}
      />
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.mode === 'DEACTIVATE' ? "Confirm Deactivation" : "Confirm Activation"}
        message={`Are you sure you want to ${confirmState.mode.toLowerCase()} this employee?`}
        confirmText="Confirm"
        isDanger={confirmState.mode === 'DEACTIVATE'}
        onConfirm={handleAction}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
      />
    </div>
  );
};

export default EmployeesView;

// ─── ConfirmDialog (unchanged) ────────────────────────────────────
interface ConfirmDialogProps {
  isOpen: boolean; title: string; message: string; confirmText: string;
  isDanger: boolean; onConfirm: () => void; onCancel: () => void;
}

const ConfirmDialog = ({ isOpen, title, message, confirmText, isDanger, onConfirm, onCancel }: ConfirmDialogProps) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-sm bg-white border border-slate-200 rounded-sm shadow-2xl p-6">
          <h3 className="text-sm font-black text-slate-900 uppercase mb-2">{title}</h3>
          <p className="text-[11px] font-medium text-slate-500 uppercase leading-relaxed mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2 border border-slate-200 text-[10px] font-black uppercase hover:bg-slate-50 transition-all">Cancel</button>
            <button onClick={onConfirm} className={`flex-1 px-4 py-2 text-white text-[10px] font-black uppercase transition-all shadow-sm ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);