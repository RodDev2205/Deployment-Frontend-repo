import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import ChatRoomPage from './ChatRoomPage';
import AdminReportPage from './AdminReportPage';
import AdminSettingsPage from './SettingsPage';
import Modal from "../components/POScomponent/Modal/Modal";


// ✅ Error Boundary (INLINE)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-red-600">
          <h2 className="text-xl font-bold">Something went wrong.</h2>
          <p>Please refresh the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}


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
  const navigate = useNavigate();

  // ✅ GLOBAL MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  // ✅ FIXED route → title mapping
  useEffect(() => {
    try {
      const parts = location.pathname.split('/').filter(Boolean);

      if (parts.length <= 1) {
        setActiveItem('Dashboard');
      } else {
        const key = parts[1];

        const formatMap = {
          pos: 'POS',
          'chat-room': 'Chat Room',
          transactions: 'Transactions',
          cashiers: 'Cashiers',
          reports: 'Reports',
          logs: 'Logs',
          settings: 'Settings',
          inventory: 'Inventory',
          menu: 'Menu'
        };

        const title = formatMap[key] ||
          key
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        setActiveItem(title || 'Dashboard');
      }
    } catch (error) {
      console.error("Route parsing error:", error);
      setActiveItem('Dashboard');
    }
  }, [location.pathname]);

  // Modal handlers
  const openModal = (content) => {
    try {
      setModalContent(content);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Open modal error:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // Navigation items
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

  // Logout
  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Render content safely
  const renderContent = () => {
    try {
      switch (activeItem) {
        case 'Dashboard':
          return <DashboardContent openModal={openModal} />;

        case 'Menu':
          return <MenuManagement openModal={openModal} />;

        case 'POS':
          return <POS openModal={openModal} isAdmin={true} />;

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
          console.warn("Unknown route:", activeItem);
          return <PlaceholderPage title="404 - Page Not Found" />;
      }
    } catch (error) {
      console.error("Render error:", error);
      return <PlaceholderPage title="Error Loading Page" />;
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
          if (path && typeof path === "string") {
            navigate(path);
          } else {
            console.warn("Invalid path:", path);
          }
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

        {/* Content with Error Boundary */}
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </main>

      </div>

      {/* GLOBAL MODAL */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {modalContent ? modalContent : <div>No content</div>}
      </Modal>

    </div>
  );
}

export default AdminDashboardPage;