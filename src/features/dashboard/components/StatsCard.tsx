import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/Card';

/* 1️⃣ Export the variant type */
export type StatsCardVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'info'
  | 'destructive';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: StatsCardVariant;
}

/* 2️⃣ Move this outside component */
const VARIANT_STYLES: Record<StatsCardVariant, string> = {
  default: 'text-slate-600 bg-slate-100 border-slate-200',
  primary: 'text-blue-600 bg-blue-50 border-blue-100',
  success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  warning: 'text-orange-600 bg-orange-50 border-orange-100',
  info: 'text-cyan-600 bg-cyan-50 border-cyan-100',
  destructive: 'text-red-600 bg-red-50 border-red-100',
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: StatsCardProps) {
  const variantClass =
    VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between pb-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            {title}
          </p>
          <div className={`p-2 rounded-lg border ${variantClass}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-col">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}