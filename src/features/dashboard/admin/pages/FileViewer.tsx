import api from "@/services/apiClient";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const FileViewer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const id = location.state?.id;

  useEffect(() => {
    if (!id) {
      alert("Invalid file request");
      navigate(-1);
      return;
    }

    const openFile = async () => {
      try {
        // ✅ IMPORTANT: await + blob response
        const response = await api.get(`/policies/view/${id}`, {
          responseType: "blob", // 🔥 VERY IMPORTANT
          withCredentials: true, // 🔥 sends cookies automatically
        });

        console.log("STATUS:", response.status);

        // ✅ Axios success
        const fileURL = window.URL.createObjectURL(response.data);
        window.open(fileURL, "_blank");

      } catch (err: any) {
        console.error("FILE ERROR:", err);

        // ✅ Axios error handling
        if (err.response?.status === 401) {
          alert("Unauthorized. Please login again.");
          navigate("/login");
        } else {
          alert("Failed to load file");
        }
      }
    };

    openFile();
  }, [id, navigate]);

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={() => navigate(-1)}>⬅ Back</button>
      <h3>Opening document...</h3>
    </div>
  );
};

export default FileViewer;