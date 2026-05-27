  import type { LucideIcon } from 'lucide-react';
  import {
    Users,
    CheckCircle2,
    CalendarClock,
    Clock,
  } from 'lucide-react';
  import type { StatsCardVariant } from '../components/StatsCard';
import StatsCard from '../components/StatsCard';

  interface SummarySectionProps {
    totalEmployees: number;
    activeEmployees: number;
    employeesOnLeaveToday: number;
    totalPendingLeaves: number;
    totalApprovedLeaves: number;
  }

  interface SummaryItem {
    title: string;
    value: number;
    subtitle: string;
    icon: LucideIcon;
    variant: StatsCardVariant;
  }

  export default function SummarySection({
    totalEmployees,
    activeEmployees,
    employeesOnLeaveToday,
    totalPendingLeaves,
    totalApprovedLeaves,
  }: SummarySectionProps) {

    const summaryData: SummaryItem[] = [
      {
        title: 'Total Employees',
        value: totalEmployees,
        subtitle: 'All registered employees',
        icon: Users,
        variant: 'primary',
      },
      {
        title: 'Active Employees',
        value: activeEmployees,
        subtitle: 'Currently active workforce',
        icon: Users,
        variant: 'info',
      },
      {
        title: 'Pending Leaves',
        value: totalPendingLeaves,
        subtitle: 'Awaiting approval',
        icon: Clock,
        variant: 'warning',
      },
      {
        title: 'Approved Leaves',
        value: totalApprovedLeaves,
        subtitle: 'Successfully approved',
        icon: CheckCircle2,
        variant: 'success',
      },
      {
        title: 'On Leave Today',
        value: employeesOnLeaveToday,
        subtitle: 'Employees absent today',
        icon: CalendarClock,
        variant: 'destructive',
      },
    ];

    return (
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {summaryData.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            variant={stat.variant}
          />
        ))}
      </section>
    );
  }