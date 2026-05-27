import Cookies from "js-cookie";

const TOKEN_KEY = "lms_token";
const USER_ID_KEY = "lms_user_id";


export const setAuthData = (id: string, token: string) => {
  Cookies.set(USER_ID_KEY, id, { expires: 1, path: "/" });
  Cookies.set(TOKEN_KEY, token, { 
    expires: 1, 
    path: "/", 
    sameSite: "Lax" 
  });
};

export const clearAuthData = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_ID_KEY);
};

export const logout = () => {
  clearAuthData();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

export const getUserId = () => Cookies.get(USER_ID_KEY); 
export const getToken = () => Cookies.get(TOKEN_KEY);