import api from "@/services/apiClient";

export const permissionService = {

    // ── CHANGED: accepts FormData for multipart file upload ───────
    submitPermissionRequest: async (data: FormData) => {
        const response = await api.post("/permissions", data, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    getMyPermissions: async (empId: string) => {
        const response = await api.get(`/permissions/employee/${empId}`);
        return response.data;
    },

    getPendingPermissions: async (approverId: string) => {
        const response = await api.get(
            `/permissions/approver/${approverId}/pending`
        );
        return response.data;
    },

    approvePermission: async (
        permissionId: number,
        approverId: string,
        comments: string
    ) => {
        const response = await api.put(
            `/permissions/${permissionId}/approve`,
            null,
            { params: { approverId, comments } }
        );
        return response.data;
    },

    rejectPermission: async (
        permissionId: number,
        approverId: string,
        comments: string
    ) => {
        const response = await api.put(
            `/permissions/${permissionId}/reject`,
            null,
            { params: { approverId, comments } }
        );
        return response.data;
    },

    cancelPermission: async (permissionId: number, employeeId: string) => {
        const response = await api.put(
            `/permissions/${permissionId}/cancel`,
            null,
            { params: { empId: employeeId } }
        );
        return response.data;
    },

    editPermission: async (
        permissionId: number,
        data: {
            employeeId: string;
            permissionDate: string;
            startTime: string;
            endTime: string;
            reason: string;
        }
    ) => {
        const { employeeId, ...body } = data;
        const response = await api.put(
            `/permissions/${permissionId}/update`,
            body,
            { params: { empId: employeeId } }
        );
        return response.data;
    },
};