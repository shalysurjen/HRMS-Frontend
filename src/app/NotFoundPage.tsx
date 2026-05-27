import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6 text-center">
      <h1 className="text-[12rem] md:text-[20rem] font-bold text-slate-200/60 select-none animate-pulse">
        404
      </h1>
      <div className="absolute flex flex-col items-center w-full max-w-md px-4">
        <h2 className="text-3xl font-bold text-slate-800 mt-4">
          Oops! Page not found
        </h2>
        <p className="text-slate-600 mt-3 mb-8 leading-relaxed">
          The page you are looking for doesn't exist or has been moved. 
          Check the URL or head back to safety.
        </p>
        <Link
          to="/"
          className="px-8 py-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-200"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;