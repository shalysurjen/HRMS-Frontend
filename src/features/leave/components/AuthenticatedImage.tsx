import api from "@/services/apiClient";
import { useEffect, useState } from "react";

interface AuthenticatedImageProps {
    fileUrl: string;
    className?: string;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({ fileUrl, className }) => {
    const [imgSrc, setImgSrc] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/v1/files/view?path=${encodeURIComponent(fileUrl)}`, {
                    responseType: "blob",
                });

                // Convert the raw data into a local URL the browser can display
                const url = URL.createObjectURL(response.data);
                setImgSrc(url);
            } catch (error) {
                console.error("Error fetching image:", error);
                setImgSrc("https://via.placeholder.com/300?text=Error+Loading+Image");
            } finally {
                setLoading(false);
            }
        };

        if (fileUrl) fetchImage();

        // Cleanup the URL when component unmounts to save memory
        return () => {
            if (imgSrc) URL.revokeObjectURL(imgSrc);
        };
    }, [fileUrl]);

    if (loading) return <div className="p-10 animate-pulse bg-slate-200 rounded-lg">Loading secure image...</div>;

    return <img src={imgSrc} alt="Attachment" className={className} />;
};

export default AuthenticatedImage;