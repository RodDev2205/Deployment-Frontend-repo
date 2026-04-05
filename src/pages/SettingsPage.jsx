import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import { Eye, EyeOff } from 'lucide-react';

export default function SimpleSettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [reportType, setReportType] = useState('bug');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [pinCode, setPinCode] = useState('');
  const [roleId, setRoleId] = useState(null); // store user's role

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in first');
        return;
      }

      // Decode JWT to get user_id
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user_id = payload.user_id;

      // Prepare feedback data
      const feedbackData = {
        user_id,
        type: reportType,
        message,
        system_name: navigator.userAgent,
        // screenshot_url will be added later when file upload is implemented
      };

      // Call the feedback API
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      const result = await response.json();
      console.log('Feedback submitted:', result);

      // Reset form
      setMessage('');
      setScreenshot(null);
      setReportType('bug');

      alert('Thank you! Your feedback has been submitted successfully.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(`Failed to send feedback: ${error.message}`);
    }
  };

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
          // admin only endpoint
          const res = await fetch(`${API_BASE_URL}/api/admin/pin-code`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Failed to fetch pin code');
          const data = await res.json();
          setPinCode(data.pin_code || '');
        }
      } catch (error) {
        console.error('Error fetching user info / pin code:', error);
        // only show N/A if admin tried to load pin
        if (roleId === 2) {
          setPinCode('N/A');
        }
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Void Pin Code:</label>
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
          <div className="mt-16 bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-base font-bold mb-1">Report an Issue or Send Feedback</h2>
            <p className="text-xs text-gray-600 mb-4">
              Choose the type then describe your message. Attach an optional screenshot or image.
            </p>

            <form onSubmit={handleReportSubmit}>
              <div className="mb-4">
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="reportType"
                      value="bug"
                      checked={reportType === 'bug'}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    Bug Report
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="reportType"
                      value="feedback"
                      checked={reportType === 'feedback'}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    Feedback
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here"
                  className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700 resize-none h-28"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Attach Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
                {screenshot && (
                  <p className="text-xs text-gray-600 mt-2">Selected: {screenshot.name}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800"
              >
                Submit
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}