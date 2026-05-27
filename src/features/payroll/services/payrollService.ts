import api from "@/services/apiClient";

export const payrollService = {
    getMyPayslip: async (year: number, month: number) => {
        return api.get(`/v1/payslip/my/${year}/${month}`);
    },

    getHistory: async (employeeId: string, year: number) => {
    const res = await api.get(
        `/v1/payslip/employee/${employeeId}/${year}`
    );
    return res.data;
},

    downloadPayslip: async (year: number, month: number) => {
        const res = await api.get(`/v1/payslip/download/${year}/${month}`, {
            responseType: "blob"
        });

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `payslip-${month}-${year}.pdf`);
        document.body.appendChild(link);
        link.click();
    },
}