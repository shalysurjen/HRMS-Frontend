import axios from "axios";

/* =========================
   AXIOS INSTANCE
========================= */
const api = axios.create({
  baseURL: "http://localhost:8111/api",
});

/* =========================
   GET COOKIE HELPER
========================= */
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

/* =========================
   AUTH HEADER (JWT)
========================= */
const getAuthHeader = () => {
  const token = getCookie("lms_token"); // 🔥 your cookie name

  if (!token) {
    console.error("❌ No token found. Please login again.");
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

/* =========================
   GET ALL POLICIES
========================= */
export const getPolicies = async () => {
  const response = await api.get("/policies", {
    headers: getAuthHeader(),
  });
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
      ...getAuthHeader(),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/* =========================
   DELETE POLICY
========================= */
export const deletePolicyAPI = async (id: number) => {
  await api.delete(`/policies/${id}`, {
    headers: getAuthHeader(),
  });
};

/* =========================
   VIEW POLICY (OPEN PDF)
========================= */
export const viewPolicy = async (id: number) => {
  try {
    const res = await api.get(`/policies/view/${id}`, {
      headers: getAuthHeader(),
      responseType: "blob",
    });

    const fileURL = window.URL.createObjectURL(res.data);
    window.open(fileURL, "_blank"); // ✅ opens PDF
  } catch (err) {
    console.error("❌ View failed:", err);
    alert("Failed to open file");
  }
};
export const previewPolicyFile = async (id: number) => {
  try {
    const res = await api.get(`/policies/preview/${id}`, {
      headers: getAuthHeader(),
      responseType: "blob",
    });

    const fileURL = window.URL.createObjectURL(res.data);
    window.open(fileURL, "_blank");

  } catch (err) {
    console.error("❌ Preview failed:", err);
    alert("Failed to open file");
  }
};

/* =========================
   DOWNLOAD POLICY
========================= */
export const downloadPolicy = async (id: number) => {
  try {
    const response = await api.get(`/policies/download/${id}`, {
      headers: getAuthHeader(),
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `policy_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("❌ Download failed:", err);
    alert("Download failed");
  }
};