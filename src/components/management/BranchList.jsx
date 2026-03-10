import React, { useState, useEffect } from "react";
import API_BASE_URL from '../../config/api';
import { Store, Eye, FilePenLine } from "lucide-react";
import AddBranchModal from "./AddBranches";
import ViewBranchModal from "./ViewBranchModal";
import EditBranchModal from "./EditBranchModal";

export default function BranchList() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState(null);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/branches/getBranches`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch branches");

      setBranches(data.branches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreateBranch = () => {
    fetchBranches();
    setIsAddBranchModalOpen(false);
  };

  const handleEditBranch = () => {
    fetchBranches();
    setIsEditModalOpen(false);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "--";
    const date = new Date(`1970-01-01T${timeString}`);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

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

      {/* Content */}
      {loading ? (
        <p>Loading branches...</p>
      ) : (
        <div className="grid gap-4">
          {branches.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
              No branches yet.
            </div>
          )}

          {branches.map((branch) => (
            <div
              key={branch.branch_id}
              className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {branch.name || branch.branchName || "Unnamed Branch"}
                    </h3>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {formatTime(branch.openingTime)} -{" "}
                      {formatTime(branch.closingTime)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{branch.address}</p>
                    <p>{branch.contact}</p>
                    <p>Created by: {branch.createdBy}</p>
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
                  >
                    <Eye className="w-5 h-5" />
                  </button>

                  {/* EDIT */}
                  <button
                    onClick={() => {
                      setSelectedBranch(branch);
                      setIsEditModalOpen(true);
                    }}
                    className="rounded border border-green-600 px-3 py-1 font-medium text-green-600 hover:bg-green-50"
                  >
                    Edit
                  </button>
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
