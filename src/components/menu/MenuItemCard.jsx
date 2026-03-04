import React from "react";
import { Trash2, Edit } from "lucide-react";import API_BASE_URL from '../../config/api';
export default function MenuItemCard({ item, onEdit, onDelete }) {
  // Map status to badge colors
  const statusColor =
    item.status === "available" ? "bg-green-100 text-green-700" :
    item.status === "unavailable" ? "bg-red-100 text-red-700" :
    "bg-gray-100 text-gray-700";
  // Map menu_status to another badge
  const menuStatusColor =
    item.menu_status === "active" ? "bg-green-50 text-green-700" :
    item.menu_status === "archived" ? "bg-gray-200 text-gray-700" :
    "bg-yellow-100 text-yellow-700"; // fallback for other statuses

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow">
      {/* Product Image */}
      <div className="h-48 overflow-hidden">
        <img
          src={item.image_path ? `${API_BASE_URL}${item.image_path}` : "https://via.placeholder.com/300x200?text=Food+Item"}
          alt={item.product_name}
          className="w-full h-full object-cover"
        />  
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Name and Status */}
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-xl">{item.product_name}</h4>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        </div>
        {/* POS menu status badge */}
        <div className="mb-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${menuStatusColor}`}>
            {item.menu_status && item.menu_status.charAt(0).toUpperCase() + item.menu_status.slice(1)}
          </span>
        </div>

        {/* Category */}
        <p className="text-sm text-gray-500">{item.category_name}</p>

        {/* Price and Action Buttons */}
        <div className="flex justify-between mt-auto border-t pt-2">
          <span className="text-2xl font-bold text-[#1B5E20]">
            ₱{item.price ? Number(item.price).toFixed(2) : "0.00"}
          </span>
          <div className="flex gap-2">
            <button
              className="p-2 text-blue-600 hover:bg-gray-100 rounded-full"
              onClick={() => onEdit(item)}
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-red-600 hover:bg-gray-100 rounded-full"
              onClick={() => onDelete(item.product_id)}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
