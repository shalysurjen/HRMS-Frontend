import { useMemo, useState } from "react";

export const useFilters = () => {

    const [loading, ] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        month: 'all',
        year: '2026',
        department: 'all',
        leaveType: 'all',
        manager: 'all',
    });

    const updateFilter = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const stats = useMemo(() => ({
        topDepartment: null,
        topApprover: null,
        topPending: null,
    }), []);
    return {
        loading,
        error,
        setError,
        filters,
        updateFilter,
        stats,


    }
}