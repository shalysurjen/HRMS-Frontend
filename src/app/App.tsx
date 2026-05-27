import React from "react";
import { Toaster } from "sonner";
import AppRoutes from "@/app/AppRoutes.tsx";



const App: React.FC = () => {
  return (
    <div className="antialiased text-slate-900 flex flex-col min-h-screen">
      <Toaster position="top-right" richColors closeButton />
      <div className="flex-1 flex flex-col">

        <AppRoutes />
      </div>
    </div>
  );
};

export default App;