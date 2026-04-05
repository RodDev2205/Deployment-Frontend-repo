import React from "react";
import { Search, ChevronDown } from "lucide-react";
import API_BASE_URL from '../../../config/api';

export default function ItemsPanel({
  items,
  activeCategory,
  setActiveCategory,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  cart,
  setCart,
}) {
  const categories = ["All", ...Array.from(new Set(items.map((item) => item.category_name)))];

  return (
    <div className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 border-b border-emerald-800">
        <h2 className="text-2xl font-bold">Menu Items</h2>
        <p className="text-emerald-100 text-sm">Select items to add to cart</p>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 flex flex-col">
        {/* Search Bar */}
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors bg-white text-sm"
            />
          </div>
        </div>

        {/* Sort Dropdown */}
        <div>
          <div className="relative inline-block w-full">
            <select
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:border-emerald-500 focus:outline-none transition-colors cursor-pointer font-medium text-gray-700 text-sm"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="default">Sort: Default</option>
              <option value="nameAsc">Sort: Name A-Z</option>
              <option value="priceAsc">Sort: Price Low-High</option>
              <option value="priceDesc">Sort: Price High-Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Categories</p>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full font-medium transition-all text-sm ${
                  activeCategory === cat
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:border-emerald-500 hover:text-emerald-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
          {items.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p className="text-lg font-medium">No items available</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product_id}
                onClick={() => {
                  const existingItem = cart.find((i) => i.product_id === item.product_id);
                  if (existingItem) {
                    setCart(
                      cart.map((i) =>
                        i.product_id === item.product_id
                          ? { ...i, qty: i.qty + 1 }
                          : i
                      )
                    );
                  } else {
                    setCart([
                      ...cart,
                      {
                        product_id: item.product_id,
                        item: item.product_name,
                        qty: 1,
                        price: Number(item.price),
                      },
                    ]);
                  }
                }}
                className="bg-white rounded-lg p-3 text-center cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-emerald-500"
              >
                {/* Image */}
                <div className="bg-gray-100 h-24 rounded mb-2 flex items-center justify-center text-gray-400 text-xs overflow-hidden">
                  {item.image_path ? (
                    <img
                      src={`${API_BASE_URL}${item.image_path}`}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>No Image</span>
                  )}
                </div>

                {/* Product Info */}
                <p className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{item.product_name}</p>
                
                {/* Price Badge */}
                <div className="bg-emerald-100 text-emerald-700 rounded py-1 font-bold text-sm">
                  ₱{Number(item.price).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
