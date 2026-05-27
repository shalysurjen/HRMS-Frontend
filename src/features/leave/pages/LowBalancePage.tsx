
// import LowBalanceTable from "@/features/dashboard/hr/components/Lowbalancetable";
// import { dashboardService } from "@/features/dashboard/services/dashboardService";
// import type { LowBalanceEmployee } from "@/features/leave/types";
// import { useEffect as useEff, useRef, useState as useSt, type SetStateAction, } from "react";

// function LowBalancePage() {
//   const [data, setData] = useSt<LowBalanceEmployee[]>([]);
//   const [loading, setLoading] = useSt(true);
//   const [error, setError] = useSt<string | null>(null);
//   const isMounted = useRef(false);

//   useEff(() => {
//     isMounted.current = true;

//     const timer = setTimeout(() => {       
//       if (!isMounted.current) return;

//       dashboardService.getHRLowBalance()  
//         .then((res: SetStateAction<LowBalanceEmployee[]>) => {
//           if (isMounted.current) { setData(res); setLoading(false); }
//         })
//         .catch((err: { message: SetStateAction<string | null>; }) => {
//           if (isMounted.current) {
//             setError(err instanceof Error ? err.message : 'Failed to load');
//             setLoading(false);
//           }
//         });
//     }, 100);

//     return () => {
//       isMounted.current = false;
//       clearTimeout(timer);               // ← timer cancel
//     };
//   }, []);

//   return <LowBalanceTable data={data} loading={loading} error={error} />;
// };


// export default LowBalancePage;



function LowBalancePage() {
  return (
    <div>LowBalancePage</div>
  )
}

export default LowBalancePage
