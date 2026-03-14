import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import {
  Search, Filter, Calendar, Download, Clock, User,
  Activity, AlertCircle, CheckCircle, XCircle, Info,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('today');
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ===========================
  // Fetch activity logs
  // ===========================
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/activity-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch activity logs");

        const data = await res.json();
        setActivityLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // ===========================
  // Timestamp Formatting
  // ===========================
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila", // 🇵🇭 Philippines timezone
    }).format(date);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minute(s) ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hour(s) ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} day(s) ago`;

    return "";
  };

  // ===========================
  // Map log type to icon
  // ===========================
  const getActivityIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className="text-green-600" />;
      case 'error': return <XCircle size={20} className="text-red-600" />;
      case 'warning': return <AlertCircle size={20} className="text-yellow-600" />;
      case 'info': return <Info size={20} className="text-blue-600" />;
      default: return <Activity size={20} className="text-gray-600" />;
    }
  };

  // ===========================
  // Map badge color
  // ===========================
  const getActivityBadge = (type) => {
    const badges = {
      success: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700',
      warning: 'bg-yellow-100 text-yellow-700',
      info: 'bg-blue-100 text-blue-700'
    };
    return badges[type] || 'bg-gray-100 text-gray-700';
  };

  // ===========================
  // Categorize actions
  // ===========================
  const getCategory = (action) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('login') || lowerAction.includes('logout') || lowerAction.includes('password')) {
      return 'security';
    } else if (lowerAction.includes('menu') || lowerAction.includes('product')) {
      return 'menu';
    } else if (lowerAction.includes('sale') || lowerAction.includes('transaction') || lowerAction.includes('void') || lowerAction.includes('refund')) {
      return 'pos';
    } else if (lowerAction.includes('inventory') || lowerAction.includes('ingredient') || lowerAction.includes('stock')) {
      return 'inventory';
    } else if (lowerAction.includes('user') || lowerAction.includes('admin') || lowerAction.includes('branch') || lowerAction.includes('role')) {
      return 'admin';
    } else {
      return 'other';
    }
  };

  // ===========================
  // Normalize Logs
  // ===========================
  const normalizedLogs = activityLogs.map(log => ({
    id: log.log_id,
    user: log.user || "System",
    action: log.action || log.description,
    details: log.reference_id ? `Ref ID: ${log.reference_id}` : "",
    timestamp: log.timestamp,
    type: log.activity_type === "login"
      ? "success"
      : log.activity_type || "info",
    branch: log.branch || "System",
    category: getCategory(log.action || log.description)
  }));

  // ===========================
  // Filtering
  // ===========================
  const filteredLogs = normalizedLogs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === 'all' || log.category === selectedFilter;

    const logDate = new Date(log.timestamp);
    const now = new Date();
    let matchesDate = true;

    if (selectedDate === 'today') {
      matchesDate = logDate.toDateString() === now.toDateString();
    } else if (selectedDate === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      matchesDate = logDate.toDateString() === yesterday.toDateString();
    } else if (selectedDate === 'week') {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      matchesDate = logDate >= weekStart && logDate <= weekEnd;
    } else if (selectedDate === 'month') {
      matchesDate =
        logDate.getMonth() === now.getMonth() &&
        logDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesFilter && matchesDate;
  });

  // ===========================
  // Pagination
  // ===========================
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };


  // ===========================
  // UI
  // ===========================
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Activity Logs & Records</h1>
      </div>


      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities, users, or details..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="security">Security</option>
            <option value="menu">Menu</option>
            <option value="pos">POS</option>
            <option value="inventory">Inventory</option>
            <option value="admin">Admin</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-gray-500" />
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading logs...</div>
          ) : paginatedLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No activity logs found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{getActivityIcon(log.type)}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-800">{log.user}</span>
                    </td>
                    <td className="px-6 py-4">{log.action}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.details}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.branch}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                        {log.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-start gap-2 text-sm text-gray-600">
                      <Clock size={14} />
                      <div>
                        <div className="font-medium">
                          {formatTimestamp(log.timestamp)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {getTimeAgo(log.timestamp)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
