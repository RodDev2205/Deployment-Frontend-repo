// InventoryManagement.jsx
import React, { useState, useEffect } from "react";
import { AlertTriangle, Plus, Edit } from "lucide-react";
import API_BASE_URL from '../../config/api';
import AddIngredientModal from "../inventory/models/AddIngredientModal";
import EditIngredientModal from "../inventory/models/EditIngredientModal";

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // ✅ Fetch ingredients from backend (branch-based)
  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem("token");

      console.log("TOKEN:", token);

      const response = await fetch(`${API_BASE_URL}/api/inventory/get-ingredients`, {
          headers: { Authorization: `Bearer ${token}` },
      });

      const text = await response.text();
      console.log("RAW RESPONSE:", text);

      if (!response.ok) {
        throw new Error(text || "Failed to fetch ingredients");
      }

      const data = JSON.parse(text);

      // Ensure inventory is always an array
      if (Array.isArray(data)) {
        setInventory(data);
      } else if (Array.isArray(data.data)) {
        setInventory(data.data);
      } else {
        setInventory([]); // fallback safety
      }

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Load on mount
  useEffect(() => {
    fetchIngredients();
  }, []);

  // ✅ After adding ingredient → refresh from DB
  const handleAddIngredient = async (newIngredient) => {
    // The modal already posts to the backend and provides the created
    // ingredient (including `inventory_id`). Avoid posting again here —
    // just merge the returned ingredient into local state.
    if (!newIngredient) return;

    setInventory((prev) => [newIngredient, ...prev]);
  };

  // Low stock is determined by units (quantity) compared to low_stock_threshold
  const lowStockItems = Array.isArray(inventory)
    ? inventory.filter(
        (item) =>
          Number(item.quantity) > 0 && 
          Number(item.quantity) <= Number(item.low_stock_threshold)
      )
    : [];

  // No stock items
  const noStockItems = Array.isArray(inventory)
    ? inventory.filter(
        (item) =>
          Number(item.quantity) <= 0 || item.status === 'out_of_stock'
      )
    : [];

  if (loading) {
    return <div className="p-8">Loading inventory...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Inventory Management
        </h1>
        <p className="text-gray-500 mt-1">
          Overview of ingredient stocks and servings
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Total Ingredients" value={inventory.length} />
        <DashboardCard
          title="Low Stock Items"
          value={lowStockItems.length}
          alert={lowStockItems.length > 0}
          alertColor="yellow"
        />
        <DashboardCard
          title="No Stock Items"
          value={noStockItems.length}
          alert={noStockItems.length > 0}
          alertColor="red"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Ingredient Stock
            </h2>
            <p className="text-sm text-gray-500">
              Manage raw ingredients and monitor servings availability
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 transition text-white rounded-2xl shadow-md font-medium"
          >
            <Plus size={18} /> Add Ingredient
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400 border-b">
                <th className="pb-4">Ingredient</th>
                <th>Units</th>
                <th>Servings/Unit</th>
                <th>Total Servings</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-700">
              {inventory.map((item) => {
                const qty = Number(item.quantity || 0);
                const threshold = Number(item.low_stock_threshold || 0);
                const isNoStock = qty <= 0 || item.status === 'out_of_stock';
                const isLow = !isNoStock && qty <= threshold;

                return (
                  <tr
                    key={item.inventory_id}
                    className="border-b last:border-none hover:bg-gray-50 transition"
                  >
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.item_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Threshold: {item.low_stock_threshold}
                        </p>
                      </div>
                    </td>

                    <td>{item.quantity}</td>
                    <td>{item.servings_per_unit}</td>

                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            isNoStock ? "text-gray-400" : isLow ? "text-red-600" : "text-gray-800"
                          }`}
                        >
                          {item.total_servings}
                        </span>

                        {isNoStock ? (
                          <span className="text-xs text-red-500 flex items-center gap-1 px-2 py-0.5 bg-red-300 rounded-full">
                            No Stock
                          </span>
                        ) : isLow ? (
                          <span className="text-xs text-yellow-500 flex items-center gap-1 px-2 py-0.5 bg-yellow-300 rounded-full">
                            <AlertTriangle size={14} /> Low
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                          item.status === "available" ? "bg-green-100 text-green-700" :
                          item.status === "low_stock" ? "bg-yellow-100 text-yellow-700" :
                          item.status === "out_of_stock" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {item.status === "low_stock" ? "Low Stock" :
                         item.status === "out_of_stock" ? "No Stock" :
                         item.status}
                      </span>
                    </td>

                    <td className="text-right">
                      <button
                        className="p-2 rounded-xl hover:bg-gray-200 transition"
                        onClick={() => {
                          setSelectedIngredient(item);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {inventory.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              No ingredients found for this branch.
            </div>
          )}
        </div>
      </div>

      <EditIngredientModal
        isOpen={isEditModalOpen}
        ingredient={selectedIngredient}
        onClose={() => setIsEditModalOpen(false)}
        onEdit={(updatedIngredient) => {
          setInventory((prev) =>
            prev.map((item) =>
              item.inventory_id === updatedIngredient.inventory_id
                ? updatedIngredient
                : item
            )
          );
        }}
      />
      <AddIngredientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddIngredient}
      />
    </div>
  );
};

const DashboardCard = ({ title, value, alert, alertColor = "red" }) => {
  const bgColorMap = {
    red: "bg-red-50",
    yellow: "bg-yellow-50",
  };
  const textColorMap = {
    red: "text-red-600",
    yellow: "text-yellow-600",
  };

  return (
    <div
      className={`p-6 rounded-2xl shadow-md ${
        alert ? bgColorMap[alertColor] : "bg-white"
      } hover:shadow-lg transition`}
    >
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p
        className={`text-2xl font-bold ${
          alert ? textColorMap[alertColor] : "text-gray-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
};

export default InventoryManagement;