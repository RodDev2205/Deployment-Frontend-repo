import React, { useState, useMemo } from "react";
import { useAlert } from "@/context/AlertContext";

export default function PaymentModal({ totalAmount = 0, onConfirm, onClose }) {
  const { error: alertError } = useAlert();

  const [amountPaid, setAmountPaid] = useState("");
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");
  const [orderType, setOrderType] = useState("dine-in"); // dine-in or takeout

  // Ensure numbers are always safe
  const safeTotal = Number(totalAmount) || 0;
  const safeDiscountValue = Number(discountValue) || 0;
  const safeAmountPaid = Number(amountPaid) || 0;

  const discountAmount = useMemo(() => {
    if (discountType === "percentage") {
      return (safeTotal * safeDiscountValue) / 100;
    }
    if (discountType === "fixed") {
      return safeDiscountValue;
    }
    return 0;
  }, [discountType, safeDiscountValue, safeTotal]);

  const finalAmount = Math.max(safeTotal - discountAmount, 0);
  const change = safeAmountPaid - finalAmount;
  const isValidPayment = safeAmountPaid >= finalAmount && finalAmount > 0;

  // ensure orderType is valid
  const validOrder = orderType === 'dine-in' || orderType === 'takeout';

  const handleConfirm = () => {
    if (finalAmount <= 0) {
      alertError("Payment", "Invalid total amount.");
      return;
    }

    if (!isValidPayment) {
      alertError("Payment", "Amount paid is insufficient.");
      return;
    }

    onConfirm({
      paymentMethod: "cash",
      amountPaid: safeAmountPaid,
      finalAmount,
      change,
      orderType,
      discount: {
        type: discountType,
        value: safeDiscountValue,
        amount: discountAmount,
      },
    });

    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Complete Payment
      </h2>

      <div className="flex flex-col lg:flex-row gap-4">

        {/* LEFT COLUMN */}
        <div className="lg:w-1/2 space-y-6">

{/* Order Type */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Order Type
        </label>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="orderType"
              value="dine-in"
              checked={orderType === 'dine-in'}
              onChange={() => setOrderType('dine-in')}
              className="form-radio"
            />
            <span className="ml-2 text-sm">Dine-in</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="orderType"
              value="takeout"
              checked={orderType === 'takeout'}
              onChange={() => setOrderType('takeout')}
              className="form-radio"
            />
            <span className="ml-2 text-sm">Takeout</span>
          </label>
        </div>
      </div>

      {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <h3 className="font-semibold text-gray-700 mb-3">
              Order Summary
            </h3>

            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">
                ₱{safeTotal.toFixed(2)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>- ₱{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₱{finalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Discount Section */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Apply Discount
            </label>

            <div className="flex gap-2 mb-3">
              <select
                value={discountType}
                onChange={(e) => {
                  setDiscountType(e.target.value);
                  setDiscountValue("");
                }}
                className="flex-1 border px-3 py-2 rounded text-sm"
              >
                <option value="none">No Discount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₱)</option>
              </select>

              {discountType !== "none" && (
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="0"
                  className="w-24 border px-3 py-2 rounded text-sm"
                  min="0"
                  step="0.01"
                />
              )}
            </div>

            {discountAmount > 0 && (
              <p className="text-xs text-blue-600">
                Discount Amount: ₱{discountAmount.toFixed(2)}
              </p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:w-1/2 space-y-6">

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount Paid
            </label>

            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full border px-4 py-3 rounded text-xl font-semibold text-center"
              min="0"
              step="0.01"
              placeholder="0.00"
              autoFocus
            />
          </div>

          {/* Change */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">
                Change
              </span>
              <span
                className={`text-2xl font-bold ${
                  change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ₱{change.toFixed(2)}
              </span>
            </div>

            {change < 0 && (
              <p className="text-xs text-red-600 mt-1">
                Amount paid is insufficient.
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={!isValidPayment || !validOrder}
              className={`flex-1 px-4 py-3 rounded font-semibold transition-colors ${
                isValidPayment && validOrder
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
            >
              Confirm Payment
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}