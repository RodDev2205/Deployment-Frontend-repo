import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

export default function SimpleSettings() {
  const [reportType, setReportType] = useState('bug');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [pinCode, setPinCode] = useState('');

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

  // Fetch pin_code if admin
  useEffect(() => {
    const fetchPinCode = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const payload = JSON.parse(atob(token.split('.')[1]));
        setRoleId(payload.role_id);

        // Only fetch pin_code for admins (role_id === 2)
        if (payload.role_id === 2) {
          const pinRes = await fetch(`${API_BASE_URL}/api/admin/pin-code`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (pinRes.ok) {
            const pinData = await pinRes.json();
            setPinCode(pinData.pin_code || 'N/A');
          }
        }
      } catch (error) {
        console.error('Error fetching pin code:', error);
      }
    };

    fetchPinCode();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        {/* Feedback Section */}
        <div className="flex-1 bg-white rounded-lg p-6 shadow-sm">
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

      {/* Admin PIN Code Section */}
      {roleId === 2 && (
        <div className="w-64 bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-base font-bold mb-4 text-gray-800">Void Pin Code</h2>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-3">Your PIN for voiding transactions:</p>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-700 tracking-widest">
                  {pinCode || '••••'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Keep this PIN secure and use it when voiding transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}