import React from "react";
import { ShoppingCart, Trash2, AlertCircle, CheckCircle } from "lucide-react";

export default function ReceiptPanel({
  cart,
  totalAmount,
  handleCheckout,
  setCart,
  decrementItem,
  isCashier,
  isAdmin,
}) {
  const today = new Date().toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="w-96 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 border-b border-emerald-800">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="font-bold text-xl">Order</h2>
        </div>
        <div className="flex justify-between text-xs opacity-90">
          <span>Receipt #0098</span>
          <span>{today}</span>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 space-y-2 px-6 py-4 overflow-y-auto border-b border-gray-200">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No items added</p>
            <p className="text-xs text-gray-400">Click items to add to cart</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.product_id} className="flex justify-between items-start text-sm bg-gray-50 rounded-lg p-3 hover:shadow-sm transition-shadow">
              <button
                className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full mr-2 hover:bg-red-600"
                onClick={() => decrementItem(item.product_id)}
              >
                -
              </button>
              <div className="flex-1 pr-2">
                <div className="font-semibold text-gray-900 text-xs">{item.item}</div>
                <div className="text-xs text-gray-600">{item.qty}x @ ₱{item.price.toFixed(2)}</div>
              </div>
              <div className="font-bold text-emerald-600 text-right min-w-max">
                ₱{(item.qty * item.price).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="space-y-3 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between text-sm text-gray-700">
          <span>Subtotal:</span>
          <span className="font-semibold">₱{totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-700">
          <span>Discount:</span>
          <span className="font-semibold">None</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="font-bold text-gray-900">Total</span>
          <div className="bg-emerald-600 text-white rounded-lg px-3 py-2 font-bold text-lg">
            ₱{totalAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 px-6 py-4">
        <button
          className={`w-full font-bold py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
            cart.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95"
          }`}
          onClick={handleCheckout}
          disabled={cart.length === 0}
        >
          <CheckCircle className="w-4 h-4" />
          Complete Sale
        </button>

        {isAdmin && (
          <button
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
            onClick={() => setCart([])}
          >
            <Trash2 className="w-4 h-4" />
            Cancel
          </button>
        )}

        {isCashier && (
          <button
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
            onClick={() => setCart([])}
          >
            <AlertCircle className="w-4 h-4" />
            Clear Cart
          </button>
        )}
      </div>

      {/* Cart Badge */}
      {cart.length > 0 && (
        <div className="text-center text-xs text-gray-600 pt-2">
          {cart.length} {cart.length === 1 ? "item" : "items"} in cart
        </div>
      )}
    </div>
  );
}
