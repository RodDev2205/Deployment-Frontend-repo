import { useState, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../config/api';
import AddLocationModal from "./AddLocationModal";

export default function EditBranchModal({ isOpen, onClose, branch, onSubmit }) {
  const [branchName, setBranchName] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [selectedContactPersonId, setSelectedContactPersonId] = useState("");
  const [adminsLoading, setAdminsLoading] = useState(false);
  const { success, error: alertError } = useAlert();

  const fetchLocations = async () => {
    setLocationLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alertError("Authentication Error", "You must be logged in to load locations.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/branches/locations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alertError("Failed to load locations", data.message || "Could not fetch locations.");
        return;
      }

      setLocations(data.locations || []);
    } catch (err) {
      console.error(err);
      alertError("Server Error", "Unable to fetch locations.");
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchAdmins = async () => {
    if (!branch?.branch_id) return;
    
    setAdminsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alertError("Authentication Error", "You must be logged in to load admins.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/branches/${branch.branch_id}/admins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alertError("Failed to load admins", data.message || "Could not fetch admins.");
        return;
      }

      setAdmins(data.admins || []);
    } catch (err) {
      console.error(err);
      alertError("Server Error", "Unable to fetch admins.");
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleLocationCreated = async (location) => {
    await fetchLocations();
    const id = location?.location_id || location?.locationId;
    if (id) {
      setSelectedLocationId(id);
    }
  };

  // 🔥 Prefill form when modal opens
  useEffect(() => {
    if (branch) {
      setBranchName(branch.branchName || branch.name || "");
      setOpeningTime(branch.openingTime || "");
      setClosingTime(branch.closingTime || "");
      setSelectedLocationId(branch.locationId || "");
      setSelectedContactPersonId(branch.contactPersonId || "");
    }
  }, [branch]);

  useEffect(() => {
    if (!isOpen) return;
    fetchLocations();
    fetchAdmins();
  }, [isOpen, alertError]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLocationId) {
      alertError("Validation Error", "Please select a location");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/branches/${branch.branch_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            branchName,
            openingTime,
            closingTime,
            locationId: selectedLocationId,
            contactPersonId: selectedContactPersonId || null,
          }),
        }
      );

      // handle cases where backend returns HTML (404 page) instead of JSON
      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (!res.ok) {
        // if 404, give more descriptive message
        const msg =
          res.status === 404
            ? "Branch not found (it may have been deleted)"
            : data.message || "Failed to update branch";
        alertError("Error", msg);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-gray-200">
        <h2 className="mb-4 text-lg font-semibold">Edit Branch</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Branch Name</h3>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
          />

          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Location</h3>
              <p className="text-xs text-gray-500">Pick a saved location or add a new one.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddLocationOpen(true)}
              className="rounded-lg border border-blue-500 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              Add Location
            </button>
          </div>
          <div className="relative">
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              required
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
            >
              <option value="">Select a saved location</option>
              {locationLoading ? (
                <option value="" disabled>Loading locations...</option>
              ) : locations.length > 0 ? (
                locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {`${loc.country || ""}${loc.country ? ", " : ""}${loc.city || ""}${loc.city ? ", " : ""}${loc.province || ""}${loc.province ? ", " : ""}${loc.street || ""}${loc.postal_code ? ", " : ""}${loc.postal_code || ""}`}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No saved locations available
                </option>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Required: Select a location for the branch.</p>

          <h3 className="text-sm font-medium text-gray-700">Contact Person</h3>
          <p className="text-xs text-gray-500">Select an admin to be the contact person for this branch.</p>
          <div className="relative">
            <select
              value={selectedContactPersonId}
              onChange={(e) => setSelectedContactPersonId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
            >
              <option value="">Select a contact person (optional)</option>
              {adminsLoading ? (
                <option value="" disabled>Loading admins...</option>
              ) : admins.length > 0 ? (
                admins.map((admin) => (
                  <option key={admin.user_id} value={admin.user_id}>
                    {`${admin.first_name} ${admin.last_name} (${admin.username})`}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No admins available for this branch
                </option>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <h3 className="text-sm font-medium text-gray-700">Operating Time</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Branch"}
            </button>
          </div>
        </form>
      </div>
      <AddLocationModal
        isOpen={isAddLocationOpen}
        onClose={() => setIsAddLocationOpen(false)}
        onCreate={handleLocationCreated}
      />
    </div>
  );
}
