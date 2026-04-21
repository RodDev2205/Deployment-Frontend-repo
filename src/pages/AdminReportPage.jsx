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
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

export default function AdminReportsPage() {
  const reportRef = useRef();
  const salesChartRef = useRef();
  const pieChartRef = useRef();
  const [dailySales, setDailySales] = useState([]);
  const [todaySales, setTodaySales] = useState(null);
  const [period, setPeriod] = useState('daily'); // daily, weekly, monthly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState([]); // cash/gcash breakdown
  const [topProducts, setTopProducts] = useState([]); // product ranking
  const [voidTracking, setVoidTracking] = useState([]); // void tracking data
  const [voidPage, setVoidPage] = useState(1); // current page for void tracking
  const [pdfGenerating, setPdfGenerating] = useState(false); // PDF generation state
  const itemsPerPage = 5; // items per page for void tracking

  const [refreshTrigger, setRefreshTrigger] = useState(0); // To trigger refetch

  // helper: convert DB rows into chart-compatible format based on the currently selected period
  const transformTrend = (rows) => {
    return rows.map((r) => {
      let label = r.period_key;
      switch (period) {
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
            `${API_BASE_URL}/api/sales-admin/sales-trend?period=${period}&startDate=${startDate}&endDate=${endDate}`,
            { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
          ),
          fetch(`${API_BASE_URL}/api/sales-admin/today-sales`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          }),
          fetch(
            `${API_BASE_URL}/api/sales-admin/payment-methods?startDate=${startDate}&endDate=${endDate}`,
            { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
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

        const voidData = await fetch(
          `${API_BASE_URL}/api/sales-admin/void-tracking?startDate=${startDate}&endDate=${endDate}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
        ).then(r => r.ok ? r.json() : []);

        // Transform data for chart using same logic as SuperAdmin
        const transformedData = transformTrend(salesData || []);
        setDailySales(transformedData);
        setTodaySales(todayData);
        // status breakdown (Completed / Voided / Partial Voided)
        const pie = payData.map(p => ({
          name: p.status,
          value: p.cnt
        }));
        setPaymentData(pie);
        setTopProducts(topData);
        setVoidTracking(voidData);
        setVoidPage(1);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [period, refreshTrigger]);
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
    csv += "\nVoid Tracking\nTransaction,Cashier,Item,Amount,Type,Reason\n";
    voidTracking.forEach(v => {
      csv += `${v.transaction_number || ''},${v.cashier || ''},${v.item || ''},${v.amount || 0},${v.type || ''},${v.reason || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branch_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      // Set font to support special characters better
      doc.setFont('helvetica');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 15;
      const margin = 12;
      const contentWidth = pageWidth - 2 * margin;

      // ===== PAGE 1: HEADER & KPIs =====
      // Header
      doc.setFontSize(24);
      doc.setTextColor(25, 25, 112); // Dark blue
      doc.text('BRANCH REPORT', margin, yPosition);
      yPosition += 8;

      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      doc.text('Generated: ' + dateStr, margin, yPosition);
      yPosition += 12;

      // Divider line
      doc.setDrawColor(25, 25, 112);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // KPIs Grid (2x3)
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const kpiWidth = (contentWidth - 4) / 2; // 2 columns with 4mm gap
      const kpiHeight = 28;
      let kpiIndex = 0;

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          if (kpiIndex >= kpis.length) break;
          
          const kpi = kpis[kpiIndex];
          const xPos = margin + col * (kpiWidth + 4);
          const yPos = yPosition + row * (kpiHeight + 4);

          // Box background
          doc.setFillColor(240, 248, 255); // Alice blue
          doc.rect(xPos, yPos, kpiWidth, kpiHeight, 'F');
          doc.setDrawColor(25, 25, 112);
          doc.rect(xPos, yPos, kpiWidth, kpiHeight);

          // KPI Title - escape special characters
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          const titleText = String(kpi.title).replace(/&/g, 'and').replace(/[+_]/g, ' ');
          doc.text(titleText, xPos + 3, yPos + 5);

          // KPI Value - remove problematic symbols and use plain format
          doc.setFontSize(12);
          doc.setTextColor(25, 25, 112);
          doc.setFont(undefined, 'bold');
          let valueText = String(kpi.value);
          // Replace peso symbol with "PHP "
          valueText = valueText.replace('₱', 'PHP ').replace(/[^\w\s.,\-()]/g, '');
          doc.text(valueText, xPos + 3, yPos + 13);

          // KPI Subtitle
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          if (kpi.subtitle) {
            const subtitleText = String(kpi.subtitle).replace(/&/g, 'and');
            doc.text(subtitleText, xPos + 3, yPos + 19);
          }

          kpiIndex++;
        }
      }

      yPosition += 3 * (kpiHeight + 4) + 8;

      // ===== EXECUTIVE SUMMARY =====
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setTextColor(25, 25, 112);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Executive Summary', margin, yPosition);
      yPosition += 6;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);

      // Build summary text
      const completedTransactions = paymentData.find(p => p.name === 'Completed')?.value || 0;
      const voidedTransactions = paymentData.find(p => p.name === 'Voided')?.value || 0;
      const partialVoidedTransactions = paymentData.find(p => p.name === 'Partial Voided')?.value || 0;
      const totalTx = completedTransactions + voidedTransactions + partialVoidedTransactions;
      const completionRate = totalTx > 0 ? ((completedTransactions / totalTx) * 100).toFixed(1) : 0;

      const summaryText = `Overall Business Performance:\n\nYour branch completed PHP ${(todaySales?.total_sales || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} in net sales today with ${todaySales?.completed_count || 0} completed orders. The transaction completion rate stands at ${completionRate}%, with ${voidedTransactions} voided and ${partialVoidedTransactions} partially voided transactions. Your top performing staff member processed PHP ${(todaySales?.avg_order_value || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} in average order value. This report provides detailed insights into sales trends, product performance, and transaction management.`;

      doc.text(summaryText, margin, yPosition, { maxWidth: contentWidth, align: 'justify' });
      yPosition += doc.getTextDimensions(summaryText, { maxWidth: contentWidth }).h + 8;

      // ===== PAGE 2: CHARTS =====
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setTextColor(25, 25, 112);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Sales Analytics', margin, yPosition);
      yPosition += 8;

      // Capture Sales Chart
      let maxChartHeight = 50;
      if (salesChartRef.current) {
        try {
          const canvas = await html2canvas(salesChartRef.current, {
            allowTaint: true,
            useCORS: true,
            backgroundColor: '#ffffff',
            scale: 1.5,
          });
          const chartImage = canvas.toDataURL('image/png');
          const chartWidth = contentWidth / 2 - 2;
          const chartHeight = 50;
          
          doc.addImage(chartImage, 'PNG', margin, yPosition, chartWidth, chartHeight);

          // Add text interpretation for Sales Chart
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          
          // Calculate statistics
          const sales = dailySales.map(d => d.sales || 0);
          const maxSales = Math.max(...sales);
          const minSales = Math.min(...sales);
          const avgSales = sales.reduce((a, b) => a + b, 0) / sales.length;
          const highestDay = dailySales.find(d => d.sales === maxSales);
          const lowestDay = dailySales.find(d => d.sales === minSales);
          const trend = sales[sales.length - 1] > sales[0] ? 'upward' : 'downward';
          
          // Build sales interpretation with proper fallbacks
          const highestDayStr = highestDay?.date ? highestDay.date : 'period';
          const lowestDayStr = lowestDay?.date ? lowestDay.date : 'period';
          const isValidData = dailySales && dailySales.length > 0;
          
          let salesInterpretation = '';
          if (isValidData) {
            salesInterpretation = `Sales Trend Analysis: Peak sales of PHP ${maxSales.toLocaleString('en-US', {minimumFractionDigits: 2})} recorded on ${highestDayStr}. Lowest sales of PHP ${minSales.toLocaleString('en-US', {minimumFractionDigits: 2})} on ${lowestDayStr}. Average daily sales: PHP ${avgSales.toLocaleString('en-US', {minimumFractionDigits: 2})}. Overall ${trend} trend observed over the period.`;
          } else {
            salesInterpretation = 'No sales data available for this period.';
          }
          
          const salesTextHeight = doc.getTextDimensions(salesInterpretation, { maxWidth: contentWidth / 2 - 2 }).h;
          doc.text(salesInterpretation, margin, yPosition + chartHeight + 2, { maxWidth: contentWidth / 2 - 2, align: 'left' });
          maxChartHeight = chartHeight + salesTextHeight + 4;
        } catch (e) {
          console.error('Error capturing sales chart:', e);
        }
      }

      // Capture Pie Chart
      if (pieChartRef.current) {
        try {
          const canvas = await html2canvas(pieChartRef.current, {
            allowTaint: true,
            useCORS: true,
            backgroundColor: '#ffffff',
            scale: 1.5,
          });
          const chartImage = canvas.toDataURL('image/png');
          const chartWidth = contentWidth / 2 - 2;
          const chartHeight = 50;
          
          doc.addImage(chartImage, 'PNG', margin + contentWidth / 2 + 2, yPosition, chartWidth, chartHeight);
          
          // Add text interpretation for Pie Chart
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          
          // Calculate percentages
          const totalTransactions = paymentData.reduce((sum, item) => sum + item.value, 0);
          let transactionSummary = 'Transaction Status: ';
          paymentData.forEach((item, idx) => {
            const pct = totalTransactions > 0 ? ((item.value / totalTransactions) * 100).toFixed(1) : 0;
            if (idx > 0) transactionSummary += ' | ';
            transactionSummary += `${item.name}: ${item.value} (${pct}%)`;
          });
          
          const pieTextHeight = doc.getTextDimensions(transactionSummary, { maxWidth: contentWidth / 2 - 2 }).h;
          doc.text(transactionSummary, margin + contentWidth / 2 + 2, yPosition + chartHeight + 2, { maxWidth: contentWidth / 2 - 2, align: 'left' });
          if (chartHeight + pieTextHeight + 4 > maxChartHeight) {
            maxChartHeight = chartHeight + pieTextHeight + 4;
          }
        } catch (e) {
          console.error('Error capturing pie chart:', e);
        }
      }

      yPosition += maxChartHeight + 8;

      // ===== TOP PRODUCTS TABLE =====
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setTextColor(25, 25, 112);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Top Selling Products', margin, yPosition);
      yPosition += 6;

      const topProductsData = topProducts.map(p => [
        (p.product_name || 'Unknown').substring(0, 30),
        String(p.total_qty || 0),
        'PHP ' + Number(p.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
      ]);

      autoTable(doc, {
        head: [['Product', 'Qty Sold', 'Total Amount']],
        body: topProductsData,
        startY: yPosition,
        margin: margin,
        theme: 'grid',
        headStyles: {
          fillColor: [25, 25, 112],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [245, 248, 255]
        },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'center' },
          2: { halign: 'right' }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 8;

      // ===== VOID TRACKING TABLE =====
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setTextColor(25, 25, 112);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Void Tracking', margin, yPosition);
      yPosition += 6;

      // Only show first 10 void records in PDF
      const voidTrackingData = voidTracking.slice(0, 10).map(v => [
        (v.transaction_number || '').substring(0, 15),
        (v.cashier || '').substring(0, 15),
        (v.item || '').substring(0, 20),
        'PHP ' + Number(v.amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        (v.type || '').substring(0, 10),
        (v.reason || '').substring(0, 20)
      ]);

      autoTable(doc, {
        head: [['Transaction', 'Cashier', 'Item', 'Amount', 'Type', 'Reason']],
        body: voidTrackingData,
        startY: yPosition,
        margin: margin,
        theme: 'grid',
        headStyles: {
          fillColor: [220, 20, 60], // Crimson for void tracking
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [255, 240, 245]
        },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'left' },
          2: { halign: 'left' },
          3: { halign: 'right' },
          4: { halign: 'center' },
          5: { halign: 'left' }
        }
      });

      // ===== FOOTER ON EACH PAGE =====
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Footer line
        doc.setDrawColor(25, 25, 112);
        doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
        
        // Page number
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Page ' + i + ' of ' + totalPages, pageWidth - margin - 20, pageHeight - 5, { align: 'right' });

        // Company name / footer text
        doc.setFontSize(8);
        doc.text('Report Generated: ' + new Date().toLocaleString(), margin, pageHeight - 5);
      }

      doc.save('Branch_Report_' + new Date().toISOString().split('T')[0] + '.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF. Please try again.');
    }
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
            onClick={async () => {
              setPdfGenerating(true);
              try {
                await exportPDF();
              } finally {
                setPdfGenerating(false);
              }
            }}
            disabled={pdfGenerating}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfGenerating ? 'Generating...' : 'PDF'}
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
        <div ref={salesChartRef} className="bg-white rounded-2xl shadow-md p-6">
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
        <div ref={pieChartRef} className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Transaction's Breakdown</h2>
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

      {/* Void Tracking Table */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Void Tracking</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-2 border-b">Transaction</th>
              <th className="p-2 border-b">Cashier</th>
              <th className="p-2 border-b">Item</th>
              <th className="p-2 border-b">Amount</th>
              <th className="p-2 border-b">Type</th>
              <th className="p-2 border-b">Reason</th>
            </tr>
          </thead>
          <tbody>
            {voidTracking.slice((voidPage - 1) * itemsPerPage, voidPage * itemsPerPage).map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="p-2 border-b">{item.transaction_number}</td>
                <td className="p-2 border-b">{item.cashier}</td>
                <td className="p-2 border-b">{item.item}</td>
                <td className="p-2 border-b">₱{Number(item.amount).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                <td className="p-2 border-b">{item.type}</td>
                <td className="p-2 border-b">{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination for Void Tracking */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setVoidPage(Math.max(1, voidPage - 1))}
            disabled={voidPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Previous
          </button>
          <span>Page {voidPage} of {Math.ceil(voidTracking.length / itemsPerPage)}</span>
          <button
            onClick={() => setVoidPage(Math.min(Math.ceil(voidTracking.length / itemsPerPage), voidPage + 1))}
            disabled={voidPage === Math.ceil(voidTracking.length / itemsPerPage)}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
