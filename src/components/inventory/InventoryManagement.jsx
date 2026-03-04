import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import API_BASE_URL from '../../config/api';

import InventoryTabs from "./InventoryTabs";
import StockTabContent from "./StockTabContent";
import PortionFormulaTabContent from "./PortionFormulaTabContent";
import PortionFormulaModal from "./PortionFormulaModal";

// ================== Ingredient Modal ==================
const IngredientModal = ({ onClose, onSave, item }) => {
  const { error: alertError } = useAlert();
  const [form, setForm] = useState({
    name: item?.name || "",
    unit: item?.unit || "",
    quantity: item?.quantity || 0,
    supplier: item?.supplier || "",
  });

  const handleChange = (e) => {
    const value =
      e.target.name === "quantity" ? parseFloat(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const saveHandler = () => {
    if (!form.name || !form.unit || form.quantity <= 0) {
      alertError("Validation", "All fields are required!");
      return;
    }

    onSave({
      ...form,
      raw_item_id: item?.raw_item_id ?? null,
    });
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/20 z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96">
        <h3 className="text-xl font-bold mb-4">
          {item ? "Edit Ingredient" : "Add Ingredient"}
        </h3>

        <div className="space-y-3">
          <input
            name="name"
            type="text"
            placeholder="Ingredient Name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            name="unit"
            type="text"
            placeholder="Unit (kg, g, pcs)"
            value={form.unit}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            name="quantity"
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            name="supplier"
            type="text"
            placeholder="Supplier"
            value={form.supplier}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
            onClick={saveHandler}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ================== Low Stock Modal ==================
const LowStockModal = ({ lowStockItems, onClose }) => (
  <div className="fixed inset-0 flex justify-center items-center bg-black/20 z-50 p-4">
    <div className="bg-white p-6 rounded-xl shadow-xl">
      <h3 className="text-xl font-bold text-red-800 flex items-center gap-2">
        <AlertTriangle /> Low Stock Items
      </h3>

      <ul className="list-disc ml-5 mt-2">
        {lowStockItems.map((item) => (
          <li key={item.raw_item_id}>
            {item.name} ({item.quantity})
          </li>
        ))}
      </ul>

      <button
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  </div>
);

// ================== MAIN COMPONENT ==================
const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const { error: alertError, success } = useAlert();
  const [portions, setPortions] = useState([]);

  const [activeTab, setActiveTab] = useState("stock");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [showLowStockModal, setShowLowStockModal] = useState(false);

  const [showPortionModal, setShowPortionModal] = useState(false);
  const [editingPortion, setEditingPortion] = useState(null);

  // ================== LOAD INGREDIENTS ==================
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/raw-items`)
      .then((res) => res.json())
      .then((data) => setInventory(data))
      .catch((err) => console.error("Inventory fetch error:", err));
  }, []);

  // ================== LOAD PORTIONS ==================
  const loadPortions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/portions`);
      const data = await res.json();
      const formatted = data.map((p) => ({
        ...p,
        formula: JSON.parse(p.formula_json || "[]"),
      }));
      setPortions(formatted);
    } catch (err) {
      console.error("Portion fetch error:", err);
    }
  };

  useEffect(() => {
    loadPortions();
  }, []);

  // ================== ADD/UPDATE INGREDIENT ==================
  const handleAddItem = async (newItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/raw-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const saved = await res.json();
      setInventory([...inventory, saved]);
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      alertError("Error", "Failed to save ingredient.");
    }
  };

  const handleSaveItem = async (updatedItem) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/raw-items/${updatedItem.raw_item_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedItem),
        }
      );
      const saved = await res.json();
      setInventory(
        inventory.map((i) => (i.raw_item_id === saved.raw_item_id ? saved : i))
      );
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      alertError("Error", "Failed to update item.");
    }
  };

  // ================== SAVE/UPDATE PORTION ==================
  const handleSavePortion = async (portionData) => {
    try {
      const method = editingPortion ? "PUT" : "POST";
      const url = editingPortion
        ? `${API_BASE_URL}/api/portions/${editingPortion.portion_id}`
        : `${API_BASE_URL}/api/portions`;

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portion_id: editingPortion?.portion_id,
          portion_name: portionData.portion_name,
          formula: portionData.formula,
        }),
      });

      await loadPortions();
    } catch (error) {
      console.error("Error saving portion:", error);
      alertError("Error", "Failed to save portion.");
    } finally {
      setEditingPortion(null);
      setShowPortionModal(false);
    }
  };

  // ================== LOW STOCK FILTER ==================
  const lowStockItems = inventory.filter((i) => i.quantity <= 10);

  // ================== FILTERING ==================
  const filteredItems = inventory.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ================== SORTING ==================
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "ascending" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending")
      direction = "descending";
    setSortConfig({ key, direction });
  };

  // ================== RENDER ==================
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800">
        Ingredient Inventory Management
      </h2>

      {lowStockItems.length > 0 && (
        <div
          className="bg-red-100 text-red-700 px-4 py-2 rounded-lg w-max cursor-pointer flex items-center gap-2"
          onClick={() => setShowLowStockModal(true)}
        >
          <AlertTriangle /> Low Stock Items: {lowStockItems.length}
        </div>
      )}

      <InventoryTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "stock" && (
        <StockTabContent
          lowStockItems={lowStockItems}
          setShowLowStockModal={setShowLowStockModal}
          setShowAddModal={setShowAddModal}
          sortedItems={sortedItems}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortConfig={sortConfig}
          requestSort={requestSort}
          setEditingItem={setEditingItem}
        />
      )}

      {activeTab === "portion" && (
        <PortionFormulaTabContent
          portions={portions}
          inventory={inventory}
          setShowPortionModal={setShowPortionModal}
          setEditingPortion={setEditingPortion}
        />
      )}

      {showAddModal && (
        <IngredientModal onClose={() => setShowAddModal(false)} onSave={handleAddItem} />
      )}

      {editingItem && (
        <IngredientModal  
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
        />
      )}

      {showPortionModal && (
        <PortionFormulaModal
          portion={editingPortion}
          inventory={inventory}
          onSave={handleSavePortion}
          onClose={() => {
            setShowPortionModal(false);
            setEditingPortion(null);
          }}
        />
      )}

      {showLowStockModal && (
        <LowStockModal lowStockItems={lowStockItems} onClose={() => setShowLowStockModal(false)} />
      )}
    </div>
  );
};

export default InventoryManagement;
