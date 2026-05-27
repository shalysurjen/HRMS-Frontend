import { employeeService, type Employee } from '@/features/employee/services/employeeService';
import { notify } from '@/features/notification/utils/notifications';
import type { Payslip, PayslipCreateRequest } from '@/features/payroll/payrollTypes';
import { PayslipService } from '@/features/payroll/services/payslipService';
import api from '@/services/apiClient';
import { CustomLoader } from '@/shared/components';
import React, { useEffect, useState } from 'react';
import {
    FaCalendarAlt, FaChartBar,
    FaCheck,
    FaChevronLeft,
    FaChevronRight,
    FaFileInvoiceDollar,
    FaSearch,
    FaSyncAlt,
    FaTimes,
    FaToggleOff,
    FaToggleOn,
    FaTrash,
    FaUserCheck,
    FaUserTimes,
} from 'react-icons/fa';

// ─── Types ────────────────────────────────────────────────────────

// New leave balance structure from GET /v1/leave/balance/{employeeId}
interface SingleLeaveBalance {
    employeeId: string;
    year: number;
    month: number;
    availableDays: number;
    usedDays: number;
    remainingDays: number;
}

interface LeaveBalanceResponse {
    annualLeaveBalance: SingleLeaveBalance;
    sickLeaveBalance: SingleLeaveBalance;
}

interface YearlySummaryResponse {
    year: number;
    totalBasic: number;
    totalHra: number;
    totalConveyance: number;
    totalMedical: number;
    totalOtherAllowance: number;
    totalBonus: number;
    totalIncentive: number;
    totalStipend: number;
    totalPf: number;
    totalEsi: number;
    totalProfessionalTax: number;
    totalTds: number;
    totalLop: number;
    totalGrossSalary: number;
    totalNetSalary: number;
}

interface MonthlyPayslip {
    month: number;
    year: number;
    basicSalary: number;
    hra: number;
    conveyance: number;
    medical: number;
    otherAllowance: number;
    bonus: number;
    incentive: number;
    stipend: number;
    variablePay: number;
    grossSalary: number;
    pf: number;
    esi: number;
    professionalTax: number;
    tds: number;
    lopDays: number;
    lop: number;
    netSalary: number;
    generatedDate: string;
    status: string;
}

// ─── Constants ────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_STYLES: Record<string, string> = {
    PAID:      'bg-emerald-100 text-emerald-700',
    GENERATED: 'bg-indigo-100 text-indigo-700',
    PENDING:   'bg-amber-100 text-amber-700',
    CANCELLED: 'bg-rose-100 text-rose-700',
};

const fmt = (v: number) => `₹${(v || 0).toLocaleString('en-IN')}`;

// ─── Leave Balance Card ───────────────────────────────────────────
const LeaveBalanceCard: React.FC<{
    label: string;
    color: string;
    balance: SingleLeaveBalance;
}> = ({ label, color, balance }) => {
    const usedPct = balance.availableDays > 0
        ? (balance.usedDays / balance.availableDays) * 100
        : 0;

    const colorMap: Record<string, { bg: string; text: string; bar: string; badge: string }> = {
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', bar: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700' },
        rose:   { bg: 'bg-rose-50',   text: 'text-rose-600',   bar: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-700'   },
    };
    const c = colorMap[color] ?? colorMap.indigo;

    return (
        <div className={`${c.bg} rounded-xl p-4 space-y-3`}>
            <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${c.badge}`}>
                    {label}
                </span>
                <span className={`text-xs font-bold ${c.text}`}>
                    {balance.remainingDays} days left
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-lg font-black text-slate-700">{balance.availableDays}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Allocated</p>
                </div>
                <div>
                    <p className="text-lg font-black text-slate-700">{balance.usedDays}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Used</p>
                </div>
                <div>
                    <p className={`text-lg font-black ${c.text}`}>{balance.remainingDays}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Remaining</p>
                </div>
            </div>
            <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                <div
                    className={`h-full ${c.bar} rounded-full transition-all`}
                    style={{ width: `${Math.min(usedPct, 100)}%` }}
                />
            </div>
            <p className="text-[10px] text-slate-400 text-right">
                As of {MONTH_NAMES[balance.month - 1]} {balance.year}
            </p>
        </div>
    );
};

// ─── Leave Modal ──────────────────────────────────────────────────
const LeaveModal: React.FC<{ employee: Employee; onClose: () => void }> = ({ employee, onClose }) => {
    const [balance, setBalance] = useState<LeaveBalanceResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!employee?.empId) return;
        const fetchBalance = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/v1/leave/balance/${employee.empId}`);
                setBalance(res.data as LeaveBalanceResponse);
            } catch {
                notify.error('Failed', 'Could not load leave balance');
            } finally {
                setLoading(false);
            }
        };
        fetchBalance();                 
    }, [employee?.empId]);

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <FaCalendarAlt className="text-emerald-500 text-sm" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{employee.name}</h3>
                            <p className="text-xs text-slate-400">Leave Balance</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <FaTimes className="text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <CustomLoader label="Loading leave balance..." />
                        </div>
                    ) : balance ? (
                        <>
                            {/* Summary row */}
                            <div className="grid grid-cols-3 gap-3">
                                {([
                                    {
                                        label: 'Total Available',
                                        value: (balance.annualLeaveBalance.availableDays + balance.sickLeaveBalance.availableDays),
                                        color: 'slate'
                                    },
                                    {
                                        label: 'Total Used',
                                        value: (balance.annualLeaveBalance.usedDays + balance.sickLeaveBalance.usedDays),
                                        color: 'rose'
                                    },
                                    {
                                        label: 'Total Remaining',
                                        value: (balance.annualLeaveBalance.remainingDays + balance.sickLeaveBalance.remainingDays),
                                        color: 'emerald'
                                    },
                                ] as const).map(({ label, value, color }) => (
                                    <div key={label} className={`bg-${color}-50 rounded-xl p-3 text-center`}>
                                        <p className={`text-xl font-black text-${color}-600`}>{value}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Annual Leave */}
                            <LeaveBalanceCard
                                label="Annual Leave"
                                color="indigo"
                                balance={balance.annualLeaveBalance}
                            />

                            {/* Sick Leave */}
                            <LeaveBalanceCard
                                label="Sick Leave"
                                color="rose"
                                balance={balance.sickLeaveBalance}
                            />
                        </>
                    ) : (
                        <div className="text-center py-10">
                            <FaCalendarAlt className="text-slate-200 text-4xl mx-auto mb-3" />
                            <p className="text-sm text-slate-400">No leave data found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Annual Payslip Modal ─────────────────────────────────────────
const AnnualPayslipModal: React.FC<{ employee: Employee; onClose: () => void }> = ({ employee, onClose }) => {
    const [year, setYear]         = useState(new Date().getFullYear());
    const [summary, setSummary]   = useState<YearlySummaryResponse | null>(null);
    const [monthly, setMonthly]   = useState<MonthlyPayslip[]>([]);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingMonthly, setLoadingMonthly] = useState(false);
    const [activeTab, setActiveTab] = useState<'monthly' | 'summary'>('monthly');

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoadingSummary(true);
                const res = await api.get(`/v1/payslip/employee/${employee.empId}/${year}`);
                setSummary(res.data as YearlySummaryResponse);
            } catch { setSummary(null); }
            finally { setLoadingSummary(false); }
        };
        fetchSummary();
    }, [employee.empId, year]);

    useEffect(() => {
        const fetchMonthly = async () => {
            try {
                setLoadingMonthly(true);
                const res = await api.get(`/v1/payslip/employee/${employee.empId}/${year}/monthly`);
                setMonthly([...(res.data as MonthlyPayslip[])].sort((a, b) => a.month - b.month));
            } catch { setMonthly([]); }
            finally { setLoadingMonthly(false); }
        };
        fetchMonthly();
    }, [employee.empId, year]);

    const EARNINGS = [
        { label: 'Basic',           key: 'totalBasic'           },
        { label: 'HRA',             key: 'totalHra'             },
        { label: 'Conveyance',      key: 'totalConveyance'      },
        { label: 'Medical',         key: 'totalMedical'         },
        { label: 'Other Allowance', key: 'totalOtherAllowance'  },
        { label: 'Bonus',           key: 'totalBonus'           },
        { label: 'Incentive',       key: 'totalIncentive'       },
        { label: 'Stipend',         key: 'totalStipend'         },
    ] as const;

    const DEDUCTIONS = [
        { label: 'PF',               key: 'totalPf'              },
        { label: 'ESI',              key: 'totalEsi'             },
        { label: 'Professional Tax', key: 'totalProfessionalTax' },
        { label: 'TDS',              key: 'totalTds'             },
        { label: 'LOP',              key: 'totalLop'             },
    ] as const;

    const totalDeductions = summary
        ? summary.totalPf + summary.totalEsi + summary.totalProfessionalTax + summary.totalTds + summary.totalLop
        : 0;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

                <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-violet-50 rounded-xl flex items-center justify-center">
                            <FaChartBar className="text-violet-500 text-sm" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{employee.name}</h3>
                            <p className="text-xs text-slate-400">Annual Payslip Summary</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={year} onChange={e => setYear(parseInt(e.target.value, 10))}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none">
                            <option value={2026}>2026</option>
                            <option value={2025}>2025</option>
                        </select>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
                            <FaTimes className="text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-1 px-6 pt-4 shrink-0">
                    {(['monthly', 'summary'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                activeTab === tab ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}>
                            {tab === 'monthly' ? 'Monthly Breakdown' : 'Annual Summary'}
                        </button>
                    ))}
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                    {activeTab === 'monthly' && (
                        loadingMonthly ? <div className="flex justify-center py-8"><CustomLoader label="Fetching monthly data..." /></div>
                        : monthly.length === 0 ? (
                            <div className="text-center py-8">
                                <FaChartBar className="text-slate-200 text-4xl mx-auto mb-3" />
                                <p className="text-sm text-slate-400">No payslips for {year}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            {['Month','Gross','PF','TDS','ESI','LOP','Net','Status'].map(h => (
                                                <th key={h} className={`py-2.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ${h === 'Month' ? 'text-left' : 'text-right'}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {monthly.map(p => (
                                            <tr key={p.month} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                                                <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">{fmt(p.grossSalary)}</td>
                                                <td className="py-2.5 px-3 text-right text-slate-500">{fmt(p.pf)}</td>
                                                <td className="py-2.5 px-3 text-right text-slate-500">{fmt(p.tds)}</td>
                                                <td className="py-2.5 px-3 text-right text-slate-500">{fmt(p.esi)}</td>
                                                <td className="py-2.5 px-3 text-right text-rose-400">{p.lopDays > 0 ? `${p.lopDays}d` : '—'}</td>
                                                <td className="py-2.5 px-3 text-right font-black text-indigo-600">{fmt(p.netSalary)}</td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${STATUS_STYLES[p.status] ?? 'bg-slate-100 text-slate-500'}`}>{p.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                                            <td className="py-2.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</td>
                                            <td className="py-2.5 px-3 text-right font-black text-emerald-600">{fmt(monthly.reduce((s,p)=>s+p.grossSalary,0))}</td>
                                            <td className="py-2.5 px-3 text-right font-black text-slate-500">{fmt(monthly.reduce((s,p)=>s+p.pf,0))}</td>
                                            <td className="py-2.5 px-3 text-right font-black text-slate-500">{fmt(monthly.reduce((s,p)=>s+p.tds,0))}</td>
                                            <td className="py-2.5 px-3 text-right font-black text-slate-500">{fmt(monthly.reduce((s,p)=>s+p.esi,0))}</td>
                                            <td className="py-2.5 px-3 text-right font-black text-rose-400">
                                                {monthly.reduce((s,p)=>s+(p.lopDays||0),0) > 0 ? `${monthly.reduce((s,p)=>s+(p.lopDays||0),0)}d` : '—'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-black text-indigo-600">{fmt(monthly.reduce((s,p)=>s+p.netSalary,0))}</td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )
                    )}

                    {activeTab === 'summary' && (
                        loadingSummary ? <div className="flex justify-center py-8"><CustomLoader label="Fetching annual data..." /></div>
                        : !summary ? (
                            <div className="text-center py-8">
                                <FaChartBar className="text-slate-200 text-4xl mx-auto mb-3" />
                                <p className="text-sm text-slate-400">No payslips for {year}</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-emerald-50 rounded-xl p-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Gross</p>
                                        <p className="text-xl font-black text-emerald-600">{fmt(summary.totalGrossSalary)}</p>
                                    </div>
                                    <div className="bg-indigo-50 rounded-xl p-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Net</p>
                                        <p className="text-xl font-black text-indigo-600">{fmt(summary.totalNetSalary)}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Earnings</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {EARNINGS.map(({ label, key }) => (
                                            <div key={key} className="bg-emerald-50/50 rounded-xl p-3 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-500">{label}</span>
                                                <span className="text-xs font-black text-emerald-600">{fmt(summary[key])}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-3">Deductions</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {DEDUCTIONS.map(({ label, key }) => (
                                            <div key={key} className="bg-rose-50/50 rounded-xl p-3 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-500">{label}</span>
                                                <span className="text-xs font-black text-rose-500">{fmt(summary[key])}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-slate-800 rounded-xl p-4 grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Gross</p>
                                        <p className="text-sm font-black text-emerald-400">{fmt(summary.totalGrossSalary)}</p>
                                    </div>
                                    <div className="text-center border-x border-slate-700">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Deductions</p>
                                        <p className="text-sm font-black text-rose-400">{fmt(totalDeductions)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Net</p>
                                        <p className="text-sm font-black text-white">{fmt(summary.totalNetSalary)}</p>
                                    </div>
                                </div>
                            </>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Helper ───────────────────────────────────────────────────────
const fillFormFromData = (
    data: Partial<PayslipCreateRequest>,
    employeeId: string,
    month: number,
    year: number
): PayslipCreateRequest => ({
    employeeId, month, year,
    status:          data.status          ?? 'PAID',
    basicSalary:     data.basicSalary     ?? 0,
    hra:             data.hra             ?? 0,
    conveyance:      data.conveyance      ?? 0,
    medical:         data.medical         ?? 0,
    otherAllowance:  data.otherAllowance  ?? 0,
    bonus:           data.bonus           ?? 0,
    incentive:       data.incentive       ?? 0,
    stipend:         data.stipend         ?? 0,
    pf:              data.pf              ?? 0,
    esi:             data.esi             ?? 0,
    professionalTax: data.professionalTax ?? 0,
    tds:             data.tds             ?? 0,
    lop:             data.lop             ?? 0,
    lopDays:         data.lopDays         ?? 0,
    variablePay:     data.variablePay     ?? 0,
});

// ─── Create/Edit Payslip Modal ────────────────────────────────────
const CreatePayslipModal: React.FC<{ employee: Employee; onClose: () => void }> = ({ employee, onClose }) => {
    const [loading, setLoading]               = useState(false);
    const [fetchLoading, setFetchLoading]     = useState(false);
    const [existingPayslip, setExistingPayslip] = useState<Payslip | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [prefillBadge, setPrefillBadge]     = useState(false);

    const [form, setForm] = useState<PayslipCreateRequest>({
        employeeId: employee.empId,
        month: new Date().getMonth() + 1,
        year:  new Date().getFullYear(),
        status: 'PAID',
        basicSalary: 0, hra: 0, conveyance: 0, medical: 0, otherAllowance: 0,
        bonus: 0, incentive: 0, stipend: 0,
        pf: 0, esi: 0, professionalTax: 0, tds: 0,
        lop: 0, lopDays: 0, variablePay: 0,
    });

    const { month: formMonth, year: formYear } = form;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setFetchLoading(true);
                setPrefillBadge(false);
                try {
                    const res = await api.get(`/v1/payslip/employee/${employee.empId}/${formYear}/${formMonth}`);
                    setExistingPayslip(res.data as Payslip);
                    setForm(fillFormFromData(res.data as Payslip, employee.empId, formMonth, formYear));
                    return;
                } catch { setExistingPayslip(null); }
                try {
                    const res = await api.get(`/v1/payslip/prefill?employeeId=${employee.empId}&year=${formYear}&month=${formMonth}`);
                    setForm(fillFormFromData(res.data as Partial<PayslipCreateRequest>, employee.empId, formMonth, formYear));
                    setPrefillBadge(true);
                } catch {
                    setForm(prev => ({ ...prev, basicSalary:0,hra:0,conveyance:0,medical:0,otherAllowance:0,bonus:0,incentive:0,stipend:0,pf:0,esi:0,professionalTax:0,tds:0,lop:0,lopDays:0,variablePay:0 }));
                }
            } finally { setFetchLoading(false); }
        };
        fetchData();
    }, [formMonth, formYear, employee.empId]);

    const updateNum = (field: keyof PayslipCreateRequest, val: number) =>
        setForm(prev => ({ ...prev, [field]: val }));

    const gross = form.basicSalary+form.hra+form.conveyance+form.medical+form.otherAllowance+form.bonus+form.incentive+form.stipend;
    const deductions = form.pf+ form.esi+ form.professionalTax+ form.tds + form.lop + form.variablePay;
    const net = gross - deductions;

    const EARNINGS_FIELDS: { label: string; field: keyof PayslipCreateRequest }[] = [
        { label: 'Basic Salary',    field: 'basicSalary'    },
        { label: 'HRA',             field: 'hra'            },
        { label: 'Conveyance',      field: 'conveyance'     },
        { label: 'Medical',         field: 'medical'        },
        { label: 'Other Allowance', field: 'otherAllowance' },
        { label: 'Bonus',           field: 'bonus'          },
        { label: 'Incentive',       field: 'incentive'      },
        { label: 'Stipend',         field: 'stipend'        },
    ];
    const DEDUCTION_FIELDS: { label: string; field: keyof PayslipCreateRequest }[] = [
        { label: 'PF',               field: 'pf'              },
        { label: 'ESI',              field: 'esi'             },
        { label: 'Professional Tax', field: 'professionalTax' },
        { label: 'TDS',              field: 'tds'             },
        { label: 'LOP',              field: 'lop'             },
        { label: 'LOP Days',         field: 'lopDays'         },
        { label: 'Variable Pay',     field: 'variablePay'     },
    ];

    const handleSave = async () => {
        try {
            setLoading(true);
            if (existingPayslip) {
                await PayslipService.updatePayslip(form);
                notify.success('Payslip updated successfully');
            } else {
                await PayslipService.createPayslip(form);
                notify.success('Payslip created successfully');
            }
            onClose();
        } catch {
            notify.error('Failed', existingPayslip ? 'Could not update payslip' : 'Could not create payslip');
        } finally { setLoading(false); }
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            await PayslipService.deletePayslip(employee.empId, form.year, form.month);
            notify.success('Payslip deleted');
            onClose();
        } catch {
            notify.error('Failed', 'Could not delete payslip');
        } finally { setLoading(false); setShowDeleteConfirm(false); }
    };

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <FaFileInvoiceDollar className="text-indigo-500 text-sm" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-800">{existingPayslip ? 'Edit Payslip' : 'Create Payslip'}</h3>
                                    {existingPayslip && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black">EXISTS</span>}
                                    {!existingPayslip && prefillBadge && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black">PREFILLED</span>}
                                </div>
                                <p className="text-xs text-indigo-500 font-semibold">#{employee.empId} · {employee.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {existingPayslip && (
                                <button onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors">
                                    <FaTrash className="text-xs" /> Delete
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
                                <FaTimes className="text-slate-400" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Month</label>
                                <select value={form.month} onChange={e => updateNum('month', parseInt(e.target.value, 10))}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                                    {MONTH_NAMES.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year</label>
                                <select value={form.year} onChange={e => updateNum('year', parseInt(e.target.value, 10))}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                                    <option value={2026}>2026</option>
                                    <option value={2025}>2025</option>
                                </select>
                            </div>
                        </div>

                        {fetchLoading ? (
                            <div className="flex justify-center py-4"><CustomLoader label="Fetching payslip data..." /></div>
                        ) : (
                            <>
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Earnings</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {EARNINGS_FIELDS.map(({ label, field }) => (
                                            <div key={field} className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                                                <input type="number" value={form[field] as number}
                                                    onChange={e => updateNum(field, parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-3">Deductions</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {DEDUCTION_FIELDS.map(({ label, field }) => (
                                            <div key={field} className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                                                <input type="number" value={form[field] as number}
                                                    onChange={e => updateNum(field, parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-slate-800 rounded-xl p-4 grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Gross</p>
                                        <p className="text-sm font-black text-emerald-400">{fmt(gross)}</p>
                                    </div>
                                    <div className="text-center border-x border-slate-700">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Deductions</p>
                                        <p className="text-sm font-black text-rose-400">{fmt(deductions)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Net</p>
                                        <p className="text-sm font-black text-white">{fmt(net)}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex gap-3 p-6 pt-0 sticky bottom-0 bg-white border-t border-slate-100">
                        <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={loading || fetchLoading}
                            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                            {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaCheck className="text-xs" />}
                            {existingPayslip ? 'Update Payslip' : 'Create Payslip'}
                        </button>
                    </div>
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                                <FaTrash className="text-rose-500 text-sm" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm">Confirm Delete</p>
                                <p className="text-xs text-slate-400 mt-0.5">Delete payslip for {employee.name} — {MONTH_NAMES[form.month-1]} {form.year}?</p>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">No, Cancel</button>
                            <button onClick={handleDelete} disabled={loading} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ─── Main CFO Employees Page ──────────────────────────────────────
const PAGE_SIZE = 10;

export const CFOEmployeesPage: React.FC = () => {
    const [employees, setEmployees]       = useState<Employee[]>([]);
    const [loading, setLoading]           = useState(true);
    const [searchQuery, setSearchQuery]   = useState('');
    const [taxRegimes, setTaxRegimes]     = useState<Record<string, 'OLD' | 'NEW'>>({});
    const [month, setMonth]               = useState(new Date().getMonth() + 1);
    const [year, setYear]                 = useState(new Date().getFullYear());
    const [payrollLoading, setPayrollLoading] = useState(false);
    const [leaveModal, setLeaveModal]         = useState<Employee | null>(null);
    const [annualModal, setAnnualModal]       = useState<Employee | null>(null);
    const [createPayslipModal, setCreatePayslipModal] = useState<Employee | null>(null);
    const [currentPage, setCurrentPage]   = useState(0);
    const [totalPages, setTotalPages]     = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [employeeMap, setEmployeeMap]   = useState<Record<string, Employee>>({});

    const load = async (page = 0) => {
        try {
            setLoading(true);
            const res = await employeeService.getAllEmployeesHR(page, PAGE_SIZE);
            setEmployees(res.content);
            setTotalPages(res.totalPages);
            setTotalElements(res.totalElements);
            setCurrentPage(res.number);
            setEmployeeMap(prev => {
                const updated = { ...prev };
                res.content.forEach((e: Employee) => { updated[e.empId] = e; });
                return updated;
            });
            setTaxRegimes(prev => {
                const defaults: Record<string, 'OLD' | 'NEW'> = {};
                res.content.forEach((e: Employee) => { defaults[e.empId] = 'OLD'; });
                return { ...defaults, ...prev };
            });
        } catch {
            notify.error('Failed', 'Could not load employees');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(0); }, []);

    const getManagerName = (reportingId: string | null): string => {
        if (!reportingId) return '—';
        return employeeMap[reportingId]?.name ?? `#${reportingId}`;
    };

    const filtered = employees.filter(e => {
        const matchSearch =
            e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.empId?.toString().includes(searchQuery) ||
            e.roleName?.toLowerCase().includes(searchQuery.toLowerCase());
        const joinDate     = e.joiningDate ? new Date(e.joiningDate) : null;
        const selectedDate = new Date(year, month - 1, 1);
        const matchJoin    = joinDate ? joinDate <= selectedDate : true;
        return matchSearch && matchJoin;
    });

    const toggleTaxRegime = (empId: string) =>
        setTaxRegimes(prev => ({ ...prev, [empId]: prev[empId] === 'OLD' ? 'NEW' : 'OLD' }));

    const handleGeneratePayroll = async () => {
        try {
            setPayrollLoading(true);
            await api.post(`/v1/payroll/generate?year=${year}&month=${month}`);
            notify.success(`Payroll generated for ${MONTH_NAMES[month-1]} ${year}`);
        } catch { notify.error('Failed', 'Could not generate payroll'); }
        finally { setPayrollLoading(false); }
    };

    const handlePreparePayroll = async () => {
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear  = month === 12 ? year + 1 : year;
        try {
            setPayrollLoading(true);
            await api.post(`/v1/payroll/prepare?year=${nextYear}&month=${nextMonth}`);
            notify.success(`Payroll prepared for ${MONTH_NAMES[nextMonth-1]} ${nextYear}`);
            setMonth(nextMonth); setYear(nextYear);
        } catch { notify.error('Failed', 'Could not prepare payroll'); }
        finally { setPayrollLoading(false); }
    };

    return (
        <div className="flex flex-col gap-6 w-full">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Employees</h1>
                    <p className="text-xs text-slate-400 mt-0.5">CFO — Employee financial overview</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <select value={month} onChange={e => setMonth(parseInt(e.target.value,10))}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-sm">
                        {MONTH_NAMES.map((m,i) => <option key={m} value={i+1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(parseInt(e.target.value,10))}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-sm">
                        <option value={2026}>2026</option>
                        <option value={2025}>2025</option>
                    </select>
                    <button onClick={handlePreparePayroll} disabled={payrollLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-600 transition-colors disabled:opacity-50">
                        <FaSyncAlt className="text-xs" /> Prepare Payroll
                    </button>
                    <button onClick={handleGeneratePayroll} disabled={payrollLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50">
                        <FaFileInvoiceDollar className="text-xs" /> Generate Payroll
                    </button>
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                        <p className="text-xs text-slate-500">{totalElements} employees</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input type="text" placeholder="Search by name, ID or role..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><CustomLoader label="Loading employees..." /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16"><p className="text-sm text-slate-400">No employees found</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    {['Employee','Role','Manager','Joined','Status','Tax Regime','Actions'].map(h => (
                                        <th key={h} className={`py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${h === 'Employee' ? 'text-left' : 'text-center'}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(emp => (
                                    <tr key={emp.empId} className="hover:bg-slate-50 transition-colors">
                                        {/* Employee */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-indigo-100 rounded-xl flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0">
                                                    {emp.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-700">{emp.name}</p>
                                                    <p className="text-[10px] text-slate-400">#{emp.empId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* ✅ Role — now correctly shows emp.role */}
                                        <td className="py-3 px-4 text-center">
                                            {emp.roleName ? (
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase">
                                                    {emp.roleName}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        {/* Manager */}
                                        <td className="py-3 px-4 text-center text-slate-500">
                                            {emp.reportingId ? (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className="text-xs font-semibold text-slate-700">{getManagerName(emp.reportingId)}</span>
                                                    <span className="text-[10px] text-slate-400">#{emp.reportingId}</span>
                                                </div>
                                            ) : <span className="text-slate-400">—</span>}
                                        </td>
                                        {/* Joined */}
                                        <td className="py-3 px-4 text-center text-slate-500">
                                            {emp.joiningDate
                                                ? new Date(emp.joiningDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
                                                : '—'}
                                        </td>
                                        {/* Status */}
                                        <td className="py-3 px-4 text-center">
                                            {emp.active ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">
                                                    <FaUserCheck className="text-[8px]" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold">
                                                    <FaUserTimes className="text-[8px]" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        {/* Tax Regime */}
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={() => toggleTaxRegime(emp.empId)}
                                                className={`flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                                                    taxRegimes[emp.empId] === 'NEW'
                                                        ? 'bg-violet-100 text-violet-600'
                                                        : 'bg-amber-100 text-amber-600'
                                                }`}>
                                                {taxRegimes[emp.empId] === 'NEW'
                                                    ? <FaToggleOn className="text-sm" />
                                                    : <FaToggleOff className="text-sm" />}
                                                {taxRegimes[emp.empId] ?? 'OLD'} Regime
                                            </button>
                                        </td>
                                        {/* Actions */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => setLeaveModal(emp)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-bold transition-colors">
                                                    <FaCalendarAlt className="text-[10px]" /> Leave
                                                </button>
                                                <button onClick={() => setCreatePayslipModal(emp)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold transition-colors">
                                                    <FaFileInvoiceDollar className="text-[10px]" /> Payslip
                                                </button>
                                                <button onClick={() => setAnnualModal(emp)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl text-[10px] font-bold transition-colors">
                                                    <FaChartBar className="text-[10px]" /> Annual
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 flex-wrap gap-2">
                                <p className="text-xs text-slate-400">
                                    Showing <span className="font-bold text-slate-600">{currentPage * PAGE_SIZE + 1}</span>
                                    {' '}-{''} <span className="font-bold text-slate-600">{Math.min((currentPage+1)*PAGE_SIZE, totalElements)}</span>
                                    {''} of <span className="font-bold text-slate-600">{totalElements}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <button disabled={currentPage===0||loading} onClick={() => load(currentPage-1)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                        <FaChevronLeft className="text-[10px]" /> Prev
                                    </button>
                                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
                                        <button key={i} onClick={() => load(i)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                                                i===currentPage ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}>
                                            {i+1}
                                        </button>
                                    ))}
                                    <button disabled={currentPage>=totalPages-1||loading} onClick={() => load(currentPage+1)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                        Next <FaChevronRight className="text-[10px]" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {leaveModal         && <LeaveModal          employee={leaveModal}         onClose={() => setLeaveModal(null)}         />}
            {annualModal        && <AnnualPayslipModal   employee={annualModal}        onClose={() => setAnnualModal(null)}        />}
            {createPayslipModal && <CreatePayslipModal   employee={createPayslipModal} onClose={() => setCreatePayslipModal(null)} />}
        </div>
    );
};