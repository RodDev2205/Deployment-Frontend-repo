import { useState } from "react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../config/api';

// 1. Added onSubmit to the props destructuring
export default function AddBranchModal({ isOpen, onClose, onSubmit }) {
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [loading, setLoading] = useState(false);
  const { success, error: alertError } = useAlert();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/branches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          branchName, // This is what the backend receives
          address,
          contact,
          openingTime,
          closingTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alertError("Error", data.message || "Failed to add branch");
        return;
      }

      success("Branch Added", "Branch added successfully ✅");

      // 2. Trigger the parent refresh. 
      // If your backend returns the new branch in 'data.branch', pass that.
      // Otherwise, just call fetchBranches in the parent.
      if (onSubmit) {
        onSubmit(data.branch); 
      }

      // Reset form
      setBranchName("");
      setAddress("");
      setContact("");
      setOpeningTime("");
      setClosingTime("");
      onClose();

    } catch (err) {
      console.error(err);
      alertError("Server Error", "Server error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Add New Branch</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Branch Name</h3>
          <input
            type="text"
            placeholder="Branch Name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2"
          />
          {/* ... other inputs remain the same ... */}
          <h3 className="text-sm font-medium text-gray-700">Address</h3>
          <textarea
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            required
            className="w-full rounded-lg border px-3 py-2"
          />
          <h3 className="text-sm font-medium text-gray-700">Contact Number</h3>
          <input
            type="tel"
            placeholder="Contact Number"
            value={contact}
            onChange={(e) => setContact(e.target.value.replace(/[^0-9]/g, ""))}
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
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}