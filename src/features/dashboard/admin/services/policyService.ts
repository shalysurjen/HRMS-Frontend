import api from "@/services/apiClient";

/* =========================
   GET ALL POLICIES
========================= */
export const getPolicies = async () => {
  const response = await api.get("/policies");
  return response.data;
};

/* =========================
   UPLOAD POLICY
========================= */
export const uploadPolicy = async (name: string, file: File) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("file", file);

  const response = await api.post("/policies/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/* =========================
   DELETE POLICY
========================= */
export const deletePolicyAPI = async (id: number) => {
  await api.delete(`/policies/${id}`);
};

/* =========================
   VIEW POLICY (OPEN PDF)
========================= */
export const viewPolicy = async (id: number) => {
  try {
    const res = await api.get(`/policies/view/${id}`, {
      params: { token: undefined }, // token handled by interceptor — param not needed
      responseType: "blob",
    });
    const fileURL = window.URL.createObjectURL(res.data);
    window.open(fileURL, "_blank");
  } catch (err) {
    console.error("❌ View failed:", err);
  }
};

/* =========================
   PREVIEW POLICY (OPEN PDF)
========================= */
export const previewPolicyFile = async (id: number) => {
  try {
    const res = await api.get(`/policies/preview/${id}`, {
      responseType: "blob",
    });
    const fileURL = window.URL.createObjectURL(res.data);
    window.open(fileURL, "_blank");
  } catch (err) {
    console.error("❌ Preview failed:", err);
  }
};

/* =========================
   DOWNLOAD POLICY
========================= */
export const downloadPolicy = async (id: number, fileName?: string) => {
  try {
    const response = await api.get(`/policies/download/${id}`, {
      responseType: "blob",
    });

    // Try to get the real filename from Content-Disposition header
    const disposition = response.headers["content-disposition"] as string | undefined;
    let resolvedName = fileName ?? `policy_${id}.pdf`;
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match?.[1]) {
        resolvedName = match[1].replace(/['"]/g, "");
      }
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", resolvedName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("❌ Download failed:", err);
  }
};