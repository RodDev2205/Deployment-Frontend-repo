import React, { useState } from "react";
import { User, Edit, Key, Lock, Unlock } from "lucide-react";
import AlertDialog from "../common/AlertDialog";

export default function CashierCard({ cashier, onEdit, onResetPassword, onToggleStatus }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Determine if the cashier is active based on backend status
  const isActive = cashier.status === "Activate";

  const statusColor = isActive
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700";

  const handleToggleClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    await onToggleStatus(cashier.id);
    setShowConfirmModal(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col transition-shadow hover:shadow-xl border-t-4 border-[#1B5E20]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b pb-3">
        <div className="flex items-center">
          <User className="w-8 h-8 text-[#1B5E20] mr-3 p-1 bg-green-50 rounded-full" />
          <div>
            <h4 className="text-xl font-bold text-gray-800">{cashier.first_name} {cashier.middle_name || ''} {cashier.last_name}</h4>
            <p className="text-sm text-gray-500">@{cashier.username}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
          {isActive ? "Activate" : "Deactivated"}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Role:</span>
          <span className="font-semibold text-indigo-600">
            {cashier.role_id === 1 ? "Cashier" : "Other"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Contact:</span>
          <span className="text-gray-500">
            {cashier.contact_number || "N/A"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Last Login:</span>
          <span className="text-gray-500">
            {cashier.lastLogin ? cashier.lastLogin.split(" ")[0] : "N/A"}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
        <button
          title="Edit User"
          onClick={() => onEdit(cashier)}
          className="p-2 text-blue-600 hover:text-blue-800 transition-colors rounded-full hover:bg-gray-100"
        >
          <Edit className="w-5 h-5" />
        </button>

        <button
          title="Reset Password"
          onClick={() => onResetPassword(cashier)}
          className="p-2 text-yellow-600 hover:text-yellow-800 transition-colors rounded-full hover:bg-gray-100"
        >
          <Key className="w-5 h-5" />
        </button>

        <button
          title={isActive ? "Deactivate" : "Activate"}
          onClick={handleToggleClick}
          className={`p-2 transition-colors rounded-full hover:bg-gray-100 
            ${isActive ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}
        >
          {isActive ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={showConfirmModal}
        type={isActive ? "warning" : "success"}
        title={isActive ? "Confirm Deactivation" : "Confirm Activation"}
        message={isActive 
          ? `Are you sure you want to deactivate ${cashier.first_name} ${cashier.middle_name || ''} ${cashier.last_name}?`
          : `Are you sure you want to reactivate ${cashier.first_name} ${cashier.middle_name || ''} ${cashier.last_name}?`
        }
        confirmText={isActive ? "Deactivate" : "Reactivate"}
        cancelText="Cancel"
        onConfirm={handleConfirmToggle}
        onClose={() => setShowConfirmModal(false)}
        showConfirmButton={true}
        showCancelButton={true}
        isDanger={isActive}
      />

      {/* Success Modal - handled by parent component */}
    </div>
  );
}
