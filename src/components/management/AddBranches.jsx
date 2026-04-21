import { useState } from "react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../config/api';
import { ChevronDown, X } from "lucide-react";

export default function AddBranchModal({ isOpen, onClose, onSubmit }) {
  const [branchName, setBranchName] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { success, error: alertError } = useAlert();

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDay = (day) => {
    setSelectedDays([day]);
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location.trim()) {
      alertError("Validation Error", "Please enter a location");
      return;
    }

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
          branchName,
          openingTime,
          closingTime,
          locationText: location,
          operatingDays: selectedDays,
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
      setOpeningTime("");
      setClosingTime("");
      setLocation("");
      setSelectedDays([]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-lg font-semibold">Add New Branch</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Branch Name</h3>
          <input
            type="text"
            placeholder="Branch Name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:border-gray-400"
          />

          <div>
            <h3 className="text-sm font-medium text-gray-700">Location</h3>
            <p className="text-xs text-gray-500">Enter the branch location.</p>
          </div>
          <input
            type="text"
            placeholder="e.g., Zamboanga City, Zamboanga del Sur, Philippines"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:border-gray-400"
          />
          <h3 className="text-sm font-medium text-gray-700 mb-4">Operating Time</h3>
          <div className="grid grid-cols-3 gap-4">
            {/* Days Selection - Custom Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-3">Days</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:border-gray-400"
                >
                  <span className="text-sm">{selectedDays.length > 0 ? selectedDays[0] : 'Select a day'}</span>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown List */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 grid grid-cols-2 gap-2 p-2">
                    {days.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`text-left px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors ${
                          selectedDays.includes(day)
                            ? "bg-emerald-100 text-emerald-900 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        <span className="text-sm">{day}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-3">Start Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:border-gray-400"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-3">End Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:border-gray-400"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-6">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}