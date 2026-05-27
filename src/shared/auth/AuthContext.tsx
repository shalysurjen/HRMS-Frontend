import { authService } from "@/features/auth/api/authApi";
import React, { createContext, useCallback, useEffect, useState } from "react";

import type { User } from "@/features/employee/types";
import { getToken, getUserId, logout, setAuthData } from "@/services/auth/authStorage";
import type { AuthResponse } from "./authTypes";

export interface AuthContextType {
  user: User | null;
  login: (data: AuthResponse) => Promise<void>;
  contextLogout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  personalDetailsComplete: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const contextLogout = useCallback(async () => {

    setUser(null);
    logout();

  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      const id = getUserId();

      // If there is no token, they aren't logged in.
      if (!token || !id) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getEmployeeProfile(id);
        setUser(profile);
      } catch (error) {
        console.error("Failed to restore session:", error);
        logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (data: AuthResponse) => {
    try {
      setAuthData(data.employeeId, data.token);

      const profile = await authService.getEmployeeProfile(data.employeeId);

      setUser(profile);
    } catch (e) {
      console.error("Login initialization failed:", e);
      logout();
      throw e;
    }
  }, []);



  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        contextLogout,
        isAuthenticated: !!user,
        isLoading,
        mustChangePassword: user?.mustChangePassword ?? false,
        personalDetailsComplete: user?.personalDetailsComplete === true,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};