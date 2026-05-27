// import { useCallback, useEffect, useRef, useState } from 'react';
// import { Users, Search, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
// import { employeeService, type Employee, type EmployeePageResponse } from '../../services/employeeService';
// import {  Card, CardContent, CardHeader } from '@mui/material';
// import { CardDescription, CardTitle } from '@/shared/components/Card';
// import { Badge } from '@/shared/components';

// // ─── Role Badge ───────────────────────────────────────────────────
// function RoleBadge({ role }: { role: string }) {
//   const styles: Record<string, string> = {
//     HR:       'bg-purple-50 text-purple-600 border-purple-100',
//     MANAGER:  'bg-blue-50 text-blue-600 border-blue-100',
//     EMPLOYEE: 'bg-slate-100 text-slate-600 border-slate-200',
//     ADMIN:    'bg-rose-50 text-rose-600 border-rose-100',
//   };
//   return (
//     <Badge className={`font-bold px-3 ${styles[role] ?? styles.EMPLOYEE}`}>
//       {role}
//     </Badge>
//   );
// }

// // ─── Status Badge ─────────────────────────────────────────────────
// function StatusBadge({ status }: { status: string }) {
//   const isPending = status?.toUpperCase() === 'PENDING';
//   return (
//     <Badge className={`font-bold px-2 text-[10px] border-none ${
//       isPending ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
//     }`}>
//       {status}
//     </Badge>
//   );
// }

// // ─── Skeleton Row ─────────────────────────────────────────────────
// const SkeletonRow = () => (
//   <tr>
//     {Array.from({ length: 8 }).map((_, i) => (
//       <td key={i} className="py-3 px-3">
//         <div className="h-3 bg-slate-200 rounded animate-pulse w-full" />
//       </td>
//     ))}
//   </tr>
// );

// // ─── Employee Row ─────────────────────────────────────────────────
// function EmployeeRow({ emp, allEmployees }: { emp: Employee; allEmployees: Employee[] }) {
//   const getManagerName = (managerId: number | null) => {
//     if (!managerId) return '—';
//     const manager = allEmployees.find(e => e.id === managerId);
//     return manager?.name || `#${managerId}`;
//   };
//   return (
//     <tr className="hover:bg-slate-50/80 transition-colors">
//       <td className="py-3 px-3 text-xs text-slate-400 font-medium">#{emp.id}</td>
//       <td className="py-3 px-3">
//         <div className="flex items-center gap-2">
//           <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center
//             justify-center text-white text-xs font-bold shrink-0">
//             {emp.name.charAt(0)}
//           </div>
//           <p className="font-semibold text-slate-700 text-sm">{emp.name}</p>
//         </div>
//       </td>
//       <td className="py-3 px-3 text-center"><RoleBadge role={emp.role} /></td>
//       <td className="py-3 px-3 text-center">
//         {emp.managerId != null ? (
//           <div className="flex flex-col items-center gap-0.5">
//             <span className="text-xs font-semibold text-slate-700">{getManagerName(emp.managerId)}</span>
//             <span className="text-[10px] text-slate-400">#{emp.managerId}</span>
//           </div>
//         ) : (
//           <span className="text-slate-400">—</span>
//         )}
//       </td>
//       <td className="py-3 px-3 text-center">
//         <Badge className={`font-bold px-3 border-none ${
//           emp.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
//         }`}>
//           {emp.active ? 'Active' : 'Inactive'}
//         </Badge>
//       </td>
//       <td className="py-3 px-3 text-center text-slate-500 text-xs font-medium">
//         {new Date(emp.joiningDate).toLocaleDateString('en-IN', {
//           day: '2-digit', month: 'short', year: 'numeric',
//         })}
//       </td>
//       <td className="py-3 px-3 text-center"><StatusBadge status={emp.biometricStatus} /></td>
//       <td className="py-3 px-3 text-center"><StatusBadge status={emp.vpnStatus} /></td>
//     </tr>
//   );
// }

// // ─── Main Page ────────────────────────────────────────────────────
// export function HREmployeesPage() {
//   // Paginated data (normal mode)
//   const [pageData, setPageData]         = useState<EmployeePageResponse | null>(null);
//   // Search results (search mode)
//   const [searchResults, setSearchResults] = useState<Employee[] | null>(null);

//   const [loading, setLoading]           = useState(true);
//   const [error, setError]               = useState<string | null>(null);
//   const [currentPage, setCurrentPage]   = useState(0);

//   // Search input
//   const [search, setSearch]             = useState('');
//   const [searchInput, setSearchInput]   = useState(''); // live input
//   const searchTimeout                   = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // Client-side filters (applied on top of search results or page data)
//   const [roleFilter, setRoleFilter]     = useState('all');
//   const [statusFilter, setStatusFilter] = useState('all');

//   const isMounted = useRef(false);

//   // All employees for manager name lookup
//   const [allEmployees, setAllEmployees] = useState<Employee[]>([]);


//   // ─── Fetch all employees for manager name ──────────────────────
//   useEffect(() => {
//     const loadAll = async () => {
//       try {
//         const data = await employeeService.getAllEmployeesHR(0, 1000);
//         setAllEmployees(data.content);
//       } catch {
//         // silent
//       }
//     };
//     loadAll();
//   }, []);

//   // ─── Load paginated data ────────────────────────────────────────
//   const loadEmployees = useCallback(async (page: number) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await employeeService.getAllEmployees(page, 10);
//       if (isMounted.current) {
//         setPageData(data);
//         setSearchResults(null); // clear search mode
//       }
//     } catch (err) {
//       if (isMounted.current) {
//         setError(err instanceof Error ? err.message : 'Failed to load employees');
//       }
//     } finally {
//       if (isMounted.current) setLoading(false);
//     }
//   }, []);

//   // ─── Search via backend ─────────────────────────────────────────
//   const doSearch = useCallback(async (query: string) => {
//     if (!query.trim()) {
//       // Empty search → back to normal paginated mode
//       setSearch('');
//       setSearchResults(null);
//       loadEmployees(0);
//       setCurrentPage(0);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const results = await employeeService.searchEmployees(query.trim());
//       if (isMounted.current) {
//         setSearchResults(results);
//         setPageData(null); // clear pagination mode
//       }
//     } catch (err) {
//       if (isMounted.current) {
//         setError(err instanceof Error ? err.message : 'Search failed');
//       }
//     } finally {
//       if (isMounted.current) setLoading(false);
//     }
//   }, [loadEmployees]);

//   // ─── Fetch all employees for manager name lookup ───────────────
//   useEffect(() => {
//     const loadAll = async () => {
//       try {
//         const data = await employeeService.getAllEmployees(0, 1000);
//         setAllEmployees(data.content);
//       } catch {
//         // silent
//       }
//     };
//     loadAll();
//   }, []);

//   // ─── Initial load ───────────────────────────────────────────────
//   useEffect(() => {
//     isMounted.current = true;
//     const timer = setTimeout(() => {
//       if (isMounted.current) loadEmployees(currentPage);
//     }, 100);
//     return () => {
//       isMounted.current = false;
//       clearTimeout(timer);
//     };
//   }, [currentPage, loadEmployees]);

//   // ─── Debounced search input ─────────────────────────────────────
//   const handleSearchInput = (value: string) => {
//     setSearchInput(value);
//     if (searchTimeout.current) clearTimeout(searchTimeout.current);
//     searchTimeout.current = setTimeout(() => {
//       setSearch(value);
//       doSearch(value);
//     }, 400); // 400ms debounce
//   };

//   // ─── Clear search ───────────────────────────────────────────────
//   const clearSearch = () => {
//     setSearchInput('');
//     setSearch('');
//     setSearchResults(null);
//     setCurrentPage(0);
//     loadEmployees(0);
//   };

//   // ─── Get display rows — search results OR page data ────────────
//   const baseRows: Employee[] = searchResults ?? pageData?.content ?? [];

//   // Client-side role + status filter on top
//   const displayRows = baseRows.filter((emp) => {
//     const matchRole   = roleFilter === 'all' || emp.role === roleFilter;
//     const matchStatus = statusFilter === 'all'
//       || (statusFilter === 'active' ? emp.active : !emp.active);
//     return matchRole && matchStatus;
//   });

//   const isSearchMode = searchResults !== null;

//   return (
//     <Card className="border border-slate-200 shadow-sm bg-white">
//       <CardHeader className="pb-3">
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//           <div className="space-y-1">
//             <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
//               <Users className="h-4 w-4 text-blue-600" />
//               All Employees
//             </CardTitle>
//             <CardDescription className="text-xs text-slate-500">
//               {isSearchMode ? (
//                 <>
//                   Search results for{' '}
//                   <span className="font-bold text-blue-600">"{search}"</span>
//                   {' '} — {' '}
//                   <span className="font-bold text-slate-700">{displayRows.length}</span> found
//                 </>
//               ) : (
//                 <>
//                   Total:{' '}
//                   <span className="font-bold text-slate-700">
//                     {pageData?.totalElements ?? '—'}
//                   </span>{' '}
//                   employees · Page{' '}
//                   <span className="font-bold text-slate-700">
//                     {(pageData?.number ?? 0) + 1}
//                   </span>{' '}
//                   of{' '}
//                   <span className="font-bold text-slate-700">
//                     {pageData?.totalPages ?? '—'}
//                   </span>
//                 </>
//               )}
//             </CardDescription>
//           </div>

//           {/* Filters */}
//           <div className="flex flex-wrap gap-2">

//             {/* Search */}
//             <div className="relative">
//               <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
//               <input
//                 type="text"
//                 placeholder="Search name..."
//                 value={searchInput}
//                 onChange={(e) => handleSearchInput(e.target.value)}
//                 className="pl-8 pr-8 h-9 text-sm border border-slate-200 rounded-lg
//                   focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
//                   bg-white text-slate-700 w-44"
//               />
//               {searchInput && (
//                 <button
//                   onClick={clearSearch}
//                   className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
//                 >
//                   <X className="h-3.5 w-3.5" />
//                 </button>
//               )}
//             </div>

//             {/* Role Filter */}
//             <select
//               value={roleFilter}
//               onChange={(e) => setRoleFilter(e.target.value)}
//               className="h-9 px-3 text-sm border border-slate-200 rounded-lg
//                 focus:outline-none focus:ring-2 focus:ring-blue-500/20
//                 bg-white text-slate-700"
//             >
//               <option value="all">All Roles</option>
//               <option value="HR">HR</option>
//               <option value="MANAGER">Manager</option>
//               <option value="EMPLOYEE">Employee</option>
//               <option value="ADMIN">Admin</option>
//             </select>

//             {/* Status Filter */}
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="h-9 px-3 text-sm border border-slate-200 rounded-lg
//                 focus:outline-none focus:ring-2 focus:ring-blue-500/20
//                 bg-white text-slate-700"
//             >
//               <option value="all">All Status</option>
//               <option value="active">Active</option>
//               <option value="inactive">Inactive</option>
//             </select>

//             {/* Refresh */}
//             <button
//               onClick={() => isSearchMode ? doSearch(search) : loadEmployees(currentPage)}
//               disabled={loading}
//               className="h-9 px-3 border border-slate-200 rounded-lg text-slate-600
//                 hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1.5"
//             >
//               <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
//               <span className="text-xs font-medium">Refresh</span>
//             </button>
//           </div>
//         </div>
//       </CardHeader>

//       <CardContent>
//         {/* Error */}
//         {error && (
//           <div className="flex flex-col items-center justify-center py-8 gap-3">
//             <p className="text-red-500 text-sm">{error}</p>
//             <button
//               onClick={() => isSearchMode ? doSearch(search) : loadEmployees(currentPage)}
//               className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               Retry
//             </button>
//           </div>
//         )}

//         {/* Table */}
//         {!error && (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
//                   <th className="text-left py-3 px-3">ID</th>
//                   <th className="text-left py-3 px-3">Name</th>
//                   <th className="text-center py-3 px-3">Role</th>
//                   <th className="text-center py-3 px-3">Manager</th>
//                   <th className="text-center py-3 px-3">Status</th>
//                   <th className="text-center py-3 px-3">Joining Date</th>
//                   <th className="text-center py-3 px-3">Biometric</th>
//                   <th className="text-center py-3 px-3">VPN</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-50">
//                 {loading ? (
//                   Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
//                 ) : displayRows.length === 0 ? (
//                   <tr>
//                     <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
//                       {isSearchMode ? `No results found for "${search}"` : 'No employees found'}
//                     </td>
//                   </tr>
//                 ) : (
//                   displayRows.map((emp) => <EmployeeRow key={emp.id} emp={emp} allEmployees={allEmployees} />)
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Pagination — only in normal mode, not search mode */}
//         {!error && !isSearchMode && pageData && pageData.totalPages > 1 && (
//           <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
//             <p className="text-xs text-slate-400">
//               Showing{' '}
//               <span className="font-bold text-slate-600">
//                 {pageData.number * pageData.size + 1}
//               </span>{' '}
//               –{' '}
//               <span className="font-bold text-slate-600">
//                 {Math.min((pageData.number + 1) * pageData.size, pageData.totalElements)}
//               </span>{' '}
//               of{' '}
//               <span className="font-bold text-slate-600">{pageData.totalElements}</span>
//             </p>

//             <div className="flex gap-2">
//               <button
//                 disabled={pageData.first || loading}
//                 onClick={() => setCurrentPage((p) => p - 1)}
//                 className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold
//                   border border-slate-200 rounded-lg text-slate-600
//                   hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
//               >
//                 <ChevronLeft className="h-3.5 w-3.5" /> Prev
//               </button>

//               {Array.from({ length: pageData.totalPages }).map((_, i) => (
//                 <button
//                   key={i}
//                   onClick={() => setCurrentPage(i)}
//                   className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
//                     i === pageData.number
//                       ? 'bg-blue-600 text-white border-blue-600'
//                       : 'border-slate-200 text-slate-600 hover:bg-slate-50'
//                   }`}
//                 >
//                   {i + 1}
//                 </button>
//               ))}

//               <button
//                 disabled={pageData.last || loading}
//                 onClick={() => setCurrentPage((p) => p + 1)}
//                 className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold
//                   border border-slate-200 rounded-lg text-slate-600
//                   hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
//               >
//                 Next <ChevronRight className="h-3.5 w-3.5" />
//               </button>
//             </div>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }




function HREmployeesPage() {
  return (
    <div>HREmployeesPage</div>
  )
}

export default HREmployeesPage