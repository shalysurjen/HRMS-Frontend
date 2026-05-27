import React, { useCallback, useState } from "react";
import logo from "@/assets/images/bg-rm-logo-HRES.png";
import { usePayroll } from "@/features/payroll/hooks/usePayroll";
import { useAuth } from "@/shared/auth/useAuth";
import type { ProfileData } from "@/features/employee/types";
import type { YearlySummary } from "@/features/payroll/payrollTypes";
import api from "@/services/apiClient";
import { payrollService } from "@/features/payroll/services/payrollService";



const PayrollView: React.FC = () => {
  const { payslip, fetchPayslip } = usePayroll();
  const { user } = useAuth();
  const [loadingPDF] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [summary,setSummary] = useState<YearlySummary | null>(null);
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");

  const [loading, setLoading] = useState(false);
 
  const [, setLoadingProfile] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear()+1);
  const [month, setMonth] = useState(now.getMonth() +1);

  const months = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

  // ================= FETCH =================
 

  const fetchProfile = useCallback( async () => {
    setLoadingProfile(true);
    try {
      const res = await api.get(`/v1/employees/profile/${user?.id!}`);
      setProfile(res.data);
    } catch (err) {
      console.error("Profile fetch failed", err);
    } finally {
      setLoadingProfile(false);
    }
  },[]);

 const fetchYearlySummary = async (employeeId: string, year: number) => {
  try {
    setLoading(true);

    const data: YearlySummary =
        await payrollService.getHistory(employeeId, year);

    setSummary(data);

  } catch (e) {
    console.error("Yearly summary failed", e);
    setSummary(null);
  } finally {
    setLoading(false);
  }
};

 const search = async () => {
  try {
    setLoading(true);

    if (viewMode === "monthly") {
      await Promise.all([
        fetchPayslip(year, month),
        fetchProfile()
      ]);
    }

    if (viewMode === "yearly") {
      await Promise.all([
        fetchYearlySummary(user?.id!, year),
        fetchProfile()   // ADD THIS
      ]);
    }



  } catch (err) {
    console.error("Search failed", err);
  } finally {
    setLoading(false);
  }
};

  const numberToWords = (num: number): string => {
    const a = [
      "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX",
      "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE",
      "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
      "SEVENTEEN", "EIGHTEEN", "NINETEEN"
    ];
    const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

    if (num === 0) return "ZERO";

    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
      if (n < 1000)
        return a[Math.floor(n / 100)] + " HUNDRED " + inWords(n % 100);
      if (n < 100000)
        return inWords(Math.floor(n / 1000)) + " THOUSAND " + inWords(n % 1000);
      if (n < 10000000)
        return inWords(Math.floor(n / 100000)) + " LAKH " + inWords(n % 100000);
      return inWords(Math.floor(n / 10000000)) + " CRORE " + inWords(n % 10000000);
    };

    return inWords(num).trim();
  };

  const formatCurrency = (val: any) =>
    `₹ ${Number(val || 0).toLocaleString("en-IN")}`;


//   const downloadPDF = async () => {
//   const element = document.getElementById("payslip-container");
//   if (!element) return;

//   setLoadingPDF(true);

//   console.log("pdf called");

//   try {
//     const dataUrl = await toPng(element, {
//       cacheBust: true,
//       pixelRatio: 3,
//       backgroundColor: "#ffffff",
//     });

//     const pdf = new jsPDF("p", "mm", "a4");

//     const img = new Image();
//     img.src = dataUrl;

//     img.onload = () => {
//       const pageWidth = 210;
//       const pageHeight = 297;

//       const imgWidth = pageWidth;
//       const imgHeight = (img.height * imgWidth) / img.width;

//       let heightLeft = imgHeight;
//       let position = 0;

//       pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
//       heightLeft -= pageHeight;

//       while (heightLeft > 0) {
//         position = heightLeft - imgHeight;
//         pdf.addPage();
//         pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
//         heightLeft -= pageHeight;
//       }

//       pdf.save(`Payslip-${month}-${year}.pdf`);
//       setLoadingPDF(false);
//     };

//   } catch (err) {
//     console.error(err);
//     setLoadingPDF(false);
//   }
// };

  const downloadPDF = async () => {
  try {
    const response = await api.get(
      `/v1/payslip/download/${year}/${month}`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `Payslip-${month}-${year}.pdf`);
    document.body.appendChild(link);
    link.click();

  } catch (err) {
    console.error(err);
  }
};

  const salaryRows = [
    ["Basic Salary", payslip?.basicSalary, "PF", profile?.pfNumber],
    ["HRA", payslip?.hra, "TDS", payslip?.tds],
    ["Conveyance", payslip?.conveyance, "Professional Tax", payslip?.professionalTax],
    ["Medical", payslip?.medical, "ESI", payslip?.esi],
    ["Other Allowance", payslip?.otherAllowance, "LOP", payslip?.lop],
    ["Bonus", payslip?.bonus, " variablePay", payslip?.variablePay],
  ];

  return (
    <div className="max-w-5xl mx-auto bg-white border shadow p-8">
      <h1 className="text-xl font-bold text-center mb-6">
        Employee Payslip
      </h1>

      {/* CONTROLS */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-2"
        />

        <select
  value={month}
  onChange={(e) => setMonth(Number(e.target.value))}
  className="border p-2"
>
  {months.map((m, i) => (
    <option key={i} value={i + 1}>
      {m}
    </option>
  ))}
</select>

        <button
  onClick={search}
  disabled={loading}
  className={`px-4 py-2 rounded text-white 
    ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
  `}
>
  {loading ? "Loading..." : "Search"}
</button>

        <button
          onClick={downloadPDF}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {loadingPDF ? "Downloading..." : "Download PDF"}
        </button>

        <button
          onClick={() => {
  setViewMode("yearly");
  fetchYearlySummary(user?.id!, year);
   search();
}}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Yearly View
        </button>

        <button
          onClick={() => setViewMode("monthly")}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          Monthly View
        </button>
      </div>

      {/* UNIFIED UI */}
      {((viewMode === "monthly" && payslip && profile) ||
        (viewMode === "yearly" && summary)) && (
          <div id="payslip-container" className="border-2 border-black p-6 text-sm">
            <div className="flex items-center justify-between border-b pb-4 mb-4">

              {/* LOGO */}
              <img
                src={logo} // OR use {logo} if imported
                alt="Company Logo"
                className="w-16 h-16 object-contain"
              />

              {/* COMPANY DETAILS */}
              <div className="text-center flex-1">
                <h2 className="font-bold text-lg">
                  WENXT TECHNOLOGIES PRIVATE LIMITED
                </h2>
                <h3 className="text-xs mt-1">
                  Office Address: Type II / 1, Ground Floor, Dr.V.S.I Estate,
                  Thiruvanmiyur, Chennai- 600041
                </h3>


                      <p className="text-xs mt-3 font-semibold tracking-wide">
        {viewMode === "monthly"
          ? `MONTHLY PAYSLIP - ${months[month-1]} ${year}`
          : `YEARLY PAYSLIP - ${year}`}
      </p>
              </div>

              {/* EMPTY SPACE (for balance) */}
              <div className="w-16" />
            </div>



            {/* EMPLOYEE DETAILS */}
            {profile && (
              <div className="border-2 border-black p-6 text-sm">
               
                <table className="w-full border border-black mb-4 text-sm">
                  <tbody>
                    <tr>
                      <td className="border p-2 font-medium">Employee ID</td>
                      <td className="border p-2">{payslip.employeeId}</td>
                      <td className="border p-2 font-medium">UAN No</td>
                      <td className="border p-2">{profile.uanNumber}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium">Employee Name</td>
                      <td className="border p-2">{profile.name }</td>
                      <td className="border p-2 font-medium">PF Number</td>
                      <td className="border p-2">{profile.pfNumber}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium">Designation</td>
                      <td className="border p-2">{profile.designation }</td>
                      <td className="border p-2 font-medium">Bank</td>
                      <td className="border p-2">{profile.bankName }</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium">
                        {viewMode === "monthly" ? "Month / Year" : "Year"}
                      </td>

                      <td className="border p-2">
                        {viewMode === "monthly"
                          ? `${payslip?.month}/${payslip?.year}`
                          : year}
                      </td>
                      <td className="border p-2 font-medium">Account No</td>
                      <td className="border p-2">{profile.accountNumber }</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* SALARY TABLE */}
            <table className="w-full border mt-3.5 border-black">

              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Income</th>
                  <th className="border p-2">Amount</th>
                  <th className="border p-2">Deductions</th>
                  <th className="border p-2">Amount</th>
                </tr>
              </thead>

              <tbody>
                {viewMode === "monthly" ? (
                  salaryRows.map(([l, lv, r, rv], i) => (
                    <tr key={i}>
                      <td className="border p-2">{l}</td>
                      <td className="border p-2">{formatCurrency(lv)}</td>
                      <td className="border p-2">{r}</td>
                      <td className="border p-2">{formatCurrency(rv)}</td>
                    </tr>
                  ))
                ) : (
                  <>

                  
                    <tr>
                      <td className="border p-2">Basic</td>
                      <td className="border p-2">{formatCurrency(summary?.totalBasic)}</td>
                      <td className="border p-2">PF</td>
                      <td className="border p-2">{formatCurrency(summary?.totalPf)}</td>
                    </tr>

                    <tr>
                      <td className="border p-2">HRA</td>
                      <td className="border p-2">{formatCurrency(summary?.totalHra)}</td>
                      <td className="border p-2">TDS</td>
                      <td className="border p-2">{formatCurrency(summary?.totalTds)}</td>
                    </tr>

                    <tr>
                      <td className="border p-2">Conveyance</td>
                      <td className="border p-2">{formatCurrency(summary?.totalConveyance)}</td>
                      <td className="border p-2">Professional Tax</td>
                      <td className="border p-2">{formatCurrency(summary?.totalProfessionalTax)}</td>
                    </tr>

                    <tr>
                      <td className="border p-2">Medical Allowance</td>
                      <td className="border p-2">{formatCurrency(summary?.totalMedical)}</td>
                      <td className="border p-2">ESI</td>
                      <td className="border p-2">{formatCurrency(summary?.totalEsi)}</td>
                    </tr>

                    <tr>
                      <td className="border p-2">Other Allowance</td>
                      <td className="border p-2">{formatCurrency(summary?.totalOtherAllowance)}</td>
                      <td className="border p-2">LOP</td>
                      <td className="border p-2">{formatCurrency(summary?.totalLop)}</td>
                    </tr>

                    <tr>
                      <td className="border p-2">Bonus</td>
                      <td className="border p-2">{formatCurrency(summary?.totalBonus)}</td>
                      {/* <td className="border p-2">Variable Pay</td>
                      <td className="border p-2">{formatCurrency(summary?.)}</td> */}
                      
                    </tr>

                    <tr>
                      <td className="border p-2">Incentive</td>
                      <td className="border p-2">{formatCurrency(summary?.totalIncentive)}</td>
                      <td className="border p-2"></td>
                      <td className="border p-2"></td>
                    </tr>

                    <tr>
                      <td className="border p-2">Stipend</td>
                      <td className="border p-2">{formatCurrency(summary?.totalStipend)}</td>
                      <td className="border p-2"></td>
                      <td className="border p-2"></td>
                    </tr>
                  </>
                )}

                <tr className="font-bold">
                  <td className="border p-2">Total</td>
                  <td className="border p-2">
                    {formatCurrency(
                      viewMode === "monthly"
                        ? payslip?.grossSalary
                        : summary?.totalGrossSalary
                    )}
                  </td>

                  <td className="border p-2">Total Deduction</td>
                  <td className="border p-2">
                    {formatCurrency(
                      viewMode === "monthly"
                        ? Number(payslip?.grossSalary) - Number(payslip?.netSalary)
                        : Number(summary?.totalGrossSalary) - Number(summary?.totalNetSalary)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* NET */}
            <div className="mt-4 font-bold">
              Net Salary:{" "}
              {formatCurrency(
                viewMode === "monthly"
                  ? payslip?.netSalary
                  : summary?.totalNetSalary
              )}
            </div>

            <div className="mt-2 text-m italic">
              In Words:{" "}
              {numberToWords(
                viewMode === "monthly"
                  ? Number(payslip?.netSalary || 0)
                  : Number(summary?.totalNetSalary || 0)
              )}{" "}
              ONLY
            </div>

            <div className="flex justify-between mt-8 text-m">
              <div>Employee Signature: ______________________</div>
              <div>This payslip is computer generated</div>
            </div>
          </div>
        )}

      {viewMode === "yearly" && loading && (
        <div className="text-center mt-4">Loading summary...</div>
      )}
    </div>
  );
};

export default PayrollView;