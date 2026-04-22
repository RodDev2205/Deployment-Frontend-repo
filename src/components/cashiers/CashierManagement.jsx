import React, { useState, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../config/api';
import CashierCard from "./CashierCard";
import AddNewCashierForm from "./AddNewCashierForm";
import EditCashierModal from "./EditCashierModal";
import ResetPasswordModal from "./ResetPasswordModal";

export default function CashierManagement() {
  const [cashiers, setCashiers] = useState([]);
  const { error, success } = useAlert();
  const [editingCashier, setEditingCashier] = useState(null);
  const [resettingCashier, setResettingCashier] = useState(null);

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/admin/cashiers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch cashiers");

      // Restore middle_name from cache if it was saved (backend may not return it)
      const cashiersWithMiddleNames = data.map(cashier => {
        const cacheKey = `cashier_${cashier.username}_middle_name`;
        const cachedMiddleName = localStorage.getItem(cacheKey);
        return {
          ...cashier,
          middle_name: cachedMiddleName || cashier.middle_name || ""
        };
      });

      setCashiers(cashiersWithMiddleNames);
    } catch (err) {
      console.error("Error fetching cashiers:", err);
    }
  };

  const handleAddCashier = async (newCashier) => {
    try {
      const token = localStorage.getItem("token");
      
      // Store the middle_name in a local cache to preserve it
      const cacheKey = `cashier_${newCashier.username}_middle_name`;
      if (newCashier.middle_name) {
        localStorage.setItem(cacheKey, newCashier.middle_name);
      }
      
      const res = await fetch(`${API_BASE_URL}/api/admin/cashiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCashier),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add cashier");

      // Refetch cashiers to get complete data including branch_name from database
      await fetchCashiers();
      
      success("Success", "Cashier added successfully!");
    } catch (err) {
      console.error("Error adding cashier:", err);
      error("Error", err.message);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/toggle/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle status");

      setCashiers(prev =>
        prev.map(c => (c.id === id ? { ...c, status: data.status } : c))
      );
      success("Success", "Status updated successfully!");
    } catch (err) {
      console.error("Failed to toggle status:", err);
      error("Error", err.message);
    }
  };

  const handleSaveEdit = async (updatedCashier) => {
    try {
      const token = localStorage.getItem("token");
      
      // Cache the middle_name before sending
      const cacheKey = `cashier_${updatedCashier.username}_middle_name`;
      if (updatedCashier.middle_name) {
        localStorage.setItem(cacheKey, updatedCashier.middle_name);
      }
      
      const res = await fetch(`${API_BASE_URL}/api/admin/cashiers/${updatedCashier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          first_name: updatedCashier.first_name,
          middle_name: updatedCashier.middle_name,
          last_name: updatedCashier.last_name,
          username: updatedCashier.username,
          contact_number: updatedCashier.contact_number,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update cashier");

      setCashiers(prev =>
        prev.map(c =>
          c.id === updatedCashier.id
            ? { ...c, first_name: updatedCashier.first_name, middle_name: updatedCashier.middle_name, last_name: updatedCashier.last_name, username: updatedCashier.username, contact_number: updatedCashier.contact_number }
            : c
        )
      );
      setEditingCashier(null);
      success("Success", "Cashier updated successfully!");
    } catch (err) {
      console.error("Failed to update cashier:", err);
      error("Error", err.message);
    }
  };

  // ---------- PASSWORD UPDATE ----------
  const handleUpdatePassword = async (cashierId, password) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/cashiers/${cashierId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setResettingCashier(null);
      success("Success", "Password updated successfully!");
    } catch (err) {
      console.error("Failed to update password:", err);
      error("Error", err.message);
    }
  };

  return (
    <div className="space-y-8 relative">
      <h2 className="text-3xl font-bold text-gray-800">Cashier Account Management</h2>

      <AddNewCashierForm onAddCashier={handleAddCashier} />

      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          Cashier Roster ({cashiers.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cashiers.map(cashier => (
            <CashierCard
              key={cashier.id}
              cashier={cashier}
              onEdit={setEditingCashier}
              onResetPassword={setResettingCashier}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      </div>

      {editingCashier && (
        <EditCashierModal
          cashier={editingCashier}
          onClose={() => setEditingCashier(null)}
          onSave={handleSaveEdit}
        />
      )}

      {resettingCashier && (
        <ResetPasswordModal
          cashier={resettingCashier}
          onClose={() => setResettingCashier(null)}
          onSave={handleUpdatePassword} // pass the new handler
        />
      )}
    </div>
  );
}
