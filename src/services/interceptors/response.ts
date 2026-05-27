import { logout } from "@/services/auth/authStorage";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

export const responseInterceptor = async (error: AxiosError) => {
  const status = error.response?.status;
  const originalRequest = error.config as InternalAxiosRequestConfig & { silent?: number[] };

  const backendMessage = (error.response?.data as any)?.message;
  const defaultMessage = "An unexpected error occurred. Please try again.";

  if (!error.response) {
    toast.error("Network Error", {
      description: "Cannot connect to server. Please check your internet connection.",
    });
    return Promise.reject(error);
  }

  const isSilent = originalRequest.silent?.includes(status!);

  if (!isSilent) {
    switch (status) {
      case 401:
        toast.error("Session Expired", { description: backendMessage || "Please log in again." });
        logout();
        break;

      case 400:
        toast.warning("Invalid Request", {
          description: backendMessage || "Please check your input data."
        });
        break;

      case 403:
        toast.error("Access Denied", {
          description: backendMessage || "You do not have permission to perform this action."
        });
        break;

      case 404:
        toast.info("Resource Not Found", {
          description: backendMessage || "The requested item could not be located."
        });
        break;

      case 409:
        toast.warning("Conflict", {
          description: backendMessage || "This record already exists."
        });
        break;

      case 422:
        toast.error("Validation Error", {
          description: backendMessage || "The data provided is invalid."
        });
        break;

      case 429:
        toast.error("Too Many Requests", {
          description: backendMessage || "Slow down! You are making too many requests."
        });
        break;

      case 500:
        toast.error("Server Error", {
          description: backendMessage || "Something went wrong on our end. We are looking into it."
        });
        break;

      case 503:
        toast.error("Service Unavailable", {
          description: backendMessage || "The server is temporarily down for maintenance."
        });
        break;

      default:
        toast.error("Error", {
          description: backendMessage || defaultMessage
        });
    }
  }

  return Promise.reject(error);
};