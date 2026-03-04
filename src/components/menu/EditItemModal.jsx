import React, { useState, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../config/api';

export default function EditItemModal({
  item,
  onClose,
  onUpdated,
  resetApproval = false, // set true only for declined items
}) {
  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("available");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const { error: alertError, warning, success, info, confirm, danger } = useAlert();
  const token = localStorage.getItem("token");

  // ------------------- LOAD ITEM & CATEGORIES -------------------
  useEffect(() => {
    if (!item) return;

    // Set item data
    setProductName(item.product_name ?? "");
    setCategoryId(item.category_id ? String(item.category_id) : "");
    setPrice(item.price ?? "");
    setStatus(item.status ?? "available");
    setPreview(item.image_path ?? null);
    setFile(null);

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Fetch categories failed:", err);
        alertError("Load Error", "Failed to load categories");
      }
    };

    fetchCategories();
  }, [item, token]);

  // ------------------- IMAGE PREVIEW -------------------
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }, [file]);

  // ------------------- FORM SUBMIT -------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item) return;

    if (!categoryId || !categories.find((cat) => String(cat.category_id) === categoryId)) {
      return alertError("Validation Error", "Please select a valid category.");
    }
    if (!productName.trim()) return alertError("Validation Error", "Product name is required.");
    if (!price || Number(price) <= 0) return alertError("Validation Error", "Price must be greater than 0.");
    if (!token) return alertError("Authentication Error", "You are not authenticated.");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("product_name", productName.trim());
      formData.append("category_id", categoryId);
      formData.append("price", price);
      formData.append("status", status);

      if (resetApproval) {
        formData.append("approval_status", "PENDING");
      }

      if (file) formData.append("image", file);

      const res = await fetch(`${API_BASE_URL}/api/menu/${item.product_id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Update failed:", data);
        alertError("Update Failed", data.message || "Failed to update item");
        return;
      }

      if (typeof onUpdated === "function") onUpdated(data);
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
      alertError("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Edit Menu Item
        </h2>

        {resetApproval && (
          <p className="mb-4 text-sm text-blue-700 bg-blue-100 p-2 rounded-md">
            Editing will set approval status back to PENDING for review.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div>
            <label className="block mb-1 font-medium">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full border rounded-full px-4 py-2 focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-1 font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.category_id}
                  type="button"
                  onClick={() => setCategoryId(String(cat.category_id))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    categoryId === String(cat.category_id)
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 hover:bg-green-100"
                  }`}
                >
                  {cat.category_name}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block mb-1 font-medium">Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border rounded-full px-4 py-2 focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block mb-1 font-medium">Availability</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-full px-4 py-2 focus:ring-2 focus:ring-green-500"
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {/* Image */}
          <div>
            <label className="block mb-1 font-medium">Image</label>
            <div className="flex items-center gap-4">
              {preview && (
                <img
                  src={preview}
                  alt="preview"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-green-600 text-white"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
