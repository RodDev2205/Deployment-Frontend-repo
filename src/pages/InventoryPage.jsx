import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import InventoryTab from "../components/management/tabs/InventoryTab";

export default function InventoryPage() {
  const location = useLocation();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Inventory Management
      </h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <InventoryTab />
      </div>
    </div>
  );
}
