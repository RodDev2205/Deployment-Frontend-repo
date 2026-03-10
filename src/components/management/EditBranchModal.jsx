import { useState, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../config/api';

export default function EditBranchModal({ isOpen, onClose, branch, onSubmit }) {
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [loading, setLoading] = useState(false);
  const { success, error: alertError } = useAlert();

  // 🔥 Prefill form when modal opens
  useEffect(() => {
    if (branch) {
      setBranchName(branch.branchName || branch.name || "");
      setAddress(branch.address || "");
      setContact(branch.contact || "");
      setOpeningTime(branch.openingTime || "");
      setClosingTime(branch.closingTime || "");
    }
  }, [branch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/branches/${branch.branch_id}`,
        {
          method: "PUT", // or PATCH if your backend prefers
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            branchName,
            address,
            contact,
            openingTime,
            closingTime,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alertError("Error", data.message || "Failed to update branch");
        return;
      }

      success("Success", "Branch updated successfully ✅");

      if (onSubmit) {
        onSubmit(data.branch);
      }

      onClose();
    } catch (err) {
      console.error(err);
      alertError("Server Error", "Server error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !branch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Edit Branch</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Branch Name</h3>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2"
          />

          <h3 className="text-sm font-medium text-gray-700">Address</h3>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            required
            className="w-full rounded-lg border px-3 py-2"
          />

          <h3 className="text-sm font-medium text-gray-700">Contact Number</h3>
          <input
            type="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2"
          />

          <h3 className="text-sm font-medium text-gray-700">Operating Time</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              required
              className="rounded-lg border px-3 py-2"
            />
            <input
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              required
              className="rounded-lg border px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
