import { useState, useEffect } from 'react';
import api from '@/services/apiClient';

export const useAuthenticatedImage = (path: string | null | undefined) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!path) {
            setImageUrl(null);
            return;
        }

        let objectUrl: string | null = null;
        const fetchImage = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(
                    `/v1/documents/view?path=${encodeURIComponent(path)}`,
                    { responseType: "blob" }
                );

                const blob = new Blob([response.data], {
                    type: (response.headers["content-type"] as string) || 'image/jpeg',
                });
                
                objectUrl = URL.createObjectURL(blob);
                setImageUrl(objectUrl);
                setError(null);
            } catch (err) {
                console.error("Error loading authenticated image:", err);
                setError(err);
                setImageUrl(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchImage();

        // CLEANUP: This is vital to prevent memory leaks
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [path]);

    return { imageUrl, isLoading, error };
};