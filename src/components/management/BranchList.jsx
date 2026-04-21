import React, { useState, useEffect } from "react";
import API_BASE_URL from '../../config/api';
import { Store, Eye, FilePenLine, Power, PowerOff, Search, X } from "lucide-react";
import AddBranchModal from "./AddBranches";
import ViewBranchModal from "./ViewBranchModal";
import EditBranchModal from "./EditBranchModal";

export default function BranchList() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);

  //  FETCH WITH FULL ERROR HANDLING
  const fetchBranches = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found.");
      }

      const res = await fetch(`${API_BASE_URL}/api/branches/getBranches`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data;

      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response.");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch branches");
      }

      setBranches(data.branches || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    // Get user role from localStorage
    const role = localStorage.getItem('role_id');
    setUserRole(role ? Number(role) : null);
  }, []);

  //  SAFE HANDLERS
  const handleCreateBranch = () => {
    try {
      fetchBranches();
      setIsAddBranchModalOpen(false);
    } catch (err) {
      console.error("Create branch error:", err);
    }
  };

  const handleEditBranch = () => {
    try {
      fetchBranches();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Edit branch error:", err);
    }
  };

  const handleToggleBranchStatus = async (branchId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/branches/${branchId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to toggle branch status");
      }

      // Refresh branches list
      fetchBranches();
    } catch (err) {
      console.error("Toggle branch status error:", err);
      setError(err.message || "Failed to toggle branch status");
    }
  };

  //  SAFE TIME FORMATTER
  const formatTime = (timeString) => {
    try {
      if (!timeString) return "--";

      const date = new Date(`1970-01-01T${timeString}`);

      if (isNaN(date.getTime())) return "--";

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "--";
    }
  };

  const formatLocationText = (branch) => {
    if (branch.locationText) return branch.locationText;
    if (branch.address) return branch.address;
    return "No location available";
  };

  const formatContactPerson = (branch) => {
    if (
      branch.contactPersonFirstName &&
      branch.contactPersonLastName &&
      branch.contactPersonUsername
    ) {
      const contactInfo = `${branch.contactPersonFirstName} ${branch.contactPersonLastName} (${branch.contactPersonUsername})`;
      const contactNumber = branch.contactPersonContactNumber?.trim();
      return contactNumber ? `${contactInfo} - ${contactNumber}` : contactInfo;
    }
    return "No contact person assigned";
  };

  // FILTER BRANCHES BASED ON SEARCH TERM
  const filteredBranches = branches.filter((branch) => {
    const searchLower = searchTerm.toLowerCase();
    const branchName = (branch.name || branch.branchName || "").toLowerCase();
    const location = formatLocationText(branch).toLowerCase();
    const contactPerson = formatContactPerson(branch).toLowerCase();
    
    return (
      branchName.includes(searchLower) ||
      location.includes(searchLower) ||
      contactPerson.includes(searchLower)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Branch List</h2>

        <button
          onClick={() => setIsAddBranchModalOpen(true)}
          className="flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
        >
          <Store className="mr-2 h-4 w-4" />
          Add New Branch
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by branch name, location, or contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/*  ERROR DISPLAY */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-100 border border-red-300 p-3 text-red-700">
          {error}
          <button
            onClick={fetchBranches}
            className="ml-4 underline text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <p className="text-gray-500">Loading branches...</p>
      ) : (
        <div className="grid gap-4">
          {filteredBranches.length === 0 && branches.length === 0 && !error && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
              No branches yet.
            </div>
          )}

          {filteredBranches.length === 0 && branches.length > 0 && !error && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
              No branches match your search "{searchTerm}".
            </div>
          )}

          {filteredBranches.map((branch) => (
            <div
              key={branch.branch_id || Math.random()}
              className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {branch.name || branch.branchName || "Unnamed Branch"}
                    </h3>

                    {/* Status Badge */}
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      branch.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {branch.status === 'active' ? 'Active' : 'Deactivated'}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {formatTime(branch.openingTime)} -{" "}
                      {formatTime(branch.closingTime)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{branch.locationText ? `Location: ${branch.locationText}` : "No saved location"}</p>
                    <p>Contact Person: {formatContactPerson(branch)}</p>
                    <p>Created by: {branch.createdBy || "Unknown"}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {/* VIEW */}
                  <button
                    onClick={() => {
                      setSelectedBranch(branch);
                      setIsViewModalOpen(true);
                    }}
                    className="rounded border border-green-600 p-2 text-green-600 hover:bg-green-50 flex items-center justify-center"
                    title="View Branch"
                  >
                    <Eye className="w-5 h-5" />
                  </button>

                  {/* EDIT */}
                  <button
                    onClick={() => {
                      setSelectedBranch(branch);
                      setIsEditModalOpen(true);
                    }}
                    className="rounded border border-green-600 p-2 text-green-600 hover:bg-green-50 flex items-center justify-center"
                    title="Edit Branch"
                  >
                    <FilePenLine className="w-5 h-5" />
                  </button>

                  {/* TOGGLE STATUS - Only for Superadmin (role_id = 3) */}
                  {userRole === 3 && (
                    <button
                      onClick={() => handleToggleBranchStatus(branch.branch_id)}
                      className={`rounded border p-2 flex items-center justify-center ${
                        branch.status === 'active'
                          ? 'border-red-600 text-red-600 hover:bg-red-50'
                          : 'border-green-600 text-green-600 hover:bg-green-50'
                      }`}
                      title={branch.status === 'active' ? 'Deactivate Branch' : 'Activate Branch'}
                    >
                      {branch.status === 'active' ? (
                        <PowerOff className="w-5 h-5" />
                      ) : (
                        <Power className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <ViewBranchModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        branch={selectedBranch}
      />

      {/* Edit Modal */}
      <EditBranchModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        branch={selectedBranch}
        onSubmit={handleEditBranch}
      />

      {/* Add Modal */}
      <AddBranchModal
        isOpen={isAddBranchModalOpen}
        onClose={() => setIsAddBranchModalOpen(false)}
        onSubmit={handleCreateBranch}
      />
    </div>
  );
}