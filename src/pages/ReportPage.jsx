import React, { useState, useEffect, useRef } from 'react';
import { Download, Calendar, Filter, TrendingUp, PhilippinePeso, Package, Users, BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
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
import html2canvas from 'html2canvas';

export default function ReportPage() {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  // Chart refs for PDF export
  const trendChartRef = useRef(null);
  const branchChartRef = useRef(null);
  const pieChartRef = useRef(null);
  
  const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const [startDate, setStartDate] = useState(formatDate(sevenDaysAgo));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [branches, setBranches] = useState([]);

  // Calendar states
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [endCalendarMonth, setEndCalendarMonth] = useState(new Date());

  // Date Range Preset Functions
  const setDateRange = (start, end) => {
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const setThisWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    setDateRange(monday, today);
  };

  const setLastWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const lastWeekMonday = new Date(monday);
    lastWeekMonday.setDate(monday.getDate() - 7);
    const lastWeekSunday = new Date(monday);
    lastWeekSunday.setDate(monday.getDate() - 1);
    setDateRange(lastWeekMonday, lastWeekSunday);
  };

  const setThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateRange(firstDay, today);
  };

  const setLastMonth = () => {
    const today = new Date();
    const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayLastMonth = new Date(firstDayThisMonth);
    lastDayLastMonth.setDate(0);
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    setDateRange(firstDayLastMonth, lastDayLastMonth);
  };

  const setLast7Days = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    setDateRange(sevenDaysAgo, today);
  };

  const setLast30Days = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setDateRange(thirtyDaysAgo, today);
  };

  const setLast90Days = () => {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    setDateRange(ninetyDaysAgo, today);
  };

  // sales trend data fetched from backend
  const [trendData, setTrendData] = useState([]);

  // helper: convert DB rows into chart-compatible format
  const transformTrend = (rows) => {
    return rows.map((r) => {
      const date = new Date(r.period_key);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return { 
        date: `${month}/${day}`,
        sales: r.total_sales,
        fullDate: r.period_key
      };
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
      // Ensure all monetary values are non-negative
      const revenue = Math.max(0, Number(b.total_sales) || 0);
      const tx = Math.max(0, Number(b.transaction_count || 0));
      const prevRevenue = Math.max(0, Number(b.prev_sales || 0));
      const prevDays = Math.max(0, Number(b.prev_window_days || 0));
      
      // compute growth percentage relative to previous period
      // handle edge case when previous sales = 0
      let growthDisplay = 'N/A';
      let growthNum = 0;
      if (prevRevenue > 0) {
        growthNum = ((revenue - prevRevenue) / prevRevenue) * 100;
        growthDisplay = growthNum >= 0 ? `+${growthNum.toFixed(1)}%` : `${growthNum.toFixed(1)}%`;
      } else if (prevRevenue === 0 && revenue > 0) {
        growthDisplay = '+100.0%';
      } else if (prevRevenue === 0 && revenue === 0) {
        growthDisplay = '0.0%';
      }
      
      return {
        branch: b.branch_name,
        monthlyRevenue: revenue,
        transactions: tx,
        avgOrder: tx ? Math.round(revenue / tx) : 0,
        growth: growthDisplay,
        growthNum: growthDisplay !== 'N/A' ? parseFloat(growthDisplay) : 0,
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

  // Calendar Helper Functions
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateSelect = (day) => {
    const selectedDate = new Date(calendarMonth);
    selectedDate.setDate(day);
    const formatted = formatDate(selectedDate);
    setStartDate(formatted);
    setEndCalendarMonth(selectedDate);
    setShowCalendar(false);
  };

  const handleEndDateSelect = (day) => {
    const selectedDate = new Date(endCalendarMonth);
    selectedDate.setDate(day);
    const formatted = formatDate(selectedDate);
    setEndDate(formatted);
    setShowEndCalendar(false);
  };

  const resetDates = () => {
    setStartDate(formatDate(sevenDaysAgo));
    setEndDate(formatDate(today));
    setShowCalendar(false);
    setShowEndCalendar(false);
  };

  const setToday = () => {
    const todayFormatted = formatDate(new Date());
    setStartDate(todayFormatted);
    setShowCalendar(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="text-center py-2"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = formatDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
      const isSelected = cellDate === startDate;
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`text-center py-2 text-sm rounded-lg transition ${
            isSelected 
              ? 'bg-blue-500 text-white font-bold' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const renderEndCalendar = () => {
    const daysInMonth = getDaysInMonth(endCalendarMonth);
    const firstDay = getFirstDayOfMonth(endCalendarMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="text-center py-2"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = formatDate(new Date(endCalendarMonth.getFullYear(), endCalendarMonth.getMonth(), day));
      const isSelected = cellDate === endDate;
      days.push(
        <button
          key={day}
          onClick={() => handleEndDateSelect(day)}
          className={`text-center py-2 text-sm rounded-lg transition ${
            isSelected 
              ? 'bg-blue-500 text-white font-bold' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const getPreviousRangeDates = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - (diffDays + 1));
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { startDate: fmt(prevStart), endDate: fmt(prevEnd) };
  };

  const getRangeDates = () => {
    return { startDate, endDate };
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
        const { startDate: currStart, endDate: currEnd } = getRangeDates();
        const branchParam = selectedBranch && selectedBranch !== 'all' ? `&branchId=${selectedBranch}` : '';
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/kpis?startDate=${currStart}&endDate=${currEnd}${branchParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch KPIs');
        const data = await res.json();
        // Fetch previous period data for growth calculation
        const { startDate: prevStart, endDate: prevEnd } = getPreviousRangeDates();
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
          const currentSales = Math.max(0, Number(data.total_sales || 0));
          const prevSales = Math.max(0, Number(prevData.total_sales || 0));
          if (prevSales > 0) {
            const growth = ((currentSales - prevSales) / prevSales) * 100;
            salesGrowth = growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
          } else if (prevSales === 0 && currentSales > 0) {
            salesGrowth = '+100.0%';
          } else {
            salesGrowth = '0.0%';
          }
        }
        
        // Map API response to card layout
        // Order: Gross Sales → Voided Sales → Total Sales (Net), then other KPIs
        const cards = [
          { title: 'Gross Sales', value: formatCurrency(Math.max(0, data.gross_sales)), change: '', icon: PhilippinePeso, color: 'bg-blue-100 text-blue-600' },
          { title: 'Voided Sales', value: formatCurrency(Math.max(0, data.voided_sales)), change: '', icon: PhilippinePeso, color: 'bg-red-100 text-red-600' },
          { title: 'Total Sales', value: formatCurrency(Math.max(0, data.total_sales)), change: '', icon: PhilippinePeso, color: 'bg-green-100 text-green-600' },
          { title: 'Sales Growth', value: salesGrowth, change: 'vs Previous Period', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
          { title: 'Total Transactions', value: Math.max(0, data.transaction_count || 0).toString(), change: '', icon: BarChart3, color: 'bg-indigo-100 text-indigo-600' },
          { title: 'Average Order Value', value: formatCurrency(Math.max(0, data.avg_order_value)), change: '(Total Sales ÷ Orders)', icon: TrendingUp, color: 'bg-orange-100 text-orange-600' },
          { title: 'Active Branches', value: Math.max(0, data.active_branches || 0).toString(), change: '', icon: Package, color: 'bg-pink-100 text-pink-600' },
          { title: 'Avg Transactions/Day', value: Math.max(0, Number(data.avg_transactions_per_day) || 0).toFixed(2), change: '', icon: Users, color: 'bg-teal-100 text-teal-600' },
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
        const { startDate: trendStart, endDate: trendEnd } = getRangeDates();
        const branchParam = selectedBranch && selectedBranch !== 'all' ? `&branchId=${selectedBranch}` : '';
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/sales-trend?startDate=${trendStart}&endDate=${trendEnd}${branchParam}`, {
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
        const { startDate: currStart, endDate: currEnd } = getRangeDates();
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/branch-comparison?startDate=${currStart}&endDate=${currEnd}`, {
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
        const { startDate: currStart, endDate: currEnd } = getRangeDates();
        const branchParam = selectedBranch && selectedBranch !== 'all' ? `&branchId=${selectedBranch}` : '';
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/top-menu-items?startDate=${currStart}&endDate=${currEnd}${branchParam}`, {
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
        const { startDate: currStart, endDate: currEnd } = getRangeDates();
        const branchParam = selectedBranch && selectedBranch !== 'all' ? `&branchId=${selectedBranch}` : '';
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/void-transactions?startDate=${currStart}&endDate=${currEnd}${branchParam}`, {
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
  }, [startDate, endDate, selectedBranch, refreshKey]);

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 15;
      const margin = 12;
      const maxWidth = pageWidth - 2 * margin;

      // Helper function to check if we need a new page
      const checkNewPage = (neededSpace) => {
        if (yPosition + neededSpace > pageHeight - 10) {
          doc.addPage();
          yPosition = 15;
          return true;
        }
        return false;
      };

      // ===== HEADER SECTION =====
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text('SALES & PERFORMANCE REPORT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Report Date Range
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Report Period: ${formattedStartDate} to ${formattedEndDate}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Generated Date
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Divider line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

      // ===== EXECUTIVE SUMMARY (KPI CARDS) =====
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Executive Summary', margin, yPosition);
      yPosition += 8;

      // Create a summary of key metrics
      const summaryData = [];
      kpiCards.forEach((card) => {
        summaryData.push([card.title, card.value, card.change]);
      });

      autoTable(doc, {
        startY: yPosition,
        margin: margin,
        head: [['Metric', 'Value', 'Details']],
        body: summaryData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [50, 50, 50],
          lineColor: [200, 200, 200],
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
        },
      });

      yPosition = doc.lastAutoTable.finalY + 12;

      // ===== SALES TREND CHART =====
      checkNewPage(100);
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Sales Trend Analysis', margin, yPosition);
      yPosition += 8;

      if (trendChartRef.current) {
        try {
          const canvas = await html2canvas(trendChartRef.current, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const chartWidth = maxWidth;
          const chartHeight = (canvas.height / canvas.width) * chartWidth;
          doc.addImage(imgData, 'PNG', margin, yPosition, chartWidth, Math.min(chartHeight, 70));
          yPosition += Math.min(chartHeight, 70) + 8;
        } catch (err) {
          console.error('Failed to capture trend chart:', err);
        }
      }

      // Trend Interpretation
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const totalTrendSales = trendData.reduce((sum, d) => sum + d.sales, 0);
      const avgDailySales = trendData.length > 0 ? (totalTrendSales / trendData.length).toFixed(2) : 0;
      const trendInterpretation = `Sales Trend: Total sales of ₱${totalTrendSales.toLocaleString()} over ${trendData.length} days. Average daily sales: ₱${Number(avgDailySales).toLocaleString()}.`;
      doc.text(trendInterpretation, margin, yPosition, { maxWidth: maxWidth, align: 'left' });
      yPosition += 10;

      // ===== BRANCH COMPARISON SECTION =====
      checkNewPage(100);
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Branch Performance Comparison', margin, yPosition);
      yPosition += 8;

      // Branch Bar Chart
      if (branchChartRef.current) {
        try {
          const canvas = await html2canvas(branchChartRef.current, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const chartWidth = maxWidth * 0.48;
          const chartHeight = (canvas.height / canvas.width) * chartWidth;
          doc.addImage(imgData, 'PNG', margin, yPosition, chartWidth, Math.min(chartHeight, 60));
        } catch (err) {
          console.error('Failed to capture branch chart:', err);
        }
      }

      // Pie Chart (beside the bar chart)
      if (pieChartRef.current) {
        try {
          const canvas = await html2canvas(pieChartRef.current, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const chartWidth = maxWidth * 0.48;
          const chartHeight = (canvas.height / canvas.width) * chartWidth;
          doc.addImage(imgData, 'PNG', margin + maxWidth * 0.52, yPosition, chartWidth, Math.min(chartHeight, 60));
          yPosition += Math.min(chartHeight, 60) + 8;
        } catch (err) {
          console.error('Failed to capture pie chart:', err);
        }
      }

      // Branch Performance Interpretation
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const topBranch = processedBranchData.length > 0 ? processedBranchData[0] : null;
      const branchInterpretation = topBranch 
        ? `Top Performing Branch: ${topBranch.displayName} with ₱${Number(topBranch.total_sales).toLocaleString()} in sales. Total branches analyzed: ${processedBranchData.length}.`
        : 'No branch data available.';
      doc.text(branchInterpretation, margin, yPosition, { maxWidth: maxWidth, align: 'left' });
      yPosition += 10;

      // ===== DETAILED BRANCH COMPARISON TABLE =====
      checkNewPage(80);
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Detailed Branch Metrics', margin, yPosition);
      yPosition += 6;

      autoTable(doc, {
        startY: yPosition,
        margin: margin,
        head: [['Rank', 'Branch', 'Revenue', 'Transactions', 'Avg Order', 'Growth']],
        body: detailedComparison.map((row) => [
          row.rank,
          row.branch,
          `₱${row.monthlyRevenue.toLocaleString()}`,
          row.transactions.toLocaleString(),
          `₱${row.avgOrder}`,
          row.growth,
        ]),
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [50, 50, 50],
          lineColor: [200, 200, 200],
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
        },
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // ===== TOP MENU ITEMS =====
      checkNewPage(80);
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Top Performing Menu Items', margin, yPosition);
      yPosition += 6;

      const topMenuData = menuPerformance.slice(0, 10).map((item) => [
        item.menuItem,
        item.sold.toLocaleString(),
        `₱${item.revenue.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        margin: margin,
        head: [['Menu Item', 'Units Sold', 'Revenue']],
        body: topMenuData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2.5,
          textColor: [50, 50, 50],
          lineColor: [200, 200, 200],
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
        },
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // ===== VOID TRANSACTIONS =====
      checkNewPage(80);
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Voided Transactions', margin, yPosition);
      yPosition += 6;

      const voidData = voidTransactions.slice(0, 10).map((tx) => [
        `#${tx.transaction_number}`,
        tx.branch_name,
        tx.status,
        tx.cashier_name || 'N/A',
        `₱${Number(tx.void_amount || 0).toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        margin: margin,
        head: [['Trans. ID', 'Branch', 'Status', 'Cashier', 'Amount']],
        body: voidData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [50, 50, 50],
          lineColor: [200, 200, 200],
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          4: { halign: 'right' },
        },
      });

      // ===== FOOTER =====
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text('Confidential - Internal Use Only', pageWidth / 2, pageHeight - 5, { align: 'center' });
      }

      // Save the PDF
      doc.save(`Sales_Report_${startDate}_to_${endDate}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
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
              {/* Start Date Calendar */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Calendar size={18} className="text-gray-600" />
                  <span className="text-sm font-medium">{startDate}</span>
                </button>
                
                {showCalendar && (
                  <div className="absolute left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-80">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronUp size={20} className="text-gray-600" />
                      </button>
                      <span className="font-semibold text-gray-800">
                        {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronDown size={20} className="text-gray-600" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs font-bold text-gray-600 py-2">
                          {day}
                        </div>
                      ))}
                      {renderCalendar()}
                    </div>

                    <div className="flex gap-2 justify-between">
                      <button
                        onClick={resetDates}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear
                      </button>
                      <button
                        onClick={setToday}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Today
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* End Date Calendar */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                <button
                  onClick={() => setShowEndCalendar(!showEndCalendar)}
                  className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Calendar size={18} className="text-gray-600" />
                  <span className="text-sm font-medium">{endDate}</span>
                </button>
                
                {showEndCalendar && (
                  <div className="absolute left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-80">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setEndCalendarMonth(new Date(endCalendarMonth.getFullYear(), endCalendarMonth.getMonth() - 1))}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronUp size={20} className="text-gray-600" />
                      </button>
                      <span className="font-semibold text-gray-800">
                        {endCalendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => setEndCalendarMonth(new Date(endCalendarMonth.getFullYear(), endCalendarMonth.getMonth() + 1))}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronDown size={20} className="text-gray-600" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs font-bold text-gray-600 py-2">
                          {day}
                        </div>
                      ))}
                      {renderEndCalendar()}
                    </div>

                    <div className="flex gap-2 justify-between">
                      <button
                        onClick={resetDates}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear
                      </button>
                      <button
                        onClick={setToday}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Today
                      </button>
                    </div>
                  </div>
                )}
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
          Sales Trend ({startDate} to {endDate})
        </h2>
          <div ref={trendChartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `₱${value.toLocaleString()}`}
                  labelFormatter={(label) => {
                    const item = trendData.find(d => d.date === label);
                    return item?.fullDate ? new Date(item.fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : label;
                  }}
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
            <div ref={branchChartRef}>
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
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Showing {processedBranchData.length} of {branchComparisonData.length} branches
            </div>
          </div>

          {/* Branch Contribution Pie Chart */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Branch Contribution %</h2>
            <div ref={pieChartRef}>
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
            </div>
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