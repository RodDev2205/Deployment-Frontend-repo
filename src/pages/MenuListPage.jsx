import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MenuListTab from "../components/management/tabs/MenuListTab";
import AddMenuItemModal from "../components/menu/modal/AddMenuItemModal";
import EditMenuItemModal from "../components/menu/modal/EditMenuItemModal";
import API_BASE_URL from "../config/api";

export default function MenuListPage() {
  const location = useLocation();
  const [menuRefreshKey, setMenuRefreshKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [categories, setCategories] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Menu Management
        </h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition"
        >
          + Add Menu Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <MenuListTab key={menuRefreshKey} />
      </div>

      <AddMenuItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddItem={() => {
          setMenuRefreshKey((prev) => prev + 1);
          setIsAddModalOpen(false);
        }}
        categories={categories}
      />

      <EditMenuItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => {
          setMenuRefreshKey((prev) => prev + 1);
          setIsEditModalOpen(false);
        }}
        item={selectedItem}
        categories={categories}
      />
    </div>
  );
}
