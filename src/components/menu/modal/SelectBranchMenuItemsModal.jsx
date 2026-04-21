import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import API_BASE_URL from '../../../config/api';

export default function SelectBranchMenuItemsModal({ isOpen, onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setSelectedIds(new Set());
      setSearchTerm("");
      setError("");
      setLoading(false);
      setSaving(false);
      return;
    }

    const fetchBranchMenuProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

        const res = await fetch(`${API_BASE_URL}/api/menu/branch-menu`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error((data && (data.message || data.error)) || "Failed to load products");
        }

        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        setSelectedIds(new Set((data || []).filter((item) => item.is_available).map((item) => item.product_id)));
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load product list");
      } finally {
        setLoading(false);
      }
    };

    fetchBranchMenuProducts();
  }, [isOpen]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/api/menu/branch-menu`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_ids: Array.from(selectedIds) }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && (data.message || data.error)) || "Failed to save selection");
      }

      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save selected products");
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter((item) => {
    return (
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div>
            <h3 className="text-xl font-bold">Select Menu Items</h3>
            <p className="text-sm text-gray-500">Choose products to make available in your branch.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

          <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products or categories"
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              Selected: <span className="font-semibold">{selectedIds.size}</span>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto border border-gray-200 rounded-2xl bg-gray-50 p-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading available products…</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No products found.</div>
            ) : (
              <div className="grid gap-3">
                {filteredItems.map((item) => (
                  <button
                    key={item.product_id}
                    type="button"
                    onClick={() => toggleSelection(item.product_id)}
                    className={`w-full text-left rounded-2xl border p-4 transition ${
                      selectedIds.has(item.product_id)
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-5 w-5 shrink-0 rounded border ${selectedIds.has(item.product_id) ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-500">{item.category_name || 'Uncategorized'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-800">₱{item.price}</p>
                            <p className="text-xs text-gray-500">{item.approval_status}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          Branch Origin: {item.origin_branch_id || 'N/A'} • Status: {item.status}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t px-6 py-4 bg-white sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-full bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Saving..." : "Save Selected Items"}
          </button>
        </div>
      </div>
    </div>
  );
}
