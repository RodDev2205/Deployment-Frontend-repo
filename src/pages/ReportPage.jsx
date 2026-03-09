import React, { useState, useEffect } from 'react';
import { Download, Calendar, Filter, TrendingUp, PhilippinePeso, Package, Users, BarChart3 } from 'lucide-react';
import API_BASE_URL from '../config/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportPage() {
  const [dateRange, setDateRange] = useState('daily');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [branches, setBranches] = useState([]);

  // sales trend data fetched from backend
  const [trendData, setTrendData] = useState([]);

  // helper: convert DB rows into chart-compatible format based on the currently selected period
  const transformTrend = (rows) => {
    return rows.map((r) => {
      let label = r.period_key;
      switch (dateRange) {
        case 'daily': { // convert iso date to weekday abbreviation
          const d = new Date(r.period_key);
          const weekday = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          label = weekday[d.getDay()];
          break;
        }
        case 'weekly': {
          // r.period_key like "2023-05" -> "W5" (week number)
          const parts = r.period_key.split('-');
          label = `W${parseInt(parts[1], 10)}`;
          break;
        }
        case 'monthly': {
          const [year, mon] = r.period_key.split('-');
          const m = new Date(year, mon - 1).toLocaleString('en-US', { month: 'short' });
          label = `${m}`;
          break;
        }
        case 'quarterly': {
          // r.period_key like "2023-Q2" or "2023-Q1"
          const parts = r.period_key.split('-Q');
          if (parts.length === 2) {
            label = `Q${parts[1]} ${parts[0]}`;
          } else {
            label = r.period_key;
          }
          break;
        }
        case 'yearly': {
          label = r.period_key;
          break;
        }
        default:
          break;
      }
      return { date: label, sales: r.total_sales };
    });
  };

  // branch comparison data fetched from backend
  const [branchComparisonData, setBranchComparisonData] = useState([]);

  // menu performance data fetched from backend
  const [menuPerformance, setMenuPerformance] = useState([]);

  // Calculate branch contribution percentages
  const totalBranchSales = branchComparisonData.reduce((sum, b) => sum + Number(b.total_sales), 0);
  const branchContribution = branchComparisonData.map((branch, idx) => {
    const salesNum = Number(branch.total_sales);
    const percentage = totalBranchSales ? ((salesNum / totalBranchSales) * 100).toFixed(1) : 0;
    const colors = ['#059669', '#3b82f6', '#f59e0b', '#8b5cf6', '#f65c5c', '#f2ff00', '#63f1d0', '#f97316'];
    const shortLabel = `br-${branch.branch_id}`; // use short id for slice label
    return {
      name: branch.branch_name,
      shortLabel,
      value: parseFloat(percentage),
      color: colors[idx % colors.length],
      sales: salesNum,
    };
  });

  // detailed comparison derived from branch comparison data
  const detailedComparison = branchComparisonData.map((b) => {
    const revenue = Number(b.total_sales);
    const tx = Number(b.transaction_count || 0);
    const prevRevenue = Number(b.prev_sales || 0);
    const prevDays = Number(b.prev_window_days || 0);
    // compute growth percentage relative to previous period
    // avoid misleadingly large percentages when previous revenue is tiny
    let growthDisplay = 'N/A';
    if (prevRevenue >= 1) {
      const g = ((revenue - prevRevenue) / prevRevenue) * 100;
      growthDisplay = `${g.toFixed(1)}%`;
    }
    return {
      branch: b.branch_name,
      monthlyRevenue: revenue,
      transactions: tx,
      avgOrder: tx ? Math.round(revenue / tx) : 0,
      growth: growthDisplay,
      prevRevenue,
      prevDays,
    };
  });



  // note for growth column based on previous window
  const comparisonDays = branchComparisonData.length ? branchComparisonData[0].prev_window_days : 1;
  const comparisonNote = comparisonDays > 1 ? ` (vs previous ${comparisonDays}-day total)` : '';

  // KPI Cards (stateful — populated from backend)
  const [kpiCards, setKpiCards] = useState([
    { title: 'Total Revenue', value: '₱3,160,000', change: '+12.5%', icon: PhilippinePeso, color: 'bg-green-100 text-green-600' },
    { title: 'Total Transactions', value: '4,250', change: '+8.2%', icon: BarChart3, color: 'bg-blue-100 text-blue-600' },
    { title: 'Average Order Value', value: '₱743', change: '+5.1%', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
    { title: 'Active Branches', value: '4', change: '0%', icon: Package, color: 'bg-orange-100 text-orange-600' },
    { title: 'Avg Transactions/Day', value: '607', change: '+3.2%', icon: Users, color: 'bg-pink-100 text-pink-600' },
    { title: 'Month-to-Date', value: '28 days', change: '-2 days', icon: Calendar, color: 'bg-indigo-100 text-indigo-600' },
  ]);

  const formatCurrency = (n) => `₱${Number(n || 0).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;

  const getRangeDates = (range) => {
    const today = new Date();
    let start = new Date();
    if (range === 'daily') {
      start = new Date(today);
    } else if (range === 'weekly') {
      start.setDate(today.getDate() - 6);
    } else if (range === 'monthly') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (range === 'quarterly') {
      start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    } else if (range === 'yearly') {
      start = new Date(today.getFullYear(), 0, 1);
    }
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { startDate: fmt(start), endDate: fmt(today) };
  };

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
      } catch (err) {
        console.error('Failed to load branches', err);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const { startDate, endDate } = getRangeDates(dateRange);
        const branchParam = selectedBranch && selectedBranch !== 'all' ? `&branchId=${selectedBranch}` : '';
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/kpis?startDate=${startDate}&endDate=${endDate}${branchParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch KPIs');
        const data = await res.json();
        // Map API response to card layout
        const cards = [
          { title: 'Total Sales', value: formatCurrency(data.total_sales), change: '', icon: PhilippinePeso, color: 'bg-green-100 text-green-600' },
          { title: 'Gross Sales', value: formatCurrency(data.gross_sales), change: '', icon: PhilippinePeso, color: 'bg-blue-100 text-blue-600' },
          { title: 'Total Transactions', value: data.transaction_count?.toString() || '0', change: '', icon: BarChart3, color: 'bg-purple-100 text-purple-600' },
          { title: 'Average Order Value', value: formatCurrency(data.avg_order_value), change: '', icon: TrendingUp, color: 'bg-orange-100 text-orange-600' },
          { title: 'Active Branches', value: data.active_branches?.toString() || '0', change: '', icon: Package, color: 'bg-pink-100 text-pink-600' },
          { title: 'Avg Transactions/Day', value: Number(data.avg_transactions_per_day).toFixed(2), change: '', icon: Users, color: 'bg-indigo-100 text-indigo-600' },
        ];
        setKpiCards(cards);
      } catch (err) {
        console.error('Failed to load KPIs', err);
      }
    };

    const fetchTrend = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        // KPIs use normal range
        const { startDate, endDate } = getRangeDates(dateRange);
        // trend sometimes needs a broader window (e.g. daily should show past 7 days)
        let trendStart = startDate;
        let trendEnd = endDate;
        if (dateRange === 'daily') {
          const now = new Date();
          const past = new Date(now);
          past.setDate(now.getDate() - 6);
          const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          trendStart = fmt(past);
          trendEnd = fmt(now);
        }
        const branchParam = selectedBranch && selectedBranch !== 'all' ? `&branchId=${selectedBranch}` : '';
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/sales-trend?period=${dateRange}&startDate=${trendStart}&endDate=${trendEnd}${branchParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch trend');
        const data = await res.json();
        setTrendData(transformTrend(data || []));
      } catch (err) {
        console.error('Failed to load sales trend', err);
      }
    };

    fetchKpis();
    fetchTrend();
    // branch comparison fetch - independent of selectedBranch
    const fetchComparison = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const { startDate, endDate } = getRangeDates(dateRange);
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/branch-comparison?startDate=${startDate}&endDate=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch branch comparison');
        const data = await res.json();
        // add a short identifier label for x-axis and a combined display name
        const enhanced = (data || []).map((b) => ({
          ...b,
          label: `br-${b.branch_id}`,
          displayName: `br-${b.branch_id} - ${b.branch_name}`,
          prev_window_days: b.prev_window_days || 0,
        }));
        setBranchComparisonData(enhanced);
      } catch (err) {
        console.error('Failed to load branch comparison', err);
      }
    };
    fetchComparison();

    const fetchMenuPerformance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const { startDate, endDate } = getRangeDates(dateRange);
        const branchParam = selectedBranch && selectedBranch !== 'all' ? `&branchId=${selectedBranch}` : '';
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/top-menu-items?startDate=${startDate}&endDate=${endDate}${branchParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error('menu performance API error body', errText);
          throw new Error(`Failed to fetch menu performance: ${res.status}`);
        }
        const data = await res.json();
        setMenuPerformance(data || []);
      } catch (err) {
        console.error('Failed to load menu performance', err);
      }
    };
    fetchMenuPerformance();
  }, [dateRange, selectedBranch]);

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(18);
    doc.text('Sales & Performance Report', 40, 40);
    
    doc.setFontSize(12);
    let y = 70;
    
    // KPI Summary
    doc.text('Summary', 40, y);
    y += 20;
    kpiCards.forEach(card => {
      doc.text(`${card.title}: ${card.value} (${card.change})`, 40, y);
      y += 15;
    });
    
    // Branch Comparison Table
    y += 10;
        autoTable(doc, {
      head: [['Branch', 'Monthly Revenue', 'Transactions', 'Avg Order', 'Growth (%)', 'Prev Period']],
      body: detailedComparison.map(row => [
        row.branch,
        `₱${row.monthlyRevenue.toLocaleString()}`,
        row.transactions,
        `₱${row.avgOrder}`,
        row.growth,
        row.prevDays > 1 ? `${row.prevDays}-day` : '1-day',
      ]),
      startY: y,
      theme: 'grid',
      styles: { fontSize: 10 },
    });
    
    // Menu Performance Table
    y = doc.lastAutoTable.finalY + 20;
    autoTable(doc, {
      head: [['Menu Item', 'Units Sold', 'Revenue']],
      body: menuPerformance.map(item => [
        item.menuItem,
        item.sold,
        `₱${item.revenue.toLocaleString()}`,
      ]),
      startY: y,
      theme: 'grid',
      styles: { fontSize: 10 },
    });
    
    doc.save('sales_report.pdf');
  };

  const handleExportCSV = () => {
    let csv = 'Sales & Performance Report\n\n';
    csv += 'Summary\n';
    csv += 'Metric,Value,Change\n';
    kpiCards.forEach(card => {
      csv += `${card.title},${card.value},${card.change}\n`;
    });
    
    csv += '\n\nBranch Comparison\n';
    csv += 'Branch,Monthly Revenue,Transactions,Avg Order,Growth (%),Prev Period\n';
    detailedComparison.forEach(row => {
      csv += `${row.branch},₱${row.monthlyRevenue},${row.transactions},₱${row.avgOrder},${row.growth},${row.prevDays > 1 ? `${row.prevDays}-day` : '1-day'}\n`;
    });
    
    csv += '\n\nMenu Performance\n';
    csv += 'Menu Item,Units Sold,Revenue\n';
    menuPerformance.forEach(item => {
      csv += `${item.menuItem},${item.sold},₱${item.revenue}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900">Sales & Performance Report</h1>
        <p className="text-gray-600 text-sm mt-1">Real-time analytics across all branches</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-gray-600" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-600" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={18} />
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <Download size={18} />
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-sm font-semibold text-green-600">{card.change}</span>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">{card.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sales Trend {'(' + (dateRange === 'daily' ? 'Last 7 Days' : dateRange.charAt(0).toUpperCase() + dateRange.slice(1)) + ')'}
        </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) => `₱${value.toLocaleString()}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#059669"
                strokeWidth={3}
                dot={{ fill: '#059669', r: 5 }}
                name="Actual Sales"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Comparison Bar Chart & Payment Breakdown Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Branch Comparison */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Branch Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `₱${Number(value).toLocaleString()}`}
                  labelFormatter={(label) => {
                    const match = branchComparisonData.find(b => b.label === label);
                    return match ? match.displayName : label;
                  }}
                />
                <Legend />
                <Bar dataKey="total_sales" fill="#059669" name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Branch Contribution Pie Chart */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Branch Contribution %</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={branchContribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  // no labels on slices; legend will show identifiers instead
                  label={false}
                >
                  {branchContribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend formatter={(name, entry) => {
                    // find branch by name to get shortLabel prefix
                    const match = branchContribution.find(b => b.name === name);
                    return match ? `${match.shortLabel} - ${name}` : name;
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Branch Comparison{comparisonNote}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Branch</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Monthly Revenue</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Transactions</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Avg Order Value</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Growth (%)</th>
                </tr>
              </thead>
              <tbody>
                {detailedComparison.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.branch}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">₱{row.monthlyRevenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.transactions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">₱{row.avgOrder}</td>
                    {
                      (() => {
                        const raw = row.growth;
                        const num = parseFloat(String(raw).replace('%',''));
                        let colorClass = 'text-gray-600';
                        if (Number.isFinite(num)) {
                          if (num > 0) colorClass = 'text-green-600';
                          else if (num < 0) colorClass = 'text-red-600';
                          else colorClass = 'text-gray-600';
                        } else {
                          colorClass = 'text-gray-500';
                        }
                        const prev = Number(row.prevRevenue || 0);
                        const prevDays = Number(row.prevDays || 0);
                        let title = '';
                        if (prev > 0) {
                          title = prevDays > 1
                            ? `Prev (${prevDays}-day total): ₱${prev.toLocaleString()}`
                            : `Prev: ₱${prev.toLocaleString()}`;
                        } else {
                          title = 'Prev: ₱0.00';
                        }
                        return (
                          <td title={title} className={`px-4 py-3 text-sm font-semibold ${colorClass}`}>{raw}</td>
                        );
                      })()
                    }
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Menu Performance Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Menu Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Menu Item</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Units Sold</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {menuPerformance.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.menuItem}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.sold.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">₱{item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}