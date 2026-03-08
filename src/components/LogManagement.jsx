import React, { useState, useEffect } from 'react';
import { History, Search, Download, Server, Package, Lock } from 'lucide-react';

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

        const response = await fetch('http://localhost:5200/api/activity/login-logs', {
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

  const logTypes = ["All", "Security"];

  // --- Filtering Logic ---
  const filteredLogs = logs.filter(log => {
    const typeMatch = activeType === 'All' || log.type === activeType;
    const searchMatch = log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

// --- Helper Functions for Styling ---
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
      return <Lock className="w-4 h-4 mr-2 text-red-600" />;
    case 'Inventory':
      return <Package className="w-4 h-4 mr-2 text-amber-600" />;
    case 'System':
      return <Server className="w-4 h-4 mr-2 text-blue-600" />;
    default:
      return null;
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
                    title="Export Logs"
                >
                    <Download className="w-5 h-5 mr-2" /> Export
                </button>
            </div>
        </div>

        {/* Log Type Filter Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            {logTypes.map((type) => {
                const isActive = activeType === type;
                return (
                    <button
                        key={type}
                        onClick={() => setActiveType(type)}
                        className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            isActive 
                                ? 'bg-[#1B5E20] text-white shadow-lg' 
                                : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
                        }`}
                    >
                        {type}
                    </button>
                );
            })}
        </div>
      </div>

      {/* 2. Logs Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <tr key={log.log_id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-600">{log.timestamp}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800 font-semibold flex items-center">
                      {getTypeIcon(log.type)}
                      {log.type}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{log.user}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{log.action}</td>
                  <td className="px-6 py-3 text-sm text-gray-500 max-w-sm truncate">{log.details}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityStyle(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">No log entries found matching the filter criteria.</td>
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