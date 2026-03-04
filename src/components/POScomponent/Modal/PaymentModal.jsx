import React, { useState } from "react";
import { useAlert } from "@/context/AlertContext";

export default function PaymentModal({ totalAmount, onConfirm, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const { error: alertError } = useAlert();
  const [amountPaid, setAmountPaid] = useState(totalAmount);
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState(0);

  const discountAmount =
    discountType === "percentage"
      ? (totalAmount * discountValue) / 100
      : discountType === "fixed"
      ? discountValue
      : 0;

  const finalAmount = totalAmount - discountAmount;
  const change = amountPaid - finalAmount;
  const isValidPayment = amountPaid >= finalAmount;

  const handleConfirm = () => {
    // Ensure amountPaid is a valid number
    const finalAmountPaid = parseFloat(amountPaid) || 0;
    const finalDiscountValue = parseFloat(discountValue) || 0;

    if (!paymentMethod) {
      alertError("Payment", "Please select a payment method!");
      return;
    }

    if (finalAmountPaid <= 0) {
      alertError("Payment", "Amount paid must be greater than 0!");
      return;
    }

    if (!isValidPayment) {
      alertError("Payment", "Amount paid is less than total!");
      return;
    }

    onConfirm({
      paymentMethod,
      amountPaid: finalAmountPaid,
      discount: {
        type: discountType,
        value: finalDiscountValue,
      },
    });

    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Payment</h2>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Column - Order Summary & Payment Method */}
        <div className="lg:w-1/2 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <h3 className="font-semibold text-gray-700 mb-3">Order Summary</h3>
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">₱{totalAmount.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-₱{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>₱{finalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Discount Section */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discount
            </label>
            <div className="flex gap-2 mb-3">
              <select
                value={discountType}
                onChange={(e) => {
                  setDiscountType(e.target.value);
                  setDiscountValue(0);
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
                  placeholder="Value"
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

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["cash", "gcash", "card"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    paymentMethod === method
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Payment Input & Change */}
        <div className="lg:w-1/2 space-y-6">
          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount Paid
            </label>
            <input
              type="number"
              value={amountPaid || ""}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full border px-4 py-3 rounded text-xl font-semibold text-center"
              min="0"
              step="0.01"
              placeholder="0.00"
              autoFocus
            />
          </div>

          {/* Change Display */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-semibold">Change:</span>
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
                Amount paid is less than total
              </p>
            )}
          </div>

          {/* Error Message */}
          {!isValidPayment && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              ⚠️ Payment amount is insufficient!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValidPayment}
              className={`flex-1 px-4 py-3 rounded font-semibold transition-colors ${
                isValidPayment
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
