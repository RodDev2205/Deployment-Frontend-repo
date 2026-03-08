import React, { useState, useEffect } from 'react';
import { History, Search, Download, Server, Package, Lock, User, UserCheck, UserX, Key, ShoppingCart, XCircle, RotateCcw } from 'lucide-react';
// jsPDF and its autotable plugin will be dynamically loaded in exportToPDF
// to avoid initialization issues with bundlers and ensure plugin attaches correctly.
import API_BASE_URL from '../config/api';

// --- Main Log Management Component ---
const LogManagement = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch login logs on component mount
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/activity-logs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }

        const data = await response.json();
        setLogs(data);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Define grouped log categories
  const logCategories = {
    'All': ['all'],
    'Security': ['Security', 'login', 'login_failed'],
    'Menu': ['menu_item_created', 'menu_item_updated', 'menu_item_deleted'],
    'Inventory': ['inventory_adjustment', 'inventory_add'],
    'Cashier': ['cashier_created', 'cashier_updated', 'cashier_password_reset', 'cashier_activated', 'cashier_deactivated'],
    'POS': ['transaction_completed', 'transaction_voided', 'transaction_partial_void'],
    'System': ['System']
  };

  // Get available categories based on existing logs
  const getAvailableCategories = () => {
    const availableTypes = new Set(logs.map(log => log.activity_type || log.type));
    return Object.keys(logCategories).filter(category => {
      if (category === 'All') return true;
      return logCategories[category].some(type => availableTypes.has(type));
    });
  };

  const availableCategories = getAvailableCategories();

  // --- Filtering Logic ---
  const filteredLogs = logs.filter(log => {
    const logType = log.activity_type || log.type;
    const typeMatch = activeType === 'All' || logCategories[activeType]?.includes(logType);
    const searchMatch = log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

  // --- Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(filteredLogs.length / perPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * perPage, currentPage * perPage);


// --- Helper Functions for Styling ---
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

const getSeverityStyle = (severity) => {
  switch (severity) {
    case 'Alert':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'Warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Success':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Info':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300';
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'Security':
    case 'login':
    case 'login_failed':
      return <Lock className="w-4 h-4 mr-2 text-red-600" />;
    case 'menu_item_created':
    case 'menu_item_updated':
    case 'menu_item_deleted':
      return <Package className="w-4 h-4 mr-2 text-amber-600" />;
    case 'inventory_adjustment':
    case 'inventory_add':
      return <Package className="w-4 h-4 mr-2 text-green-600" />;
    case 'cashier_created':
      return <User className="w-4 h-4 mr-2 text-blue-600" />;
    case 'cashier_updated':
      return <User className="w-4 h-4 mr-2 text-purple-600" />;
    case 'cashier_password_reset':
      return <Key className="w-4 h-4 mr-2 text-orange-600" />;
    case 'cashier_activated':
      return <UserCheck className="w-4 h-4 mr-2 text-green-600" />;
    case 'cashier_deactivated':
      return <UserX className="w-4 h-4 mr-2 text-red-600" />;
    case 'transaction_completed':
      return <ShoppingCart className="w-4 h-4 mr-2 text-green-600" />;
    case 'transaction_voided':
      return <XCircle className="w-4 h-4 mr-2 text-red-600" />;
    case 'transaction_partial_void':
      return <RotateCcw className="w-4 h-4 mr-2 text-orange-600" />;
    case 'System':
      return <Server className="w-4 h-4 mr-2 text-blue-600" />;
    default:
      return null;
  }
};

// PDF Export Function (dynamic import ensures correct plugin initialization)
const exportToPDF = async (logs) => {
  try {
    const { jsPDF } = await import('jspdf');
    // load plugin function explicitly
    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default || autoTableModule;
    
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text('System Activity Logs Report', 14, 22);

    // Add generation timestamp
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Total Records: ${logs.length}`, 14, 38);

    // Prepare table data
    const tableData = logs.map(log => [
      formatTimestamp(log.timestamp),
      log.activity_type || log.type || 'N/A',
      log.user || 'N/A',
      log.action || log.description || 'N/A',
      log.severity || 'Info'
    ]);

    // Add table using autoTable plugin function directly
    if (typeof autoTable === 'function') {
      autoTable(doc, {
        head: [['Timestamp', 'Type', 'User/Source', 'Action', 'Severity']],
        body: tableData,
        startY: 45,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [27, 94, 32], // #1B5E20
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 45 },
      });
    } else {
      console.error('autoTable plugin not loaded');
    }

    // Save the PDF
    const fileName = `activity_logs_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (err) {
    console.error('PDF export failed:', err);
    alert('Failed to generate PDF. See console for details.');
  }
};

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800">System Activity Logs</h2>

      {/* 1. Filters and Controls */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <History className="w-6 h-6 mr-2 text-[#1B5E20]" /> Audit Trail
            </h3>

            <div className="flex items-center space-x-2">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search logs by keyword..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 pl-10 border border-gray-300 rounded-lg focus:ring-[#33691E] focus:border-[#33691E] transition w-64"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <button 
                    className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
                    title="Export Logs to PDF"
                    onClick={() => exportToPDF(filteredLogs)}
                >
                    <Download className="w-5 h-5 mr-2" /> Export PDF
                </button>
            </div>
        </div>

        {/* Log Type Filter Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            {availableCategories.map((category) => {
                const isActive = activeType === category;
                return (
                    <button
                        key={category}
                        onClick={() => setActiveType(category)}
                        className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            isActive 
                                ? 'bg-[#1B5E20] text-white shadow-lg' 
                                : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
                        }`}
                    >
                        {category}
                    </button>
                );
            })}
        </div>
      </div>

      {/* 2. Logs Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
        {/* Pagination Controls at Top Right */}
        {filteredLogs.length > perPage && (
          <div className="flex justify-end items-center space-x-2 mb-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >Previous</button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >Next</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-6">Loading logs...</div>
        ) : error ? (
          <div className="text-center py-6 text-red-600">Error: {error}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User/Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedLogs.map((log) => (
                <tr key={log.log_id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-600">{formatTimestamp(log.timestamp)}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800 font-semibold flex items-center">
                      {getTypeIcon(log.activity_type || log.type)}
                      {log.activity_type || log.type}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{log.user}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{log.action}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityStyle(log.severity || 'Info')}`}>
                      {(log.severity || 'Info')}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-500">No log entries found matching the filter criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LogManagement;