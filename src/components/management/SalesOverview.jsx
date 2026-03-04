import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import { useNavigate } from 'react-router-dom';

const SalesOverview = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/sales-superadmin/branch-sales-summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch branch sales summary');
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error('Error loading branch sales summary', err);
      }
    };
    fetchSummary();
  }, []);

  const totalSalesDisplay = summary ? `₱ ${Number(summary.overall_total).toLocaleString()}` : '₱ 0.00';

  return (
    <div className="bg-white rounded-lg p-4 h-96 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Sales Overview</h2>
      </div>

      <p className="text-gray-500 text-sm mb-3">Sale overview of <span className="font-semibold">today</span></p>

      <div className="mb-4 bg-gray-50 p-4 rounded-lg shadow-lg">
        <h3 className="text-gray-900 font-semibold mb-3">Total Sales {totalSalesDisplay}</h3>

        {/* dynamic branch bars */}
        <div className="space-y-4 mb-6">
          {summary && summary.branches.map((b) => {
            const percent = summary.overall_total ? (Number(b.total_sales) / summary.overall_total) * 100 : 0;
            return (
              <div key={b.branch_id} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600 w-24">{b.branch_name}</span>
                <div className="flex-1">
                  <div
                    className="h-8 bg-green-400 rounded"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-green-600">₱ {Number(b.total_sales).toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        <hr className="my-3 border-gray-300" />

        <div className="space-y-3">
          {summary && summary.branches.map((b) => (
            <p key={b.branch_id} className="text-sm text-gray-600">
              Transactions from {b.branch_name}: {b.completed_count}
            </p>
          ))}
        </div>
      </div>

      <button 
        onClick={() => navigate('/superadmin/reports')}
        className="mt-4 text-green-600 hover:text-green-700 text-sm font-medium"
      >
        Go to Reports Page for more information
      </button>
    </div>
  );
};

export default SalesOverview;
