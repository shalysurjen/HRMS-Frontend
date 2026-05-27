import React, { createContext, useContext, useState, useEffect } from "react";

export interface UploadedPolicy {
  id: string;
  policyType: string;
  preparedBy: string;
  version: number;
  fileName: string;
  fileDataUrl: string; // base64 stored in localStorage
  uploadedAt: string;
}

interface PolicyContextType {
  policies: UploadedPolicy[];
  addPolicy: (p: Omit<UploadedPolicy, "id">) => void;
  updatePolicy: (id: string, p: Partial<UploadedPolicy>) => void;
  deletePolicy: (id: string) => void;
  getPoliciesByType: (type: string) => UploadedPolicy[];
}

const PolicyContext = createContext<PolicyContextType | null>(null);

const STORAGE_KEY = "hrms_uploaded_policies";

export const PolicyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [policies, setPolicies] = useState<UploadedPolicy[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
  }, [policies]);

  const addPolicy = (p: Omit<UploadedPolicy, "id">) => {
    const newPolicy: UploadedPolicy = { ...p, id: crypto.randomUUID() };
    setPolicies((prev) => [...prev, newPolicy]);
  };

  const updatePolicy = (id: string, updated: Partial<UploadedPolicy>) => {
    setPolicies((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deletePolicy = (id: string) => {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
  };

  const getPoliciesByType = (type: string) =>
    policies.filter((p) => p.policyType.toLowerCase() === type.toLowerCase());

  return (
    <PolicyContext.Provider value={{ policies, addPolicy, updatePolicy, deletePolicy, getPoliciesByType }}>
      {children}
    </PolicyContext.Provider>
  );
};

export const usePolicyContext = () => {
  const ctx = useContext(PolicyContext);
  if (!ctx) throw new Error("usePolicyContext must be used inside PolicyProvider");
  return ctx;
};