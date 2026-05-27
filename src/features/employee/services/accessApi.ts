import api from "@/services/apiClient";

/**
 * 🔹 Fetch access types (VPN, BIOMETRIC, etc.)
 * Later this will come from Spring Boot
 */
export const fetchAccessTypes = async () => {
  const response = await api.get("/access-types");
  return response.data;
};

/**
 * 🔹 Create new access request
 */
export const createAccessRequestApi = async (payload: {
  accessType: string;
  reason: string;
}) => {
  const response = await api.post("/access-request", payload);
  return response.data;
};