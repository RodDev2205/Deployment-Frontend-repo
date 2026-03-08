import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import API_BASE_URL from '../config/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // for table exports, used below

export default function AdminReportsPage() {
  const reportRef = useRef();
  const [dailySales, setDailySales] = useState([]);
  const [todaySales, setTodaySales] = useState(null);
  const [period, setPeriod] = useState('daily'); // daily, weekly, monthly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState([]); // cash/gcash breakdown
  const [topProducts, setTopProducts] = useState([]); // product ranking

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Check if token exists
        if (!token) {
          setError("Not authenticated. Please log in.");
          setLoading(false);
          return;
        }
        
        // Fetch sales for selected period (last 7 calendar units)
        const today = new Date();
        // compute startDate based on period (7 units back)
        const start = new Date(today);
        const format = (d) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${dd}`;
        };
        if (period === 'daily') {
          start.setDate(today.getDate() - 6);
        } else if (period === 'weekly') {
          start.setDate(today.getDate() - 6 * 7);
        } else if (period === 'monthly') {
          start.setMonth(today.getMonth() - 6);
        }
        const startDate = format(start);
        const endDate = format(today);

        const [salesRes, todayRes, paymentRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}/api/sales-admin/sales?period=${period}&startDate=${startDate}&endDate=${endDate}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          fetch(`${API_BASE_URL}/api/sales-admin/today-sales`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(
            `${API_BASE_URL}/api/sales-admin/payment-methods?startDate=${startDate}&endDate=${endDate}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);

        if (!salesRes.ok || !todayRes.ok || !paymentRes.ok) {
          throw new Error("Failed to fetch sales data");
        }

        const salesData = await salesRes.json();
        const todayData = await todayRes.json();
        const payData = await paymentRes.json();
        const topData = await fetch(
          `${API_BASE_URL}/api/sales-admin/top-products?startDate=${startDate}&endDate=${endDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(r => r.ok ? r.json() : []);

        // generate a complete list of period keys to fill gaps
        const generateKeys = () => {
          const keys = [];
          const temp = new Date(startDate);
          for (let i = 0; i < 7; i++) {
            if (period === 'daily') {
              keys.push(format(temp));
              temp.setDate(temp.getDate() + 1);
            } else if (period === 'weekly') {
              // ISO week label
              const year = temp.getFullYear();
              const wk = String(getWeekNumber(temp)).padStart(2,'0');
              keys.push(`${year}-${wk}`);
              temp.setDate(temp.getDate() + 7);
            } else if (period === 'monthly') {
              const year = temp.getFullYear();
              const mon = String(temp.getMonth()+1).padStart(2,'0');
              keys.push(`${year}-${mon}`);
              temp.setMonth(temp.getMonth() + 1);
            }
          }
          return keys;
        };

        const weekNumberCache = {};
        const getWeekNumber = (d) => {
          const date = new Date(d.getTime());
          date.setHours(0,0,0,0);
          // Thursday-based ISO week
          date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
          const week1 = new Date(date.getFullYear(),0,4);
          return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay()+6)%7)) / 7);
        };

        // Transform data for chart (group by period_key)
        const rawMap = {};
        salesData.forEach(item => {
          rawMap[item.period_key] = Number(item.total_sales || 0);
        });

        const filled = generateKeys().map(key => {
          let label = key;
          if (period === 'daily') {
            label = new Date(key).toLocaleDateString('en-US', { weekday: 'short' });
          } else if (period === 'weekly') {
            const wk = key.split('-')[1];
            label = `W${wk}`;
          } else if (period === 'monthly') {
            const parts = key.split('-');
            label = `${parts[0]}-${parts[1]}`;
          }
          return { date: label, sales: rawMap[key] || 0 };
        });

        setDailySales(filled.reverse());
        setTodaySales(todayData);
        // status breakdown (Completed / Voided / Partial Voided)
        const pie = payData.map(p => ({
          name: p.status,
          value: p.cnt
        }));
        setPaymentData(pie);
        setTopProducts(topData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [period]);
  const kpis = [
    {
      title: "Total Sales Today",
      value: `₱${(todaySales?.total_sales || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: "Net Sales (Gross - Voided)"
    },
    {
      title: "Gross Sales",
      value: `₱${(todaySales?.gross_sales || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: "All items ordered"
    },
    {
      title: "Voided Transactions",
      value: todaySales?.voided_count || 0,
      subtitle: "Status: Voided"
    },
    {
      title: "Partial Voids",
      value: todaySales?.partial_voided_count || 0,
      subtitle: "Status: Partial Voided"
    },
    {
      title: "Staff Who Voided",
      value: todaySales?.staff_who_voided_count || 0,
      subtitle: "Unique staff members"
    },
    {
      title: "Average Order Value",
      value: `₱${(todaySales?.avg_order_value || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      title: "Completed Orders",
      value: todaySales?.completed_count || 0,
    },
  ];

  if (loading) {
    return <div className="p-6 text-center">Loading sales data...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Error loading sales data: {error}
      </div>
    );
  }

  const exportCSV = () => {
    // construct a simple CSV containing both the sales trend and top products
    let csv = "Sales Trend\nDate,Sales\n";
    dailySales.forEach(d => {
      csv += `${d.date},${d.sales}\n`;
    });
    csv += "\nTop Selling Products\nProduct,Quantity Sold,Total Amount\n";
    topProducts.forEach(p => {
      csv += `${p.product_name || ''},${p.total_qty || 0},${p.total_amount || 0}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branch_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    // build pdf manually to avoid html2canvas errors with tailwind colors
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(18);
    doc.text('Branch Report', 40, 40);

    // KPIs summary
    doc.setFontSize(12);
    let y = 60;
    kpis.forEach(k => {
      doc.text(`${k.title}: ${k.value}`, 40, y);
      y += 20;
    });

    // add sales trend note
    y += 10;
    doc.text('Sales Trend: see application charts', 40, y);
    y += 20;

    // Top products table
    const tableBody = topProducts.map(p => [p.product_name || '', p.total_qty || 0, p.total_amount || 0]);
    autoTable(doc, {
      head: [['Product', 'Qty Sold', 'Total Amount']],
      body: tableBody,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 10 },
    });

    doc.save('branch_report.pdf');
  };

  return (
    <div ref={reportRef} className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Branch Reports</h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString()} | Last 7 Days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md hover:opacity-90"
          >
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl shadow-md hover:opacity-90"
          >
            PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition"
          >
            <p className="text-sm text-gray-500">{item.title}</p>
            <h2 className="text-2xl font-bold mt-2">{item.value}</h2>
            {item.subtitle && <p className="text-xs text-gray-400 mt-1">{item.subtitle}</p>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="flex items-center space-x-4 mb-4">
        <label className="text-sm font-medium">Period:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">
            {period.charAt(0).toUpperCase() + period.slice(1)} Sales Trend (Last 7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) =>
                  `₱${Number(value).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}`
                }
              />
              <Line type="monotone" dataKey="sales" strokeWidth={3} stroke="#000" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment method pie chart */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Method Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name}: ${ (percent*100).toFixed(1) }%`}
              >
                {paymentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.name === 'Completed' ? '#8884d8' :
                      entry.name === 'Voided' ? '#e74c3c' :
                      entry.name === 'Partial Voided' ? '#f39c12' :
                      '#ccc'
                    }
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => {
                    const total = paymentData.reduce((s,e)=>s+e.value,0);
                    const pct = total ? (value/total)*100 : 0;
                    return [`${value}`, `${pct.toFixed(1)}%`];
                }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products table */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-2 border-b">Product</th>
              <th className="p-2 border-b">Quantity Sold</th>
              <th className="p-2 border-b">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((prod, idx) => (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="p-2 border-b">{prod.product_name || 'Unknown'}</td>
                <td className="p-2 border-b">{prod.total_qty}</td>
                <td className="p-2 border-b">₱{Number(prod.total_amount).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
