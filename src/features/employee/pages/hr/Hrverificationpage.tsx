import { notify } from '@/features/notification/utils/notifications';
import api from '@/services/apiClient';
import { CustomLoader } from '@/shared/components';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSearch, FaCheck, FaTimes, FaEye, FaUser,
  FaFilter, FaCheckCircle, FaTimesCircle, FaClock,
  FaDownload, FaFileAlt
} from 'react-icons/fa';



// ─── Types ────────────────────────────────────────────────────────
interface EmployeeVerification {
  id: number;
  employeeId: string;
  employeeType: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  hrRemarks: string | null;
  verifiedAt: string | null;
  locked: boolean;
  submittedAt: string;
  firstName: string | null;
  lastName: string | null;
  surName: string | null;
  fullName: string | null;
  contactNumber: string;
  gender: string;
  maritalStatus: string;
  dateOfBirth: string;
  personalEmail: string;
  presentAddress: string;
  permanentAddress: string;
  bloodGroup: string;
  emergencyContactNumber: string | null;
  aadharNumber: string;
  designation: string;
  skillSet: string;
  fatherName: string;
  fatherDateOfBirth: string;
  fatherOccupation: string;
  fatherAlive: boolean;
  motherName: string | null;
  motherDateOfBirth: string;
  motherOccupation: string;
  motherAlive: boolean;
  accountNumber: string | null;
  bankName: string | null;
  pfNumber: string | null;
  unaNumber: string | null;
  aadhaarDocPath: string | null;
  tcDocPath: string | null;
  offerLetterDocPath: string | null;
  experienceCertDocPath: string | null;
  leavingLetterDocPath: string | null;
  previousRole: string | null;
  oldCompanyName: string | null;
  oldCompanyFromDate: string | null;
  oldCompanyEndDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Detail Modal ─────────────────────────────────────────────────
const DetailModal: React.FC<{
  verification: EmployeeVerification;
  onClose: () => void;
  onVerify: (employeeId: string, status: 'VERIFIED' | 'REJECTED', remarks: string) => void;
}> = ({ verification, onClose, onVerify }) => {
  const [remarks, setRemarks] = useState(verification.hrRemarks || '');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    if (status === 'REJECTED' && !remarks.trim()) {
      notify.error('Required', 'Please add remarks for rejection');
      return;
    }
    setLoading(true);
    await onVerify(verification.employeeId, status, remarks);
    setLoading(false);
  };

  const isPending = verification.verificationStatus === 'PENDING';

  const handleView = async (path: string) => {
    try {
      const res = await api.get(`/documents/view?path=${path}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch {
      notify.error('Failed', 'Could not load document');
    }
  };

  const handleDownload = async (path: string, label: string) => {
    try {
      const res = await api.get(`/documents/download?path=${path}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = label;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notify.error('Failed', 'Could not download document');
    }
  };

  const employeeName = [verification.firstName, verification.lastName, verification.surName]
    .filter(Boolean).join(' ') || verification.fullName || `Employee #${verification.employeeId}`;

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">{title}</p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );

  const Field: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-semibold text-slate-700">{value || '—'}</p>
    </div>
  );

  // Documents list — only non-null paths
  const docs = [
    { label: 'Aadhaar', path: verification.aadhaarDocPath },
    { label: 'TC', path: verification.tcDocPath },
    { label: 'Offer Letter', path: verification.offerLetterDocPath },
    { label: 'Experience Certificate', path: verification.experienceCertDocPath },
    { label: 'Leaving Letter', path: verification.leavingLetterDocPath },
  ].filter(d => d.path);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">
              {employeeName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800">{employeeName}</h3>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${verification.verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                  verification.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-rose-100 text-rose-600'
                  }`}>
                  {verification.verificationStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400">#{verification.employeeId} · {verification.employeeType} · {verification.designation}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <FaTimes className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Personal Info */}
          <Section title="Personal Information">
            <Field label="Gender" value={verification.gender} />
            <Field label="Marital Status" value={verification.maritalStatus} />
            <Field label="Date of Birth" value={verification.dateOfBirth} />
            <Field label="Blood Group" value={verification.bloodGroup?.replace('_', '+')} />
            <Field label="Contact" value={verification.contactNumber} />
            <Field label="Emergency Contact" value={verification.emergencyContactNumber} />
            <Field label="Personal Email" value={verification.personalEmail} />
            <Field label="Aadhar Number" value={verification.aadharNumber} />
          </Section>

          {/* Address */}
          <Section title="Address">
            <Field label="Present Address" value={verification.presentAddress} />
            <Field label="Permanent Address" value={verification.permanentAddress} />
          </Section>

          {/* Professional */}
          <Section title="Professional Details">
            <Field label="Designation" value={verification.designation} />
            <Field label="Skill Set" value={verification.skillSet} />
            {verification.oldCompanyName && (
              <>
                <Field label="Previous Company" value={verification.oldCompanyName} />
                <Field label="Previous Role" value={verification.previousRole} />
                <Field label="From" value={verification.oldCompanyFromDate} />
                <Field label="To" value={verification.oldCompanyEndDate} />
              </>
            )}
          </Section>

          {/* Family */}
          <Section title="Family Details">
            <Field label="Father's Name" value={verification.fatherName} />
            <Field label="Father's DOB" value={verification.fatherDateOfBirth} />
            <Field label="Father's Occupation" value={verification.fatherOccupation} />
            <Field label="Father Alive" value={verification.fatherAlive ? 'Yes' : 'No'} />
            <Field label="Mother's Name" value={verification.motherName} />
            <Field label="Mother's DOB" value={verification.motherDateOfBirth} />
            <Field label="Mother's Occupation" value={verification.motherOccupation} />
            <Field label="Mother Alive" value={verification.motherAlive ? 'Yes' : 'No'} />
          </Section>

          {/* Bank */}
          <Section title="Bank Details">
            <Field label="Account Number" value={verification.accountNumber} />
            <Field label="Bank Name" value={verification.bankName} />
            <Field label="PF Number" value={verification.pfNumber} />
            <Field label="UAN Number" value={verification.unaNumber} />
          </Section>

          {/* Documents */}
          {docs.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                Documents
              </p>
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.label} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <FaFileAlt className="text-slate-400 text-xs" />
                      <span className="text-xs font-semibold text-slate-700">{doc.label}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(doc.path!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold transition-colors"
                      >
                        <FaEye className="text-[10px]" /> View
                      </button>
                      <button
                        onClick={() => handleDownload(doc.path!, doc.label)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold transition-colors"
                      >
                        <FaDownload className="text-[10px]" /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No documents */}
          {docs.length === 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Documents</p>
              <div className="text-center py-4 bg-slate-50 rounded-xl">
                <FaFileAlt className="text-slate-200 text-2xl mx-auto mb-1" />
                <p className="text-xs text-slate-400">No documents uploaded</p>
              </div>
            </div>
          )}

          {/* HR Remarks */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              HR Remarks {!isPending && verification.hrRemarks ? '(Read Only)' : ''}
            </label>
            {isPending ? (
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Add remarks (required for rejection)..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            ) : (
              <div className="px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-600">
                {verification.hrRemarks || '—'}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        {isPending && (
          <div className="flex gap-3 p-6 pt-0 sticky bottom-0 bg-white border-t border-slate-100">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >Cancel</button>
            <button onClick={() => handleVerify('REJECTED')} disabled={loading}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaTimes className="text-xs" /> Reject
            </button>
            <button onClick={() => handleVerify('VERIFIED')} disabled={loading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading
                ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <FaCheck className="text-xs" />
              }
              Approve
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

// ─── Main HR Verification Page ────────────────────────────────────
export const HRVerificationPage: React.FC = () => {
  const [verifications, setVerifications] = useState<EmployeeVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<EmployeeVerification | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'pending'
        ? '/hr/verifications/pending'
        : '/hr/verifications/all';
      const res = await api.get(endpoint);
      setVerifications(res.data);
    } catch {
      notify.error('Failed', 'Could not load verifications');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleVerify = async (employeeId: string, status: 'VERIFIED' | 'REJECTED', remarks: string) => {
    try {
      await api.put(`/hr/verify/${employeeId}`, { status, hrRemarks: remarks });
      notify.success(`Employee ${status === 'VERIFIED' ? 'approved' : 'rejected'} successfully`);
      setSelectedVerification(null);
      fetchVerifications();
    } catch {
      notify.error('Failed', 'Could not update verification status');
    }
  };

  const filtered = verifications.filter(v => {
    const name = [v.firstName, v.lastName].filter(Boolean).join(' ').toLowerCase();
    const matchSearch =
      v.employeeId.toString().includes(searchQuery) ||
      name.includes(searchQuery.toLowerCase()) ||
      v.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.personalEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filter === 'ALL' || v.verificationStatus === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    pending: verifications.filter(v => v.verificationStatus === 'PENDING').length,
    approved: verifications.filter(v => v.verificationStatus === 'VERIFIED').length,
    rejected: verifications.filter(v => v.verificationStatus === 'REJECTED').length,
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config = {
      PENDING: { bg: 'bg-amber-100', text: 'text-amber-600', icon: <FaClock className="text-[8px]" /> },
      APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: <FaCheckCircle className="text-[8px]" /> },
      REJECTED: { bg: 'bg-rose-100', text: 'text-rose-600', icon: <FaTimesCircle className="text-[8px]" /> },
    }[status] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: null };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${config.bg} ${config.text}`}>
        {config.icon} {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Employee Verifications</h1>
          <p className="text-xs text-slate-400 mt-0.5">Review and verify employee personal details</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: counts.pending, color: 'amber', icon: <FaClock /> },
          { label: 'Verified', value: counts.approved, color: 'emerald', icon: <FaCheckCircle /> },
          { label: 'Rejected', value: counts.rejected, color: 'rose', icon: <FaTimesCircle /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`h-10 w-10 bg-${color}-50 rounded-xl flex items-center justify-center text-${color}-500`}>
              {icon}
            </div>
            <div>
              <p className="text-xl font-black text-slate-800">{value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search + Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {[{ key: 'pending', label: 'Pending' }, { key: 'all', label: 'All' }].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key as 'pending' | 'all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {activeTab === 'all' && (
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <FaFilter className="text-slate-400 text-xs" />
              <select value={filter} onChange={e => setFilter(e.target.value as any)}
                className="text-xs font-semibold text-slate-600 focus:outline-none bg-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          )}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input type="text" placeholder="Search employee..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm w-48"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><CustomLoader label="Loading verifications..." /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FaUser className="text-slate-200 text-4xl mx-auto mb-3" />
            <p className="text-sm text-slate-400">No verifications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Employee', 'Type', 'Designation', 'Contact', 'Email', 'Submitted', 'Status', 'Action'].map(h => (
                    <th key={h} className={`py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${h === 'Employee' ? 'text-left' : 'text-center'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(v => {
                  const name = [v.firstName, v.lastName].filter(Boolean).join(' ') || `#${v.employeeId}`;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-indigo-100 rounded-xl flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700">{name}</p>
                            <p className="text-[10px] text-slate-400">#{v.employeeId} · {v.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold">{v.employeeType}</span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">{v.designation || '—'}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{v.contactNumber || '—'}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{v.personalEmail || '—'}</td>
                      <td className="py-3 px-4 text-center text-slate-400">
                        {new Date(v.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={v.verificationStatus} /></td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => setSelectedVerification(v)}
                          className="flex items-center gap-1.5 mx-auto px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold transition-colors"
                        >
                          <FaEye className="text-[10px]" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedVerification && (
        <DetailModal
          verification={selectedVerification}
          onClose={() => setSelectedVerification(null)}
          onVerify={handleVerify}
        />
      )}

    </div>
  );
};