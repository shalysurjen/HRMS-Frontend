import type { User } from "@/features/employee/types";
import api from "@/services/apiClient";
import type { AuthResponse, LoginCredentials } from "@/shared/auth/authTypes";

export const authService = {

  loginUser: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/v1/auth/login', credentials);
    return response.data;
  },



  getEmployeeProfile: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/v1/employees/profile/${id}`);

    return response.data;
  },

  getMyProfile: async (): Promise<User> => {
    const response = await api.get<User>('/v1/employees/me');
    return response.data;
  },

  getProfileByID: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/v1/employees/profile/${id}`);
    return response.data;
  },
  // getProfileByID: async (id  : number): Promise<User> => {
  //   const response = await api.get<User>(`/v1/employees/profile/${id}`);
  //   console.log(response);

  //   return response.data;
  // },

  // ─── POST — first time submission ────────────────────────────
  submitMultipartDetails: async (
    id: string,
    type: "FRESHER" | "EXPERIENCED",
    data: any,
    files: Record<string, File | File[] | null>
  ): Promise<any> => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));

    if (files.idProof) formData.append("idProof", files.idProof as File);
    if (files.passportPhoto) formData.append("passportPhoto", files.passportPhoto as File);

    if (type === "FRESHER") {
      if (files.tenthMarksheet) formData.append("tenthMarksheet", files.tenthMarksheet as File);
      if (files.twelfthMarksheet) formData.append("twelfthMarksheet", files.twelfthMarksheet as File);
      if (files.degreeCertificate) formData.append("degreeCertificate", files.degreeCertificate as File);
      if (files.offerLetter) formData.append("offerLetter", files.offerLetter as File);
    } else {
      if (Array.isArray(files.experienceCerts)) {
        files.experienceCerts.forEach(f => formData.append("experienceCerts", f));
      }

      if (Array.isArray(files.joiningLetter)) {
        files.joiningLetter.forEach((file) => {
          formData.append("joiningLetters", file);
        });
      }
      if (Array.isArray(files.relievingLetter)) {
        files.relievingLetter.forEach((file) => {
          formData.append("relievingLetters", file);
        });
      }
    }
    const response = await api.post(
      `/v1/employees/personal-details/${id}/${type.toLowerCase()}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  updateProfileDetails: async (
    id: string,
    type: "FRESHER" | "EXPERIENCED",
    data: any,
    files: Record<string, any>
  ): Promise<any> => {

    const formData = new FormData();

    // ── 1. JSON payload ───────────────────────────────────────────
    formData.append("data", JSON.stringify(data));

    // ── 2. Common files ───────────────────────────────────────────
    if (files.idProof)
      formData.append("idProof", files.idProof);

    if (files.passportPhoto)
      formData.append("passportPhoto", files.passportPhoto);

    // ── 3. Fresher files ──────────────────────────────────────────
    if (type === "FRESHER") {

      if (files.tenthMarksheet)
        formData.append("tenthMarksheet", files.tenthMarksheet);

      if (files.twelfthMarksheet)
        formData.append("twelfthMarksheet", files.twelfthMarksheet);

      if (files.degreeCertificate)
        formData.append("degreeCertificate", files.degreeCertificate);

      if (files.offerLetter)
        formData.append("offerLetter", files.offerLetter);

    }

    // ── 4. Experienced files (🔥 FIXED) ───────────────────────────
    else {

      // ✅ experienceCerts[]
      if (files.experienceCerts?.length) {
        files.experienceCerts.forEach((file: File) => {
          formData.append("experienceCerts", file);
        });
      }

      // ✅ joiningLetters[]
      if (files.joiningLetters?.length) {
        files.joiningLetters.forEach((file: File) => {
          formData.append("joiningLetters", file);
        });
      }

      // ✅ relievingLetters[]
      if (files.relievingLetters?.length) {
        files.relievingLetters.forEach((file: File) => {
          formData.append("relievingLetters", file);
        });
      }
    }

    // ── 5. API call ───────────────────────────────────────────────
    const response = await api.put(
      `/v1/employees/profile/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },



  changePassword: async (newPassword: string): Promise<void> => {
    await api.post('/v1/auth/force-change', { newPassword });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/v1/password-reset/forgot-password', {
      email
    });
  },


  verifyOtp: async (data: {
    email: string,
    otp: string,
    newPassword: string
  }) => {

    return api.post(
      "/v1/password-reset/verify-otp",
      data
    );

  }

};