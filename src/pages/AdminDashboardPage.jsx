import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  BookOpen, 
  Warehouse, 
  Users, 
  History, 
  Settings, 
  MessageCircleMore,
  ChartNoAxesCombined,
  CreditCard
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

import DashboardContent from '../components/DashboardContent';
import MenuManagement from '../components/menu/testingMenuManagement';
import InventoryManagement from '../components/inventory/testingInventoryManagement';
import CashierManagement from '../components/cashiers/CashierManagement';
import LogManagement from '../components/LogManagement';
import Records from '../components/POScomponent/Records';
import POS from '../components/POSadminContent';
import ChatRoomPage from './ChatRoomPage';  // Example additional page
import AdminReportPage from './AdminReportPage';  // Example additional page
import AdminSettingsPage from './SettingsPage';  // Example additional page
import Modal from "../components/POScomponent/Modal/Modal";   // ✅ Reusable Modal Component
import { useNavigate } from 'react-router-dom';

// Placeholder Component
const PlaceholderPage = ({ title }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg">
    <h2 className="text-3xl font-bold mb-6 text-gray-800">{title}</h2>
    <p className="text-gray-600">
      Content for the <b>{title}</b> page will be implemented here.
    </p>
  </div>
);

function AdminDashboardPage() {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const location = useLocation();

  // update activeItem whenever the URL path changes
  React.useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean); // ['admin', 'inventory']
    if (parts.length <= 1) {
      setActiveItem('Dashboard');
    } else {
      const key = parts[1];
      // convert path segment to title-case name
      const title = key
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      setActiveItem(title || 'Dashboard');
    }
  }, [location.pathname]);
  
  // ✅ GLOBAL MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const navigate = useNavigate();

  // Function passed to children to open modal
  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  // Close modal function
  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // Navigation items (include path for routing)
  const adminNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'POS', icon: ShoppingCart, path: '/admin/pos' },
    { name: 'Transactions', icon: CreditCard, path: '/admin/transactions' },
    { name: 'Chat Room', icon: MessageCircleMore, path: '/admin/chat-room' },
    { name: 'Menu', icon: BookOpen, path: '/admin/menu' },
    { name: 'Inventory', icon: Warehouse, path: '/admin/inventory' },
    { name: 'Cashiers', icon: Users, path: '/admin/cashiers' },
    { name: 'Reports', icon: ChartNoAxesCombined, path: '/admin/reports' },
    { name: 'Logs', icon: History, path: '/admin/logs' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  // Render selected page (activeItem is maintained by URL)
  const renderContent = () => {
    switch (activeItem) {
      case 'Dashboard':
        return <DashboardContent openModal={openModal} />;

      case 'Menu':
        return <MenuManagement openModal={openModal} />;

      case 'Pos':
        return <POS openModal={openModal} isAdmin={true} />;   // ⭐ Modal support

      case 'Inventory':
        return <InventoryManagement openModal={openModal} />;
      case 'Chat Room':
        return <ChatRoomPage openModal={openModal} />;
      case 'Cashiers':
        return <CashierManagement openModal={openModal} />;
      case 'Reports':
        return <AdminReportPage openModal={openModal} />;
      case 'Transactions':
        return <Records />;

      case 'Logs':
        return <LogManagement openModal={openModal} />;

      case 'Settings':
        return <AdminSettingsPage openModal={openModal} />;

      case 'Logout':
        handleLogout();
        return null;

      default:
        return <PlaceholderPage title="404 - Page Not Found" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <Sidebar
        logoHighlight="Food"
        logoTitle="Paradise"
        navItems={adminNavItems}
        activeItem={activeItem}
        setActiveItem={(item, path) => {
          setActiveItem(item);
          if (path) navigate(path);
        }}
        onLogout={handleLogout}
      />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <Header
          title="Food Paradise: Admin Dashboard"
          username="Admin Username"
          initials="AU"
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>

      </div>

      {/* 🌟 GLOBAL MODAL (Reusable Everywhere) */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {modalContent}
      </Modal>

    </div>
  );
}

export default AdminDashboardPage;
