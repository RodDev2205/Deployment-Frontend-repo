import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import { Eye, EyeOff } from 'lucide-react';

export default function SimpleSettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [bugReport, setBugReport] = useState('');
  const [feedback, setFeedback] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [roleId, setRoleId] = useState(null); // store user's role

  // Fetch user info (role) and pin code if admin
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token'); // adjust if JWT stored differently
        if (!token) return;

        // Decode JWT locally to get role_id (simple parsing)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRoleId(payload.role_id);

        // Only fetch pin code if admin
        if (payload.role_id === 2) {
          const res = await fetch(`${API_BASE_URL}/pin-code`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Failed to fetch pin code');
          const data = await res.json();
          setPinCode(data.pin_code || '');
        }
      } catch (error) {
        console.error('Error fetching user info / pin code:', error);
        setPinCode('N/A');
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-gray-100">
      <div className="flex h-full">

        {/* Left Column */}
        <div className="flex-1 p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
          <p className="text-sm text-gray-600 mb-8">Queries, bug reports, and customization</p>

          {/* Profile Settings */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold mb-4">Profile Settings</h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username:</label>
              <input
                type="text"
                defaultValue="↑pcashier4"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password:</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  defaultValue="password123"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-700 pr-10"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Only show Pin Code if user is admin */}
            {roleId === 2 && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pin Code:</label>
                <input
                  type="text"
                  value={pinCode}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-100 cursor-not-allowed"
                />
              </div>
            )}

            <button className="px-5 py-2 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800">
              Update Username and Password
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 p-8">
          <div className="mt-16">
            {/* Bug Reports */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <h2 className="text-base font-bold mb-1">Bug Reports</h2>
              <p className="text-xs text-gray-600 mb-4">
                Found bug/s or errors? Please let your managers know, and send us a report.
              </p>
              <textarea
                value={bugReport}
                onChange={(e) => setBugReport(e.target.value)}
                placeholder="Enter your report here and specify where the bug was found."
                className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700 resize-none h-24 mb-4"
              />
              <button className="w-full py-2 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800">
                Submit bug report
              </button>
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-base font-bold mb-1">Got any Feedback or Suggestions?</h2>
              <p className="text-xs text-gray-600 mb-4">
                Feedback on the system's performance is always welcomed! Let us work together to improve overall performance.
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback/suggestions here. We'd love to hear your opinions!"
                className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700 resize-none h-24 mb-4"
              />
              <button className="w-full py-2 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800">
                Send us your feedback
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}