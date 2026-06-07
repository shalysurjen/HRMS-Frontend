import { useState } from "react";
import { appraisalService } from "@/features/appraisal/services/appraisalService";
import type { AppraisalCycle, AppraisalDetail, AppraisalSummary, AnswerDTO } from "@/features/appraisal/types/appraisal";

export const useAppraisal = () => {
  const [cycles, setCycles]       = useState<AppraisalCycle[]>([]);
  const [detail, setDetail]       = useState<AppraisalDetail | null>(null);
  const [summaries, setSummaries] = useState<AppraisalSummary[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const loadCycles = async () => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.getCycles(); setCycles(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  const loadOrCreate = async (empId: string, cycleId: number) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.getOrCreate(empId, cycleId); setDetail(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  const saveDraft = async (empId: string, cycleId: number, answers: AnswerDTO[]) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.saveDraft(empId, cycleId, answers); setDetail(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  const submitFinal = async (empId: string, cycleId: number, answers: AnswerDTO[]) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.submit(empId, cycleId, answers); setDetail(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  const loadHistory = async (empId: string) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.getHistory(empId); setSummaries(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  const loadPendingL1 = async (id: string) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.getPendingL1(id); setSummaries(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  const loadPendingL2 = async (id: string) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.getPendingL2(id); setSummaries(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  // Combined L1+L2 for MANAGER/CTO/TEAM_LEADER
  const loadPendingApprover = async (id: string) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.getPendingApprover(id); setSummaries(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  // FIX: Full dashboard feed — L1 pending + ALL L2 records (view-only + actionable)
  // Use this in AppraisalDashboardPage instead of loadPendingApprover
  const loadAllForApprover = async (id: string) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.getAllForApprover(id); setSummaries(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  const loadDetail = async (id: number) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.getDetail(id); setDetail(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  const loadPublished = async (empId: string, cycleId: number) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.getPublished(empId, cycleId); setDetail(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  const sendRemarks = async (id: number, payload: any) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.addRemarks(id, payload); setDetail(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  const loadAll = async (cycleId?: number) => {
    setLoading(true); setError(null);
    try { const d = await appraisalService.getAllAppraisals(cycleId); setSummaries(d); return d; }
    catch (e: any) { setError(e?.response?.data?.message || "Failed"); return null; }
    finally { setLoading(false); }
  };

  return {
    cycles, detail, summaries, loading, error,
    loadCycles, loadOrCreate, saveDraft, submitFinal,
    loadHistory, loadPendingL1, loadPendingL2, loadPendingApprover, loadAllForApprover,
    loadDetail, loadPublished, sendRemarks, loadAll,
  };
};