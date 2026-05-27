import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/Select';
import { Card, CardContent } from '@/shared/components/Card';

interface DashboardFiltersProps {
  filters: {
    month: string;
    year: string;
    department: string;
    leaveType: string;
    manager: string;
  };
  updateFilter: (
    key: keyof DashboardFiltersProps["filters"],
    value: string
  ) => void;

}

export default function DashboardFilters({ filters, updateFilter }: DashboardFiltersProps) {

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardContent className="py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
            <div className="bg-slate-100 p-1.5 rounded-md">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Filters
            </span>
          </div>

          {/* Month Filter */}
          <Select
            value={filters.month}
            onValueChange={(v) => updateFilter('month', v)}
          >
            <SelectTrigger className="w-35 h-9">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {/* {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))} */}
            </SelectContent>
          </Select>

          {/* Year Filter */}
          <Select
            value={filters.year}
            onValueChange={(v) => updateFilter('year', v)}
          >
            <SelectTrigger className="w-27.5 h-9">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>

          {/* Department Filter
          <Select 
            value={filters.department} 
            onValueChange={(v) => updateFilter('department', v)}
          >
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}

          {/* Leave Type Filter */}
          <Select
            value={filters.leaveType}
            onValueChange={(v) => updateFilter('leaveType', v)}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Leave Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="sick">Sick</SelectItem>
              <SelectItem value="earned">Earned</SelectItem>
              <SelectItem value="comp_off">Comp Off</SelectItem>
              <SelectItem value="loss_of_pay">Loss of Pay</SelectItem>
            </SelectContent>
          </Select>

          {/* Manager Filter */}
          {/* <Select 
            value={filters.manager} 
            onValueChange={(v) => updateFilter('manager', v)}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Manager" />
            </SelectTrigger> 
            <SelectContent>
              <SelectItem value="all">All Managers</SelectItem>
              {managerTrackingData.map((m) => (
                <SelectItem key={m.name} value={m.name}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
        </div>
      </CardContent>
    </Card>
  );
}