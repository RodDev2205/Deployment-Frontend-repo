import React from 'react';
import API_BASE_URL from '../config/api';
import StatCard from '../components/management/Statcard';
import SalesOverview from '../components/management/SalesOverview';
import InventoryOverview from '../components/management/InventoryOverview';
import { TrendingUp, PhilippinePeso, Users, AlertCircle } from 'lucide-react';

const DashboardLayout = () => {
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Error loading dashboard stats', err);
      }
    };
    fetchStats();
  }, []);

  // compute display values
  const totalSales = stats ? `₱ ${Number(stats.total_sales).toLocaleString()}` : '—';
  // Only count COMPLETED transactions (not refunded, voided, or partially refunded)
  const totalTrans = stats ? `${Number(stats.status_counts.completed)} Orders` : '—';
  const activeEmps = stats ? `${stats.active_employees} Active` : '—';
  const lowStock = stats ? `${stats.low_stock} items` : '—';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-6 bg-gray-100 h-screen overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome back! Here's an overview key information across all branches for today.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={PhilippinePeso}
            title="Total Sales Today"
            value={totalSales}
            bgColor="bg-green-100"
            textColor="text-green-600"
          />
          <StatCard
            icon={TrendingUp}
            title="Total Transactions"
            value={totalTrans}
            bgColor="bg-blue-100"
            textColor="text-blue-600"
          />
          <StatCard
            icon={Users}
            title="Active Employees"
            value={activeEmps}
            bgColor="bg-yellow-100"
            textColor="text-yellow-600"
          />
          <StatCard
            icon={AlertCircle}
            title="Low Stock Items"
            value={lowStock}
            bgColor="bg-red-100"
            textColor="text-red-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SalesOverview />
          <InventoryOverview />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
