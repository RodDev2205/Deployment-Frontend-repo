import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

export default function SimpleSettings() {
  const [reportType, setReportType] = useState('bug');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [pinCode, setPinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

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

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in first');
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id;

      const updateData = {
        first_name: firstName,
        last_name: lastName,
        contact_number: contactNumber,
        username,
      };

      if (newPassword.trim()) {
        if (!oldPassword.trim()) {
          alert('Please enter your current password to change it');
          return;
        }
        updateData.password = newPassword;
        updateData.old_password = oldPassword;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/user/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      console.log('Profile updated:', result);

      // Reset password fields
      setOldPassword('');
      setNewPassword('');

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  // Fetch pin_code if admin and user profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const payload = JSON.parse(atob(token.split('.')[1]));
        setRoleId(payload.role_id);

        // Fetch user profile
        const userRes = await fetch(`${API_BASE_URL}/api/users/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setFirstName(userData.first_name || '');
          setLastName(userData.last_name || '');
          setContactNumber(userData.contact_number || '');
          setUsername(userData.username || '');
        }

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
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={`space-y-6 pb-20 ${roleId === 1 ? 'h-screen overflow-y-auto' : ''}`}>
      {/* Profile Settings Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-base font-bold mb-1">Profile Settings</h2>
        <p className="text-xs text-gray-600 mb-6">Queries, bug reports, and customization</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">First Name:</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700 bg-gray-50"
              readOnly={roleId !== 2 && roleId !== 3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name:</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700 bg-gray-50"
              readOnly={roleId !== 2 && roleId !== 3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number:</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700 bg-gray-50"
              readOnly={roleId !== 2 && roleId !== 3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700 bg-gray-50"
              readOnly={roleId !== 2 && roleId !== 3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password:</label>
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (leave empty to keep current)"
                className="flex-1 border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700 bg-gray-50"
                readOnly={roleId !== 2 && roleId !== 3}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password:</label>
            <div className="flex items-center gap-2">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="flex-1 border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700 bg-gray-50"
                readOnly={roleId !== 2 && roleId !== 3}
              />
              <button 
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                {showOldPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {roleId === 2 || roleId === 3 ? (
            <button 
              onClick={handleUpdateProfile}
              className="w-full py-2 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800"
            >
              Update Profile
            </button>
          ) : (
            <>
              <button disabled className="w-full py-2 bg-emerald-700 text-white text-sm rounded font-semibold opacity-70 cursor-not-allowed">
                Cannot Edit
              </button>
              <p className="text-xs text-gray-600">
                Profile can only be edited by your branch manager or super admin. For any concerns please contact them.
              </p>
            </>
          )}
        </div>
      </div>

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