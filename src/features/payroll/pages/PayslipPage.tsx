import { employeeService, type Employee } from '@/features/employee/services/employeeService';
import { notify } from '@/features/notification/utils/notifications';
import { usePayslip } from '@/features/payroll/hooks/usePayslip';
import type { Payslip, PayslipCreateRequest } from '@/features/payroll/payrollTypes';
import api from '@/services/apiClient';
import { CustomLoader } from '@/shared/components';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FaBolt,
  FaCheck,
  FaChevronDown,
  FaDownload,
  FaEdit,
  FaFileInvoiceDollar,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineUsers,
} from 'react-icons/hi2';

// ─── Types ────────────────────────────────────────────────────────

interface EmployeeStatus {
  employeeId: string;
  employeeName: string;
  designation: string;
  payslipStatus: 'NOT_CREATED' | 'DRAFT' | 'GENERATED';
  grossSalary: number | null;
  totalDeductions: number | null;
  netSalary: number | null;
}

interface DashboardData {
  year: number;
  month: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  totalEmployees: number;
  generatedCount: number;
  draftCount: number;
  notCreatedCount: number;
  employeeStatuses: EmployeeStatus[];
}

// ─── Constants ────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt = (v: number | null | undefined) =>
  `₹${((v ?? 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Status config
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  GENERATED:   { label: 'Generated',   bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500'  },
  DRAFT:       { label: 'Draft',       bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500'    },
  NOT_CREATED: { label: 'Not Created', bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400'    },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.NOT_CREATED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────
const ConfirmModal: React.FC<{
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
          <FaTrash className="text-rose-500 text-sm" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">Confirm Delete</p>
          <p className="text-xs text-slate-500 mt-0.5">{message}</p>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel}
          className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors">
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Payslip Form Modal ───────────────────────────────────────────
const PayslipFormModal: React.FC<{
  mode: 'create' | 'edit';
  initial?: Payslip;
  employees: Employee[];
  year: number;
  month: number;
  onClose: () => void;
  onSave: (data: PayslipCreateRequest) => void;
}> = ({ mode, initial, employees, year, month, onClose, onSave }) => {
  const EMPTY: PayslipCreateRequest = {
    employeeId:      initial?.employeeId      ?? '',
    month:           initial?.month           ?? month,
    year:            initial?.year            ?? year,
    basicSalary:     initial?.basicSalary     ?? 0,
    hra:             initial?.hra             ?? 0,
    conveyance:      initial?.conveyance      ?? 0,
    medical:         initial?.medical         ?? 0,
    otherAllowance:  initial?.otherAllowance  ?? 0,
    bonus:           initial?.bonus           ?? 0,
    incentive:       initial?.incentive       ?? 0,
    stipend:         initial?.stipend         ?? 0,
    pf:              initial?.pf              ?? 0,
    esi:             initial?.esi             ?? 0,
    professionalTax: initial?.professionalTax ?? 0,
    tds:             initial?.tds             ?? 0,
    lop:             initial?.lop             ?? 0,
    lopDays:         initial?.lopDays         ?? 0,
    variablePay:     initial?.variablePay     ?? 0,
    status:          initial?.status          ?? 'DRAFT',
  };

  const [form, setForm] = useState<PayslipCreateRequest>(EMPTY);

  const updateNum = (field: keyof PayslipCreateRequest, val: number) =>
    setForm(prev => ({ ...prev, [field]: val }));
  const updateStr = (field: keyof PayslipCreateRequest, val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  const gross = form.basicSalary + form.hra + form.conveyance + form.medical +
    form.otherAllowance + form.bonus + form.incentive + form.stipend;
  const deductions = form.pf + form.esi + form.professionalTax + form.tds +
    form.variablePay + form.lop;
  const net = gross - deductions;

  const EARNINGS: { label: string; field: keyof PayslipCreateRequest }[] = [
    { label: 'Basic Salary',    field: 'basicSalary'    },
    { label: 'HRA',             field: 'hra'            },
    { label: 'Conveyance',      field: 'conveyance'     },
    { label: 'Medical',         field: 'medical'        },
    { label: 'Other Allowance', field: 'otherAllowance' },
    { label: 'Bonus',           field: 'bonus'          },
    { label: 'Incentive',       field: 'incentive'      },
    { label: 'Stipend',         field: 'stipend'        },
  ];
  const DEDUCTIONS: { label: string; field: keyof PayslipCreateRequest }[] = [
    { label: 'PF',               field: 'pf'              },
    { label: 'ESI',              field: 'esi'             },
    { label: 'Professional Tax', field: 'professionalTax' },
    { label: 'TDS',              field: 'tds'             },
    { label: 'LOP',              field: 'lop'             },
    { label: 'LOP Days',         field: 'lopDays'         },
    { label: 'Variable Pay',     field: 'variablePay'     },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-50 rounded-xl flex items-center justify-center">
              <FaFileInvoiceDollar className="text-indigo-500 text-sm" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">
                {mode === 'create' ? 'Create Payslip' : 'Edit Payslip'}
              </h3>
              <p className="text-xs text-slate-400">Fill all salary components</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <FaTimes className="text-slate-400" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Employee / Month / Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</label>
              <select value={form.employeeId} onChange={e => updateStr('employeeId', e.target.value)}
                disabled={mode === 'edit'}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60">
                <option value="">Select employee</option>
                {employees.map(e => (
                  <option key={e.empId} value={e.empId}>#{e.empId} {e.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Month</label>
              <select value={form.month} onChange={e => updateNum('month', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year</label>
              <select value={form.year} onChange={e => updateNum('year', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>

          {/* Earnings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Earnings</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {EARNINGS.map(({ label, field }) => (
                <div key={field} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                  <input type="number" min={0}
                    value={form[field] as number}
                    onChange={e => updateNum(field, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Deductions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Deductions</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DEDUCTIONS.map(({ label, field }) => (
                <div key={field} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                  <input type="number" min={0}
                    value={form[field] as number}
                    onChange={e => updateNum(field, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Summary bar */}
          <div className="bg-slate-800 rounded-xl p-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Gross</p>
              <p className="text-base font-black text-emerald-400">{fmt(gross)}</p>
            </div>
            <div className="text-center border-x border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Deductions</p>
              <p className="text-base font-black text-rose-400">{fmt(deductions)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Net Pay</p>
              <p className="text-base font-black text-white">{fmt(net)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-100 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => {
              if (!form.employeeId) { notify.error('Missing', 'Select an employee'); return; }
              onSave(form);
            }}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
            <FaCheck className="text-xs" />
            {mode === 'create' ? 'Create Payslip' : 'Update Payslip'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────
interface PayslipPageProps {
  selectedEmployeeId?: string | null;
  onClearSelectedEmployee?: () => void;
}

// ─── Main PayslipPage ─────────────────────────────────────────────
export const PayslipPage: React.FC<PayslipPageProps> = ({
  selectedEmployeeId,
  onClearSelectedEmployee,
}) => {
  const {
    payrollData, loading,
    createPayslip, updatePayslip, deletePayslip,
    generatePayroll, preparePayroll,
    fetchPayrollData, exportCSV,
  } = usePayslip();

  const [employees, setEmployees]       = useState<Employee[]>([]);
  const [employeeMap, setEmployeeMap]   = useState<Record<string, Employee>>({});
  const [month, setMonth]               = useState(new Date().getMonth() + 1);
  const [year, setYear]                 = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery]   = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editTarget, setEditTarget]     = useState<Payslip | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payslip | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Dashboard state
  const [dashboard, setDashboard]       = useState<DashboardData | null>(null);
  const [dashLoading, setDashLoading]   = useState(false);

  // Per-row generate loading
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Merge payrollData rows with dashboard status
  const statusMap = React.useMemo(() => {
    const map: Record<string, EmployeeStatus> = {};
    dashboard?.employeeStatuses.forEach(s => { map[s.employeeId] = s; });
    return map;
  }, [dashboard]);

  // Fetch employees
  useEffect(() => {
    const load = async () => {
      try {
        const res = await employeeService.getAllEmployeesHR(0, 500);
        setEmployees(res.content);
        const map: Record<string, Employee> = {};
        res.content.forEach((e: Employee) => { map[e.empId] = e; });
        setEmployeeMap(map);
      } catch {
        console.warn('Employee list unavailable');
      }
    };
    load();
  }, []);

  // Auto-select from navigation
  useEffect(() => {
    if (selectedEmployeeId && employees.length > 0) {
      const emp = employees.find(e => e.empId === selectedEmployeeId);
      if (emp) { setSelectedEmployee(emp); onClearSelectedEmployee?.(); }
    }
  }, [selectedEmployeeId, employees, onClearSelectedEmployee]);

  // Fetch dashboard + payroll together
  const loadDashboard = useCallback(async (y: number, m: number) => {
    setDashLoading(true);
    try {
      const res = await api.get<DashboardData>(`/v1/payslip/dashboard/${y}/${m}`);
      setDashboard(res.data);
    } catch {
      setDashboard(null);
    } finally {
      setDashLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayrollData(year, month);
    loadDashboard(year, month);
  }, [year, month, fetchPayrollData, loadDashboard]);

  const getEmpName = (empId: string): string =>
    employeeMap[empId]?.name ?? `Emp #${empId}`;

  const filtered = payrollData.filter(p =>
    getEmpName(p.employeeId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Action handlers ───────────────────────────────────────────
  const handleGeneratePayroll = async () => {
    const result = await generatePayroll(year, month);
    if (result?.success) {
      notify.success(`Payroll generated for ${MONTHS[month - 1]} ${year}`);
      loadDashboard(year, month);
    } else {
      notify.error('Failed', 'Could not generate payroll');
    }
  };

  const handlePreparePayroll = async () => {
    const nm = month === 12 ? 1 : month + 1;
    const ny = month === 12 ? year + 1 : year;
    const result = await preparePayroll(ny, nm);
    if (result?.success) {
      notify.success(`Payroll prepared for ${MONTHS[nm - 1]} ${ny}`);
      setMonth(nm); setYear(ny);
    } else {
      notify.error('Failed', 'Could not prepare payroll');
    }
  };

  // Generate single employee payslip (DRAFT → GENERATED)
  const handleGenerateOne = async (empId: string) => {
    setGeneratingId(empId);
    try {
      await api.put(`/v1/payslip/generate/${empId}/${year}/${month}`);
      notify.success('Payslip generated');
      fetchPayrollData(year, month);
      loadDashboard(year, month);
    } catch (err: any) {
      notify.error('Failed', err?.response?.data?.message || 'Could not generate payslip');
    } finally {
      setGeneratingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deletePayslip(deleteTarget.employeeId, deleteTarget.year, deleteTarget.month);
    if (ok) {
      notify.success('Payslip deleted');
      loadDashboard(year, month);
    } else {
      notify.error('Failed', 'Could not delete payslip');
    }
    setDeleteTarget(null);
  };

  const handleSaveForm = async (data: PayslipCreateRequest) => {
    if (editTarget) {
      const result = await updatePayslip(data);
      if (result) {
        notify.success('Payslip updated');
        fetchPayrollData(year, month);
        loadDashboard(year, month);
        setShowFormModal(false); setEditTarget(null);
      }
    } else {
      const result = await createPayslip(data);
      if (result) {
        notify.success('Payslip created');
        fetchPayrollData(year, month);
        loadDashboard(year, month);
        setShowFormModal(false);
      }
    }
  };

  const handleExportCSV = async () => {
    const ok = await exportCSV(year, month);
    if (!ok) notify.error('Failed', 'Could not export CSV');
  };

  const isLoading = loading || dashLoading;

  return (
    <div className="flex flex-col gap-5 w-full">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Payroll</h1>
          <p className="text-xs text-slate-400 mt-0.5">CFO — Full financial management</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handlePreparePayroll} disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-600 transition-colors disabled:opacity-50">
            <FaSyncAlt className={`text-xs ${isLoading ? 'animate-spin' : ''}`} /> Prepare Payroll
          </button>
          <button onClick={handleGeneratePayroll} disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50">
            <FaFileInvoiceDollar className="text-xs" /> Generate All
          </button>
          <button onClick={handleExportCSV} disabled={!payrollData.length || isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors disabled:opacity-40">
            <FaDownload className="text-xs" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── SELECTED EMPLOYEE BANNER ── */}
      {selectedEmployee && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
              {selectedEmployee.name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-800">{selectedEmployee.name}</p>
              <p className="text-xs text-indigo-500">#{selectedEmployee.empId} · Pre-selected from Employees</p>
            </div>
          </div>
          <button onClick={() => setSelectedEmployee(null)} className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors">
            <FaTimes className="text-indigo-400 text-xs" />
          </button>
        </div>
      )}

      {/* ── MONTH / YEAR SELECTOR ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value, 10))}
            className="appearance-none pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
        </div>
        <div className="relative">
          <select value={year} onChange={e => setYear(parseInt(e.target.value, 10))}
            className="appearance-none pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm">
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
          <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
        </div>
        {dashboard && (
          <p className="text-xs text-slate-400">
            {dashboard.totalEmployees} employees
          </p>
        )}
      </div>

      {/* ── SUMMARY CARDS — from dashboard API ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Financial cards */}
        {[
          { label: 'Total Gross',      value: dashboard?.totalGrossSalary,  color: 'emerald', icon: null },
          { label: 'Total Deductions', value: dashboard?.totalDeductions,    color: 'rose',    icon: null },
          { label: 'Total Net Payout', value: dashboard?.totalNetSalary,     color: 'indigo',  icon: null },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            {dashLoading ? (
              <div className="h-7 bg-slate-100 rounded-lg animate-pulse mt-1" />
            ) : (
              <p className={`text-xl font-black text-${color}-600`}>{fmt(value)}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">{MONTHS[month - 1]} {year}</p>
          </div>
        ))}

        {/* Status summary card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status Summary</p>
          {dashLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />)}
            </div>
          ) : dashboard ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HiOutlineCheckCircle className="text-emerald-500 text-sm" />
                  <span className="text-xs text-slate-600 font-semibold">Generated</span>
                </div>
                <span className="text-xs font-black text-emerald-600">{dashboard.generatedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HiOutlineClock className="text-amber-500 text-sm" />
                  <span className="text-xs text-slate-600 font-semibold">Draft</span>
                </div>
                <span className="text-xs font-black text-amber-600">{dashboard.draftCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HiOutlineExclamationCircle className="text-slate-400 text-sm" />
                  <span className="text-xs text-slate-600 font-semibold">Not Created</span>
                </div>
                <span className="text-xs font-black text-slate-500">{dashboard.notCreatedCount}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                {dashboard.totalEmployees > 0 && (
                  <div className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(dashboard.generatedCount / dashboard.totalEmployees) * 100}%` }} />
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <HiOutlineUsers className="text-sm" />
              <span className="text-xs">No data</span>
            </div>
          )}
        </div>
      </div>

      {/* ── PAYROLL TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold text-slate-700">
              Payroll — {MONTHS[month - 1]} {year}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {payrollData.length} payslip{payrollData.length !== 1 ? 's' : ''} · sorted by pending first
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input type="text" placeholder="Search employee..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-44 sm:w-56" />
            </div>
            <button onClick={() => { setEditTarget(null); setShowFormModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-colors">
              + New
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-14"><CustomLoader label="Loading payroll..." /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <FaFileInvoiceDollar className="text-slate-200 text-4xl mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-semibold">No payroll data</p>
            <p className="text-xs text-slate-300 mt-1">Click Generate All or create individual payslips</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Employee','Status','Basic','HRA','Bonus','Gross','PF','TDS','Prof.Tax','LOP','Net','Actions'].map(h => (
                    <th key={h}
                      className={`py-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ${
                        h === 'Employee' || h === 'Status' ? 'text-left' : 'text-right'
                      } ${h === 'Actions' ? 'text-center' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(row => {
                  const empStatus = statusMap[row.employeeId];
                  const payslipStatus = empStatus?.payslipStatus ?? (row.status as any) ?? 'DRAFT';
                  const isDraft     = payslipStatus === 'DRAFT';
                  const isGenerated = payslipStatus === 'GENERATED';
                  const isGeneratingThis = generatingId === row.employeeId;

                  return (
                    <tr key={row.employeeId}
                      className={`transition-colors ${isGenerated ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-slate-50'}`}>
                      {/* Employee */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 bg-indigo-100 rounded-lg flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0">
                            {getEmpName(row.employeeId).charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700">{getEmpName(row.employeeId)}</p>
                            <p className="text-[10px] text-slate-400">#{row.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="py-3 px-3">
                        <StatusBadge status={payslipStatus} />
                      </td>
                      {/* Amounts */}
                      <td className="py-3 px-3 text-right text-slate-600">{fmt(row.basicSalary)}</td>
                      <td className="py-3 px-3 text-right text-slate-600">{fmt(row.hra)}</td>
                      <td className="py-3 px-3 text-right text-emerald-600 font-semibold">{fmt(row.bonus)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-700">{fmt(row.grossSalary)}</td>
                      <td className="py-3 px-3 text-right text-rose-500">{fmt(row.pf)}</td>
                      <td className="py-3 px-3 text-right text-rose-500">{fmt(row.tds)}</td>
                      <td className="py-3 px-3 text-right text-rose-500">{fmt(row.professionalTax)}</td>
                      <td className="py-3 px-3 text-right text-rose-500">{fmt(row.lop)}</td>
                      <td className="py-3 px-3 text-right font-black text-slate-800">{fmt(row.netSalary)}</td>
                      {/* Actions */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit — only for DRAFT */}
                          {isDraft && (
                            <button
                              onClick={() => { setEditTarget(row); setShowFormModal(true); }}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-500 rounded-lg transition-colors"
                              title="Edit payslip">
                              <FaEdit className="text-xs" />
                            </button>
                          )}
                          {/* Generate — only for DRAFT */}
                          {isDraft && (
                            <button
                              onClick={() => handleGenerateOne(row.employeeId)}
                              disabled={isGeneratingThis}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors disabled:opacity-50"
                              title="Finalise → Generated">
                              {isGeneratingThis
                                ? <div className="h-3 w-3 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                                : <FaBolt className="text-xs" />}
                            </button>
                          )}
                          {/* Delete — available for DRAFT (not GENERATED per backend rules) */}
                          {!isGenerated && (
                            <button
                              onClick={() => setDeleteTarget(row)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                              title="Delete payslip">
                              <FaTrash className="text-xs" />
                            </button>
                          )}
                          {/* Generated indicator */}
                          {isGenerated && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">
                              <FaCheck className="text-[8px]" /> Done
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {deleteTarget && (
        <ConfirmModal
          message={`Delete payslip for Emp #${deleteTarget.employeeId} — ${MONTHS[deleteTarget.month - 1]} ${deleteTarget.year}?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showFormModal && (
        <PayslipFormModal
          mode={editTarget ? 'edit' : 'create'}
          initial={editTarget ?? undefined}
          employees={employees}
          year={year}
          month={month}
          onClose={() => { setShowFormModal(false); setEditTarget(null); }}
          onSave={handleSaveForm}
        />
      )}
    </div>
  );
};