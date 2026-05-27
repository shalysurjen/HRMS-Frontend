import { useEffect, useState, useRef } from "react";
import {
  uploadPolicy,
  getPolicies,
  deletePolicyAPI,
    previewPolicyFile  
} from "../services/policyService";
import "../style/policy.css";


interface Policy {
  id: number;
  name: string;
  fileName: string;
}

/* GROUP BY NAME */
const groupPolicies = (data: Policy[]) => {
  const map = new Map<string, Policy[]>();
  data.forEach((p) => {
    if (!map.has(p.name)) map.set(p.name, []);
    map.get(p.name)?.push(p);
  });
  return map;
};

const PolicyConfig = () => {
  const [policyName, setPolicyName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    const data = await getPolicies();
    setPolicies(data || []);
  };

  const handleUpload = async () => {
    if (!policyName || !file) return alert("Fill all fields");

    await uploadPolicy(policyName, file);

    setPolicyName("");
    setFile(null);
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";

    loadPolicies();
  };

  const handleEdit = (p: Policy) => {
    setPolicyName(p.name);
    setEditingId(p.id);
    setOpenMenu(null);
  };

  const handleDelete = async (id: number) => {
    await deletePolicyAPI(id);
    loadPolicies();
  };

  const grouped = groupPolicies(policies);
  const latest = Array.from(grouped.values()).map((g) => g[0]);

  return (
    <div className="policy-page">
      <div className="page-wrapper">
        <div className="container">

          <h2 className="page-title">Admin - Policy Configuration</h2>

          {/* FORM */}
          <div className="form-section">
            <label className="form-label">Policy Type</label>

            <input
              className="form-input"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              placeholder="Enter policy name"
            />

            <div className="file-upload-row">
              <label className="custom-file-label">
                {file ? file.name : "Choose PDF file"}
                <input
                  type="file"
                  hidden
                  ref={fileRef}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>

              <button className="btn-upload" onClick={handleUpload}>
                {editingId ? "Update" : "Upload"}
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="table-wrapper">
            <table className="policy-table">
              <thead>
                <tr>
                  <th>Policy Name</th>
                  <th>Latest File</th>
                  <th>Versions</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {latest.map((p) => {
                  const versions = grouped.get(p.name) || [];

                  return (
                    <>
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.fileName}</td>

                        <td>
                          <span className="version-badge">
                            {versions.length}
                          </span>
                        </td>

                        <td className="action-cell">
                          <button
                            className="dots-btn"
                            onClick={() =>
                              setOpenMenu(openMenu === p.name ? null : p.name)
                            }
                          >
                            ⋮
                          </button>

                          {openMenu === p.name && (
                            <div className="action-menu">
                              <button
                                onClick={() => {
                                  setViewOpen(
                                    viewOpen === p.name ? null : p.name
                                  );
                                  setOpenMenu(null);
                                }}
                              >
                                👁 View
                              </button>

                              <button onClick={() => handleEdit(p)}>
                                ✏ Edit
                              </button>

                              <button
                                className="delete"
                                onClick={() => handleDelete(p.id)}
                              >
                                🗑 Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* ✅ VIEW SECTION */}
                      {viewOpen === p.name && (
                        <tr className="view-row">
                          <td colSpan={4}>
                            <div className="view-box">
                              {versions.map((v) => (
                              <div
  key={v.id}
  className="doc-row clickable"
  onClick={() =>
     previewPolicyFile(v.id)
  }
>
  📄 {v.fileName}
</div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PolicyConfig;