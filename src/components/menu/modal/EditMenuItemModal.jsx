import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import API_BASE_URL from '../../../config/api';

export default function EditMenuItemModal({ isOpen, onClose, onSaved, item, categories = [], declined = false }) {
  const [modalStep, setModalStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [newItem, setNewItem] = useState({
    product_name: "",
    category_id: "",
    price: "",
    file: null,
    ingredients: [],
    status: "",
    menu_status: "",
  });
  const [filePreview, setFilePreview] = useState(null);

  // inventory pagination
  const [fetchedIngredients, setFetchedIngredients] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  const API_INVENTORY = `${API_BASE_URL}/api/inventory`;

  const productNameRef = useRef(null);

  // when modal opens, prefill
  useEffect(() => {
    if (isOpen && item) {
      setNewItem((prev) => ({
        ...prev,
        product_name: item.product_name || "",
        category_id: item.category_id || item.category_id || "",
        price: item.price || "",
        status: item.status || "",
        menu_status: item.menu_status || "",
        ingredients: [],
        file: null,
      }));
      setFilePreview(item.image_path ? `${API_BASE_URL}${item.image_path}` : null);
      // fetch existing linked ingredients
      fetchLinkedIngredients(item.product_id);
    }
    // reset when closed
    if (!isOpen) {
      setModalStep(1);
      setError("");
      setSuccess(false);
      setFetchedIngredients([]);
      setPage(1);
      setHasMore(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item]);

  // fetch ingredients page
  const fetchIngredients = async (pageToLoad = 1) => {
    if (loadingIngredients) return;
    setLoadingIngredients(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_INVENTORY}/get-ingredients?page=${pageToLoad}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.data || [];
      const normalized = items.map((i) => ({ id: i.inventory_id ?? i.id, name: i.item_name ?? i.name }));
      setFetchedIngredients((prev) => (pageToLoad === 1 ? normalized : [...prev, ...normalized]));
      setHasMore(data.totalPages ? pageToLoad < data.totalPages : false);
      setPage(pageToLoad);
    } catch (err) {
      console.error(err);
      setError("Failed to load inventory items");
    } finally {
      setLoadingIngredients(false);
    }
  };

  const fetchLinkedIngredients = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/menu/${productId}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      // transform to { id, quantity }
      const linked = data.map((r) => ({ id: r.inventory_id, quantity: r.servings_required }));
      setNewItem((prev) => ({ ...prev, ingredients: linked }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen && modalStep === 2) fetchIngredients(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, modalStep]);

  useEffect(() => {
    let url = null;
    if (newItem.file) {
      url = URL.createObjectURL(newItem.file);
      setFilePreview(url);
    }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [newItem.file]);

  const handleIngredientsScroll = (e) => {
    const el = e.target;
    if (!hasMore || loadingIngredients) return;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40) fetchIngredients(page + 1);
  };

  const handleToggleIngredient = (inv) => {
    const exists = newItem.ingredients.find((i) => i.id === inv.id);
    if (exists) {
      setNewItem((prev) => ({ ...prev, ingredients: prev.ingredients.filter((i) => i.id !== inv.id) }));
    } else {
      setNewItem((prev) => ({ ...prev, ingredients: [...prev.ingredients, { id: inv.id, quantity: 1 }] }));
    }
  };

  const setIngredientQuantity = (id, qty) => {
    setNewItem((prev) => ({ ...prev, ingredients: prev.ingredients.map((i) => i.id === id ? { ...i, quantity: qty } : i) }));
  };

  const handleSave = async () => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("product_name", newItem.product_name);
      form.append("category_id", newItem.category_id);
      form.append("price", newItem.price);
      if (newItem.file) form.append("image", newItem.file);
      if (newItem.status) form.append("status", newItem.status);
      if (newItem.menu_status) form.append("menu_status", newItem.menu_status);
      form.append("ingredients", JSON.stringify(newItem.ingredients));

      const endpoint = declined ? `${API_BASE_URL}/api/menu/declined/${item.product_id}` : `${API_BASE_URL}/api/menu/${item.product_id}`;
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update product");
      }

      const data = await res.json();
      setSuccess(true);
      if (onSaved) onSaved(data);
      setTimeout(() => { setSuccess(false); onClose(); }, 800);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl relative shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 px-6 py-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{modalStep === 1 ? 'Edit Product' : 'Edit Ingredients'}</h3>
            <button onClick={onClose} className="text-sm text-gray-500">Close</button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">Saved</div>}

          {modalStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Product Name</label>
                <input ref={productNameRef} value={newItem.product_name} onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })} className="w-full border p-3 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Category</label>
                <select value={newItem.category_id} onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })} className="w-full border p-3 rounded">
                  <option value="">Select</option>
                  {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Price</label>
                <input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="w-full border p-3 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select value={newItem.status} onChange={(e) => setNewItem({ ...newItem, status: e.target.value })} className="w-full border p-3 rounded">
                  <option value="">Select status</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">POS/Menu Status</label>
                <select value={newItem.menu_status} onChange={(e) => setNewItem({ ...newItem, menu_status: e.target.value })} className="w-full border p-3 rounded">
                  <option value="">Select</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Image</label>
                <input type="file" accept="image/*" onChange={(e) => setNewItem({ ...newItem, file: e.target.files[0] })} className="w-full" />
              </div>
              {filePreview && <div className="w-full h-48 rounded overflow-hidden"><img src={filePreview} alt="preview" className="w-full h-full object-cover" /></div>}

              <div className="flex gap-3 pt-4">
                <button onClick={() => setModalStep(2)} className="flex-1 bg-green-600 text-white py-2 rounded">Next</button>
              </div>
            </div>
          )}

          {modalStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm">Select linked inventory items and set quantity</p>
              <div onScroll={handleIngredientsScroll} className="max-h-72 overflow-y-auto border rounded p-3 bg-gray-50">
                {fetchedIngredients.length > 0 ? (
                  fetchedIngredients.map((inv) => {
                    const sel = newItem.ingredients.find((i) => i.id === inv.id);
                    return (
                      <div key={inv.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={!!sel} onChange={() => handleToggleIngredient(inv)} />
                          <span>{inv.name}</span>
                        </div>
                        {sel && (
                          <input type="number" min="0" value={sel.quantity} onChange={(e) => setIngredientQuantity(inv.id, Number(e.target.value))} className="w-20 border p-1 rounded" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-sm text-gray-500">No inventory items</div>
                )}
                {loadingIngredients && <div className="text-center py-2 text-sm">Loading...</div>}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-2 rounded">Save</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
