import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  LayoutDashboard,
  Split,
  BookOpen,
  SquareMenu,
  History,
  MessageCircleMore,
  Settings,
} from "lucide-react";

export default function OwnerDashboard() {
  // --- Dashboard Data (can be passed to components as props) ---
  const dashboardData = {
    salesData: { today: 20000, weekly: 30000, monthly: 40000, yearly: 95000 },
    branchPerformance: [
      { rank: 1, name: "Main Branch", sales: 45000, change: 12 },
      { rank: 2, name: "Downtown Branch", sales: 38000, change: -5 },
      { rank: 3, name: "Mall Branch", sales: 32000, change: 8 },
    ],
    topItems: [
      { name: "Spagetti", sold: 150, unit: "plates" },
      { name: "Burger", sold: 120, unit: "orders" },
      { name: "Halo-Halo", sold: 95, unit: "servings" },
    ],
    lowStockItems: [
      { item: "Beef Patty", branch: "Main", remaining: 5, threshold: 10, status: "Critical" },
      { item: "Lettuce", branch: "Downtown", remaining: 8, threshold: 15, status: "Low" },
    ],
  };

  const navigate = useNavigate();
  const location = useLocation();

  // --- Sidebar active state ---
  const [activeItem, setActiveItem] = useState("Dashboard");

  // --- Sidebar navigation items with paths ---
  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/superadmin/dashboard" },
    { name: "Chat Room", icon: MessageCircleMore, path: "/superadmin/chat-room" },
    { name: "Menu & Inventory", icon: SquareMenu, path: "/superadmin/menu-inventory" },
    { name: "Management", icon: Split, path: "/superadmin/management" },
    { name: "Reports", icon: BookOpen, path: "/superadmin/reports" },
    { name: "Logs", icon: History, path: "/superadmin/logs" },
    { name: "Settings", icon: Settings, path: "/superadmin/settings" },
  ];

  // update activeItem when the URL changes
  useEffect(() => {
    const current = navItems.find((n) => location.pathname.startsWith(n.path));
    if (current) setActiveItem(current.name);
  }, [location.pathname]);

  // wrapper for sidebar clicks
  const handleNav = (itemName) => {
    const item = navItems.find((n) => n.name === itemName);
    if (item) {
      setActiveItem(itemName);
      navigate(item.path);
    }
  };

  // --- Logout handler ---
  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        activeItem={activeItem}
        setActiveItem={handleNav}
        logoTitle="Paradise"
        logoHighlight="Food"
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Food Paradise: Owner Dashboard"
          username="Owner Username"
          initials="OU"
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Outlet renders nested route components */}
          <Outlet context={dashboardData} />
        </main>
      </div>
    </div>
  );
}
