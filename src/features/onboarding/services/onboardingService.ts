import type { AccessResponse, AdminAccessDecision, BiometricVpnStatus, PendingOnboardingResponse } from "@/features/leave/types";
import api from "@/services/apiClient";

export const onboardingServices = {

    getOnboardingRequests: async (): Promise<PendingOnboardingResponse[]> => {
        const res = await api.get("/v1/access-requests/admin/pending-approvals");

        return res.data;
    },
    approveAccessAdmin: async (requestId: number, decision: AdminAccessDecision) => {
        await api.patch(`/v1/access-requests/${requestId}/admin-decision`, decision,);
    },


    approveOnboardingBioRequests: async (employeeId: string, decision: BiometricVpnStatus): Promise<void> => {
     

        await api.patch(`/v1/admin/onboarding/bio/decision/${employeeId}`, {}, {
            params: {
                decision
            }
        });
    },
    approveOnboardingVpnRequests: async (employeeId: string, decision: BiometricVpnStatus): Promise<void> => {
      
        await api.patch(`/v1/admin/onboarding/vpn/decision/${employeeId}`, {}, {
            params: {
                decision
            }
        });
    },

    // get all access requests

    getPendingAccessRequests: async (id: string): Promise<AccessResponse[]> => {
        const res = await api.get(`/v1/access-requests/manager/pending/${id}`);
        return res.data;
    },
}