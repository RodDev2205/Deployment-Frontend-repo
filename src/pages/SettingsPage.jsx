import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import { useAlert } from '../context/AlertContext';

export default function SimpleSettings() {
  const { success, error } = useAlert();
  const [reportType, setReportType] = useState('bug');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [pinCode, setPinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Account info state
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    username: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    username: '',
    currentPassword: '',
    newPassword: ''
  });

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
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

      success('Feedback Submitted', 'Thank you! Your feedback has been submitted successfully.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      error('Submission Failed', `Failed to send feedback: ${error.message}`);
    }
  };

  // Fetch current user profile and admin PIN on page load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const payload = JSON.parse(atob(token.split('.')[1]));
        setRoleId(payload.role_id);

        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          console.error('Failed to load profile', response.status);
          return;
        }

        const data = await response.json();
        setUserData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          contactNumber: data.contact_number || '',
          username: data.username || ''
        });
        setEditFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          contactNumber: data.contact_number || '',
          username: data.username || '',
          currentPassword: '',
          newPassword: ''
        });

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
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      if (editFormData.newPassword && !editFormData.currentPassword) {
        error('Current Password Required', 'Please provide your current password to set a new password.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: editFormData.firstName,
          last_name: editFormData.lastName,
          contact_number: editFormData.contactNumber,
          username: editFormData.username,
          current_password: editFormData.currentPassword || undefined,
          new_password: editFormData.newPassword || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedData = await response.json();
      setUserData({
        firstName: updatedData.user?.first_name || updatedData.first_name || '',
        lastName: updatedData.user?.last_name || updatedData.last_name || '',
        contactNumber: updatedData.user?.contact_number || updatedData.contact_number || '',
        username: updatedData.user?.username || updatedData.username || ''
      });
      setShowEditModal(false);
      setEditFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: ''
      }));
      success('Account Updated', 'Your account information has been updated successfully.');
    } catch (error) {
      console.error('Error updating user data:', error);
      error('Update Failed', `Failed to update account: ${error.message}`);
    }
  };

  // Handle edit modal
  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditFormData({
      firstName: userData.firstName,
      lastName: userData.lastName,
      contactNumber: userData.contactNumber,
      username: userData.username,
      currentPassword: '',
      newPassword: ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={`space-y-6 pb-20 ${roleId === 1 ? 'h-screen overflow-y-auto' : ''}`}>
      {/* Account Information Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-base font-bold mb-1">Account Information</h2>
        <p className="text-xs text-gray-600 mb-6">Your current account details</p>
        

        <div className="space-y-4 mb-6">
          {/* First Name and Last Name - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name:</label>
              <input
                type="text"
                value={userData.firstName}
                readOnly
                className="w-full border border-gray-300 rounded p-3 text-sm outline-none bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name:</label>
              <input
                type="text"
                value={userData.lastName}
                readOnly
                className="w-full border border-gray-300 rounded p-3 text-sm outline-none bg-gray-50 text-gray-700"
              />
            </div>
          </div>

          {/* Contact Number and Username - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number:</label>
              <input
                type="text"
                value={userData.contactNumber}
                readOnly
                className="w-full border border-gray-300 rounded p-3 text-sm outline-none bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username:</label>
              <input
                type="text"
                value={userData.username}
                readOnly
                className="w-full border border-gray-300 rounded p-3 text-sm outline-none bg-gray-50 text-gray-700"
              />
            </div>
          </div>
        </div>

        {roleId === 2 || roleId === 3 ? (
          <button
            onClick={handleEditClick}
            className="w-full py-2 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800 disabled:opacity-50"
            disabled={showEditModal}
          >
            Edit Account
          </button>
        ) : (
          <>
            <button
              disabled
              className="w-full py-2 bg-emerald-700 text-white text-sm rounded font-semibold opacity-70 cursor-not-allowed"
            >
              Cannot Edit
            </button>
            <p className="text-xs text-gray-600 mt-3">
              Profile can only be edited by your branch manager or super admin. For any concerns please contact them.
            </p>
          </>
        )}
      </div>

      {/* Edit Account Modal */}
      {showEditModal && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 w-full max-w-md mx-8">
            <h2 className="text-lg font-bold mb-3 text-gray-800">Edit Account Information</h2>
            
            <form onSubmit={handleEditFormSubmit} className="space-y-2">
              {/* First Name and Last Name - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name:</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={handleEditFormChange}
                    className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name:</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={handleEditFormChange}
                    className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number:</label>
                <input
                  type="text"
                  name="contactNumber"
                  value={editFormData.contactNumber}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username:</label>
                <input
                  type="text"
                  name="username"
                  value={editFormData.username}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password:</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={editFormData.currentPassword}
                    onChange={handleEditFormChange}
                    placeholder="Enter your current password"
                    className="flex-1 border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password:</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={editFormData.newPassword}
                    onChange={handleEditFormChange}
                    placeholder="Enter your new password"
                    className="flex-1 border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 text-sm rounded font-semibold hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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