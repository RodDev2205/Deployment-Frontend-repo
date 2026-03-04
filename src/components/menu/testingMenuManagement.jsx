import React, { useState, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import AddMenuItemModal from "../menu/modal/AddMenuItemModal";
import EditMenuItemModal from "../menu/modal/EditMenuItemModal";
import { Edit2, Trash2, Search } from "lucide-react";
import API_BASE_URL from '../../config/api';

export default function MenuManagementUI() {
  const [menuItems, setMenuItems] = useState([]);
  const [declinedItems, setDeclinedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDeclined, setEditingDeclined] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Menu List"); // possible values: Menu List, Archived, Declined

  // alert hooks
  const { error: alertError, warning, success, confirm, danger } = useAlert();

  const API_BASE = `${API_BASE_URL}/api`;

  const fetchDeclinedItems = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/menu/declined`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch declined items");
      const data = await res.json();
      setDeclinedItems(data);
    } catch (err) {
      console.error("Fetch declined items failed:", err);
    }
  };

  // fetch only archived products
  const fetchArchivedItems = async () => {
    await fetchProducts('archived');
  };

  // generic product fetcher, can request specific status
  const fetchProducts = async (status = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not authenticated. Please login.");
        setLoading(false);
        return;
      }
      const statusParam = status || (activeTab === 'Archived' ? 'archived' : 'active');
      const response = await fetch(`${API_BASE}/menu?menu_status=${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        throw new Error("Unauthorized (401) - token missing or expired. Please login.");
      }
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError(err.message);
      console.error("Fetch products failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/categories`);
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts('active');
    fetchCategories();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "All Items" ||
      item.category_name === activeCategory;
    const matchesSearch =
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = (item) => {
    console.log("New Item:", item);
    // Refresh products after adding new item using same status filter as current tab
    const statusParam = activeTab === 'Archived' ? 'archived' : 'active';
    fetchProducts(statusParam);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditingDeclined(false);
    setIsEditOpen(true);
  };

  const handleDelete = (productId) => {
    danger(
      "Delete Item",
      "Are you sure you want to delete this item?",
      async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/menu/${productId}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          if (res.ok) {
            setMenuItems((prev) => prev.filter((item) => item.product_id !== productId));
            success("Deleted", "Menu item removed successfully.");
          } else {
            alertError("Delete Failed", "Failed to delete item");
          }
        } catch (err) {
          console.error(err);
          alertError("Error", err.message);
        }
      }
    );
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Menu Management</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition"
        >
          + Add New Menu Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-4 mb-2">
        {['Menu List', 'Archived', 'Declined'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setActiveTab(t);
              if (t === 'Declined') {
                fetchDeclinedItems();
              } else if (t === 'Archived') {
                fetchArchivedItems();
              } else {
                fetchProducts('active');
              }
            }}
            className={`px-4 py-2 rounded ${activeTab === t ? 'bg-green-600 text-white' : 'bg-white border'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* SEARCH BAR & CATEGORY DROPDOWN */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-md">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="All Items">All Items</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_name}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
        {loading ? (
          <p className="text-center col-span-4 text-gray-500 py-10">Loading...</p>
        ) : error ? (
          <p className="text-center col-span-4 text-red-500 py-10">Error: {error}</p>
        ) : activeTab === 'Menu List' ? (
          filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item.product_id} className="bg-white shadow-md p-4 rounded-xl overflow-hidden flex flex-col h-full">
                {item.image_path && (
                  <img 
                    src={`${API_BASE_URL}${item.image_path}`} 
                    alt={item.product_name}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold text-lg">{item.product_name}</h3>
                <p className="text-sm text-gray-500">{item.category_name}</p>
                <p className="text-green-600 font-bold">₱{item.price}</p>
                <div className="mt-2 text-xs space-y-1 mb-4">
                  <p className="text-gray-600">Status: <span className="font-medium">{item.status}</span></p>
                  <p className="text-gray-600">POS Status: <span className="font-medium">{item.menu_status}</span></p>
                </div>

                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition font-medium flex items-center justify-center gap-2"
                    title="Edit item"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.product_id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded transition font-medium flex items-center justify-center gap-2"
                    title="Delete item"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center col-span-4 text-gray-500 py-10">No items found</p>
          )
        ) : (
          // Declined tab content
          (declinedItems.length > 0 ? (
            declinedItems.map((item) => (
              <div key={item.product_id} className="bg-white shadow-md p-4 rounded-xl overflow-hidden flex flex-col h-full">
                {item.image_path && (
                  <img 
                    src={`${API_BASE_URL}${item.image_path}`} 
                    alt={item.product_name}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold text-lg">{item.product_name}</h3>
                <p className="text-sm text-gray-500">{item.category_name}</p>
                <p className="text-green-600 font-bold">₱{item.price}</p>
                <div className="mt-2 text-xs space-y-1 mb-4">
                  <p className="text-gray-600">Status: <span className="font-medium">{item.status}</span></p>
                  <p className="text-gray-600">Approval: <span className="font-medium">{item.approval_status}</span></p>
                  {item.reviewed_by && <p className="text-gray-600">Reviewed by: <span className="font-medium">{item.reviewed_by}</span></p>}
                  {item.decline_reason && <p className="text-red-600 text-xs">Reason: <span className="font-medium">{item.decline_reason}</span></p>}
                </div>

                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => { setSelectedItem(item); setEditingDeclined(true); setIsEditOpen(true); }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition font-medium flex items-center justify-center gap-2"
                    title="Edit declined item"
                  >
                    <Edit2 size={16} />
                    Edit / Resubmit
                  </button>
                  <button
                    onClick={() => handleDelete(item.product_id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded transition font-medium flex items-center justify-center gap-2"
                    title="Delete item"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center col-span-4 text-gray-500 py-10">No declined items</p>
          ))
        )}
      </div>

      {/* ------------------ ADD MODAL ------------------ */}
      <AddMenuItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddItem={handleAddItem}
        categories={categories}
      />
      <EditMenuItemModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSaved={() => {
          // refresh lists after save
          refreshProducts();
          fetchDeclinedItems();
          setIsEditOpen(false);
        }}
        item={selectedItem}
        categories={categories}
        declined={editingDeclined}
      />
    </div>
  );
}