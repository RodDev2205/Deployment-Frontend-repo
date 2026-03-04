// EditIngredientModal.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import API_BASE_URL from '../../../config/api';

const EditIngredientModal = ({ isOpen, onClose, ingredient, onEdit }) => {
  const [form, setForm] = useState({
    item_name: "",
    quantity: 1,
    servings_per_unit: 1,
    low_stock_threshold: 5,
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill form when modal opens or ingredient changes
  useEffect(() => {
    if (ingredient) {
      setForm({
        item_name: ingredient.item_name || "",
        quantity: ingredient.quantity || 1,
        servings_per_unit: ingredient.servings_per_unit || 1,
        low_stock_threshold: ingredient.low_stock_threshold || 5,
        status: ingredient.status || "active",
      });
    }
  }, [ingredient]);

  // Lock scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "item_name" || name === "status" ? value : Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You must be logged in");

      const response = await fetch(
        `${API_BASE_URL}/api/inventory/edit-ingredient/${ingredient.inventory_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Failed to update ingredient (${response.status})`);
      }

      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        console.warn("Response parsing issue:", e);
      }

      // Notify parent about edit
      if (onEdit) {
        onEdit({
          ...ingredient,
          ...form,
          total_servings: form.quantity * form.servings_per_unit,
        });
      }

      setLoading(false);
      onClose();
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      {/* Background overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-opacity-30 backdrop-blur-sm"
      />

      {/* Modal content */}
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-6 z-10 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Edit Ingredient
        </h2>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-100 p-2 rounded-xl">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Ingredient Name */}
          <div>
            <label className="text-sm text-gray-600">Ingredient Name</label>
            <input
              type="text"
              name="item_name"
              value={form.item_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm text-gray-600">Quantity</label>
            <input
              type="number"
              name="quantity"
              min="1"
              value={form.quantity}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          {/* Servings Per Unit */}
          <div>
            <label className="text-sm text-gray-600">Servings Per Unit</label>
            <input
              type="number"
              name="servings_per_unit"
              min="1"
              value={form.servings_per_unit}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          {/* Low Stock Threshold */}
          <div>
            <label className="text-sm text-gray-600">Low Stock Threshold</label>
            <input
              type="number"
              name="low_stock_threshold"
              min="1"
              value={form.low_stock_threshold}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-2.5 bg-green-600 hover:bg-green-700 transition text-white rounded-2xl shadow-md font-medium disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Ingredient"}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EditIngredientModal;