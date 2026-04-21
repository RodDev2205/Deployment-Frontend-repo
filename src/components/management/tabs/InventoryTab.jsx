import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Edit2 } from "lucide-react";
import API_BASE_URL from '../../../config/api';
import AddIngredientModal from "../../inventory/models/AddIngredientModal";
import EditIngredientModal from "../../inventory/models/EditIngredientModal";

export default function InventoryTab() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'item_name', direction: 'asc' });
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [errorMessage, setErrorMessage] = useState("");
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const roleId = Number(localStorage.getItem('role_id'));
  const isSuperadmin = roleId === 3;

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const endpoint = isSuperadmin ? '/api/inventory/all-inventory' : '/api/inventory/get-ingredients';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Failed to fetch inventory");
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : data.data || [];
      setInventory(items);
      setErrorMessage("");
    } catch (err) {
      console.error("Inventory fetch error:", err);
      setErrorMessage(String(err) || "Unable to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/branches/getAll`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setBranches(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Fetch branches error:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

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
      console.error("Fetch categories error:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchCategories();
    if (isSuperadmin) {
      fetchBranches();
    }
  }, [isSuperadmin]);

  const handleAddIngredient = async (newIngredient) => {
    setShowAddModal(false);
    setSelectedIngredient(null);

    if (newIngredient && newIngredient.inventory_id) {
      const branchName = branches.find((b) => String(b.branch_id) === String(newIngredient.branch_id))?.branch_name;
      setInventory((prev) => [
        { ...newIngredient, branch_name: branchName || newIngredient.branch_name },
        ...prev,
      ]);
    } else {
      await fetchInventory();
    }
  };

  const handleEditIngredient = (updatedIngredient) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.inventory_id === updatedIngredient.inventory_id) {
          // If branch changed, update the branch_name
          const newBranchName = branches.find((b) => String(b.branch_id) === String(updatedIngredient.branch_id))?.branch_name;
          return {
            ...updatedIngredient,
            branch_name: newBranchName || updatedIngredient.branch_name,
          };
        }
        return item;
      })
    );
    setShowEditModal(false);
    setSelectedIngredient(null);
  };

  // Helper functions to get category names by ID
  const getMainCategoryName = (mainCategoryId) => {
    const category = mainCategories.find((cat) => cat.main_category_id === mainCategoryId);
    return category ? category.name : "-";
  };

  const getSubCategoryName = (subCategoryId) => {
    const category = subCategories.find((cat) => cat.sub_category_id === subCategoryId);
    return category ? category.name : "-";
  };

  const filteredInventory = useMemo(() => {
    const lowerSearch = search.toLowerCase().trim();
    return inventory.filter((item) => {
      const matchesSearch =
        item.item_name?.toLowerCase().includes(lowerSearch) ||
        String(item.inventory_id).includes(lowerSearch) ||
        (item.branch_name?.toLowerCase().includes(lowerSearch));

      const matchesBranch =
        !isSuperadmin ||
        selectedBranchId === 'all' ||
        String(item.branch_id) === String(selectedBranchId);

      return matchesSearch && matchesBranch;
    });
  }, [inventory, search, selectedBranchId, isSuperadmin]);

  const sortedInventory = useMemo(() => {
    return [...filteredInventory].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? "";
      const bValue = b[sortConfig.key] ?? "";

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredInventory, sortConfig]);

  const requestSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const statusClass = (status) => {
    if (status === 'available') return 'bg-green-100 text-green-700';
    if (status === 'low_stock') return 'bg-yellow-100 text-yellow-700';
    if (status === 'out_of_stock') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const statusLabel = (status) => {
    if (status === 'available') return 'Available';
    if (status === 'low_stock') return 'Low Stock';
    if (status === 'out_of_stock') return 'Out of Stock';
    return status || 'Unknown';
  };

  if (loading) {
    return <div className="p-8">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {isSuperadmin ? 'All Inventory Items' : 'Branch Inventory'}
          </h2>
          <p className="text-sm text-gray-500">
            {isSuperadmin ? 'View all ingredients across all branches' : 'Manage branch ingredients and stock levels'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-white hover:bg-green-700 transition"
        >
          <Plus size={16} /> Add Ingredient
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredient name or ID"
              className="border-0 p-0 text-sm text-gray-700 focus:outline-none"
            />
          </div>

          {isSuperadmin && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                ...(isSuperadmin ? [{ label: 'Branch', key: 'branch_name' }] : []),
                { label: 'Ingredient Name', key: 'item_name' },
                { label: 'Main Category', key: 'main_category_id' },
                { label: 'Sub Category', key: 'sub_category_id' },
                { label: 'Quantity', key: 'quantity' },
                { label: 'Servings / Unit', key: 'servings_per_unit' },
                { label: 'Total Servings', key: 'total_servings' },
                { label: 'Low Stock Threshold', key: 'low_stock_threshold' },
                { label: 'Status', key: 'status' },
                { label: 'Actions', key: null },
              ].map((header) => (
                <th
                  key={header.label}
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {header.key ? (
                    <button
                      type="button"
                      onClick={() => requestSort(header.key)}
                      className="inline-flex items-center gap-1"
                    >
                      {header.label}
                      {sortConfig.key === header.key ? (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      ) : null}
                    </button>
                  ) : (
                    header.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-sm text-gray-700">
            {sortedInventory.map((item) => (
              <tr key={item.inventory_id} className="hover:bg-gray-50">
                {isSuperadmin && <td className="px-6 py-4 font-medium text-gray-800">{item.branch_name}</td>}
                <td className="px-6 py-4 font-medium text-gray-800">{item.item_name}</td>
                <td className="px-6 py-4">{getMainCategoryName(item.main_category_id)}</td>
                <td className="px-6 py-4">{getSubCategoryName(item.sub_category_id)}</td>
                <td className="px-6 py-4">{item.quantity}</td>
                <td className="px-6 py-4">{item.servings_per_unit}</td>
                <td className="px-6 py-4">{item.total_servings}</td>
                <td className="px-6 py-4">{item.low_stock_threshold}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      setSelectedIngredient(item);
                      setShowEditModal(true);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 hover:bg-gray-100"
                    title="Edit ingredient"
                  >
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {sortedInventory.length === 0 && (
              <tr>
                <td colSpan={isSuperadmin ? 10 : 9} className="px-6 py-16 text-center text-sm text-gray-500">
                  {isSuperadmin ? 'No inventory items found across all branches.' : 'No inventory items found for this branch.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddIngredientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddIngredient}
        branches={branches}
        inventory={inventory}
        isSuperadmin={isSuperadmin}
      />

      <EditIngredientModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedIngredient(null);
        }}
        ingredient={selectedIngredient}
        onEdit={handleEditIngredient}
        branches={branches}
        isSuperadmin={isSuperadmin}
      />
    </div>
  );
}
