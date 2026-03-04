/**
 * REAL WORLD EXAMPLE: PaymentModal Migration
 * 
 * This shows an actual component migration from alert() to useAlert()
 */

// ========== BEFORE (Using Old alert()) ==========
/*
import React, { useState } from "react";
import API_BASE_URL from '../../config/api';

export default function PaymentModalOld({ totalAmount, onConfirm, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");

  const handleConfirm = () => {
    const finalAmountPaid = parseFloat(amountPaid) || 0;

    // OLD: Using browser alert
    if (finalAmountPaid <= 0) {
      alert("Amount paid must be greater than 0!");
      return;
    }

    if (finalAmountPaid < totalAmount) {
      alert("Amount paid is less than total!");
      return;
    }

    onConfirm({
      paymentMethod,
      amountPaid: finalAmountPaid,
    });

    onClose();
  };

  return (
    <div>
      {/* Payment form UI */}
    </div>
  );
}
*/

// ========== AFTER (Using New useAlert()) ==========

import React, { useState } from "react";
import { useAlert } from "@/context/AlertContext"; // NEW: Import hook
import API_BASE_URL from '../../config/api';

export default function PaymentModal({ totalAmount, onConfirm, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  
  // NEW: Get alert methods from hook
  const { error } = useAlert();

  const change = parseFloat(amountPaid || 0) - totalAmount;
  const isValidPayment = change >= 0;

  const handleConfirm = () => {
    const finalAmountPaid = parseFloat(amountPaid) || 0;

    // NEW: Using error() instead of alert()
    if (finalAmountPaid <= 0) {
      error("Invalid Amount", "Amount paid must be greater than 0!");
      return;
    }

    // NEW: Using error() with better message
    if (finalAmountPaid < totalAmount) {
      error(
        "Insufficient Amount",
        `Amount paid (₱${finalAmountPaid.toFixed(2)}) is less than total (₱${totalAmount.toFixed(2)})!`
      );
      return;
    }

    onConfirm({
      paymentMethod,
      amountPaid: finalAmountPaid,
    });

    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment</h2>

      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-semibold">₱{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3">
          Payment Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="cash"
              checked={paymentMethod === "cash"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Cash
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="card"
              checked={paymentMethod === "card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Card
          </label>
        </div>
      </div>

      {/* Amount Paid */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Amount Paid</label>
        <input
          type="number"
          value={amountPaid || ""}
          onChange={(e) => setAmountPaid(e.target.value)}
          className="w-full border px-4 py-2 rounded text-lg font-semibold"
          placeholder="0.00"
        />
      </div>

      {/* Change */}
      <div className="bg-green-50 p-4 rounded-lg mb-6 flex justify-between items-center">
        <span className="text-gray-700 font-semibold">Change:</span>
        <span
          className={`text-2xl font-bold ${
            change >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          ₱{Math.abs(change).toFixed(2)}
        </span>
      </div>

      {!isValidPayment && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">
          ⚠️ Payment is not enough!
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 font-semibold hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isValidPayment}
          className={`flex-1 px-4 py-2 text-white rounded font-semibold transition-colors ${
            isValidPayment
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
}

/**
 * ==================== KEY CHANGES ====================
 * 
 * 1. Added import: import { useAlert } from "@/context/AlertContext";
 * 
 * 2. Inside component: const { error } = useAlert();
 * 
 * 3. Replaced:
 *    alert("Amount paid must be greater than 0!")
 *    WITH:
 *    error("Invalid Amount", "Amount paid must be greater than 0!")
 * 
 * 4. Benefits:
 *    ✅ Professional looking dialog instead of browser alert
 *    ✅ Consistent UI across the entire app
 *    ✅ Better error messages with title + description
 *    ✅ Easier to test and maintain
 *    ✅ Theme matches the application design
 * 
 */

export default PaymentModal;
