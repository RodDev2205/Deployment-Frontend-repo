import { X } from "lucide-react";
import { useEffect } from "react";

export default function ViewUserModal({ isOpen, onClose, user, onEdit }) {
   useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 🔥 Placeholder data
  const placeholderUser = {
    fullName: "Juan Dela Cruz",
    username: "juan_admin",
    email: "juan@email.com",
    contact: "09123456789",
    role: "Branch Admin",
    branch: "Makati Branch",
    status: "Active",
    createdAt: "Feb 10, 2026",
    lastLogin: "Feb 15, 2026",
    createdBy: "Superadmin",
  };

  const userData = user || placeholderUser;

  const displayValue = (value) =>
    value === null || value === undefined || value === "" ? "N/A" : value;

  const statusColors = {
    Active: "bg-green-100 text-green-700",
    Inactive: "bg-red-100 text-red-700",
    Suspended: "bg-orange-100 text-orange-700",
  };

  const roleColors = {
    Superadmin: "bg-purple-100 text-purple-700",
    "Branch Admin": "bg-blue-100 text-blue-700",
    Cashier: "bg-gray-100 text-gray-700",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-xl font-semibold">View User</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="mt-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              roleColors[userData.role_id] || "bg-gray-100 text-gray-700"
            }`}
          >
            {displayValue(userData.role)}
          </span>
        </div>

        {/* Basic Info */}
        <div className="mt-6">
          <h3 className="text-gray-600 font-semibold mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <span className="text-gray-500">Full Name:</span>
            <span className="font-medium">{displayValue(userData.name)}</span>

            <span className="text-gray-500">Username:</span>
            <span className="font-medium">{displayValue(userData.username)}</span>

            <span className="text-gray-500">Contact:</span>
            <span className="font-medium">{displayValue(userData.contact)}</span>
          </div>
        </div>

        {/* Role & Access */}
        <div className="mt-8">
          <h3 className="text-gray-600 font-semibold mb-3">Role & Access</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <span className="text-gray-500">Branch:</span>
            <span className="font-medium">{displayValue(userData.branch)}</span>

            <span className="text-gray-500">Account Status:</span>
            <span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusColors[userData.status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {displayValue(userData.status)}
              </span>
            </span>
          </div>
        </div>

        {/* Activity Info */}
        <div className="mt-8">
          <h3 className="text-gray-600 font-semibold mb-3">
            Activity Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <span className="text-gray-500">Created At:</span>
            <span className="font-medium">{displayValue(userData.createdAt)}</span>

            <span className="text-gray-500">Created By:</span>
            <span className="font-medium">{displayValue(userData.createdBy)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col sm:flex-row justify-end gap-3 border-t pt-4">
        </div>
      </div>
    </div>
  );
}
