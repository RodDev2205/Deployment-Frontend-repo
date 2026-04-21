import { useEffect, useState } from "react";
import { X, UserPlus, Eye, EyeOff } from "lucide-react";
import API_BASE_URL from "../../config/api";
import { useAlert } from "../../context/AlertContext";

export default function AddAdminModal({ isOpen, onClose, onSubmit }) {
  const { success, error } = useAlert();
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    username: "",
    password: "",
    branch_id: "",
    contact_number: "",
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

    try {
      const token = localStorage.getItem("token");

      const payload = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        username: formData.username,
        password: formData.password,
        branch_id: formData.branch_id,
        contact_number: formData.contact_number,
      };
      const res = await fetch(`${API_BASE_URL}/api/superadmin/createCashier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create cashier");
      }

      success("Success", "Cashier created successfully!", () => {
        // Find the branch name from branch_id
        const selectedBranch = branches.find(b => b.branch_id === formData.branch_id);
        
        // Cache the middle_name to preserve it (backend may not store it)
        const cacheKey = `user_${formData.username}_middle_name`;
        if (formData.middle_name) {
          localStorage.setItem(cacheKey, formData.middle_name);
        }
        
        // Extract the correct user ID from backend response - check multiple possible locations
        const userId = data.user?.user_id || data.user?.id || data?.user_id || data?.id || data?.cashierId || data?.user?._id;
        
        // Pass the created user data (with middle_name) to parent component
        const newCashier = {
          ...data.user,
          id: userId,
          user_id: userId,
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          username: formData.username,
          branch_id: formData.branch_id,
          branch: selectedBranch?.branch_name || "",
          contact_number: formData.contact_number,
          status: data.user?.status || "Activate",
          role_name: data.user?.role_name || "Cashier",
        };
        if (onSubmit) onSubmit(newCashier);
        onClose();
        // Reset form
        setFormData({
          first_name: "",
          middle_name: "",
          last_name: "",
          username: "",
          password: "",
          branch_id: "",
          contact_number: "",
        });
      });
    } catch (err) {
      console.error(err);
      error("Error", err.message);
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
            Create Cashier
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* First, Middle & Last Name */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Middle Initial
              </label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                placeholder=""
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              />
            </div>
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-green-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contact Number
            </label>
            <input
              type="tel"
              name="contact_number"
              value={formData.contact_number}
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
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 font-medium text-white ${
                loadingSubmit
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              disabled={loadingSubmit}
            >
              {loadingSubmit ? "Creating..." : "Create Cashier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
