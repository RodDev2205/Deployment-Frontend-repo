import React from 'react';
import { PhilippinePeso, Package, AlertTriangle, Users } from 'lucide-react';
import API_BASE_URL from '../config/api';

const StatCard = ({ title, value, icon: Icon, bgColor, textColor }) => (
  <div className={`p-6 rounded-xl shadow hover:shadow-xl transition duration-300 flex items-center justify-between ${bgColor}`}>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`text-3xl font-bold ${textColor} mt-1`}>{value}</p>
    </div>
    <Icon className={`w-8 h-8 ${textColor}`} />
  </div>
);

const TopMenuSalesChart = ({ menuSales }) => {
  if (!menuSales || menuSales.length === 0) {
    return (
      <div className="h-80 bg-gray-50 p-4 rounded-lg shadow flex items-center justify-center">
        <p className="text-gray-500">Loading menu sales data...</p>
      </div>
    );
  }

  // Sort by sales amount descending and take top 10
  const sorted = [...menuSales]
    .sort((a, b) => (Number(b.total_sales) || 0) - (Number(a.total_sales) || 0))
    .slice(0, 10);
  
  const maxSales = Math.max(...sorted.map(m => Number(m.total_sales) || 0));

  return (
    <div className="w-full h-80 flex flex-col">
      {/* Y-axis labels and bars */}
      <div className="flex-1 flex items-end gap-2 px-2 py-4 border-l-2 border-gray-300">
        {sorted.map((item, idx) => {
          const heightPercent = maxSales > 0 ? (Number(item.total_sales) || 0) / maxSales * 100 : 0;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              {/* Bar */}
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '280px' }}>
                <div 
                  className="w-full bg-gradient-to-t from-green-800 to-green-600 rounded-t transition-all hover:from-green-600 hover:to-green-500 cursor-pointer group relative"
                  style={{ height: `${heightPercent}%`, minHeight: heightPercent > 0 ? '20px' : '0px' }}
                  title={`${item.menu_name}: ₱${Number(item.total_sales || 0).toLocaleString()}`}
                >
                  {/* Value label on hover */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    ₱{Number(item.total_sales || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Label */}
              <div className="w-full text-center -mb-1">
                <p className="text-xs font-semibold text-gray-700 truncate" title={item.menu_name}>
                  {item.menu_name || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">{item.branch_name || 'Branch'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DashboardContent = () => {
  const [inventoryCount, setInventoryCount] = React.useState(0);
  const [lowStockCount, setLowStockCount] = React.useState(0);
  const [branchSales, setBranchSales] = React.useState([]);
  const [branches, setBranches] = React.useState([]);
  const [activeUsers, setActiveUsers] = React.useState(0);
  const [recentTransactions, setRecentTransactions] = React.useState({});
  const [menuSales, setMenuSales] = React.useState([]);

  React.useEffect(() => {
    const token = localStorage.getItem("token");

    // fetch total inventory count
    fetch(`${API_BASE_URL}/api/inventory/count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.count === "number") {
          setInventoryCount(data.count);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch inventory count", err);
      });

    // fetch low stock count
    fetch(`${API_BASE_URL}/api/inventory/low-stock-count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.count === "number") {
          setLowStockCount(data.count);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch low stock count", err);
      });

    // fetch branch sales summary
    fetch(`${API_BASE_URL}/api/sales-superadmin/branch-sales-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.branches)) setBranchSales(data.branches);
      })
      .catch((err) => console.error('Failed to fetch branch sales', err));

    // fetch dashboard stats (includes active employees)
    fetch(`${API_BASE_URL}/api/sales-superadmin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.active_employees === 'number') setActiveUsers(data.active_employees);
      })
      .catch((err) => console.error('Failed to fetch dashboard stats', err));

    // fetch top menu sales by branch
    fetch(`${API_BASE_URL}/api/sales-superadmin/top-menu-sales`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMenuSales(data);
        else if (data && Array.isArray(data.items)) setMenuSales(data.items);
      })
      .catch((err) => console.error('Failed to fetch menu sales', err));
  }, []);

  // derive branches from branchSales when branches endpoint is not available
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if ((!branches || branches.length === 0) && branchSales && branchSales.length) {
      const derived = branchSales.map((b) => ({ id: b.branch_id ?? b.id, name: b.branch_name ?? b.name }));
      setBranches(derived);

      // fetch recent transactions for derived branches
      (async () => {
        const txMap = {};
        await Promise.all(
          derived.map(async (b) => {
            const bId = b.id;
            if (!bId) return;
            // try only the sales-superadmin endpoint; silently ignore failures
            try {
              const r = await fetch(`${API_BASE_URL}/api/sales-superadmin/recent-transactions?branchId=${bId}&limit=3`, { headers: { Authorization: `Bearer ${token}` } });
              if (r.ok) {
                const json = await r.json();
                if (Array.isArray(json)) {
                  txMap[bId] = json.slice(0, 3);
                } else if (json && Array.isArray(json.transactions)) {
                  txMap[bId] = json.transactions.slice(0, 3);
                }
              }
            } catch (e) {
              // ignore network/parse errors, the endpoint may not exist on this backend
            }
          })
        );
        setRecentTransactions((prev) => ({ ...prev, ...txMap }));
      })();
    }
  }, [branchSales]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Daily Sales"
          value={branchSales && branchSales.length ? `₱${Number(branchSales.reduce((s, b) => s + (Number(b.total_sales) || 0), 0)).toLocaleString()}` : '₱0'}
          icon={PhilippinePeso}
          bgColor="bg-green-50"
          textColor="text-green-800"
        />
        <StatCard
          title="Current Inventory"
          value={`${inventoryCount} Items`}
          icon={Package}
          bgColor="bg-amber-50"
          textColor="text-amber-700"
        />
        <StatCard
          title="Low Stock Alerts"
          value={`${lowStockCount} Items`}
          icon={AlertTriangle}
          bgColor="bg-red-50"
          textColor="text-red-700"
        />
        <StatCard
          title="Active Cashiers"
          value={`${activeUsers} Users`}
          icon={Users}
          bgColor="bg-white"
          textColor="text-indigo-600"
        />
      </div>

      {/* Top Menu Sales Chart */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Menu Sales by Branch</h3>
        <TopMenuSalesChart menuSales={menuSales} />
        <p className="text-center text-sm text-gray-500 mt-7">Ranked by total sales amount across all branches</p>
      </div>


      {/* Recent Transactions (flattened recent items up to 3 per branch) */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent POS Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.values(recentTransactions)
                .flat()
                .slice(0, 12) // show up to 12 rows (e.g., 3 per up to 4 branches)
                .map((t) => (
                  <tr key={t.transaction_id || t.id || t.tx_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.transaction_number || t.id || t.tx_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.cashier_username || t.cashier || t.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">₱{Number(t.total_amount || t.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.created_at || t.time || t.timestamp || t.date ? new Date(t.created_at || t.time || t.timestamp || t.date).toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', year: 'numeric', month: 'numeric', day: 'numeric' }) : ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{t.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
