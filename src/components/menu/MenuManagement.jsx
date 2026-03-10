import React, { useState, useEffect } from "react";
import MenuItemCard from "./MenuItemCard";
import AddNewItemForm from "./AddNewItemForm";
import EditDeclinedModal from "./EditDeclinedModal";
import EditApprovedModal from "./EditItemModal";
import API_BASE_URL from '../../config/api';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [declinedItems, setDeclinedItems] = useState([]); // Declined items state
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState("Menu List"); // possible values: Menu List, Archived, Declined List
  const token = localStorage.getItem("token");

  const API_MENU = `${API_BASE_URL}/api/menu`;
  const API_CATEGORIES = `${API_BASE_URL}/api/categories`;
  const API_DECLINED = `${API_BASE_URL}/api/menu/declined`;

  // ------------------- FETCH ON MOUNT -------------------
  useEffect(() => {
    fetchCategories();
    fetchMenuItems('active');
  }, []);

  // ------------------- FETCH CATEGORIES -------------------
  const fetchCategories = async () => {
    try {
      const res = await fetch(API_CATEGORIES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Fetch categories failed:", err);
    }
  };

  // ------------------- FETCH APPROVED MENU ITEMS -------------------
  const fetchMenuItems = async (status = null) => {
    try {
      // build query string based on desired status
      let url = API_MENU;
      const params = [];
      if (status) {
        params.push(`menu_status=${status}`);
      }
      if (params.length) {
        url += `?${params.join("&")}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch menu items");
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      console.error("Fetch menu items failed:", err);
    }
  };

  // ------------------- FETCH DECLINED ITEMS -------------------
  const fetchDeclinedItems = async () => {
    try {
      const res = await fetch(API_DECLINED, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch declined items");
      const data = await res.json();
      setDeclinedItems(data);
    } catch (err) {
      console.error("Fetch declined items failed:", err);
    }
  };

  // ------------------- HANDLE ADD ITEM -------------------
  const handleAddItem = async (item) => {
    try {
      const formData = new FormData();
      formData.append("product_name", item.product_name);
      formData.append("category_id", item.category_id);
      formData.append("price", item.price);
      if (item.file) formData.append("image", item.file);

      const res = await fetch(API_MENU, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Add item error:", text);
        return;
      }

      const newItem = await res.json();
      setMenuItems((prev) => [...prev, newItem]);
    } catch (err) {
      console.error("Add item failed:", err);
    }
  };

  // ------------------- HANDLE DELETE ITEM -------------------
  const handleDeleteItem = async (product_id, tab) => {
    try {
      const res = await fetch(`${API_MENU}/${product_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Delete item error:", text);
        return;
      }

      if (tab === "Menu List") {
        setMenuItems((prev) => prev.filter((item) => item.product_id !== product_id));
      } else {
        setDeclinedItems((prev) => prev.filter((item) => item.product_id !== product_id));
      }
    } catch (err) {
      console.error("Delete item failed:", err);
    }
  };

  // ------------------- HANDLE SAVE EDITED ITEM -------------------
  const handleSaveEditedItem = (updatedItem) => {
    if (activeTab === "Menu List") {
      setMenuItems(prev =>
        prev.map(item =>
          item.product_id === updatedItem.product_id ? updatedItem : item
        )
      );
    } else {
      setDeclinedItems(prev =>
        prev.map(item =>
          item.product_id === updatedItem.product_id ? updatedItem : item
        )
      );
    }

    setEditingItem(null);
  };


  // ------------------- FILTERED ITEMS -------------------
  const filteredItems =
    activeTab === "Menu List"
      ? menuItems.filter(
          (item) =>
            activeCategory === "All Items" || item.category_name === activeCategory
        )
      : declinedItems.filter(
          (item) =>
            activeCategory === "All Items" || item.category_name === activeCategory
        );

  // ------------------- HANDLE TAB SWITCH -------------------
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setActiveCategory("All Items"); // reset category filter
    if (tab === "Declined List") {
      fetchDeclinedItems();
    } else if (tab === "Archived") {
      fetchMenuItems('archived');
    } else {
      // Menu List (default)
      fetchMenuItems('active');
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Menu Management</h2>

      {/* ------------------- TAB TOGGLE ------------------- */}
      <div className="flex gap-4 mb-4">
        {["Menu List", "Archived", "Declined List"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabSwitch(tab)}
            className={`px-4 py-2 rounded-full font-medium transition ${
              activeTab === tab ? "bg-[#1B5E20] text-white" : "bg-gray-100 hover:bg-green-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Only show Add Form in Menu List */}
      {activeTab === "Menu List" && (
        <AddNewItemForm onAddItem={handleAddItem} categories={categories} />
      )}

      {/* ------------------- CATEGORY FILTER ------------------- */}
      <div className="flex flex-wrap bg-white p-4 rounded-xl shadow-md gap-3">
        <button
          key="All Items"
          onClick={() => setActiveCategory("All Items")}
          className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition ${
            activeCategory === "All Items" ? "bg-[#1B5E20] text-white" : "bg-gray-100 hover:bg-green-100"
          }`}
        >
          All Items ({filteredItems.length})
        </button>

        {categories.map((cat) => {
          const count = filteredItems.filter((item) => item.category_name === cat.category_name).length;
          return (
            <button
              key={cat.category_id}
              onClick={() => setActiveCategory(cat.category_name)}
              className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition ${
                activeCategory === cat.category_name ? "bg-[#1B5E20] text-white" : "bg-gray-100 hover:bg-green-100"
              }`}
            >
              {cat.category_name} ({count})
            </button>
          );
        })}
      </div>

      {/* ------------------- PRODUCT GRID ------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <MenuItemCard
              key={item.product_id}
              item={item}
              onEdit={() => setEditingItem(item)}
              onDelete={() => handleDeleteItem(item.product_id, activeTab)}
            />
          ))
        ) : (
          <p className="text-center col-span-4 text-gray-500 py-10">
            No items found in {activeCategory}
          </p>
        )}
      </div>

      {/* ------------------- EDIT MODAL ------------------- */}
      {editingItem && editingItem.approval_status === "DECLINED" && (
        <EditDeclinedModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdated={handleSaveEditedItem}
          categories={categories}
        />
      )}

      {editingItem && editingItem.approval_status === "APPROVED" && (
        <EditApprovedModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdated={handleSaveEditedItem}
          categories={categories}
        />
      )}
    </div>
  );
}
