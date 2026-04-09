import React, { useState, useEffect } from "react";
import API_BASE_URL from '../../config/api';
import { FilePenLine } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import EditTaxRateModal from "./EditTaxRateModal";

export default function TaxRateTable() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const { success, error: alertError } = useAlert();

  // Fetch branches with tax rate information
  const fetchBranchesWithTaxRate = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found.");
      }

      const res = await fetch(`${API_BASE_URL}/api/branches/getBranchesWithTax`, {
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
    fetchBranchesWithTaxRate();
  }, []);

  // Handle edit button click
  const handleEditClick = (branch) => {
    setSelectedBranch(branch);
    setIsEditModalOpen(true);
  };

  // Handle successful tax rate update
  const handleTaxRateUpdated = () => {
    setIsEditModalOpen(false);
    fetchBranchesWithTaxRate();
  };

  // Format tax rate display
  const formatTaxRate = (rate) => {
    if (rate === null || rate === undefined || rate === "") {
      return "0%";
    }
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) {
      return "0%";
    }
    return `${numRate}%`;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Tax Rate Management</h2>
        <p className="text-sm text-gray-600">View and manage branch tax rates</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-100 border border-red-300 p-3 text-red-700">
          {error}
          <button
            onClick={fetchBranchesWithTaxRate}
            className="ml-4 underline text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <p className="text-gray-500">Loading branches...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Branch Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Current Tax Rate</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 && !error && (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    No branches found.
                  </td>
                </tr>
              )}

              {branches.map((branch) => (
                <tr
                  key={branch.branch_id || Math.random()}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800">
                      {branch.name || branch.branchName || "Unnamed Branch"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">
                      {formatTaxRate(branch.tax_rate || branch.taxRate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEditClick(branch)}
                      className="inline-flex items-center justify-center rounded border border-green-600 p-2 text-green-600 hover:bg-green-50 transition-colors"
                      title="Edit Tax Rate"
                    >
                      <FilePenLine className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Tax Rate Modal */}
      <EditTaxRateModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        branch={selectedBranch}
        onSuccess={handleTaxRateUpdated}
      />
    </div>
  );
}
