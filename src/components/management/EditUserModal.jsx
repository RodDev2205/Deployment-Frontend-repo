import { useEffect, useState } from "react";
import { useAlert } from "@/context/AlertContext";
import { X, UserPlus, Eye, EyeOff } from "lucide-react";
import API_BASE_URL from '../../config/api';

export default function EditUserModal({ isOpen, onClose, user, role, onUpdate }) {
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { error: alertError, success } = useAlert();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    branch_id: "",
    contact_number: "",
  });

  /* ================= FETCH BRANCHES ================= */
  useEffect(() => {
    if (!isOpen) return;
    setLoadingBranches(true);

    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/branches/getAll`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch branches");
        const data = await res.json();
        setBranches(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [isOpen]);

  /* ================= PREFILL DATA ================= */
  useEffect(() => {
    if (!isOpen || !user || branches.length === 0) return;

    const resolvedBranchId =
      user.branch_id ||
      branches.find((b) => b.branch_name === user.branch)?.branch_id ||
      "";

    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
      password: "",
      branch_id: resolvedBranchId,
      contact_number: user.contact_number || "",
    });
  }, [isOpen, user, branches]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setErrorMsg("");

    try {
      const { first_name, last_name, username, branch_id, password, contact_number } = formData;

      if (!first_name || !last_name || !username || !branch_id) {
        throw new Error("First, last name, username, and branch are required");
      }

      const token = localStorage.getItem("token");
      const payload = { first_name, last_name, username, branch_id };
      if (password) payload.password = password;
      if (contact_number) payload.contact_number = contact_number;

      const userId = user.id || user.user_id;
      const res = await fetch(`${API_BASE_URL}/api/users/user/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Backend error:", data);
        throw new Error(data.error || data.message || "Failed to update user");
      }

      onUpdate?.(data.user || { ...user, ...payload });
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
      alertError("Error", err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center text-lg font-semibold text-gray-800">
            <UserPlus className="mr-2 h-5 w-5 text-green-600" />
            Edit {role}
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">New Password (optional)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-green-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              type="text"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              placeholder="(optional)"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Branch</label>
            <select
              name="branch_id"
              value={formData.branch_id}
              onChange={handleChange}
              required
              disabled={loadingBranches}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:outline-none"
            >
              <option value="" disabled>{loadingBranches ? "Loading branches..." : "Select a branch"}</option>
              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-gray-600 hover:bg-gray-100" disabled={loadingSubmit}>
              Cancel
            </button>
            <button type="submit" disabled={loadingSubmit} className={`rounded-lg px-4 py-2 font-medium text-white ${loadingSubmit ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>
              {loadingSubmit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
