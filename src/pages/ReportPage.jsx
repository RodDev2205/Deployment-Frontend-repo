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

  // void transactions data for superadmin
  const [voidTransactions, setVoidTransactions] = useState([]);
  const [voidCurrentPage, setVoidCurrentPage] = useState(1);
  const voidItemsPerPage = 5;

  // menu performance pagination
  const [menuCurrentPage, setMenuCurrentPage] = useState(1);
  const menuItemsPerPage = 5;

  // Refresh control for live reports
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  // Branch comparison settings
  const [branchViewMode, setBranchViewMode] = useState('top10'); // 'all', 'top10', 'top5'
  const [branchSortBy, setBranchSortBy] = useState('sales'); // 'sales', 'transactions', 'name'
  const [branchSortOrder, setBranchSortOrder] = useState('desc'); // 'asc', 'desc'

  // Process branch data based on view mode and sorting
  const processedBranchData = React.useMemo(() => {
    let data = [...branchComparisonData];

    // Sort data
    data.sort((a, b) => {
      let aVal, bVal;
      switch (branchSortBy) {
        case 'sales':
          aVal = Number(a.total_sales);
          bVal = Number(b.total_sales);
          break;
        case 'transactions':
          aVal = Number(a.transaction_count || 0);
          bVal = Number(b.transaction_count || 0);
          break;
        case 'name':
          aVal = a.branch_name.toLowerCase();
          bVal = b.branch_name.toLowerCase();
          break;
        default:
          aVal = Number(a.total_sales);
          bVal = Number(b.total_sales);
      }

      if (branchSortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    // Filter based on view mode
    if (branchViewMode === 'top5') {
      data = data.slice(0, 5);
    } else if (branchViewMode === 'top10') {
      data = data.slice(0, 10);
    }
    // 'all' keeps all data

    // Add enhanced labels for display
    return data.map((b, idx) => ({
      ...b,
      label: `br-${b.branch_id}`,
      displayName: `${b.branch_name}`,
      shortName: b.branch_name.length > 15 ? b.branch_name.substring(0, 12) + '...' : b.branch_name,
      rank: idx + 1,
      prev_window_days: b.prev_window_days || 0,
    }));
  }, [branchComparisonData, branchViewMode, branchSortBy, branchSortOrder]);

  // Calculate branch contribution percentages with processed data
  const branchContribution = React.useMemo(() => {
    const totalBranchSales = processedBranchData.reduce((sum, b) => sum + Number(b.total_sales), 0);
    const contributions = processedBranchData.map((branch, idx) => {
      const salesNum = Number(branch.total_sales);
      const percentage = totalBranchSales ? ((salesNum / totalBranchSales) * 100).toFixed(1) : 0;
      const colors = ['#059669', '#3b82f6', '#f59e0b', '#8b5cf6', '#f65c5c', '#f2ff00', '#63f1d0', '#f97316', '#84cc16', '#ec4899'];
      return {
        name: branch.branch_name,
        shortName: branch.shortName,
        value: parseFloat(percentage),
        color: colors[idx % colors.length],
        sales: salesNum,
        rank: branch.rank,
      };
    });

    // For pie chart, if we have more than 8 items, group the rest into "Others"
    if (contributions.length > 8) {
      const top7 = contributions.slice(0, 7);
      const others = contributions.slice(7);
      const othersTotal = others.reduce((sum, item) => sum + item.value, 0);
      const othersSales = others.reduce((sum, item) => sum + item.sales, 0);

      return [
        ...top7,
        {
          name: 'Others',
          shortName: 'Others',
          value: parseFloat(othersTotal.toFixed(1)),
          color: '#6b7280',
          sales: othersSales,
          rank: 99,
        }
      ];
    }

    return contributions;
  }, [processedBranchData]);

  // detailed comparison derived from processed branch comparison data
  const detailedComparison = React.useMemo(() => {
    return processedBranchData.map((b) => {
      const revenue = Number(b.total_sales);
      const tx = Number(b.transaction_count || 0);
      const prevRevenue = Number(b.prev_sales || 0);
      const prevDays = Number(b.prev_window_days || 0);
      // compute growth percentage relative to previous period
      // handle edge case when previous sales = 0
      let growthDisplay = 'N/A';
      if (prevRevenue > 0) {
        const g = ((revenue - prevRevenue) / prevRevenue) * 100;
        growthDisplay = `${g.toFixed(1)}%`;
      } else if (prevRevenue === 0 && revenue > 0) {
        growthDisplay = '100.0%';
      } else if (prevRevenue === 0 && revenue === 0) {
        growthDisplay = '0.0%';
      }
      return {
        branch: b.branch_name,
        monthlyRevenue: revenue,
        transactions: tx,
        avgOrder: tx ? Math.round(revenue / tx) : 0,
        growth: growthDisplay,
        prevRevenue,
        prevDays,
        rank: b.rank,
      };
    });
  }, [processedBranchData]);



  // note for growth column based on previous window
  const comparisonDays = branchComparisonData.length ? branchComparisonData[0].prev_window_days : 1;
  const comparisonNote = comparisonDays > 1 ? ` (vs previous ${comparisonDays}-day total)` : '';

  // KPI Cards (stateful — populated from backend)
  const [kpiCards, setKpiCards] = useState([
    { title: 'Total Revenue', value: '0', change: '+0%', icon: PhilippinePeso, color: 'bg-green-100 text-green-600' },
    { title: 'Total Transactions', value: '0', change: '+0%', icon: BarChart3, color: 'bg-blue-100 text-blue-600' },
    { title: 'Average Order Value', value: '0', change: '+0%', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
    { title: 'Active Branches', value: '0', change: '+0%', icon: Package, color: 'bg-orange-100 text-orange-600' },
    { title: 'Avg Transactions/Day', value: '0', change: '+0%', icon: Users, color: 'bg-pink-100 text-pink-600' },
    { title: 'Month-to-Date', value: '0 days', change: '+0 days', icon: Calendar, color: 'bg-indigo-100 text-indigo-600' },
  ]);

  const formatCurrency = (n) => `₱${Number(n || 0).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;

  const getPreviousRangeDates = (range) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    if (range === 'daily') {
      // Previous day
      start = new Date(today);
      start.setDate(today.getDate() - 1);
      end = new Date(start);
    } else if (range === 'weekly') {
      // Previous week (7 days before current week)
      start = new Date(today);
      start.setDate(today.getDate() - 13);
      end = new Date(today);
      end.setDate(today.getDate() - 7);
    } else if (range === 'monthly') {
      // Previous month
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (range === 'quarterly') {
      // Previous quarter
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const prevQuarter = currentQuarter - 1;
      const prevYear = prevQuarter < 0 ? today.getFullYear() - 1 : today.getFullYear();
      const prevQuarterMonth = prevQuarter < 0 ? 9 : prevQuarter * 3;
      start = new Date(prevYear, prevQuarterMonth, 1);
      end = new Date(prevYear, prevQuarterMonth + 3, 0);
    } else if (range === 'yearly') {
      // Previous year
      start = new Date(today.getFullYear() - 1, 0, 1);
      end = new Date(today.getFullYear() - 1, 11, 31);
    }
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { startDate: fmt(start), endDate: fmt(end) };
  };

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
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
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
        // Fetch previous period data for growth calculation
        const { startDate: prevStart, endDate: prevEnd } = getPreviousRangeDates(dateRange);
        let prevData = null;
        try {
          const prevRes = await fetch(`${API_BASE_URL}/api/sales-superadmin/kpis?startDate=${prevStart}&endDate=${prevEnd}${branchParam}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (prevRes.ok) {
            prevData = await prevRes.json();
          }
        } catch (err) {
          console.error('Failed to fetch previous KPIs', err);
        }
        
        // Calculate sales growth
        let salesGrowth = 'N/A';
        if (prevData && prevData.total_sales !== undefined) {
          const currentSales = Number(data.total_sales || 0);
          const prevSales = Number(prevData.total_sales || 0);
          if (prevSales > 0) {
            const growth = ((currentSales - prevSales) / prevSales) * 100;
            salesGrowth = `${growth.toFixed(1)}%`;
          } else if (prevSales === 0 && currentSales > 0) {
            salesGrowth = '100.0%';
          } else {
            salesGrowth = '0.0%';
          }
        }
        
        // Map API response to card layout
        // Order: Gross Sales → Voided Sales → Total Sales (Net), then other KPIs
        const cards = [
          { title: 'Gross Sales', value: formatCurrency(data.gross_sales), change: '', icon: PhilippinePeso, color: 'bg-blue-100 text-blue-600' },
          { title: 'Voided Sales', value: formatCurrency(data.voided_sales), change: '', icon: PhilippinePeso, color: 'bg-red-100 text-red-600' },
          { title: 'Total Sales', value: formatCurrency(data.total_sales), change: `(Gross - Voided)`, icon: PhilippinePeso, color: 'bg-green-100 text-green-600' },
          { title: 'Sales Growth', value: salesGrowth, change: `vs Previous ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
          { title: 'Total Transactions', value: data.transaction_count?.toString() || '0', change: '', icon: BarChart3, color: 'bg-indigo-100 text-indigo-600' },
          { title: 'Average Order Value', value: formatCurrency(data.avg_order_value), change: '(Total Sales ÷ Orders)', icon: TrendingUp, color: 'bg-orange-100 text-orange-600' },
          { title: 'Active Branches', value: data.active_branches?.toString() || '0', change: '', icon: Package, color: 'bg-pink-100 text-pink-600' },
          { title: 'Avg Transactions/Day', value: Number(data.avg_transactions_per_day).toFixed(2), change: '', icon: Users, color: 'bg-teal-100 text-teal-600' },
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
        // Store raw data - processing will happen in useMemo
        setBranchComparisonData(data || []);
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
        setMenuCurrentPage(1); // Reset to first page when data changes
      } catch (err) {
        console.error('Failed to load menu performance', err);
      }
    };
    fetchMenuPerformance();

    const fetchVoidTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const { startDate, endDate } = getRangeDates(dateRange);
        const branchParam = selectedBranch && selectedBranch !== 'all' ? `&branchId=${selectedBranch}` : '';
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/void-transactions?startDate=${startDate}&endDate=${endDate}${branchParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error('void transactions API error body', errText);
          throw new Error(`Failed to fetch void transactions: ${res.status}`);
        }
        const data = await res.json();
        setVoidTransactions(data || []);
        setVoidCurrentPage(1); // Reset to first page when data changes
      } catch (err) {
        console.error('Failed to load void transactions', err);
      }
    };
    fetchVoidTransactions();
  }, [dateRange, selectedBranch, refreshKey]);

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
          {/* Branch Comparison Controls */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Branch Comparison</h2>
              <div className="flex items-center gap-2 text-sm">
                <select
                  value={branchViewMode}
                  onChange={(e) => setBranchViewMode(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  <option value="all">All Branches</option>
                  <option value="top10">Top 10</option>
                  <option value="top5">Top 5</option>
                </select>
                <select
                  value={branchSortBy}
                  onChange={(e) => setBranchSortBy(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  <option value="sales">Sort by Sales</option>
                  <option value="transactions">Sort by Transactions</option>
                  <option value="name">Sort by Name</option>
                </select>
                <button
                  onClick={() => setBranchSortOrder(branchSortOrder === 'desc' ? 'asc' : 'desc')}
                  className="border border-gray-300 rounded px-2 py-1 text-xs hover:bg-gray-50"
                >
                  {branchSortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processedBranchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => `₱${Number(value).toLocaleString()}`}
                  labelFormatter={(label) => {
                    const match = processedBranchData.find(b => b.label === label);
                    return match ? match.displayName : label;
                  }}
                />
                <Legend />
                <Bar dataKey="total_sales" fill="#059669" name="Sales" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Showing {processedBranchData.length} of {branchComparisonData.length} branches
            </div>
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
                  labelLine={false}
                >
                  {branchContribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend
                  formatter={(name, entry) => {
                    const match = branchContribution.find(b => b.name === name);
                    return match ? `${name} (${match.value.toFixed(1)}%)` : name;
                  }}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {branchContribution.length > 8 && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                Top 7 branches shown individually, others grouped as "Others"
              </div>
            )}
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Detailed Branch Comparison{comparisonNote}</h2>
            <div className="text-sm text-gray-600">
              Showing {detailedComparison.length} of {branchComparisonData.length} branches
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">#</th>
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
                    <td className="px-4 py-3 text-sm font-medium text-gray-500">{row.rank}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.branch}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">₱{row.monthlyRevenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.transactions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">₱{row.avgOrder}</td>
                    {
                      (() => {
                        const raw = row.growth;
                        let num = NaN;
                        if (raw !== 'N/A') {
                          num = parseFloat(raw.replace('%', ''));
                        }
                        let colorClass = 'text-gray-600';
                        if (!isNaN(num)) {
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
                {(() => {
                  const startIndex = (menuCurrentPage - 1) * menuItemsPerPage;
                  const endIndex = startIndex + menuItemsPerPage;
                  const paginatedData = menuPerformance.slice(startIndex, endIndex);

                  return paginatedData.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.menuItem}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.sold.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">₱{item.revenue.toLocaleString()}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {menuPerformance.length > menuItemsPerPage && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {Math.min((menuCurrentPage - 1) * menuItemsPerPage + 1, menuPerformance.length)} to {Math.min(menuCurrentPage * menuItemsPerPage, menuPerformance.length)} of {menuPerformance.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMenuCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={menuCurrentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {menuCurrentPage} of {Math.ceil(menuPerformance.length / menuItemsPerPage)}
                </span>
                <button
                  onClick={() => setMenuCurrentPage(prev => Math.min(prev + 1, Math.ceil(menuPerformance.length / menuItemsPerPage)))}
                  disabled={menuCurrentPage === Math.ceil(menuPerformance.length / menuItemsPerPage)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Void Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Transaction ID</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Branch</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Cashier</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Void Amount</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const startIndex = (voidCurrentPage - 1) * voidItemsPerPage;
                  const endIndex = startIndex + voidItemsPerPage;
                  const paginatedData = voidTransactions.slice(startIndex, endIndex);

                  return paginatedData.map((transaction, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">#{transaction.transaction_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{transaction.branch_name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'Voided' 
                            ? 'bg-red-100 text-red-800' 
                            : transaction.status === 'Partial Refunded'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{transaction.cashier_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">₱{Number(transaction.void_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {voidTransactions.length > voidItemsPerPage && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Showing {Math.min((voidCurrentPage - 1) * voidItemsPerPage + 1, voidTransactions.length)} to {Math.min(voidCurrentPage * voidItemsPerPage, voidTransactions.length)} of {voidTransactions.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVoidCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={voidCurrentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {voidCurrentPage} of {Math.ceil(voidTransactions.length / voidItemsPerPage)}
                  </span>
                  <button
                    onClick={() => setVoidCurrentPage(prev => Math.min(prev + 1, Math.ceil(voidTransactions.length / voidItemsPerPage)))}
                    disabled={voidCurrentPage === Math.ceil(voidTransactions.length / voidItemsPerPage)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}