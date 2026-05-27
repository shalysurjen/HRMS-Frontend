
import { ENV } from "@/config/environment";
import { requestInterceptor } from "@/services/interceptors/request";
import { responseInterceptor } from "@/services/interceptors/response";
import axios from "axios";
declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: number[];
    _retry?: boolean;
  }
}

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  
});

api.interceptors.request.use(requestInterceptor);
api.interceptors.response.use((res) => res, responseInterceptor);

export default api;