import React, { useState, useEffect } from "react";
import API_BASE_URL from '../../config/api';
import { useAlert } from "@/context/AlertContext";
import { X } from "lucide-react";

export default function EditTaxRateModal({ isOpen, onClose, branch, onSuccess }) {
  const [taxRate, setTaxRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const { success, error: alertError } = useAlert();

  // Prefill form when modal opens
  useEffect(() => {
    if (branch && isOpen) {
      setTaxRate(branch.tax_rate || branch.taxRate || "");
      setFormError("");
    }
  }, [branch, isOpen]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validation
    if (taxRate === "") {
      setFormError("Please enter a tax rate");
      return;
    }

    const rate = parseFloat(taxRate);
    if (isNaN(rate)) {
      setFormError("Tax rate must be a valid number");
      return;
    }

    if (rate < 0) {
      setFormError("Tax rate cannot be negative");
      return;
    }

    if (rate > 100) {
      setFormError("Tax rate cannot exceed 100%");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const res = await fetch(
        `${API_BASE_URL}/api/branches/${branch.branch_id}/tax-rate`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tax_rate: rate,
          }),
        }
      );

      let data;
      try {
        data = await res.json();
      } catch {
        data = { message: "Invalid server response" };
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to update tax rate");
      }

      success("Success", `Tax rate for ${branch.name || branch.branchName} updated to ${rate}%`);
      onSuccess();
    } catch (err) {
      console.error("Error updating tax rate:", err);
      alertError("Error", err.message || "Failed to update tax rate");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white p-6 w-96 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Edit Tax Rate</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branch Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Branch</p>
          <p className="text-base font-medium text-gray-800">
            {branch?.name || branch?.branchName || "Unknown Branch"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%)
            </label>
            <div className="flex items-center">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => {
                  setTaxRate(e.target.value);
                  setFormError("");
                }}
                className="flex-1 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 12"
                disabled={loading}
              />
              <span className="ml-2 text-gray-600 font-medium">%</span>
            </div>
            {formError && (
              <p className="mt-2 text-sm text-red-600">{formError}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Tax Rate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
