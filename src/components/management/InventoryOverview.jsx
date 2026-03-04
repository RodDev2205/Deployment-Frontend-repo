import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api';
import { useNavigate } from 'react-router-dom';

const InventoryOverview = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState([]);

  // fetch branch list on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/branches`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch branches');
        const data = await res.json();
        setBranches(data || []);
        if (data && data.length) {
          setActiveTab('all');
        }
      } catch (err) {
        console.error('Error loading branches', err);
      }
    };
    fetchBranches();
  }, []);

  // helper to build branch tabs list (include "All")
  const branchTabs = ['all', ...branches.map((b) => b.branch_id.toString())];

  // fetch low-stock items whenever activeTab changes
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const params = new URLSearchParams();
        if (activeTab !== 'all') params.append('branchId', activeTab);
        params.append('limit', 3);
        const res = await fetch(`${API_BASE_URL}/api/inventory/low-stock-items?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch low stock items');
        const data = await res.json();
        setItems(data || []);
      } catch (err) {
        console.error('Error loading low stock items', err);
      }
    };
    fetchItems();
  }, [activeTab]);



  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Inventory Overview</h2>

      {/* Branch Tabs */}
      <div className="flex gap-0 mb-4 pb-3 pr-3 border-b-2 border-gray-300 overflow-x-auto">
        {branchTabs.map((tab) => {
          const isAll = tab === 'all';
          const label = isAll ? 'All Branches' : (branches.find(b => b.branch_id.toString() === tab)?.branch_name || tab);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold mr-4 ${
                activeTab === tab
                  ? 'bg-green-700 text-white px-6 py-2 rounded'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-0">
        <div className="col-span-2 border-gray-300"></div>

        {/* Items */}
        {items.length > 0 ? items.map((item, index) => (
          <React.Fragment key={index}>
            <div className="text-sm text-gray-700 py-2 pr-4 border-r-2 border-gray-300">{item.item_name || item.product_name}</div>
            <div className="text-sm text-gray-700 py-2 pl-4">{item.quantity != null ? item.quantity : item.total_servings}</div>
          </React.Fragment>
        )) : (
          <div className="col-span-2 text-center text-gray-500 py-4">No low-stock items</div>
        )}
      </div>

      <button 
        onClick={() => navigate('/superadmin/menu-inventory', { state: { activeTab: 'inventory' } })}
        className="mt-6 text-green-700 hover:text-green-800 text-sm font-medium"
      >
        Go to Inventory Page to view status
      </button>
    </div>
  );
};

export default InventoryOverview;
