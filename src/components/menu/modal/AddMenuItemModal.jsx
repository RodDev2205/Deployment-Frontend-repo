import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import API_BASE_URL from '../../../config/api';

export default function AddMenuItemModal({ isOpen, onClose, onAddItem, categories = [] }) {
  // Note: don't return before hooks — hooks must run consistently

  const [modalStep, setModalStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [newItem, setNewItem] = useState({
    product_name: "",
    category_id: "",
    price: "",
    vat_type: "vat",
    file: null,
    ingredients: [],
  });
  const [filePreview, setFilePreview] = useState(null);

  // Ingredients from API with pagination (infinite scroll)
  const [fetchedIngredients, setFetchedIngredients] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Categories from API (always fetch for fresh database data)
  const [localCategories, setLocalCategories] = useState([]);
  const API_CATEGORIES = `${API_BASE_URL}/api/categories`;

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_CATEGORIES, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setLocalCategories(data || []);
    } catch (err) {
      console.error("Categories fetch failed:", err);
      // silently fall back to prop categories if API fails
    }
  };

  const productNameRef = useRef(null);

  // Auto-focus
  useEffect(() => {
    if (modalStep === 1 && productNameRef.current) {
      productNameRef.current.focus();
    }
  }, [modalStep]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return;
      if (e.key === "Escape") handleClose();
      if (e.key === "Enter") {
        modalStep === 1 ? handleNextStep() : handleAdd();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalStep, loading, newItem]);

  // when entering step 2 (link ingredients) fetch first page
  useEffect(() => {
    if (isOpen && modalStep === 2) {
      // reset and fetch
      setFetchedIngredients([]);
      setPage(1);
      setHasMore(true);
      fetchIngredients(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, modalStep]);

  // fetch categories from API when modal opens (always get fresh data from DB)
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // display fetched ingredients (always from API)
  const displayIngredients = fetchedIngredients;

  // display API categories (or fallback to prop if API fetch failed)
  const displayCategories = localCategories.length > 0 ? localCategories : categories || [];

  const handleIngredientsScroll = (e) => {
    const el = e.target;
    if (!hasMore || loadingIngredients) return;
    // near bottom
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40) {
      fetchIngredients(page + 1);
    }
  };

  // File preview URL - SINGLE useEffect
  useEffect(() => {
    let url = null;
    if (newItem.file) {
      url = URL.createObjectURL(newItem.file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [newItem.file]);

  const handleClose = () => {
    setNewItem({ product_name: "", category_id: "", price: "", file: null, ingredients: [] });
    setModalStep(1);
    setError("");
    setSuccess(false);
    // reset ingredient pagination
    setFetchedIngredients([]);
    setPage(1);
    setHasMore(true);
    onClose();
  };

  const handleNextStep = () => {
    setError("");
    if (!newItem.product_name.trim()) return setError("Product name is required");
    if (!newItem.category_id) return setError("Please select a category");
    if (!newItem.price || parseFloat(newItem.price) <= 0) return setError("Price must be a positive number");
    setModalStep(2);
  };

  // Fetch ingredients from API (uses pagination when page & limit provided)
  const fetchIngredients = async (pageToLoad = 1) => {
    if (loadingIngredients) return;
    setLoadingIngredients(true);
    try {
      const token = localStorage.getItem("token");
      const API_INVENTORY = `${API_BASE_URL}/api/inventory`;
      const res = await fetch(`${API_INVENTORY}/get-ingredients?page=${pageToLoad}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      // Try to parse JSON; if response is HTML (e.g. index.html or an auth redirect), surface a clear error
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        const snippet = text ? text.slice(0, 200) : '';
        throw new Error(`Invalid JSON response from server: ${snippet}`);
      }

      if (!res.ok) {
        const msg = (data && data.message) || (data && data.error) || res.statusText || 'Failed to load ingredients';
        throw new Error(msg);
      }

      // backend returns paginated shape { data, total, currentPage, totalPages } or an array
      let items = [];
      let more = false;

      if (Array.isArray(data)) {
        items = data;
        more = false;
      } else if (data && data.data) {
        items = data.data;
        more = data.currentPage < data.totalPages;
      }

      // normalize to { id, name }
      const normalized = items.map((i) => ({ id: i.inventory_id ?? i.id ?? i.item_id ?? i.itemId ?? i.id, name: i.item_name ?? i.name ?? i.itemName ?? '' }));

      if (pageToLoad === 1) {
        setFetchedIngredients(normalized);
      } else {
        setFetchedIngredients((prev) => [...prev, ...normalized]);
      }

      setHasMore(more);
      setPage(pageToLoad);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load ingredients");
    } finally {
      setLoadingIngredients(false);
    }
  };

  const handleAdd = async () => {
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const API_MENU = `${API_BASE_URL}/api/menu`;

      // Build FormData for multipart/form-data (file + JSON fields)
      const formData = new FormData();
      formData.append("product_name", newItem.product_name.trim());
      formData.append("category_id", newItem.category_id);
      formData.append("price", parseFloat(newItem.price));
      formData.append("vat_type", newItem.vat_type);
      if (newItem.file) {
        formData.append("image", newItem.file);
      }
      // Add ingredients as JSON array
      formData.append("ingredients", JSON.stringify(newItem.ingredients));

      const res = await fetch(API_MENU, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        throw new Error("Invalid response from server");
      }

      if (!res.ok) {
        const msg = (data && data.message) || (data && data.error) || "Failed to create product";
        throw new Error(msg);
      }

      // Success: call parent callback and close modal
      onAddItem(newItem);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        handleClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl relative shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with close button */}
        

        {/* Scrollable content area */}
        <div className="overflow-y-auto flex-1 px-6">
        {/* Progress Bar */}
        <div className="mb-6 pt-8">
          <div className="flex justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-800">
              {modalStep === 1 ? "Basic Information" : "Link Ingredients"}
            </h2>
            <span className="text-sm font-medium text-gray-500">
              Step {modalStep} of 2
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(modalStep / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-2xl"
            >
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-2xl"
            >
              <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-700 font-medium">Product added successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

          <AnimatePresence mode="wait">
            {modalStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex flex-col gap-5"
              >
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  ref={productNameRef}
                  type="text"
                  placeholder="Grilled Chicken Burger"
                  disabled={loading}
                  value={newItem.product_name}
                  onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  disabled={loading}
                  value={newItem.category_id}
                  onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Select a category</option>
                  {displayCategories && displayCategories.length > 0 ? (
                    displayCategories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                    ))
                  ) : (
                    <option disabled>No categories available</option>
                  )}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={loading}
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              {/* VAT Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">VAT Type *</label>
                <div className="flex gap-6">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="vat_type"
                      value="vat"
                      checked={newItem.vat_type === "vat"}
                      onChange={(e) => setNewItem({ ...newItem, vat_type: e.target.value })}
                      disabled={loading}
                      className="form-radio"
                    />
                    <span className="ml-2 text-sm text-gray-700">VATable</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="vat_type"
                      value="non-vat"
                      checked={newItem.vat_type === "non-vat"}
                      onChange={(e) => setNewItem({ ...newItem, vat_type: e.target.value })}
                      disabled={loading}
                      className="form-radio"
                    />
                    <span className="ml-2 text-sm text-gray-700">Non-VATable</span>
                  </label>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={loading}
                  onChange={(e) => setNewItem({ ...newItem, file: e.target.files[0] })}
                  className="w-full border border-gray-200 p-2 rounded-2xl focus:border-green-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              {filePreview && (
                <div className="w-full h-48 rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                  <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 pb-4">
                <button onClick={handleClose} disabled={loading} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-2xl font-medium transition disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleNextStep} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-2xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Next <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {modalStep === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col gap-5"
            >
              <p className="text-sm text-gray-600">
                Select ingredients for <span className="font-semibold text-gray-800">{newItem.product_name}</span>
              </p>

              <div onScroll={handleIngredientsScroll} className="max-h-72 overflow-y-auto space-y-3 border border-gray-200 rounded-2xl p-4 bg-gray-50">
                {displayIngredients.length > 0 ? (
                  displayIngredients.map((ing) => {
                    const ingQty = newItem.ingredients.find((i) => i.id === ing.id)?.quantity || "";
                    return (
                      <div key={ing.id} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 hover:border-green-300 transition">
                        <span className="font-medium text-gray-700 flex-1">{ing.name}</span>
                        <input
                          type="number"
                          placeholder="Qty"
                          disabled={loading}
                          className="border border-gray-200 p-2 rounded-lg w-20 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                          value={ingQty}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 0;
                            if (qty === 0) {
                              setNewItem({
                                ...newItem,
                                ingredients: newItem.ingredients.filter(i => i.id !== ing.id)
                              });
                            } else {
                              const exists = newItem.ingredients.find(i => i.id === ing.id);
                              if (exists) {
                                setNewItem({
                                  ...newItem,
                                  ingredients: newItem.ingredients.map(i => i.id === ing.id ? {...i, quantity: qty} : i)
                                });
                              } else {
                                setNewItem({
                                  ...newItem,
                                  ingredients: [...newItem.ingredients, { id: ing.id, quantity: qty }]
                                });
                              }
                            }
                          }}
                        />
                        <span className="text-sm text-gray-500 w-12">unit</span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No ingredients available</p>
                )}

                {loadingIngredients && (
                  <div className="w-full text-center py-3 text-sm text-gray-600">Loading...</div>
                )}
              </div>

              {/* Selected Count */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl">
                <p className="text-sm text-blue-800 font-medium">
                  {newItem.ingredients.length} ingredient{newItem.ingredients.length !== 1 ? "s" : ""} selected
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 pb-4">
                <button onClick={() => setModalStep(1)} disabled={loading} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  <ChevronLeft size={18} /> Back
                </button>
                <button onClick={handleAdd} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-2xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} /> Add Product
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        /* Smooth scrolling with hidden scrollbar during transitions */
        div[class*="overflow-y-auto"]::-webkit-scrollbar {
          width: 6px;
        }
        div[class*="overflow-y-auto"]::-webkit-scrollbar-track {
          background: transparent;
        }
        div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}