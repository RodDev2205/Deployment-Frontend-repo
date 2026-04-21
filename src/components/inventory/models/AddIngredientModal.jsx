// AddIngredientModal.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import API_BASE_URL from '../../../config/api';

const AddIngredientModal = ({ isOpen, onClose, onAdd, branches = [], inventory = [], isSuperadmin = false }) => {
  const [form, setForm] = useState({
    item_name: "",
    quantity: 1,
    servings_per_unit: 1,
    low_stock_threshold: 5,
    status: "available",
    branch_id: "",
    main_category_id: "",
    sub_category_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Fetch categories
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

      // Fetch main categories
      const mainRes = await fetch(`${API_BASE_URL}/api/inventory/main-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (mainRes.ok) {
        const mainData = await mainRes.json();
        setMainCategories(Array.isArray(mainData) ? mainData : mainData.data || []);
      }

      // Fetch sub categories
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

  // Lock scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isSuperadmin && branches.length > 0 && !form.branch_id) {
      setForm((prev) => ({ ...prev, branch_id: branches[0].branch_id }));
    }
  }, [isSuperadmin, branches]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "item_name" || name === "status" ? value : Number(value) || value,
    }));
  };

  // Filter subcategories based on selected main category
  const filteredSubCategories = form.main_category_id
    ? subCategories.filter(
        (sub) => Number(sub.main_category_id) === Number(form.main_category_id)
      )
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedName = form.item_name.trim();
    if (!trimmedName) {
      setError("Ingredient name is required.");
      setLoading(false);
      return;
    }

    if (!form.main_category_id || !form.sub_category_id) {
      setError("Please select both main and sub categories.");
      setLoading(false);
      return;
    }

    const branchIdToCheck = isSuperadmin ? form.branch_id : inventory[0]?.branch_id;
    if (isSuperadmin && !branchIdToCheck) {
      setError("Please select a branch.");
      setLoading(false);
      return;
    }

    const duplicate = inventory.some((item) => {
      const itemBranchId = String(item.branch_id);
      const formBranchId = String(branchIdToCheck);
      const existingName = item.item_name?.trim().toLowerCase();
      return itemBranchId === formBranchId && existingName === trimmedName.toLowerCase();
    });

    if (duplicate) {
      setError("An ingredient with that name already exists for the selected branch.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You must be logged in");

      const response = await fetch(
        `${API_BASE_URL}/api/inventory/add-ingredient`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Failed to add ingredient (${response.status})`);
      }

      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        console.warn("Response parsing issue, continuing anyway:", e);
      }

      const submittedForm = { ...form };

      setForm({
        item_name: "",
        quantity: 1,
        servings_per_unit: 1,
        low_stock_threshold: 5,
        status: "available",
        branch_id: isSuperadmin && branches.length > 0 ? branches[0].branch_id : "",
        main_category_id: "",
        sub_category_id: "",
      });

      if (onAdd) {
        onAdd({
          ...submittedForm,
          total_servings: submittedForm.quantity * submittedForm.servings_per_unit,
          inventory_id: data.id || Date.now(),
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
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-6 z-10 animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Add New Ingredient
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
            {loading ? "Adding..." : "Add Ingredient"}
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

export default AddIngredientModal;