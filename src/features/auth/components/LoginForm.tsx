import React, { useState } from "react";
import { FaArrowRight, FaLock, FaUserShield } from "react-icons/fa";
import { Link } from "react-router-dom";

import { useAuth } from "../../../shared/auth/useAuth";


import wehrm from '@/assets/images/LogoWeHRM2.png';


import type { LoginCredentials } from "@/shared/auth/authTypes";
import Loader from "../../../shared/components/Loader";
import { authService } from "../api/authApi";

const LoginForm: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [logintype, setLogintype] = useState<"id" | "email">("id");



  // Simplified UI states for the loader
  const [loaderState, setLoaderState] = useState({
    active: false,
    finished: false,
  });

  const [loginResponse, setLoginResponse] = useState<any>(null);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoaderState({ active: true, finished: false });

    try {
      const credentials: LoginCredentials = { identifier, password };
      const response = await authService.loginUser(credentials);

      setLoginResponse(response);

      setLoaderState({ active: true, finished: true });

    } catch (error) {
      console.error("Login failed:", error);
      setLoaderState({ active: false, finished: false });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-lg  w-full max-w-140 min-h-150 p-8">

      {loaderState.active && (
        <Loader
          message="Authenticating..."
          isFinished={loaderState.finished}
          onFinished={() => login(loginResponse)}
        />
      )}
      {/* LOGO */}
      <img src={wehrm} alt="Company logo" className="w-25 h-25 mb-4" />

      <form onSubmit={handleLogin} className="space-y-6 w-full">
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-heading font-bold">Account Login</h1>
          <p className="text-sm text-center text-neutral-600">
            Enter your registered email and password to proceed
          </p>
        </div>

        {/*Radio option */}
        <div className="flex items-center gap-6">
          <span className="text-xs font-semibold text-neutral-600">
            Login with :
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="loginType"
              value="id"
              checked={logintype === "id"}
              onChange={() => {
                setLogintype("id");
                setIdentifier("");
              }}
              className="accent-primary-500"
            />
            <span className="text-xs font-semibold text-neutral-600">
              Employee ID
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="loginType"
              value="email"
              checked={logintype === "email"}
              onChange={() => {
                setLogintype("email");
                setIdentifier("");
              }}
              className="accent-primary-500"
            />
            <span className="text-xs font-semibold text-neutral-600">
              Email
            </span>
          </label>
        </div>

        {/* EMAIL */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-700 ml-1">
            {logintype === "email" ? "Company Email" : "Employee ID"}
          </label>

          <div className="relative group">
            <FaUserShield className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-primary-500 transition-colors" />

            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => {
                const value = e.target.value;
                setIdentifier(logintype === "id" ?  value.toUpperCase() : value);
              }}
              placeholder={logintype === "email" ? "name@wenxttech.com" : "WENXT011"}
              className={`w-full pl-12 pr-4 py-3.5 bg-white border border-neutral-300 rounded-xl outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 text-sm shadow-sm ${logintype === "id" ? "uppercase" : ""
                }`}
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-700 ml-1">
            Password
          </label>
          <div className="relative group">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-neutral-300 rounded-xl outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 text-sm shadow-sm"
            />
          </div>
          <Link to="/forgot-password" intrinsic-size="11" className="text-[11px] font-bold text-red-400 hover:underline flex justify-end">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loaderState.active}
          className="w-full py-4 px-6 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-3 bg-primary-500 text-white hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {loaderState.active ? "Verifying..." : "Sign In"}
          <FaArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
        </button>

        <footer className="mt-6 text-center border-t border-neutral-100 pt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
            Authorized Access Only
          </p>
        </footer>
      </form>
    </div>
  );
};

export default LoginForm;