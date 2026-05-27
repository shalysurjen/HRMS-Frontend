import api from "@/services/apiClient";
import type { BirthdayEmployee, BirthdayWish, SendWishRequest } from "../types/birthdayTypes";

export const birthdayService = {

  getTodayBirthdays: async (): Promise<BirthdayEmployee[]> => {
    const res = await api.get("/v1/birthday/today");
    return res.data;
  },

  getWeeklyBirthdays: async (): Promise<BirthdayEmployee[]> => {
    const res = await api.get("/v1/birthday/weekly");
    return res.data;
  },

  getMonthlyBirthdays: async (): Promise<BirthdayEmployee[]> => {
    const res = await api.get("/v1/birthday/monthly");
    return res.data;
  },

  getWishes: async (employeeId: string): Promise<BirthdayWish[]> => {
    const res = await api.get(`/v1/birthday/wishes/${employeeId}`);
    return res.data;
  },

  sendWish: async (payload: SendWishRequest): Promise<void> => {
    await api.post("/v1/birthday/wishes", payload);
  },

  checkAlreadyWished: async (
    birthdayEmployeeId: string,
    wishedByEmployeeId: string
  ): Promise<boolean> => {
    const res = await api.get(
      `/v1/birthday/wishes/check?birthdayEmployeeId=${birthdayEmployeeId}&wishedByEmployeeId=${wishedByEmployeeId}`
    );
    return res.data;
  },
};