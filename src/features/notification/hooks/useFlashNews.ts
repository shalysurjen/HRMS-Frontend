import { notificationService } from "@/features/notification/services/notificationService";
import type { FlashNews, FlashNewsRequest } from "@/features/notification/types";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export const useFlashNews = () => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createFlashNewsController = async (data: FlashNewsRequest) => {
        setLoading(true);
        try {
            await notificationService.createFlashNews(data);

            toast.success("Flash news created successfully!");

            return true;

        } catch (err: any) {
            setError(err.message || "Failed to create flash news");
            return false;
        } finally {
            setLoading(false);
        }
    };


    const fetchFlashNews = useCallback(async (): Promise<FlashNews[]> => {
        setLoading(true);
        setError(null);
        try {
            const res = await notificationService.getFlashNews();
            return res;
        } catch (e: any) {
            const errorMsg = "Failed to fetch FlashNews";
            setError(errorMsg);
            return [];
        }
        finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error, setError,
        createFlashNewsController,
        fetchFlashNews,
    }
}