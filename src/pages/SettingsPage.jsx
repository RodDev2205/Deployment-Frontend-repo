import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import { useAlert } from '../context/AlertContext';
import { Plus, Edit2, Percent, X } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('account');
  
  // Category Management state
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'menu', // 'menu', 'inventory', 'void_reason'
    description: ''
  });

  // Tax Management state
  const [taxRate, setTaxRate] = useState('12%');
  const [showTaxEditModal, setShowTaxEditModal] = useState(false);
  const [taxFormData, setTaxFormData] = useState('12%');

  // Discount Management state
  const [discounts, setDiscounts] = useState([]);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    name: '',
    rate: '',
    description: ''
  });
  
  // Account info state
  const [userData, setUserData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
    username: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    middleName: '',
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

  // Category Management Functions
  const fetchCategories = async (token) => {
    setCategoryLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      error('Fetch Error', 'Failed to load categories');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleOpenCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        type: category.type,
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        type: 'menu',
        description: ''
      });
    }
    setShowCategoryModal(true);
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      type: 'menu',
      description: ''
    });
  };

  const handleCategoryFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      if (!categoryForm.name.trim()) {
        error('Validation Error', 'Category name is required');
        return;
      }

      const endpoint = editingCategory
        ? `${API_BASE_URL}/api/categories/${editingCategory.id}`
        : `${API_BASE_URL}/api/categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingCategory ? 'update' : 'add'} category`);
      }

      await fetchCategories(token);
      handleCloseCategoryModal();
      success(
        editingCategory ? 'Category Updated' : 'Category Added',
        `Category has been ${editingCategory ? 'updated' : 'added'} successfully.`
      );
    } catch (err) {
      console.error('Error saving category:', err);
      error('Save Error', err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }

      await fetchCategories(token);
      success('Category Deleted', 'Category has been deleted successfully.');
    } catch (err) {
      console.error('Error deleting category:', err);
      error('Delete Error', err.message);
    }
  };

  // Tax Management Functions
  const handleSaveTax = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      if (!taxFormData.trim()) {
        error('Validation Error', 'Tax rate is required');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/tax-rates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rate: taxFormData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tax rate');
      }

      setTaxRate(taxFormData);
      setShowTaxEditModal(false);
      success('Tax Updated', 'Tax rate has been updated successfully.');
    } catch (err) {
      console.error('Error saving tax:', err);
      error('Save Error', err.message);
    }
  };

  // Discount Management Functions
  const fetchDiscounts = async (token) => {
    setDiscountLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/discounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discounts');
      }

      const data = await response.json();
      setDiscounts(data.discounts || []);
    } catch (err) {
      console.error('Error fetching discounts:', err);
      error('Fetch Error', 'Failed to load discounts');
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleOpenDiscountModal = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount);
      setDiscountForm({
        name: discount.name,
        rate: discount.rate,
        description: discount.description || ''
      });
    } else {
      setEditingDiscount(null);
      setDiscountForm({
        name: '',
        rate: '',
        description: ''
      });
    }
    setShowDiscountModal(true);
  };

  const handleCloseDiscountModal = () => {
    setShowDiscountModal(false);
    setEditingDiscount(null);
    setDiscountForm({
      name: '',
      rate: '',
      description: ''
    });
  };

  const handleDiscountFormChange = (e) => {
    const { name, value } = e.target;
    setDiscountForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      if (!discountForm.name.trim()) {
        error('Validation Error', 'Discount name is required');
        return;
      }

      if (!discountForm.rate || discountForm.rate < 0 || discountForm.rate > 100) {
        error('Validation Error', 'Discount rate must be between 0 and 100');
        return;
      }

      const endpoint = editingDiscount
        ? `${API_BASE_URL}/api/discounts/${editingDiscount.id}`
        : `${API_BASE_URL}/api/discounts`;

      const method = editingDiscount ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(discountForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingDiscount ? 'update' : 'add'} discount`);
      }

      await fetchDiscounts(token);
      handleCloseDiscountModal();
      success(
        editingDiscount ? 'Discount Updated' : 'Discount Added',
        `Discount has been ${editingDiscount ? 'updated' : 'added'} successfully.`
      );
    } catch (err) {
      console.error('Error saving discount:', err);
      error('Save Error', err.message);
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/discounts/${discountId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete discount');
      }

      await fetchDiscounts(token);
      success('Discount Deleted', 'Discount has been deleted successfully.');
    } catch (err) {
      console.error('Error deleting discount:', err);
      error('Delete Error', err.message);
    }
  };

  const handleToggleDiscountStatus = async (discountId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/discounts/${discountId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update discount status');
      }

      await fetchDiscounts(token);
      success(
        'Discount Status Updated',
        `Discount has been ${!currentStatus ? 'activated' : 'deactivated'} successfully.`
      );
    } catch (err) {
      console.error('Error toggling discount status:', err);
      error('Update Error', err.message);
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
          middleName: data.middle_name || '',
          lastName: data.last_name || '',
          contactNumber: data.contact_number || '',
          username: data.username || ''
        });
        setEditFormData({
          firstName: data.first_name || '',
          middleName: data.middle_name || '',
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

        // Fetch categories if admin or superadmin
        if (payload.role_id === 2 || payload.role_id === 3) {
          await fetchCategories(token);
          await fetchDiscounts(token);
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
          middle_name: editFormData.middleName,
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
        middleName: updatedData.user?.middle_name || updatedData.middle_name || '',
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
      middleName: userData.middleName,
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
      {/* ADMIN AND SUPERADMIN INTERFACE (Role 2 & 3) */}
      {(roleId === 2 || roleId === 3) && (
        <>
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('account')}
                className={`flex-1 py-4 px-6 font-semibold text-center transition-all ${
                  activeTab === 'account'
                    ? 'text-emerald-700 border-b-2 border-emerald-700'
                    : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                }`}
              >
                Account Information
              </button>
              <button
                onClick={() => setActiveTab('category')}
                className={`flex-1 py-4 px-6 font-semibold text-center transition-all ${
                  activeTab === 'category'
                    ? 'text-emerald-700 border-b-2 border-emerald-700'
                    : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                }`}
              >
                Category Management
              </button>
              <button
                onClick={() => setActiveTab('tax')}
                className={`flex-1 py-4 px-6 font-semibold text-center transition-all ${
                  activeTab === 'tax'
                    ? 'text-emerald-700 border-b-2 border-emerald-700'
                    : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                }`}
              >
                Tax Management
              </button>
              <button
                onClick={() => setActiveTab('discount')}
                className={`flex-1 py-4 px-6 font-semibold text-center transition-all ${
                  activeTab === 'discount'
                    ? 'text-emerald-700 border-b-2 border-emerald-700'
                    : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                }`}
              >
                Discount Management
              </button>
              <button
                onClick={() => setActiveTab('bugissues')}
                className={`flex-1 py-4 px-6 font-semibold text-center transition-all ${
                  activeTab === 'bugissues'
                    ? 'text-emerald-700 border-b-2 border-emerald-700'
                    : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                }`}
              >
                Bug Issues
              </button>
            </div>
          </div>

          {/* Account Information Tab */}
          {activeTab === 'account' && (
            <div className={`grid gap-6 ${roleId === 2 ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {/* Left Column - Account Details */}
              <div className={`bg-white rounded-lg p-6 shadow-sm ${roleId === 2 ? 'col-span-2' : ''}`}>
                <h2 className="text-base font-bold mb-1">Account Information</h2>
                <p className="text-xs text-gray-600 mb-6">Your current account details</p>
                
                <div className="space-y-4 mb-6">
                  {/* First Name, Middle Name, Last Name - 3 Columns */}
                  <div className="grid grid-cols-3 gap-4">
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Initial:</label>
                      <input
                        type="text"
                        value={userData.middleName}
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

                <button
                  onClick={handleEditClick}
                  className="w-full py-2 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800 disabled:opacity-50"
                  disabled={showEditModal}
                >
                  Edit Account
                </button>
              </div>

              {/* Right Column - PIN Code (Admin Only) */}
              {roleId === 2 && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-base font-bold mb-4 text-gray-800">PIN Code</h2>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-3">Your 8-digit PIN:</p>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-700 tracking-widest">
                        {pinCode && typeof pinCode === 'string' ? pinCode.padStart(8, '0') : '••••••••'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Use this PIN for voiding transactions.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Category Management Tab */}
          {activeTab === 'category' && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-base font-bold mb-1">Category Management</h2>
                  <p className="text-xs text-gray-600">Manage menu, inventory, and void transaction categories</p>
                </div>
                <button
                  onClick={() => handleOpenCategoryModal()}
                  className="py-2 px-4 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800"
                >
                  + Add Category
                </button>
              </div>

              {categoryLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading categories...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No categories found. Add a new category to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Category Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category, index) => (
                        <tr key={category.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-gray-800">{category.name}</td>
                          <td className="px-4 py-3">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                              {category.type === 'menu' ? 'Menu' : category.type === 'inventory' ? 'Inventory' : 'Void Reason'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{category.description || '-'}</td>
                          <td className="px-4 py-3 space-x-2 flex">
                            <button
                              onClick={() => handleOpenCategoryModal(category)}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tax Tab */}
          {activeTab === 'tax' && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-base font-bold mb-1">Tax Settings</h2>
                  <p className="text-xs text-gray-600">
                    {roleId === 3 ? 'View and manage tax rates' : 'View tax rates (Read-only)'}
                  </p>
                </div>
                {roleId === 3 && (
                  <button
                    onClick={() => setShowTaxEditModal(true)}
                    className="py-2 px-4 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800"
                  >
                    Edit Tax
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Rate (%):</label>
                  <input
                    type="text"
                    value={taxRate}
                    readOnly
                    className="w-full border border-gray-300 rounded p-3 text-sm outline-none bg-gray-50 text-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {roleId === 3 ? 'Click "Edit Tax" to modify' : 'Read-only for ADMIN users'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Discount Tab */}
          {activeTab === 'discount' && (roleId === 2 || roleId === 3) && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-base font-bold mb-1">Discount Management</h2>
                  <p className="text-xs text-gray-600">Add and manage discount types (PWD, Senior Citizen, Anniversary, etc.)</p>
                </div>
                <button
                  onClick={() => handleOpenDiscountModal()}
                  className="py-2 px-4 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800"
                >
                  + Add Discount
                </button>
              </div>

              {discountLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading discounts...</p>
                </div>
              ) : discounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No discounts found. Add a new discount type to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Discount Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Rate (%)</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map((discount, index) => (
                        <tr key={discount.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-gray-800 font-medium">{discount.name}</td>
                          <td className="px-4 py-3 text-gray-800">{discount.rate}%</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              discount.is_active 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {discount.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{discount.description || '-'}</td>
                          <td className="px-4 py-3 space-x-2 flex flex-wrap gap-2">
                            <button
                              onClick={() => handleOpenDiscountModal(discount)}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            {roleId === 3 && (
                              <button
                                onClick={() => handleToggleDiscountStatus(discount.id, discount.is_active)}
                                className={`px-3 py-1 text-white text-xs rounded ${
                                  discount.is_active
                                    ? 'bg-orange-500 hover:bg-orange-600'
                                    : 'bg-green-500 hover:bg-green-600'
                                }`}
                              >
                                {discount.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteDiscount(discount.id)}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Bug Issues Tab */}
          {activeTab === 'bugissues' && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
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
          )}

          {/* Edit Account Modal */}
          {showEditModal && (
            <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-4 w-full max-w-md mx-8">
                <h2 className="text-lg font-bold mb-3 text-gray-800">Edit Account Information</h2>
                
                <form onSubmit={handleEditFormSubmit} className="space-y-2">
                  {/* First Name, Middle Name, Last Name - 3 Columns */}
                  <div className="grid grid-cols-3 gap-4">
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Initial:</label>
                      <input
                        type="text"
                        name="middleName"
                        value={editFormData.middleName}
                        onChange={handleEditFormChange}
                        placeholder=""
                        className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700"
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

          {/* Category Management Modal */}
          {showCategoryModal && (
            <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="text-emerald-700">
                      {editingCategory ? <Edit2 size={20} /> : <Plus size={20} />}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {editingCategory ? 'Edit Category' : 'Add Category'}
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseCategoryModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSaveCategory} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Category Name</label>
                    <input
                      type="text"
                      name="name"
                      value={categoryForm.name}
                      onChange={handleCategoryFormChange}
                      placeholder="Enter category name"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Category Type</label>
                    <select
                      name="type"
                      value={categoryForm.type}
                      onChange={handleCategoryFormChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                      required
                    >
                      <option value="menu">Menu</option>
                      <option value="inventory">Inventory</option>
                      <option value="void_reason">Void Transaction Reason</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                      name="description"
                      value={categoryForm.description}
                      onChange={handleCategoryFormChange}
                      placeholder="Enter description"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none h-20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 text-white text-sm font-semibold rounded hover:bg-emerald-800"
                  >
                    {editingCategory ? 'Update' : 'Add'} Category
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tax Management Modal */}
          {showTaxEditModal && (
            <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="text-emerald-700">
                      <Percent size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">Edit Tax Rate</h2>
                  </div>
                  <button
                    onClick={() => setShowTaxEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSaveTax} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      value={taxFormData}
                      onChange={(e) => setTaxFormData(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 text-white text-sm font-semibold rounded hover:bg-emerald-800"
                  >
                    Update Tax
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Discount Modal */}
          {showDiscountModal && (
            <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="text-emerald-700">
                      {editingDiscount ? <Edit2 size={20} /> : <Plus size={20} />}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {editingDiscount ? 'Edit Discount' : 'Add Discount'}
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseDiscountModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSaveDiscount} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Discount Name</label>
                    <input
                      type="text"
                      name="name"
                      value={discountForm.name}
                      onChange={handleDiscountFormChange}
                      placeholder="e.g., PWD, Senior Citizen"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Discount Rate (%)</label>
                    <input
                      type="number"
                      name="rate"
                      value={discountForm.rate}
                      onChange={handleDiscountFormChange}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                      name="description"
                      value={discountForm.description}
                      onChange={handleDiscountFormChange}
                      placeholder="Enter description"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none h-20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 text-white text-sm font-semibold rounded hover:bg-emerald-800"
                  >
                    {editingDiscount ? 'Update' : 'Add'} Discount
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* CASHIER INTERFACE (Role 1) */}
      {roleId === 1 && (
        <>
          {/* Account Information Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-base font-bold mb-1">Account Information</h2>
            <p className="text-xs text-gray-600 mb-6">Your current account details</p>
            

            <div className="space-y-4 mb-6">
              {/* First Name, Middle Name, Last Name - 3 Columns */}
              <div className="grid grid-cols-3 gap-4">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Initial:</label>
                  <input
                    type="text"
                    value={userData.middleName}
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

            <button
              disabled
              className="w-full py-2 bg-emerald-700 text-white text-sm rounded font-semibold opacity-70 cursor-not-allowed"
            >
              Cannot Edit
            </button>
            <p className="text-xs text-gray-600 mt-3">
              Profile can only be edited by your branch manager or super admin. For any concerns please contact them.
            </p>
          </div>

          {/* Edit Account Modal */}
          {showEditModal && (
            <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-4 w-full max-w-md mx-8">
                <h2 className="text-lg font-bold mb-3 text-gray-800">Edit Account Information</h2>
                
                <form onSubmit={handleEditFormSubmit} className="space-y-2">
                  {/* First Name, Middle Name, Last Name - 3 Columns */}
                  <div className="grid grid-cols-3 gap-4">
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Initial:</label>
                      <input
                        type="text"
                        name="middleName"
                        value={editFormData.middleName}
                        onChange={handleEditFormChange}
                        placeholder="Optional"
                        className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-700"
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
                <h2 className="text-base font-bold mb-4 text-gray-800">Void PIN Code</h2>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-3">Your 8-digit PIN for voiding transactions:</p>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-700 tracking-widest">
                      {pinCode && typeof pinCode === 'string' ? pinCode.padStart(8, '0') : '••••••••'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Keep this 8-digit PIN secure and use it when voiding transactions.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}