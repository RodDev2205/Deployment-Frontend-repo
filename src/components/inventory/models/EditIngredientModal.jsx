// EditIngredientModal.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../../config/api';

const EditIngredientModal = ({ isOpen, onClose, ingredient, onEdit, branches = [], isSuperadmin = false }) => {
  const { error: alertError, success } = useAlert();
  const [form, setForm] = useState({
    item_name: "",
    quantity: 1,
    servings_per_unit: 1,
    low_stock_threshold: 5,
    branch_id: "",
    main_category_id: "",
    sub_category_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [calculatedStatus, setCalculatedStatus] = useState("available");
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const mainRes = await fetch(`${API_BASE_URL}/api/inventory/main-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (mainRes.ok) {
        const mainData = await mainRes.json();
        setMainCategories(Array.isArray(mainData) ? mainData : mainData.data || []);
      }

      const subRes = await fetch(`${API_BASE_URL}/api/inventory/sub-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubCategories(Array.isArray(subData) ? subData : subData.data || []);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Pre-fill form when modal opens or ingredient changes
  useEffect(() => {
    if (ingredient) {
      setForm({
        item_name: ingredient.item_name || "",
        quantity: ingredient.quantity || 1,
        servings_per_unit: ingredient.servings_per_unit || 1,
        low_stock_threshold: ingredient.low_stock_threshold || 5,
        branch_id: ingredient.branch_id || "",
        main_category_id: ingredient.main_category_id || "",
        sub_category_id: ingredient.sub_category_id || "",
      });
      // Calculate what status will be based on quantity
      calculateStatus(ingredient.quantity, ingredient.low_stock_threshold);
    }
  }, [ingredient]);

  // Calculate status whenever quantity or threshold changes
  const calculateStatus = (qty, threshold) => {
    if (Number(qty) === 0) {
      setCalculatedStatus("out_of_stock");
    } else if (Number(qty) <= Number(threshold)) {
      setCalculatedStatus("low_stock");
    } else {
      setCalculatedStatus("available");
    }
  };

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
    const processedValue = name === "item_name" ? value : Number(value) || value;
    
    setForm((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Recalculate status when quantity or threshold changes
    if (name === "quantity" || name === "low_stock_threshold") {
      const newQty = name === "quantity" ? Number(value) : form.quantity;
      const newThreshold = name === "low_stock_threshold" ? Number(value) : form.low_stock_threshold;
      calculateStatus(newQty, newThreshold);
    }
  };

  // Filter subcategories based on selected main category
  const filteredSubCategories = form.main_category_id
    ? subCategories.filter(
        (sub) => Number(sub.main_category_id) === Number(form.main_category_id)
      )
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!form.main_category_id || !form.sub_category_id) {
      alertError("Error", "Please select both main and sub categories.");
      setLoading(false);
      return;
    }

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

      // Notify parent about edit
      if (onEdit) {
        onEdit({
          ...ingredient,
          ...form,
          status: calculatedStatus,
          total_servings: form.quantity * form.servings_per_unit,
        });
      }

      success("Success", "Ingredient updated successfully ✅");
      onClose();
    } catch (err) {
      console.error("Submission error:", err);
      alertError("Error", err.message);
    } finally {
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
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-6 z-10 animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Edit Ingredient
        </h2>

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

          {/* Main Category */}
          <div>
            <label className="text-sm text-gray-600">Main Category</label>
            <select
              name="main_category_id"
              value={form.main_category_id}
              onChange={handleChange}
              required
              disabled={categoriesLoading}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              <option value="">
                {categoriesLoading ? "Loading..." : "Select main category"}
              </option>
              {mainCategories.map((cat) => (
                <option key={cat.main_category_id} value={cat.main_category_id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sub Category */}
          <div>
            <label className="text-sm text-gray-600">Sub Category</label>
            <select
              name="sub_category_id"
              value={form.sub_category_id}
              onChange={handleChange}
              required
              disabled={!form.main_category_id || categoriesLoading}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-gray-100"
            >
              <option value="">
                {!form.main_category_id
                  ? "Select main category first"
                  : "Select sub category"}
              </option>
              {filteredSubCategories.map((cat) => (
                <option key={cat.sub_category_id} value={cat.sub_category_id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {isSuperadmin && (
            <div>
              <label className="text-sm text-gray-600">Branch</label>
              <select
                name="branch_id"
                value={form.branch_id}
                onChange={handleChange}
                required
                disabled={branches.length === 0}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="" disabled>
                  {branches.length === 0 ? "No branches available" : "Select branch"}
                </option>
                {branches.map((branch) => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="text-sm text-gray-600">Quantity</label>
            <input
              type="number"
              name="quantity"
              min="0"
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

          {/* Status Display (Read-only, auto-calculated) */}
          <div>
            <label className="text-sm text-gray-600">Status (Auto-calculated)</label>
            <div className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl bg-gray-50 flex items-center">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  calculatedStatus === "available"
                    ? "bg-green-100 text-green-700"
                    : calculatedStatus === "low_stock"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {calculatedStatus === "available"
                  ? "Available"
                  : calculatedStatus === "low_stock"
                  ? "Low Stock"
                  : "Out of Stock"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Status is automatically determined by quantity vs. threshold
            </p>
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