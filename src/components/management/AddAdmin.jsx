import { useEffect, useState } from "react";
import { X, UserPlus } from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export default function AddAdminModal({ isOpen, onClose, onSubmit }) {
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    password: "",
    branch_id: "",
  });

  // 🔹 Fetch branches when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE_URL}/api/branches/getAll`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch branches");

        const data = await res.json();
        setBranches(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/superadmin/createAdmin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create admin");
      }

      console.log("Admin created:", data);

      if (onSubmit) onSubmit();

      onClose();

      // Reset form
      setFormData({
        full_name: "",
        username: "",
        password: "",
        branch_id: "",
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center text-lg font-semibold text-gray-800">
            <UserPlus className="mr-2 h-5 w-5 text-green-600" />
            Create Admin
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <p className="text-red-500 text-sm">{errorMsg}</p>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Branch Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Branch
            </label>
            <select
              name="branch_id"
              required
              value={formData.branch_id}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:outline-none"
            >
              <option value="" disabled>
                {loadingBranches ? "Loading branches..." : "Select a branch"}
              </option>

              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-gray-600 hover:bg-gray-100"
              disabled={loadingSubmit}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 font-medium text-white ${
                loadingSubmit
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              disabled={loadingSubmit}
            >
              {loadingSubmit ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
