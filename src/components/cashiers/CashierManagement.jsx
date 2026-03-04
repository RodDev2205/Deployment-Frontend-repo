import React, { useState, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../config/api';
import CashierCard from "./CashierCard";
import AddNewCashierForm from "./AddNewCashierForm";
import EditCashierModal from "./EditCashierModal";
import ResetPasswordModal from "./ResetPasswordModal";

export default function CashierManagement() {
  const [cashiers, setCashiers] = useState([]);
  const { error: alertError, success } = useAlert();
  const [editingCashier, setEditingCashier] = useState(null);
  const [resettingCashier, setResettingCashier] = useState(null);

  const [notification, setNotification] = useState("");
  const [showNotification, setShowNotification] = useState(false);

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

      setCashiers(data);
    } catch (err) {
      console.error("Error fetching cashiers:", err);
    }
  };

  const handleAddCashier = async (newCashier) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/cashiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCashier),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add cashier");

      fetchCashiers();
      triggerNotification("Cashier added successfully!");
    } catch (err) {
      console.error("Error adding cashier:", err);
      alertError("Error", err.message);
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
      triggerNotification("Status updated successfully!");
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alertError("Error", err.message);
    }
  };

  const handleSaveEdit = async (updatedCashier) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/cashiers/${updatedCashier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: updatedCashier.full_name,
          username: updatedCashier.username,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update cashier");

      setCashiers(prev =>
        prev.map(c =>
          c.id === updatedCashier.id
            ? { ...c, full_name: updatedCashier.full_name, username: updatedCashier.username }
            : c
        )
      );
      setEditingCashier(null);
      triggerNotification("Cashier updated successfully!");
    } catch (err) {
      console.error("Failed to update cashier:", err);
      alertError("Error", err.message);
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
      triggerNotification("Password updated successfully!");
    } catch (err) {
      console.error("Failed to update password:", err);
      alertError("Error", err.message);
    }
  };

  // ---------- Notification Animation ----------
  const triggerNotification = (message) => {
    setNotification(message);
    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
      setTimeout(() => setNotification(""), 500); // remove after fade
    }, 2000);
  };

  return (
    <div className="space-y-8 relative">
      {/* Notification popup */}
      {notification && (
        <div
          className={`fixed top-5 right-5 bg-green-600 bg-opacity-80 text-white px-4 py-2 rounded shadow-lg z-50 border border-black/30
            transition-all duration-500 ease-in-out transform
            ${showNotification ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
        >
          {notification}
        </div>
      )}

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
