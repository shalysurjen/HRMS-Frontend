import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/Card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import type { DepartmentStat } from '../hooks/useHRDashboard';

interface DepartmentChartProps {
  data: DepartmentStat[];
  topDepartment?: string;
}

export default function DepartmentChart({ data, topDepartment }: DepartmentChartProps) {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Team Structure
        </CardTitle>
        <CardDescription className="text-[11px] text-slate-500">
          Largest team:{' '}
          <span className="font-bold text-slate-900">{topDepartment ?? 'N/A'}</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="h-62.5 flex items-center justify-center text-slate-400 text-sm">
            No team data available
          </div>
        ) : (
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ left: -10, right: 20, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="department"
                  width={100}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value} members`, 'Team Size']}
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="members" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}








// import { BarChart3 } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { departmentLeaveData } from '../data/mockData';

// export function DepartmentChart({ topDepartment }: any) {
//   // Fix: Extract string if topDepartment is an object, or provide fallback
//   const displayValue = typeof topDepartment === 'object'
//     ? topDepartment?.department
//     : topDepartment;

//   return (
//     <Card className="border-none shadow-none bg-transparent">
//       <CardHeader className="pb-2">
//         <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
//           <BarChart3 className="h-4 w-4 text-blue-600" />
//           Department-wise Leaves
//         </CardTitle>
//         <CardDescription className="text-[11px] text-slate-500">
//           Highest: <span className="font-bold text-slate-900">{displayValue || "N/A"}</span>
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         {/* Using h-[250px] for standard tailwind height consistency */}
//         <div className="h-62.5 w-full">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart
//               data={departmentLeaveData}
//               layout="vertical"
//               margin={{ left: -10, right: 20, top: 0, bottom: 0 }}
//             >
//               <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
//               <XAxis type="number" hide />
//               <YAxis
//                 type="category"
//                 dataKey="department"
//                 width={80}
//                 tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
//                 axisLine={false}
//                 tickLine={false}
//               />
//               <Tooltip
//                 cursor={{ fill: '#f8fafc' }}
//                 contentStyle={{
//                   borderRadius: '8px',
//                   border: '1px solid #e2e8f0',
//                   boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
//                 }}
//               />
//               <Bar
//                 dataKey="leaves"
//                 fill="#2563eb"
//                 radius={[0, 4, 4, 0]}
//                 barSize={14}
//               />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }