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

  // Menu Categories state
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuCategoryLoading, setMenuCategoryLoading] = useState(false);
  const [showMenuCategoryModal, setShowMenuCategoryModal] = useState(false);
  const [editingMenuCategory, setEditingMenuCategory] = useState(null);
  const [menuCategoryForm, setMenuCategoryForm] = useState({
    category_name: ''
  });

  // Void Reason Management state
  const [voidReasons, setVoidReasons] = useState([]);
  const [voidReasonLoading, setVoidReasonLoading] = useState(false);
  const [showVoidReasonModal, setShowVoidReasonModal] = useState(false);
  const [editingVoidReason, setEditingVoidReason] = useState(null);
  const [voidReasonForm, setVoidReasonForm] = useState({
    reason_name: ''
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
    discount_name: '',
    discount_type: 'percentage',
    discount_value: '',
    status: 'active'
  });

  // Main & Sub Categories state
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [showMainCategoryModal, setShowMainCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [editingMainCategory, setEditingMainCategory] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [mainCategoryForm, setMainCategoryForm] = useState({
    name: ''
  });
  const [subCategoryForm, setSubCategoryForm] = useState({
    main_category_id: '',
    name: ''
  });
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState(null);
  
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

  // Delete Confirmation Modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState({
    id: null,
    name: '',
    type: '', // 'category', 'mainCategory', 'subCategory', 'menuCategory', 'voidReason', 'discount'
    onConfirm: null
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
    const categoryName = categories.find(c => c.id === categoryId)?.name || 'this category';
    setDeleteConfirmData({
      id: categoryId,
      name: categoryName,
      type: 'category',
      onConfirm: () => performDeleteCategory(categoryId)
    });
    setShowDeleteConfirm(true);
  };

  const performDeleteCategory = async (categoryId) => {
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
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // ===== MAIN & SUB CATEGORIES MANAGEMENT FUNCTIONS =====
  
  // Fetch main categories
  const fetchMainCategories = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/main-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch main categories');
      }

      const data = await response.json();
      setMainCategories(data || []);
    } catch (err) {
      console.error('Error fetching main categories:', err);
    }
  };

  // Fetch sub categories
  const fetchSubCategories = async (token, mainCategoryId = null) => {
    try {
      const url = mainCategoryId 
        ? `${API_BASE_URL}/api/inventory/sub-categories?main_category_id=${mainCategoryId}`
        : `${API_BASE_URL}/api/inventory/sub-categories`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sub categories');
      }

      const data = await response.json();
      setSubCategories(data || []);
    } catch (err) {
      console.error('Error fetching sub categories:', err);
    }
  };

  // Open main category modal
  const handleOpenMainCategoryModal = (category = null) => {
    if (category) {
      setEditingMainCategory(category);
      setMainCategoryForm({
        name: category.name
      });
    } else {
      setEditingMainCategory(null);
      setMainCategoryForm({
        name: ''
      });
    }
    setShowMainCategoryModal(true);
  };

  // Close main category modal
  const handleCloseMainCategoryModal = () => {
    setShowMainCategoryModal(false);
    setEditingMainCategory(null);
    setMainCategoryForm({
      name: ''
    });
  };

  // Save main category
  const handleSaveMainCategory = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      if (!mainCategoryForm.name.trim()) {
        error('Validation Error', 'Category name is required');
        return;
      }

      const endpoint = editingMainCategory
        ? `${API_BASE_URL}/api/inventory/main-categories/${editingMainCategory.main_category_id}`
        : `${API_BASE_URL}/api/inventory/main-categories`;

      const method = editingMainCategory ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(mainCategoryForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingMainCategory ? 'update' : 'add'} main category`);
      }

      await fetchMainCategories(token);
      handleCloseMainCategoryModal();
      success(
        editingMainCategory ? 'Category Updated' : 'Category Added',
        `Main category has been ${editingMainCategory ? 'updated' : 'added'} successfully.`
      );
    } catch (err) {
      console.error('Error saving main category:', err);
      error('Save Error', err.message);
    }
  };

  // Delete main category
  const handleDeleteMainCategory = async (categoryId) => {
    const categoryName = mainCategories.find(c => c.main_category_id === categoryId)?.name || 'this category';
    setDeleteConfirmData({
      id: categoryId,
      name: categoryName,
      type: 'mainCategory',
      onConfirm: () => performDeleteMainCategory(categoryId)
    });
    setShowDeleteConfirm(true);
  };

  // Open sub category modal
  const handleOpenSubCategoryModal = (subCategory = null) => {
    if (subCategory) {
      setEditingSubCategory(subCategory);
      setSubCategoryForm({
        main_category_id: subCategory.main_category_id,
        name: subCategory.name
      });
    } else {
      setEditingSubCategory(null);
      setSubCategoryForm({
        main_category_id: selectedMainCategoryId || '',
        name: ''
      });
    }
    setShowSubCategoryModal(true);
  };

  // Close sub category modal
  const handleCloseSubCategoryModal = () => {
    setShowSubCategoryModal(false);
    setEditingSubCategory(null);
    setSubCategoryForm({
      main_category_id: '',
      name: ''
    });
  };

  // Save sub category
  const handleSaveSubCategory = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      if (!subCategoryForm.main_category_id) {
        error('Validation Error', 'Please select a main category');
        return;
      }

      if (!subCategoryForm.name.trim()) {
        error('Validation Error', 'Sub category name is required');
        return;
      }

      const endpoint = editingSubCategory
        ? `${API_BASE_URL}/api/inventory/sub-categories/${editingSubCategory.sub_category_id}`
        : `${API_BASE_URL}/api/inventory/sub-categories`;

      const method = editingSubCategory ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          main_category_id: parseInt(subCategoryForm.main_category_id),
          name: subCategoryForm.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingSubCategory ? 'update' : 'add'} sub category`);
      }

      // Fetch ALL sub categories to keep count accurate
      await fetchSubCategories(token);
      handleCloseSubCategoryModal();
      success(
        editingSubCategory ? 'Sub Category Updated' : 'Sub Category Added',
        `Sub category has been ${editingSubCategory ? 'updated' : 'added'} successfully.`
      );
    } catch (err) {
      console.error('Error saving sub category:', err);
      error('Save Error', err.message);
    }
  };

  // Delete sub category
  const handleDeleteSubCategory = async (subCategoryId) => {
    const subCategoryName = subCategories.find(s => s.sub_category_id === subCategoryId)?.name || 'this sub category';
    setDeleteConfirmData({
      id: subCategoryId,
      name: subCategoryName,
      type: 'subCategory',
      onConfirm: () => performDeleteSubCategory(subCategoryId)
    });
    setShowDeleteConfirm(true);
  };


  // ===== MENU CATEGORIES MANAGEMENT FUNCTIONS =====

  // Fetch menu categories
  const fetchMenuCategories = async (token) => {
    setMenuCategoryLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch menu categories');
      }

      const data = await response.json();
      setMenuCategories(data || []);
    } catch (err) {
      console.error('Error fetching menu categories:', err);
      error('Fetch Error', 'Failed to load menu categories');
    } finally {
      setMenuCategoryLoading(false);
    }
  };

  // Open menu category modal
  const handleOpenMenuCategoryModal = (category = null) => {
    if (category) {
      setEditingMenuCategory(category);
      setMenuCategoryForm({
        category_name: category.category_name
      });
    } else {
      setEditingMenuCategory(null);
      setMenuCategoryForm({
        category_name: ''
      });
    }
    setShowMenuCategoryModal(true);
  };

  // Close menu category modal
  const handleCloseMenuCategoryModal = () => {
    setShowMenuCategoryModal(false);
    setEditingMenuCategory(null);
    setMenuCategoryForm({
      category_name: ''
    });
  };

  // Save menu category
  const handleSaveMenuCategory = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      if (!menuCategoryForm.category_name.trim()) {
        error('Validation Error', 'Category name is required');
        return;
      }

      const endpoint = editingMenuCategory
        ? `${API_BASE_URL}/api/categories/${editingMenuCategory.category_id}`
        : `${API_BASE_URL}/api/categories`;

      const method = editingMenuCategory ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category_name: menuCategoryForm.category_name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingMenuCategory ? 'update' : 'add'} category`);
      }

      await fetchMenuCategories(token);
      handleCloseMenuCategoryModal();
      success(
        editingMenuCategory ? 'Category Updated' : 'Category Added',
        `Menu category has been ${editingMenuCategory ? 'updated' : 'added'} successfully.`
      );
    } catch (err) {
      console.error('Error saving menu category:', err);
      error('Save Error', err.message);
    }
  };

  // Delete menu category
  const handleDeleteMenuCategory = async (categoryId) => {
    const categoryName = menuCategories.find(c => c.id === categoryId)?.name || 'this menu category';
    setDeleteConfirmData({
      id: categoryId,
      name: categoryName,
      type: 'menuCategory',
      onConfirm: () => performDeleteMenuCategory(categoryId)
    });
    setShowDeleteConfirm(true);
  };

  // ===== VOID REASON MANAGEMENT FUNCTIONS =====

  // Fetch void reasons
  const fetchVoidReasons = async (token) => {
    setVoidReasonLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/void-reasons`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch void reasons');
      }

      const data = await response.json();
      setVoidReasons(data || []);
    } catch (err) {
      console.error('Error fetching void reasons:', err);
      error('Fetch Error', 'Failed to load void reasons');
    } finally {
      setVoidReasonLoading(false);
    }
  };

  // Open void reason modal
  const handleOpenVoidReasonModal = (reason = null) => {
    if (reason) {
      setEditingVoidReason(reason);
      setVoidReasonForm({
        reason_name: reason.reason_name
      });
    } else {
      setEditingVoidReason(null);
      setVoidReasonForm({
        reason_name: ''
      });
    }
    setShowVoidReasonModal(true);
  };

  // Close void reason modal
  const handleCloseVoidReasonModal = () => {
    setShowVoidReasonModal(false);
    setEditingVoidReason(null);
    setVoidReasonForm({
      reason_name: ''
    });
  };

  // Save void reason
  const handleSaveVoidReason = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      if (!voidReasonForm.reason_name.trim()) {
        error('Validation Error', 'Reason name is required');
        return;
      }

      const endpoint = editingVoidReason
        ? `${API_BASE_URL}/api/void-reasons/${editingVoidReason.void_reason_id}`
        : `${API_BASE_URL}/api/void-reasons`;

      const method = editingVoidReason ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason_name: voidReasonForm.reason_name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingVoidReason ? 'update' : 'add'} void reason`);
      }

      await fetchVoidReasons(token);
      handleCloseVoidReasonModal();
      success(
        editingVoidReason ? 'Reason Updated' : 'Reason Added',
        `Void reason has been ${editingVoidReason ? 'updated' : 'added'} successfully.`
      );
    } catch (err) {
      console.error('Error saving void reason:', err);
      error('Save Error', err.message);
    }
  };

  // Delete void reason
  const handleDeleteVoidReason = async (reasonId) => {
    const reasonName = voidReasons.find(r => r.void_reason_id === reasonId)?.reason_name || 'this reason';
    setDeleteConfirmData({
      id: reasonId,
      name: reasonName,
      type: 'voidReason',
      onConfirm: () => performDeleteVoidReason(reasonId)
    });
    setShowDeleteConfirm(true);
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

      // Gracefully handle 404 - endpoint may not exist
      if (response.status === 404) {
        console.warn('Discounts endpoint not available');
        setDiscounts([]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch discounts');
      }

      const data = await response.json();
      setDiscounts(data.discounts || []);
    } catch (err) {
      console.error('Error fetching discounts:', err);
      // Don't show error for this non-critical feature
      setDiscounts([]);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleOpenDiscountModal = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount);
      setDiscountForm({
        discount_name: discount.discount_name,
        discount_type: discount.discount_type || 'percentage',
        discount_value: discount.discount_value,
        status: discount.status || 'active'
      });
    } else {
      setEditingDiscount(null);
      setDiscountForm({
        discount_name: '',
        discount_type: 'percentage',
        discount_value: '',
        status: 'active'
      });
    }
    setShowDiscountModal(true);
  };

  const handleCloseDiscountModal = () => {
    setShowDiscountModal(false);
    setEditingDiscount(null);
    setDiscountForm({
      discount_name: '',
      discount_type: 'percentage',
      discount_value: '',
      status: 'active'
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

      if (!discountForm.discount_name.trim()) {
        error('Validation Error', 'Discount name is required');
        return;
      }

      if (!discountForm.discount_value || discountForm.discount_value < 0) {
        error('Validation Error', 'Discount value must be a positive number');
        return;
      }

      const endpoint = editingDiscount
        ? `${API_BASE_URL}/api/discounts/${editingDiscount.discount_id}`
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
    const discountName = discounts.find(d => d.discount_id === discountId)?.discount_name || 'this discount';
    setDeleteConfirmData({
      id: discountId,
      name: discountName,
      type: 'discount',
      onConfirm: () => performDeleteDiscount(discountId)
    });
    setShowDeleteConfirm(true);
  };

  const handleToggleDiscountStatus = async (discountId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in first');
        return;
      }

      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await fetch(`${API_BASE_URL}/api/discounts/${discountId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update discount status');
      }

      await fetchDiscounts(token);
      success(
        'Discount Status Updated',
        `Discount has been ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`
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
          middleName: data.middle_initial || data.middle_name || '',
          lastName: data.last_name || '',
          contactNumber: data.contact_number || '',
          username: data.username || ''
        });
        setEditFormData({
          firstName: data.first_name || '',
          middleName: data.middle_initial || data.middle_name || '',
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
          await fetchMainCategories(token);
          await fetchSubCategories(token);
          await fetchMenuCategories(token);
          await fetchVoidReasons(token);
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
        middleName: updatedData.user?.middle_initial || updatedData.middle_initial || updatedData.user?.middle_name || updatedData.middle_name || '',
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
    setEditFormData({
      firstName: userData.firstName || '',
      middleName: userData.middleName || '',
      lastName: userData.lastName || '',
      contactNumber: userData.contactNumber || '',
      username: userData.username || '',
      currentPassword: '',
      newPassword: ''
    });
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditFormData({
      firstName: userData.firstName || '',
      middleName: userData.middleName || '',
      lastName: userData.lastName || '',
      contactNumber: userData.contactNumber || '',
      username: userData.username || '',
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

  // ===== PERFORM DELETE FUNCTIONS =====

  const performDeleteMainCategory = async (categoryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory/main-categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete main category');
      await fetchMainCategories(token);
      success('Main Category Deleted', 'Main category has been deleted successfully.');
    } catch (err) {
      console.error('Error deleting main category:', err);
      error('Delete Error', err.message);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const performDeleteSubCategory = async (categoryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory/sub-categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete sub category');
      await fetchMainCategories(token);
      success('Sub Category Deleted', 'Sub category has been deleted successfully.');
    } catch (err) {
      console.error('Error deleting sub category:', err);
      error('Delete Error', err.message);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const performDeleteMenuCategory = async (categoryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/menu-categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete menu category');
      await fetchMenuCategories(token);
      success('Menu Category Deleted', 'Menu category has been deleted successfully.');
    } catch (err) {
      console.error('Error deleting menu category:', err);
      error('Delete Error', err.message);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const performDeleteVoidReason = async (reasonId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/void-reasons/${reasonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete void reason');
      await fetchVoidReasons(token);
      success('Void Reason Deleted', 'Void reason has been deleted successfully.');
    } catch (err) {
      console.error('Error deleting void reason:', err);
      error('Delete Error', err.message);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const performDeleteDiscount = async (discountId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/discounts/${discountId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete discount');
      await fetchDiscounts(token);
      success('Discount Deleted', 'Discount has been deleted successfully.');
    } catch (err) {
      console.error('Error deleting discount:', err);
      error('Delete Error', err.message);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const performDeleteTax = async (taxId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/taxes/${taxId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete tax');
      await fetchTaxes(token);
      success('Tax Deleted', 'Tax has been deleted successfully.');
    } catch (err) {
      console.error('Error deleting tax:', err);
      error('Delete Error', err.message);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmData.onConfirm) {
      deleteConfirmData.onConfirm();
    }
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
            <div className="space-y-6">
              {/* Main Categories Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-base font-bold mb-1">Main Categories</h2>
                    <p className="text-xs text-gray-600">Manage main product categories (Beverages, Appetizers, Main Course, etc.)</p>
                  </div>
                  <button
                    onClick={() => handleOpenMainCategoryModal()}
                    className="py-2 px-4 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800 flex items-center gap-2"
                  >
                    <Plus size={18} /> Add Main Category
                  </button>
                </div>

                {mainCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No main categories found. Add a new category to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Category Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Sub Categories</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mainCategories.map((mainCat, index) => {
                          const subCatCount = subCategories.filter(sub => sub.main_category_id === mainCat.main_category_id).length;
                          return (
                            <tr key={mainCat.main_category_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 font-medium text-gray-800">{mainCat.name}</td>
                              <td className="px-4 py-3">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  {subCatCount} sub {subCatCount === 1 ? 'category' : 'categories'}
                                </span>
                              </td>
                              <td className="px-4 py-3 space-x-2 flex">
                                <button
                                  onClick={() => {
                                    setSelectedMainCategoryId(mainCat.main_category_id);
                                  }}
                                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                >
                                  View Subs
                                </button>
                                <button
                                  onClick={() => handleOpenMainCategoryModal(mainCat)}
                                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMainCategory(mainCat.main_category_id)}
                                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sub Categories Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-base font-bold mb-1">Sub Categories</h2>
                    <p className="text-xs text-gray-600">
                      {selectedMainCategoryId 
                        ? `Managing sub categories for: ${mainCategories.find(m => m.main_category_id === selectedMainCategoryId)?.name || 'Unknown'}`
                        : 'Select a main category to view or add sub categories'}
                    </p>
                  </div>
                  {selectedMainCategoryId && (
                    <button
                      onClick={() => handleOpenSubCategoryModal()}
                      className="py-2 px-4 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800 flex items-center gap-2"
                    >
                      <Plus size={18} /> Add Sub Category
                    </button>
                  )}
                </div>

                {!selectedMainCategoryId ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Click "View Subs" on a main category to manage its sub categories.</p>
                  </div>
                ) : subCategories.filter(sub => sub.main_category_id === selectedMainCategoryId).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No sub categories found. Add a new sub category to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Sub Category Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subCategories.filter(sub => sub.main_category_id === selectedMainCategoryId).map((subCat, index) => (
                          <tr key={subCat.sub_category_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-medium text-gray-800">{subCat.name}</td>
                            <td className="px-4 py-3 space-x-2 flex">
                              <button
                                onClick={() => handleOpenSubCategoryModal(subCat)}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSubCategory(subCat.sub_category_id)}
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

              {/* Menu Categories Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-base font-bold mb-1">Menu Categories</h2>
                    <p className="text-xs text-gray-600">Manage menu categories for your restaurant/cafe products</p>
                  </div>
                  <button
                    onClick={() => handleOpenMenuCategoryModal()}
                    className="py-2 px-4 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800 flex items-center gap-2"
                  >
                    <Plus size={18} /> Add Menu Category
                  </button>
                </div>

                {menuCategoryLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading menu categories...</p>
                  </div>
                ) : menuCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No menu categories found. Add a new category to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Category Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuCategories.map((menuCat, index) => (
                          <tr key={menuCat.category_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-medium text-gray-800">{menuCat.category_name}</td>
                            <td className="px-4 py-3 space-x-2 flex">
                              <button
                                onClick={() => handleOpenMenuCategoryModal(menuCat)}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMenuCategory(menuCat.category_id)}
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

              {/* Void Reason Management Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-base font-bold mb-1">Void Reasons</h2>
                    <p className="text-xs text-gray-600">Manage reasons for voiding transactions</p>
                  </div>
                  <button
                    onClick={() => handleOpenVoidReasonModal()}
                    className="py-2 px-4 bg-emerald-700 text-white text-sm rounded font-semibold hover:bg-emerald-800 flex items-center gap-2"
                  >
                    <Plus size={18} /> Add Void Reason
                  </button>
                </div>

                {voidReasonLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading void reasons...</p>
                  </div>
                ) : voidReasons.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No void reasons found. Add a new reason to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Reason Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voidReasons.map((reason, index) => (
                          <tr key={reason.void_reason_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-medium text-gray-800">{reason.reason_name}</td>
                            <td className="px-4 py-3 space-x-2 flex">
                              <button
                                onClick={() => handleOpenVoidReasonModal(reason)}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteVoidReason(reason.void_reason_id)}
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

              {/* Legacy Category Management (Optional) */}
              
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
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Value</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map((discount, index) => (
                        <tr key={discount.discount_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-gray-800 font-medium">{discount.discount_name}</td>
                          <td className="px-4 py-3 text-gray-800 capitalize">{discount.discount_type}</td>
                          <td className="px-4 py-3 text-gray-800">{discount.discount_value}{discount.discount_type === 'percentage' ? '%' : ''}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              discount.status === 'active'
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {discount.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 space-x-2 flex flex-wrap gap-2">
                            <button
                              onClick={() => handleOpenDiscountModal(discount)}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            {roleId === 3 && (
                              <button
                                onClick={() => handleToggleDiscountStatus(discount.discount_id, discount.status)}
                                className={`px-3 py-1 text-white text-xs rounded ${
                                  discount.status === 'active'
                                    ? 'bg-orange-500 hover:bg-orange-600'
                                    : 'bg-green-500 hover:bg-green-600'
                                }`}
                              >
                                {discount.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteDiscount(discount.discount_id)}
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
                      name="discount_name"
                      value={discountForm.discount_name}
                      onChange={handleDiscountFormChange}
                      placeholder="e.g., PWD, Senior Citizen"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Discount Type</label>
                    <select
                      name="discount_type"
                      value={discountForm.discount_type}
                      onChange={handleDiscountFormChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Discount Value {discountForm.discount_type === 'percentage' ? '(%)' : ''}
                    </label>
                    <input
                      type="number"
                      name="discount_value"
                      value={discountForm.discount_value}
                      onChange={handleDiscountFormChange}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  {editingDiscount && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Status</label>
                      <select
                        name="status"
                        value={discountForm.status}
                        onChange={handleDiscountFormChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  )}

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

          {/* Main Category Modal */}
          {showMainCategoryModal && (
            <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="text-emerald-700">
                      {editingMainCategory ? <Edit2 size={20} /> : <Plus size={20} />}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {editingMainCategory ? 'Edit Main Category' : 'Add Main Category'}
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseMainCategoryModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSaveMainCategory} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name</label>
                    <input
                      type="text"
                      value={mainCategoryForm.name}
                      onChange={(e) => setMainCategoryForm({...mainCategoryForm, name: e.target.value})}
                      placeholder="e.g., Beverages, Appetizers"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 text-white text-sm font-semibold rounded hover:bg-emerald-800"
                  >
                    {editingMainCategory ? 'Update' : 'Add'} Main Category
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Sub Category Modal */}
          {showSubCategoryModal && (
            <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="text-emerald-700">
                      {editingSubCategory ? <Edit2 size={20} /> : <Plus size={20} />}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {editingSubCategory ? 'Edit Sub Category' : 'Add Sub Category'}
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseSubCategoryModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSaveSubCategory} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Main Category</label>
                    <select
                      value={subCategoryForm.main_category_id}
                      onChange={(e) => setSubCategoryForm({...subCategoryForm, main_category_id: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                      required
                    >
                      <option value="">Select a main category</option>
                      {mainCategories.map((cat) => (
                        <option key={cat.main_category_id} value={cat.main_category_id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sub Category Name</label>
                    <input
                      type="text"
                      value={subCategoryForm.name}
                      onChange={(e) => setSubCategoryForm({...subCategoryForm, name: e.target.value})}
                      placeholder="e.g., Soft Drinks, Fried Items"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 text-white text-sm font-semibold rounded hover:bg-emerald-800"
                  >
                    {editingSubCategory ? 'Update' : 'Add'} Sub Category
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Menu Category Modal */}
          {showMenuCategoryModal && (
            <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="text-emerald-700">
                      {editingMenuCategory ? <Edit2 size={20} /> : <Plus size={20} />}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {editingMenuCategory ? 'Edit Menu Category' : 'Add Menu Category'}
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseMenuCategoryModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSaveMenuCategory} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name</label>
                    <input
                      type="text"
                      value={menuCategoryForm.category_name}
                      onChange={(e) => setMenuCategoryForm({...menuCategoryForm, category_name: e.target.value})}
                      placeholder="e.g., Beverages, Appetizers, Main Course"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 text-white text-sm font-semibold rounded hover:bg-emerald-800"
                  >
                    {editingMenuCategory ? 'Update' : 'Add'} Menu Category
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Void Reason Modal */}
          {showVoidReasonModal && (
            <div className="fixed top-0 left-0 w-screen h-screen z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="text-emerald-700">
                      {editingVoidReason ? <Edit2 size={20} /> : <Plus size={20} />}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {editingVoidReason ? 'Edit Void Reason' : 'Add Void Reason'}
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseVoidReasonModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSaveVoidReason} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Reason Name</label>
                    <input
                      type="text"
                      value={voidReasonForm.reason_name}
                      onChange={(e) => setVoidReasonForm({...voidReasonForm, reason_name: e.target.value})}
                      placeholder="e.g., Spoilage, Cashier Error, Customer Request"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 text-white text-sm font-semibold rounded hover:bg-emerald-800"
                  >
                    {editingVoidReason ? 'Update' : 'Add'} Void Reason
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

      {/* Delete Confirmation Modal - Outside conditional */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="bg-red-50 px-6 py-4 border-b border-red-200">
              <h3 className="text-lg font-bold text-red-600">Delete Confirmation</h3>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete <span className="font-semibold">"{deleteConfirmData.name}"</span>?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 justify-end px-6 py-4 bg-gray-50">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}